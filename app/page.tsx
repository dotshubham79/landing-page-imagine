"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

const V1_HREF = "/v1";

function Crystal() {
  return (
    <a className="crystal" href={V1_HREF} aria-label="Enter IMAGINE V1">
      <span className="crystal-glow" aria-hidden="true" />
      <span className="crystal-mark" aria-hidden="true">
        <img src="/imagine-logo-v3.png" alt="" />
      </span>
      <span className="crystal-hint">Enter V1</span>
    </a>
  );
}

export default function Home() {
  const shell = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (!shell.current) return;
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    shell.current.style.setProperty("--move-x", `${x * 8}px`);
    shell.current.style.setProperty("--move-y", `${y * 6}px`);
  }

  return (
    <main ref={shell} className={`minimal-site ${ready ? "is-ready" : ""}`} onPointerMove={trackPointer}>
      <div className="paper" aria-hidden="true" />

      <div className="hand-stage" aria-hidden="true">
        <img src="/imagine-hand-hero-v5.png" alt="" />
      </div>

      <div className="crystal-position"><Crystal /></div>

      <section className="intro" aria-labelledby="imagine-title">
        <div className="brand-lockup">
          <img src="/imagine-logo-v3.png" alt="" aria-hidden="true" />
          <h1 id="imagine-title">IMAGINE</h1>
        </div>

        <p className="tagline">A creative interface for AI.</p>
        <p className="statement">Here, your output is intelligent.</p>

        <a className="primary-action" href={V1_HREF}>
          <span>Try the V1 of IMAGINE</span>
          <i aria-hidden="true">→</i>
        </a>
        <p className="discovery">Discover the future of human–AI interaction.</p>
      </section>

      <footer className="quiet-footer">
        <p>Built by two brothers making the future of imagination.</p>
        <span>IMAGINE © 2026</span>
      </footer>
    </main>
  );
}
