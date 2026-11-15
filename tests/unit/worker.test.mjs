// cloudflare-worker.js: requests are forwarded to Vercel, redirects back to our address.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import worker from "../../cloudflare-worker.js";

const ME = "https://haber-var.example.workers.dev";
const SITE = "https://haber-var.vercel.app";
const realFetch = globalThis.fetch;
let seen = [];
let reply = () => new Response("ok");

describe("Cloudflare mirror worker", () => {
  before(() => {
    globalThis.fetch = async (request, init) => {
      seen.push({
        url: request.url,
        method: request.method,
        origin: request.headers.get("origin"),
        cookie: request.headers.get("cookie"),
        body: request.method === "POST" ? await request.text() : null,
        redirect: init?.redirect,
      });
      return reply();
    };
  });
  after(() => {
    globalThis.fetch = realFetch;
  });
  beforeEach(() => {
    seen = [];
    reply = () => new Response("ok");
  });

  test("forwards path, query, cookies and origin without following redirects", async () => {
    const res = await worker.fetch(new Request(`${ME}/gruplar?x=1`, { headers: { cookie: "sb=abc", origin: ME } }));
    assert.equal(seen[0].url, `${SITE}/gruplar?x=1`);
    assert.equal(seen[0].cookie, "sb=abc");
    assert.equal(seen[0].origin, ME);
    assert.equal(seen[0].redirect, "manual");
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "ok");
  });

  test("forwards POST bodies (form submissions)", async () => {
    await worker.fetch(new Request(`${ME}/sayi/1`, { method: "POST", body: "a=1", headers: { "content-type": "application/x-www-form-urlencoded" } }));
    assert.equal(seen[0].method, "POST");
    assert.equal(seen[0].body, "a=1");
  });

  test("rewrites redirects to the site's own address and keeps cookies", async () => {
    reply = () => new Response(null, { status: 307, headers: { location: `${SITE}/giris?next=%2Fgruplar`, "set-cookie": "sb=1; Path=/; HttpOnly" } });
    const res = await worker.fetch(new Request(`${ME}/gruplar`));
    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), `${ME}/giris?next=%2Fgruplar`);
    assert.equal(res.headers.get("set-cookie"), "sb=1; Path=/; HttpOnly");
  });

  test("leaves external and relative redirects untouched", async () => {
    reply = () => new Response(null, { status: 302, headers: { location: "https://accounts.google.com/o/oauth2/auth?x=1" } });
    assert.equal((await worker.fetch(new Request(`${ME}/x`))).headers.get("location"), "https://accounts.google.com/o/oauth2/auth?x=1");
    reply = () => new Response(null, { status: 303, headers: { location: "/gruplar" } });
    assert.equal((await worker.fetch(new Request(`${ME}/x`))).headers.get("location"), "/gruplar");
  });
});
