// Who gets a phone notification when someone comments on or reacts to an answer.
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { notifyComment, notifyReaction } from "@/lib/notifications";
import { reset } from "./fakes/supabase-admin.ts";
import { sent } from "./fakes/push.ts";

const group = { groups: { name: "Kuzenler" } };
const devices = (ids) => ids.map((user_id, i) => ({ id: `s${i}`, user_id, endpoint: "x", p256dh: "y", auth: "z" }));
const people = { kutay: { locale: "tr" }, mehmet: { locale: "tr" }, ayse: { locale: "tr" }, can: { locale: "tr" }, zeynep: { locale: "en" } };
const recipients = () => sent.flatMap((s) => s.to).sort();

describe("comment notifications", () => {
  beforeEach(() => {
    sent.length = 0;
    reset(
      {
        comments: [
          { id: "c0", user_id: "mehmet", issue_id: "i1", body: "Eski yorum", response_id: "r1", issue_question_id: null, profiles: { display_name: "Mehmet" }, issues: group },
          { id: "c1", user_id: "ayse", issue_id: "i1", body: "Bu fotoğraf harika olmuş, nerede çektin bunu? ".repeat(3).trim(), response_id: "r1", issue_question_id: null, profiles: { display_name: "Ayşe" }, issues: group },
          { id: "c2", user_id: "can", issue_id: "i1", body: "Doğada olsun", response_id: null, issue_question_id: "q1", profiles: { display_name: "Can" }, issues: group },
          { id: "c3", user_id: "zeynep", issue_id: "i1", body: "Bence de", response_id: null, issue_question_id: "q1", profiles: { display_name: "Zeynep" }, issues: group },
          { id: "c4", user_id: "kutay", issue_id: "i1", body: "Kendi yanıtıma yorum", response_id: "r2", issue_question_id: null, profiles: { display_name: "Kutay" }, issues: group },
        ],
        responses: [
          { id: "r1", user_id: "kutay" },
          { id: "r2", user_id: "kutay" },
        ],
        push_subscriptions: devices(["kutay", "mehmet", "ayse", "can", "zeynep"]),
      },
      people,
    );
  });

  test("a comment on an answer notifies the answer's owner and earlier commenters, not the author", async () => {
    await notifyComment("c1");
    assert.deepEqual(recipients(), ["kutay", "mehmet"]);
    const owner = sent.find((s) => s.to.includes("kutay"));
    assert.match(owner.message.body, /^Ayşe yanıtına yorum yaptı: “/);
    assert.ok(owner.message.body.length <= 120, "snippet is capped");
    assert.equal(owner.message.url, "/sayi/i1");
    assert.equal(owner.message.tag, "comment:r1");
    assert.equal(owner.message.title, "Kuzenler");
    assert.match(sent.find((s) => s.to.includes("mehmet")).message.body, /^Ayşe yorum yaptı: “/);
  });

  test("a comment on a poll notifies earlier commenters on that poll, in their own language", async () => {
    await notifyComment("c3");
    assert.deepEqual(recipients(), ["can"]);
    sent.length = 0;
    await notifyComment("c2");
    assert.deepEqual(recipients(), ["zeynep"]);
    assert.match(sent[0].message.body, /^Can commented: “Doğada olsun”$/);
  });

  test("a comment on your own answer notifies nobody", async () => {
    await notifyComment("c4");
    assert.equal(sent.length, 0);
  });

  test("an unknown comment id fails quietly", async () => {
    await notifyComment("missing");
    assert.equal(sent.length, 0);
  });
});

describe("reaction notifications", () => {
  let clock = 0;
  const reaction = (response_id, user_id, emoji, name) => ({
    response_id,
    user_id,
    emoji,
    created_at: new Date(Date.UTC(2026, 10, 12, 10, 0, clock++)).toISOString(),
    profiles: { display_name: name },
  });

  beforeEach(() => {
    sent.length = 0;
    clock = 0;
    reset(
      {
        responses: [
          { id: "r1", user_id: "kutay", issue_id: "i1", issues: group },
          { id: "r2", user_id: "kutay", issue_id: "i1", issues: group },
          { id: "r3", user_id: "zeynep", issue_id: "i1", issues: group },
          { id: "r4", user_id: "mehmet", issue_id: "i1", issues: group },
          { id: "r5", user_id: "kutay", issue_id: "i1", issues: group },
          { id: "r6", user_id: "zeynep", issue_id: "i1", issues: group },
        ],
        reactions: [
          reaction("r1", "ayse", "laugh", "Ayşe"),
          reaction("r1", "mehmet", "heart", "Mehmet"),
          reaction("r1", "ayse", "heart", "Ayşe"),
          reaction("r1", "can", "clap", "Can"),
          reaction("r2", "kutay", "laugh", "Kutay"),
          reaction("r3", "can", "wow", "Can"),
          reaction("r3", "mehmet", "fire", "Mehmet"),
          reaction("r4", "ayse", "heart", "Ayşe"),
          reaction("r5", "kutay", "fire", "Kutay"),
          reaction("r5", "ayse", "laugh", "Ayşe"),
          reaction("r6", "ayse", "heart", "Ayşe"),
          reaction("r6", "can", "heart", "Can"),
          reaction("r6", "mehmet", "sad", "Mehmet"),
        ],
        // Mehmet has no device with notifications on.
        push_subscriptions: devices(["kutay", "ayse", "can", "zeynep"]),
      },
      people,
    );
  });

  const bodies = () => sent.map((s) => `${s.to.join(",")} | ${s.message.body}`);

  test("several reactions are grouped: latest reactor first, each person once, each emoji once", async () => {
    await notifyReaction("r1", "can");
    assert.deepEqual(bodies(), ["kutay | Can, Ayşe ve 1 kişi daha yanıtına ❤️😂👏 bıraktı"]);
    assert.equal(sent[0].message.tag, "reaction:r1");
  });

  test("reacting to your own answer notifies nobody", async () => {
    await notifyReaction("r2", "kutay");
    assert.equal(sent.length, 0);
  });

  test("the owner's own reaction is not counted", async () => {
    await notifyReaction("r5", "ayse");
    assert.deepEqual(bodies(), ["kutay | Ayşe yanıtına 😂 bıraktı"]);
  });

  test("English owner, two and three reactors", async () => {
    await notifyReaction("r3", "mehmet");
    assert.deepEqual(bodies(), ["zeynep | Mehmet and Can reacted 😮🔥 to your answer"]);
    sent.length = 0;
    await notifyReaction("r6", "mehmet");
    assert.deepEqual(bodies(), ["zeynep | Mehmet, Can and 1 other reacted ❤️😢 to your answer"]);
  });

  test("no notification when the owner has no device", async () => {
    await notifyReaction("r4", "ayse");
    assert.equal(sent.length, 0);
  });

  test("an unknown answer fails quietly", async () => {
    await notifyReaction("missing", "ayse");
    assert.equal(sent.length, 0);
  });
});
