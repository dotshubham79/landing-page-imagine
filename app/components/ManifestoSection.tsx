import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} id="manifesto" className="manifesto section-shell">
      <motion.p className="eyebrow" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>A different relationship with intelligence</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
        Today, you adapt<br />to how intelligence works.
        <span>What if intelligence<br /><em>adapted to your mind?</em></span>
      </motion.h2>
    </section>
  );
}
