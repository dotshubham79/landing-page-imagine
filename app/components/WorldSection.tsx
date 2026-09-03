import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const WORLD_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4";

export function WorldSection() {
  return (
    <section id="world" className="world-section section-shell">
      <motion.div className="world-film" initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
        <video src={WORLD_VIDEO} muted autoPlay loop playsInline preload="metadata" aria-label="An evolving IMAGINE world" />
        <div className="film-overlay" />
        <div className="world-content">
          <div className="liquid-glass world-idea">
            <p className="eyebrow">The idea</p>
            <h3>The output should not be the end.</h3>
            <p>What if the intelligence stayed with it — remembering every object, relationship, behavior, and change?</p>
          </div>
          <motion.a className="liquid-glass world-enter" href="#thought-world" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Enter the world <ArrowUpRight size={17} /></motion.a>
        </div>
      </motion.div>
    </section>
  );
}
