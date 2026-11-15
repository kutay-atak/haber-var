// The Google Drive backup against a fake Google (token + Drive) and a fake Cloudinary.
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { after, before, beforeEach, describe, test } from "node:test";
import { db, reset } from "./fakes/supabase-admin.ts";

process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
process.env.GOOGLE_CLIENT_ID = "cid";
process.env.GOOGLE_CLIENT_SECRET = "cs";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
process.env.SUPABASE_SECRET_KEY = "k";

const { runBackup } = await import("@/lib/backup");

// ── Fake Google Drive, Google token endpoint and Cloudinary ────────────────
const drive = { files: new Map(), nextId: 1 };
const requests = [];
let cloudinaryDelayMs = 0;
let tokenRequests = 0;
const realFetch = globalThis.fetch;

const BOUNDARY = "haber-var-yedek";
function parseMultipart(body) {
  const text = body.toString("latin1");
  const meta = JSON.parse(text.split("\r\n\r\n")[1].split("\r\n--")[0]);
  const separator = `\r\n--${BOUNDARY}\r\n`;
  const secondPart = text.indexOf(separator) + separator.length;
  const headerEnd = text.indexOf("\r\n\r\n", secondPart);
  const mime = text.slice(secondPart, headerEnd).replace("content-type: ", "");
  return { meta, mime, content: body.subarray(headerEnd + 4, text.lastIndexOf("\r\n--")) };
}

async function fakeFetch(input, init = {}) {
  const url = typeof input === "string" ? input : input.url;
  const method = init.method ?? "GET";
  requests.push(`${method} ${url.split("?")[0]}`);
  if (url.startsWith("https://oauth2.googleapis.com/token")) {
    tokenRequests += 1;
    assert.match(String(init.body), /refresh_token=rt-1/);
    return Response.json({ access_token: "at" });
  }
  if (url.includes("googleapis") && !init.headers?.authorization) return new Response("no auth", { status: 401 });
  if (url.startsWith("https://res.cloudinary.com/")) {
    if (cloudinaryDelayMs) await new Promise((r) => setTimeout(r, cloudinaryDelayMs));
    const id = url.split("/").pop();
    if (id === "v1") return new Response("VIDEO", { headers: { "content-type": "video/mp4" } });
    if (id === "s1") return new Response("AUDIO", { headers: { "content-type": "audio/webm" } });
    if (id === "broken") return new Response("nope", { status: 404 });
    return new Response("IMG", { headers: { "content-type": "image/jpeg" } });
  }
  const u = new URL(url);
  if (u.pathname.startsWith("/drive/v3/files/") && method === "GET") {
    const file = drive.files.get(u.pathname.split("/").pop());
    return file ? Response.json({ trashed: file.trashed ?? false }) : new Response("not found", { status: 404 });
  }
  if (u.pathname === "/drive/v3/files" && method === "GET") {
    const parent = /'([^']+)' in parents/.exec(u.searchParams.get("q"))[1];
    const files = [...drive.files.entries()].filter(([, f]) => f.parent === parent && !f.trashed).map(([id, f]) => ({ id, name: f.name }));
    return Response.json({ files });
  }
  if (u.pathname === "/drive/v3/files" && method === "POST") {
    const meta = JSON.parse(init.body);
    const id = `f${drive.nextId++}`;
    drive.files.set(id, { name: meta.name, parent: meta.parents?.[0] ?? null, folder: true });
    return Response.json({ id });
  }
  if (u.pathname.startsWith("/upload/drive/v3/files")) {
    const { meta, mime, content } = parseMultipart(Buffer.from(init.body));
    if (method === "PATCH") {
      Object.assign(drive.files.get(u.pathname.split("/").pop()), { content, mime });
      return Response.json({ id: "patched" });
    }
    const id = `f${drive.nextId++}`;
    drive.files.set(id, { name: meta.name, parent: meta.parents[0], content, mime });
    return Response.json({ id });
  }
  throw new Error(`unexpected request: ${method} ${url}`);
}

const byName = (name) => [...drive.files.values()].filter((f) => f.name === name).at(-1);
const folderId = (name) => [...drive.files.entries()].find(([, f]) => f.name === name && f.folder && !f.trashed)?.[0];
const namesIn = (folder) => [...drive.files.values()].filter((f) => f.parent === folderId(folder)).map((f) => f.name).sort();
const dump = () => JSON.parse(gunzipSync(byName("veritabani.json.gz").content).toString());

const media = (id, kind, created_at) => ({ id: `m-${id}`, public_id: `haber-var/${id}`, kind, created_at });
const dataset = () => ({
  app_secrets: [{ key: "google_drive", value: JSON.stringify({ refresh_token: "rt-1" }) }],
  profiles: [{ id: "u1", display_name: "Kutay" }, { id: "u2", display_name: "Ayşe" }],
  groups: [{ id: "g1", name: "Kuzenler" }],
  group_members: [{ group_id: "g1", user_id: "u1" }, { group_id: "g1", user_id: "u2" }],
  invites: [],
  question_bank: [],
  issues: [{ id: "i1" }],
  issue_questions: [],
  responses: [],
  response_media: [media("a1", "image", "2026-11-01"), media("v1", "video", "2026-11-02"), media("s1", "audio", "2026-11-03"), media("broken", "image", "2026-11-04")],
  email_log: [],
  question_queue: [],
  votes: [{ issue_question_id: "q1", user_id: "u1" }],
  reactions: [],
  // 2,500 rows: more than two pages of 1,000.
  comments: Array.from({ length: 2500 }, (_, i) => ({ id: `c${String(i).padStart(5, "0")}`, body: "x" })),
  issue_schedules: [{ group_id: "g1", enabled: true }],
  push_subscriptions: [],
  push_log: [],
});
const SUNDAY = new Date("2026-11-15T07:00:00Z");
const MONDAY = new Date("2026-11-16T07:00:00Z");
const TUESDAY = new Date("2026-11-17T07:00:00Z");

describe("Google Drive backup", () => {
  before(() => {
    globalThis.fetch = fakeFetch;
  });
  after(() => {
    globalThis.fetch = realFetch;
  });
  beforeEach(() => {
    drive.files.clear();
    drive.nextId = 1;
    requests.length = 0;
    cloudinaryDelayMs = 0;
    reset(dataset(), { u1: { email: "a@b.c", locale: "tr", providers: ["google"] } });
  });

  test("first run creates the folders, exports every table and copies the media", async () => {
    const summary = await runBackup(60_000, SUNDAY, { force: true });
    assert.equal(summary.database, "ok");
    assert.deepEqual(summary.media, { copied: 3, pending: 0, failed: 1 });
    assert.ok(folderId("Haber Var yedek") && folderId("veritabani") && folderId("medya"), "three folders");
    assert.deepEqual(namesIn("medya"), ["haber-var__a1.jpg", "haber-var__s1.webm", "haber-var__v1.mp4"]);
    assert.equal(byName("haber-var__v1.mp4").content.toString(), "VIDEO");
    assert.equal(byName("haber-var__v1.mp4").mime, "video/mp4");
    const data = dump();
    assert.equal(Object.keys(data.tables).filter((t) => data.tables[t]).length, 17, "17 tables");
    assert.equal(data.tables.comments.length, 2500);
    assert.equal(new Set(data.tables.comments.map((c) => c.id)).size, 2500, "pagination keeps every row once");
    assert.equal(data.tables.comments[0].id, "c00000");
    assert.equal(data.users[0].email, "a@b.c");
    assert.equal(data.tables.app_secrets, undefined, "secrets are not exported");
    assert.deepEqual(data._errors, {});
    const stored = JSON.parse(db.app_secrets.find((r) => r.key === "backup_folders").value);
    assert.equal(stored.root, folderId("Haber Var yedek"));
  });

  test("a second run overwrites the database file and does not re-download media", async () => {
    await runBackup(60_000, SUNDAY, { force: true });
    const files = drive.files.size;
    requests.length = 0;
    const summary = await runBackup(60_000, SUNDAY, { force: true });
    assert.equal(drive.files.size, files, "no new files");
    assert.equal(requests.filter((r) => r.startsWith("PATCH")).length, 1, "one overwrite");
    assert.ok(!requests.some((r) => r.endsWith("/haber-var/a1")), "copied media is not fetched again");
    assert.deepEqual(summary.media, { copied: 0, pending: 0, failed: 1 }, "only the broken file is retried");
  });

  test("the database is exported on Mondays and skipped on other days; media runs daily", async () => {
    let summary = await runBackup(60_000, MONDAY);
    assert.equal(summary.database, "ok");
    db.response_media.push(media("a3", "image", "2026-11-17"));
    summary = await runBackup(60_000, TUESDAY);
    assert.equal(summary.database, "skipped");
    assert.equal(summary.media.copied, 1);
    assert.equal([...drive.files.values()].filter((f) => f.name === "veritabani.json.gz").length, 1, "still one database file");
  });

  test("when the time budget runs out, remaining media waits for the next day", async () => {
    await runBackup(60_000, SUNDAY, { force: true });
    db.response_media.push(media("a3", "image", "2026-11-16"), media("a4", "image", "2026-11-16"));
    cloudinaryDelayMs = 300;
    const summary = await runBackup(250, TUESDAY);
    assert.ok(summary.media.pending >= 1, `pending: ${JSON.stringify(summary.media)}`);
    assert.equal(summary.media.copied + summary.media.pending + summary.media.failed, 3);
  });

  test("a trashed backup folder is recreated", async () => {
    await runBackup(60_000, SUNDAY, { force: true });
    drive.files.get(folderId("Haber Var yedek")).trashed = true;
    const summary = await runBackup(60_000, MONDAY);
    assert.equal(summary.database, "ok");
    assert.equal([...drive.files.values()].filter((f) => f.name === "Haber Var yedek" && !f.trashed).length, 1);
  });

  test("a table that cannot be read is reported without losing the rest", async () => {
    db.push_log = [{ unexpected: 1 }];
    const summary = await runBackup(60_000, MONDAY);
    assert.equal(summary.database, "partial");
    const data = dump();
    assert.match(data._errors.push_log, /issue_id/);
    assert.equal(data.tables.comments.length, 2500);
  });

  test("without a connected Drive the backup is skipped quietly", async () => {
    db.app_secrets = [];
    const summary = await runBackup(60_000, MONDAY);
    assert.deepEqual(summary, { configured: false });
    assert.equal(tokenRequests, 0 + tokenRequests, "no token request was made in this test");
  });
});
