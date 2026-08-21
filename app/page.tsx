"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

const V1_HREF = "/v1";

function PortalMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`portal-mark ${compact ? "is-compact" : ""}`} aria-hidden="true">
      <i className="mark-outer" />
      <i className="mark-inner" />
      <i className="mark-spine" />
      <i className="mark-seed" />
    </span>
  );
}

export default function Home() {
  const shell = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.18 },
    );
    document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (!shell.current) return;
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    shell.current.style.setProperty("--pointer-x", `${x * 9}px`);
    shell.current.style.setProperty("--pointer-y", `${y * 7}px`);
    shell.current.style.setProperty("--light-x", `${event.clientX}px`);
    shell.current.style.setProperty("--light-y", `${event.clientY}px`);
  }

  function enterV1() {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => window.location.assign(V1_HREF), 720);
  }

  return (
    <main
      ref={shell}
      className={`premium-site ${ready ? "is-ready" : ""} ${entering ? "is-entering" : ""}`}
      onPointerMove={trackPointer}
    >
      <div className="paper-grain" aria-hidden="true" />
      <div className="transition-veil" aria-hidden="true" />

      <header className="site-header">
        <a className="nav-brand" href="#top" aria-label="IMAGINE home">
          <PortalMark compact />
          <span>IMAGINE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#manifesto">Manifesto</a>
          <a href="#founders">Founders</a>
          <button type="button" onClick={enterV1}>Enter V1 <span>↗</span></button>
        </nav>
      </header>

      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero-hand" aria-hidden="true">
          <img src="/imagine-hand-hero-v7.png" alt="" />
          <span className="palm-light" />
        </div>

        <div className="hero-copy">
          <p className="eyebrow"><span>01</span> Creative intelligence</p>
          <h1 id="hero-title">IMAGINE</h1>
          <p className="hero-line">A creative interface<br />for <em>intelligence.</em></p>
          <p className="hero-support">Here, your output is intelligent. Shape an idea, keep it alive, and continue creating from where thought left off.</p>
          <button className="text-action" type="button" onClick={enterV1}>
            <span>Try the V1 of IMAGINE</span>
            <i aria-hidden="true">→</i>
          </button>
        </div>

        <button className="hand-portal" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1 through the glowing mark">
          <span className="portal-aura" aria-hidden="true" />
          <PortalMark />
          <span className="portal-label">Touch to imagine</span>
        </button>

        <p className="hand-caption"><span>Human gesture</span><br />Machine-scale imagination</p>
        <a className="scroll-cue" href="#manifesto"><span>Scroll to discover</span><i /></a>
      </section>

      <section id="manifesto" className="manifesto section" aria-labelledby="manifesto-title">
        <div className="section-index" data-reveal>
          <span>02</span>
          <p>The premise</p>
        </div>
        <div className="manifesto-copy" data-reveal>
          <p className="section-kicker">Not another tool. A different relationship.</p>
          <h2 id="manifesto-title">Ideas should not disappear when the prompt ends.</h2>
          <div className="manifesto-detail">
            <p>IMAGINE turns intelligence into a creative material—something you can shape, revisit, and build upon.</p>
            <p>Objects persist. Context remains. Creation becomes continuous.</p>
          </div>
        </div>
        <div className="manifesto-note" data-reveal>
          <span>01</span><p>Describe</p><i />
          <span>02</span><p>Shape</p><i />
          <span>03</span><p>Continue</p>
        </div>
      </section>

      <section id="founders" className="founders section" aria-labelledby="founders-title">
        <div className="section-index" data-reveal>
          <span>03</span>
          <p>The makers</p>
        </div>
        <div className="founders-heading" data-reveal>
          <p className="section-kicker">Built close to the source</p>
          <h2 id="founders-title">Two brothers making the future of imagination.</h2>
        </div>
        <div className="founders-story" data-reveal>
          <p>We grew up turning the same ideas over from opposite sides—one asking what could exist, the other asking how to make it real.</p>
          <p>IMAGINE is that conversation made into an interface: human at the center, intelligence within reach.</p>
          <span>Independent by design<br />Made for the first creators</span>
        </div>
      </section>

      <section className="finale section" aria-labelledby="finale-title">
        <div className="finale-mark" data-reveal><PortalMark /></div>
        <p className="section-kicker" data-reveal>IMAGINE / V1</p>
        <h2 id="finale-title" data-reveal>What will you make<br />when intelligence becomes material?</h2>
        <button className="finale-action" type="button" onClick={enterV1} data-reveal>
          Enter the first version <span>→</span>
        </button>
      </section>

      <footer className="site-footer">
        <span>IMAGINE © 2026</span>
        <p>A creative interface for intelligence.</p>
        <a href="#top">Back to the beginning ↑</a>
      </footer>
    </main>
  );
}
