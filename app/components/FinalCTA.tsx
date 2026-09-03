import { motion } from "framer-motion";
import { PromptCapsule } from "./PromptCapsule";

export function FinalCTA() {
  return (
    <section id="final" className="final-cta">
      <div className="final-glow" />
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
        <h2>Your thoughts<br />already have a world.<br /><em>Enter it.</em></h2>
        <PromptCapsule id="final-imagine" placeholder="What do you want to imagine?" />
        <p className="final-line">One intelligent interface. Infinite applications.</p>
      </motion.div>
    </section>
  );
}
