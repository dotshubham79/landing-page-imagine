import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the IMAGINE deck in the intended narrative order", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>IMAGINE — A creative interface for intelligence<\/title>/i);
  assert.match(html, /href="\/imagine-logo\.png"/i);

  const sceneTitles = [
    "A creative interface",
    "Today, intelligence creates the output",
    "What if the intelligence",
    "AI today does three things",
    "The interface carries the intelligence",
  ];
  const positions = sceneTitles.map((title) => html.indexOf(title));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(html, /small figure stands on a hill/i);
  assert.match(html, /orbiting moon/i);
});

test("uses the supplied transparent PNG logo throughout the product shell", async () => {
  const [logo, page, layout] = await Promise.all([
    readFile(new URL("../public/imagine-logo.png", import.meta.url)),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(logo.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(logo[25], 6, "PNG should use RGBA color type");
  assert.match(page, /src="\/imagine-logo\.png"/);
  assert.match(layout, /icon:\s*"\/imagine-logo\.png"/);
  assert.doesNotMatch(page, /imagine-logo-v3/);
  assert.doesNotMatch(layout, /imagine-logo-v3/);
});
