import { CSSProperties, FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HeroParticles } from "./HeroParticles";

const artwork = { width: 1672, height: 941 } as const;
const fingertips = {
  left: { x: 803, y: 400 },
  right: { x: 891, y: 486 },
} as const;

function imagePoint(image: HTMLImageElement, point: { x: number; y: number }) {
  const bounds = image.getBoundingClientRect();
  const scale = Math.max(bounds.width / artwork.width, bounds.height / artwork.height);
  const drawnWidth = artwork.width * scale;
  const drawnHeight = artwork.height * scale;
  return {
    x: bounds.left + (bounds.width - drawnWidth) / 2 + point.x * scale,
    y: bounds.top + (bounds.height - drawnHeight) / 2 + point.y * scale,
  };
}

export function Hero() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [handsReady, setHandsReady] = useState(false);
  const [handOffsets, setHandOffsets] = useState({ leftX: 0, leftY: 0, rightX: 0, rightY: 0 });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const placeHands = () => {
      const leftImage = panel.querySelector<HTMLImageElement>("#hero-hand-left img");
      const rightImage = panel.querySelector<HTMLImageElement>("#hero-hand-right img");
      if (!leftImage || !rightImage) return;

      const panelBounds = panel.getBoundingClientRect();
      const left = imagePoint(leftImage, fingertips.left);
      const right = imagePoint(rightImage, fingertips.right);
      const gap = Math.min(Math.max(panelBounds.width * 0.08, 104), 128);
      const centerX = panelBounds.left + panelBounds.width / 2;
      const centerY = panelBounds.top + panelBounds.height / 2;

      setHandOffsets({
        leftX: centerX - gap / 2 - left.x,
        leftY: centerY - left.y,
        rightX: centerX + gap / 2 - right.x,
        rightY: centerY - right.y,
      });
      setHandsReady(true);
    };

    const frame = window.requestAnimationFrame(placeHands);
    const observer = new ResizeObserver(placeHands);
    observer.observe(panel);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let frame = 0;

    const move = (event: PointerEvent) => {
      const bounds = panel.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        panel.style.setProperty("--logo-x", `${x * 16}px`);
        panel.style.setProperty("--logo-y", `${y * 12}px`);
        panel.style.setProperty("--logo-rotate-x", `${y * -11}deg`);
        panel.style.setProperty("--logo-rotate-y", `${x * 13}deg`);
      });
    };

    const reset = () => {
      panel.style.setProperty("--logo-x", "0px");
      panel.style.setProperty("--logo-y", "0px");
      panel.style.setProperty("--logo-rotate-x", "0deg");
      panel.style.setProperty("--logo-rotate-y", "0deg");
    };

    panel.addEventListener("pointermove", move);
    panel.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener("pointermove", move);
      panel.removeEventListener("pointerleave", reset);
    };
  }, []);

  useEffect(() => {
    const openFromHash = () => setSurfaceOpen(window.location.hash === "#surface");
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  function enterImagine() {
    document.getElementById("manifesto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeSurface() {
    window.history.replaceState(null, "", window.location.pathname);
    setSurfaceOpen(false);
  }

  function beginImagine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className={`hero ${surfaceOpen ? "hero-surface-open" : ""}`} aria-labelledby="hero-heading">
      <div
        ref={panelRef}
        className="hero-art-panel"
        data-hands-ready={handsReady}
      >
        <div className="hero-paper-grain" aria-hidden="true" />
        <HeroParticles />

        <div className="hero-hands" aria-hidden="true">
          <div id="hero-hand-left" className="hero-hand hero-hand-left" style={{ "--hand-target-x": `${handOffsets.leftX}px`, "--hand-target-y": `${handOffsets.leftY}px` } as CSSProperties}>
            <img src="/imagine-hands-editorial-v1.png" alt="" />
          </div>
          <div id="hero-hand-right" className="hero-hand hero-hand-right" style={{ "--hand-target-x": `${handOffsets.rightX}px`, "--hand-target-y": `${handOffsets.rightY}px` } as CSSProperties}>
            <img src="/imagine-hands-editorial-v1.png" alt="" />
          </div>
        </div>

        <header className="hero-wordmark">
          <h1 id="hero-heading">imagine</h1>
          <p>with your eyes open</p>
        </header>

        <button className="hero-logo" type="button" aria-label="Continue to the IMAGINE story" onClick={enterImagine}>
          <span className="hero-logo-aura" aria-hidden="true" />
          <img src="/imagine-logo-center-v5.png" alt="" />
        </button>

        <div className="hero-scroll-cue" aria-hidden="true">
          <i />
        </div>

        <div className="hero-entry-light" aria-hidden="true" />

        <section className="intelligent-surface" aria-hidden={!surfaceOpen} aria-label="The intelligent surface">
          <button className="surface-return" type="button" onClick={closeSurface}>return</button>
          <div className="surface-mark" aria-hidden="true"><img src="/imagine-logo-center-v5.png" alt="" /></div>
          <div className="surface-copy">
            <p>the intelligent surface</p>
            <h2>what are you<br />imagining?</h2>
            <span>Begin with an image, a thought, or a question.</span>
          </div>
          <form className="surface-form" onSubmit={beginImagine}>
            <label htmlFor="imagine-prompt">Give your imagination a place to begin</label>
            <textarea id="imagine-prompt" name="prompt" placeholder="I want to see…" rows={3} />
            <div className="surface-actions">
              <label className="surface-image" htmlFor="imagine-image">add an image</label>
              <input id="imagine-image" name="image" type="file" accept="image/*" />
              <button type="submit">begin <span aria-hidden="true">↗</span></button>
            </div>
            <p className={submitted ? "surface-response is-visible" : "surface-response"} role="status">The surface is ready for your next thought.</p>
          </form>
        </section>
      </div>
    </section>
  );
}
