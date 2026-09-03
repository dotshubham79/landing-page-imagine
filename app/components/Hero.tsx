import { PointerEvent, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroParticles } from "./HeroParticles";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const panelRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);
  const [entering, setEntering] = useState(false);

  function moveScene(event: PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current;
    if (!panel || event.pointerType !== "mouse") return;

    const bounds = panel.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    panel.style.setProperty("--left-hand-x", `${x * 7}px`);
    panel.style.setProperty("--left-hand-y", `${y * 5}px`);
    panel.style.setProperty("--right-hand-x", `${x * -6}px`);
    panel.style.setProperty("--right-hand-y", `${y * -5}px`);

    const logoBounds = logoRef.current?.getBoundingClientRect();
    if (!logoBounds) return;
    const logoX = logoBounds.left + logoBounds.width / 2;
    const logoY = logoBounds.top + logoBounds.height / 2;
    const dx = event.clientX - logoX;
    const dy = event.clientY - logoY;
    const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 270);
    panel.style.setProperty("--logo-x", `${dx * influence * 0.035}px`);
    panel.style.setProperty("--logo-y", `${dy * influence * 0.035}px`);
  }

  function resetScene() {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.setProperty("--left-hand-x", "0px");
    panel.style.setProperty("--left-hand-y", "0px");
    panel.style.setProperty("--right-hand-x", "0px");
    panel.style.setProperty("--right-hand-y", "0px");
    panel.style.setProperty("--logo-x", "0px");
    panel.style.setProperty("--logo-y", "0px");
  }

  function enterImagine() {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => window.location.assign("https://imagine-lab.tech"), 920);
  }

  return (
    <section className={`hero ${entering ? "hero-is-entering" : ""}`} aria-labelledby="hero-heading">
      <motion.div
        ref={panelRef}
        className="hero-art-panel"
        initial={{ opacity: 0, scale: 0.986 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease }}
        onPointerMove={moveScene}
        onPointerLeave={resetScene}
      >
        <div className="hero-paper-grain" aria-hidden="true" />
        <HeroParticles />

        <div className="hero-hands" aria-hidden="true">
          <motion.div id="hero-hand-left" className="hero-hand hero-hand-left" initial={{ opacity: 0, x: -42, y: -24 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 1.6, delay: 0.18, ease }}>
            <img src="/imagine-hands-editorial-v1.png" alt="" />
          </motion.div>
          <motion.div id="hero-hand-right" className="hero-hand hero-hand-right" initial={{ opacity: 0, x: 42, y: 24 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 1.6, delay: 0.18, ease }}>
            <img src="/imagine-hands-editorial-v1.png" alt="" />
          </motion.div>
        </div>

        <motion.header className="hero-wordmark" initial={{ opacity: 0, y: -9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.72, delay: 1.85, ease }}>
          <h1 id="hero-heading">IMAGINE</h1>
          <p>where imagination meets intelligence</p>
        </motion.header>

        <motion.button ref={logoRef} className="hero-logo" type="button" aria-label="Enter IMAGINE" onClick={enterImagine} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 1.28, ease }}>
          <span className="hero-logo-aura" aria-hidden="true" />
          <img src="/imagine-logo-center-v5.png" alt="" />
          <span className="hero-logo-label" aria-hidden="true">enter</span>
        </motion.button>

        <motion.a className="hero-edge-link" href="#manifesto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 2.35 }}>
          explore
        </motion.a>

        <div className="hero-entry-light" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
