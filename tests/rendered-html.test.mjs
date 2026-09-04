import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the editorial IMAGINE experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>IMAGINE — A creative interface for intelligence<\/title>/i);
  assert.match(html, /<h1[^>]*>IMAGINE<\/h1>/);
  assert.match(html, /where imagination meets intelligence/);
  assert.match(html, /imagine-hands-editorial-v1\.png/);
  assert.match(html, /imagine-logo-center-v5\.png/);
  assert.match(html, /Today intelligence creates.*the output/s);
  assert.match(html, /Tomorrow intelligence.*is the output/s);
  assert.match(html, /IMAGINE.*is where imagination meets intelligence/s);
  assert.match(html, /imagine learn/);
  assert.match(html, /imagine create/);
  assert.match(html, /scroll to continue/);
  assert.match(html, /ready to be clicked/);
  assert.match(html, /what are you.*imagining/s);
  assert.match(html, /enter the intelligent surface/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the hero interactive, responsive, and fingertip-aware", async () => {
  const [hero, particles, story, page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/components/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/HeroParticles.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CinematicStory.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(hero, /className="hero-art-panel"/);
  assert.match(hero, /setSurfaceOpen\(true\)/);
  assert.match(hero, /intelligent-surface/);
  assert.doesNotMatch(hero, /<Navbar|<HeroVideo|<PromptCapsule/);
  assert.match(particles, /fingertips/);
  assert.match(particles, /#hero-hand-left img/);
  assert.match(particles, /THREE\.AdditiveBlending/);
  assert.match(story, /useScroll/);
  assert.match(story, /The IMAGINE idea/);
  assert.match(story, /story-sparkles/);
  assert.match(story, /story-pagination/);
  assert.match(story, /story-final-gateway/);
  assert.match(page, /<CinematicStory\s*\/>/);
  assert.match(page, /<ProductPaths\s*\/>/);
  assert.doesNotMatch(page, /<ManifestoSection|<WorldSection|<IntelligenceSection|<PathsSection|<PersistentWorldSection|<FinalCTA|<Footer/);
  assert.match(css, /\.hero-art-panel[^}]*background:\s*#386b9f/s);
  assert.match(css, /\.story-scroll[^}]*height:\s*480vh/s);
  assert.match(css, /\.story-stage[^}]*position:\s*sticky/s);
  assert.match(css, /@media \(max-width:520px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/imagine-hands-editorial-v1.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
