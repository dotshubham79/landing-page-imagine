"use client";

import { CSSProperties, PointerEvent, useEffect, useRef, useState } from "react";

const V1_HREF = "/v1";

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-hidden="true">
      <img src="/imagine-logo-v3.png" alt="" />
    </span>
  );
}

function Crystal() {
  const particles = Array.from({ length: 9 }, (_, index) => ({
    "--i": index,
    "--angle": `${index * 40}deg`,
  })) as CSSProperties[];

  return (
    <a className="crystal-cta" href={V1_HREF} aria-label="Enter IMAGINE V1">
      <span className="crystal-orbit orbit-one" aria-hidden="true" />
      <span className="crystal-orbit orbit-two" aria-hidden="true" />
      <span className="crystal-shadow" aria-hidden="true" />
      <span className="crystal-body" aria-hidden="true">
        <span className="crystal-facet facet-one" />
        <span className="crystal-facet facet-two" />
        <img src="/imagine-logo-v3.png" alt="" />
      </span>
      <span className="crystal-particles" aria-hidden="true">
        {particles.map((style, index) => <i key={index} style={style} />)}
      </span>
      <span className="crystal-label"><b>Enter V1</b><i>Touch intelligence</i></span>
    </a>
  );
}

function FounderPhoto({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  className: string;
}) {
  const card = useRef<HTMLElement>(null);

  function tilt(event: PointerEvent<HTMLElement>) {
    if (!card.current) return;
    const bounds = card.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.current.style.setProperty("--tilt-x", `${y * -5}deg`);
    card.current.style.setProperty("--tilt-y", `${x * 6}deg`);
  }

  function reset() {
    card.current?.style.setProperty("--tilt-x", "0deg");
    card.current?.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <figure ref={card} className={`founder-photo ${className}`} onPointerMove={tilt} onPointerLeave={reset}>
      <div className="photo-frame"><img src={src} alt={alt} /></div>
      <figcaption><span>{label}</span><i aria-hidden="true">↗</i></figcaption>
    </figure>
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
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    shell.current.style.setProperty("--pointer-x", `${event.clientX}px`);
    shell.current.style.setProperty("--pointer-y", `${event.clientY}px`);
    shell.current.style.setProperty("--parallax-x", `${(x - 0.5) * 12}px`);
    shell.current.style.setProperty("--parallax-y", `${(y - 0.5) * 9}px`);
  }

  return (
    <main ref={shell} className={`site-shell ${ready ? "is-ready" : ""}`} onPointerMove={trackPointer}>
      <div className="cursor-aura" aria-hidden="true" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="paper-noise" aria-hidden="true" />
        <div className="grid-veil" aria-hidden="true" />
        <div className="construction construction-a" aria-hidden="true"><i /><i /><i /></div>
        <div className="construction construction-b" aria-hidden="true"><i /><i /></div>

        <header className="masthead">
          <a href="#top" className="masthead-brand" aria-label="IMAGINE home">
            <Mark compact />
            <span>IMAGINE</span>
          </a>
          <div className="masthead-note"><i /> FIRST INTERFACE / 01</div>
          <a className="about-link" href="#about"><span>About the makers</span><i>↓</i></a>
        </header>

        <div className="figure-stage" aria-hidden="true">
          <img className="figure-art" src="/imagine-figure-hero.png" alt="" />
          <img className="figure-echo" src="/imagine-figure-hero.png" alt="" />
          <span className="figure-breath" />
        </div>

        <div className="crystal-position"><Crystal /></div>

        <div className="hero-copy">
          <p className="eyebrow"><span>01</span> A NEW CREATIVE MEDIUM</p>
          <h1 id="hero-title">IMAGINE</h1>
          <p className="hero-tagline">A creative interface for intelligence.</p>
          <div className="hero-support">
            <p>Here, your output is intelligent.</p>
            <p>Try V1 of IMAGINE and discover the future of human–AI interaction.</p>
          </div>
        </div>

        <div className="hero-footnote" aria-hidden="true">
          <span>FIG. 01 — THE INTERFACE AWAKENS</span>
          <span className="scroll-line"><i /> SCROLL TO ORIGIN</span>
        </div>
      </section>

      <section className="about" id="about" aria-labelledby="about-title">
        <div className="ticker" aria-hidden="true">
          <div>HUMAN × INTELLIGENCE × IMAGINATION × HUMAN × INTELLIGENCE × IMAGINATION ×&nbsp;</div>
          <div>HUMAN × INTELLIGENCE × IMAGINATION × HUMAN × INTELLIGENCE × IMAGINATION ×&nbsp;</div>
        </div>

        <div className="about-inner">
          <div className="about-intro">
            <p className="eyebrow eyebrow--light"><span>02</span> THE ORIGIN</p>
            <h2 id="about-title">Two brothers making the future of <em>imagination.</em></h2>
            <p className="about-lede">We grew up making things side by side. IMAGINE is the next version of that instinct: a place where people and intelligence create in the same living space.</p>
          </div>

          <div className="founder-gallery">
            <FounderPhoto
              src="/founders-childhood.jpg"
              alt="The two IMAGINE founders as children beside a laptop"
              label="THEN — LEARNING TO CREATE"
              className="photo-childhood"
            />
            <FounderPhoto
              src="/founders-now.jpg"
              alt="The two brothers and founders of IMAGINE today"
              label="NOW — BUILDING IMAGINE"
              className="photo-now"
            />
            <div className="gallery-thread" aria-hidden="true"><i /><i /><i /></div>
          </div>

          <div className="belief">
            <p>OUR BELIEF</p>
            <h3>Intelligence should not end in an answer.</h3>
            <h3>It should become something you can <em>see, shape, and continue.</em></h3>
          </div>
        </div>
      </section>

      <section className="final-call" aria-label="Try IMAGINE V1">
        <div className="final-grid" aria-hidden="true" />
        <p>THE FUTURE IS NOT PROMPTED.<br />IT IS SHAPED.</p>
        <a href={V1_HREF} className="final-link">
          <Mark />
          <span><b>Enter IMAGINE V1</b><i>Discover the interface →</i></span>
        </a>
        <footer><span>IMAGINE © 2026</span><span>CREATED BY TWO BROTHERS</span><span>EARLY INTERFACE / V1</span></footer>
      </section>
    </main>
  );
}
