import { motion } from "framer-motion";

const THOUGHT_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4";
const viewport = { once: true, margin: "-100px" } as const;

export function IntelligenceSection() {
  return (
    <section id="thought-world" className="intelligence section-shell">
      <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>Thought <em>×</em> World</motion.h2>
      <div className="intelligence-grid">
        <motion.div className="thought-film" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}><video src={THOUGHT_VIDEO} muted autoPlay loop playsInline preload="metadata" aria-label="Thought taking form in IMAGINE" /></motion.div>
        <motion.div className="intelligence-copy" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <article><p className="eyebrow">Not a prompt. A world.</p><p>When you create something in IMAGINE, it does not disappear after the next prompt. Objects retain identity, context, relationships, behavior, and history — allowing an idea to evolve instead of constantly starting over.</p></article>
          <article><p className="eyebrow">Intelligence that stays</p><p>Speak to the world. Draw into it. Move things. Ask why. Change your mind. IMAGINE keeps the context alive so creation becomes a continuous conversation between you and what you are building.</p></article>
        </motion.div>
      </div>
    </section>
  );
}
