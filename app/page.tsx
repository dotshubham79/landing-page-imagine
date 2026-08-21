"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

function Glyph() {
  return (
    <span className="glyph" aria-hidden="true">
      <i className="glyph-outer" />
      <i className="glyph-inner" />
      <i className="glyph-spine" />
      <i className="glyph-seed" />
    </span>
  );
}

function BrandIcon({ large = false }: { large?: boolean }) {
  return <span className={`brand-icon ${large ? "is-large" : ""}`}><Glyph /></span>;
}

const modes = [
  { icon: "⌨", title: "Type", tone: "blue", copy: "Write your thoughts\nand spark ideas." },
  { icon: "◉", title: "Speak", tone: "amber", copy: "Say it out loud and let\nideas come alive." },
  { icon: "✎", title: "Draw", tone: "rose", copy: "Sketch freely and\nshape your imagination." },
];

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.2 },
    );
    document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (!root.current) return;
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    root.current.style.setProperty("--move-x", `${x * 7}px`);
    root.current.style.setProperty("--move-y", `${y * 5}px`);
  }

  function enterV1() {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => window.location.assign("/v1"), 680);
  }

  return (
    <main ref={root} className={`creation-site ${ready ? "ready" : ""} ${entering ? "entering" : ""}`} onPointerMove={trackPointer}>
      <div className="page-grain" aria-hidden="true" />
      <div className="entry-flash" aria-hidden="true" />

      <section id="product" className="hero-frame" aria-labelledby="hero-title">
        <div className="dot-field" aria-hidden="true" />
        <div className="creation-art" aria-hidden="true">
          <img src="/imagine-creation-hero-v8.png" alt="" />
        </div>

        <header className="topbar">
          <a className="brand" href="#product" aria-label="IMAGINE home">
            <BrandIcon />
            <span>IMAGINE</span>
          </a>
          <nav aria-label="Primary navigation">
            <a href="#modes">Product <i>⌄</i></a>
            <a href="#gallery">Gallery</a>
            <a href="#access">Pricing</a>
            <a href="/v1">Docs</a>
            <a href="#about">About</a>
          </nav>
          <button className="sign-in" type="button" onClick={enterV1}>Sign in</button>
        </header>

        <div className="hero-heading">
          <h1 id="hero-title">IMAGINE</h1>
          <p>A creative interface for intelligence.</p>
          <span className="small-sparkle" aria-hidden="true">✣</span>
        </div>

        <div className="entry-copy">
          <button className="try-button" type="button" onClick={enterV1}>Try V1 <span>→</span></button>
          <p>Click to enter</p>
        </div>

        <button className="core-logo" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1">
          <span className="core-aura" aria-hidden="true" />
          <BrandIcon large />
          <span className="core-orbit" aria-hidden="true" />
        </button>

        <span className="sparkle sparkle-left" aria-hidden="true">✦</span>
        <span className="sparkle sparkle-right" aria-hidden="true">✧</span>

        <div id="modes" className="mode-row">
          {modes.map((mode) => (
            <button className={`mode mode-${mode.tone}`} type="button" key={mode.title} onClick={enterV1}>
              <span className="mode-icon" aria-hidden="true">{mode.icon}</span>
              <span className="mode-text"><strong>{mode.title}</strong><small>{mode.copy}</small></span>
            </button>
          ))}
        </div>

        <a className="explore-pill" href="#gallery">Scroll to explore <span>⌄</span></a>
      </section>

      <section id="gallery" className="gallery-section content-section">
        <div className="section-label" data-reveal><span>01</span> Ways to imagine</div>
        <div className="gallery-copy" data-reveal>
          <p>One interface. Any starting point.</p>
          <h2>Begin with a sentence,<br />a voice, or a line.</h2>
        </div>
        <div className="gallery-rail" data-reveal>
          <article><span>Type</span><p>Turn language into living creative objects.</p></article>
          <article><span>Speak</span><p>Think out loud and let the interface follow.</p></article>
          <article><span>Draw</span><p>Give form to ideas before words arrive.</p></article>
        </div>
      </section>

      <section id="access" className="access-section content-section">
        <div className="section-label" data-reveal><span>02</span> First access</div>
        <div className="access-copy" data-reveal>
          <p>V1 / Early creators</p>
          <h2>Start where your imagination starts.</h2>
          <button type="button" onClick={enterV1}>Enter V1 <span>→</span></button>
        </div>
      </section>

      <section id="about" className="about-section content-section">
        <div className="section-label" data-reveal><span>03</span> About</div>
        <div className="about-copy" data-reveal>
          <p>Built close to the source</p>
          <h2>Two brothers making the future of imagination.</h2>
        </div>
        <p className="about-note" data-reveal>One asking what could exist. The other asking how to make it real. IMAGINE is that conversation made into an interface.</p>
      </section>

      <footer className="site-footer"><span>IMAGINE © 2026</span><a href="#product">Back to top ↑</a></footer>
    </main>
  );
}
