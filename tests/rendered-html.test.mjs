import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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

test("server-renders the IMAGINE landing and semantic team content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>IMAGINE — Where imagination becomes intelligence<\/title>/i);
  assert.match(html, /<h1>IMAGINE<\/h1>/);
  assert.match(html, /where imagination meets intelligence\./);
  assert.match(html, /The people making IMAGINE possible/);
  assert.match(html, /Binayak and Shubham arriving together in a golf cart/);
  assert.match(html, /Two brothers building/);
  assert.match(html, /Creative direction, product, and vision\./);
  assert.match(html, /Engineering, systems, and intelligence\./);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the cinematic team experience accessible and starter-free", async () => {
  const [page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function TeamFormationParticles/);
  assert.match(page, /className="founder-hotspot founder-hotspot-binayak"/);
  assert.match(page, /className="founder-hotspot founder-hotspot-shubham"/);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.match(page, /team:dissolve-label/);
  assert.match(css, /font-family:\s*"Satoshi"/);
  assert.match(css, /\.team-formation-canvas[^}]*pointer-events:\s*none/s);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
