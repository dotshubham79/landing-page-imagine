import { motion } from "framer-motion";

const transition = { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const };
export function PersistentWorldSection() {
  return (
    <section className="persistent section-shell">
      <p className="eyebrow">What changes</p>
      <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={transition}>Today intelligence<br />creates the output.</motion.p>
      <motion.p className="muted-thought" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={transition}>But it rarely<br />travels with it.</motion.p>
      <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={transition}>What happens<br /><em>if the intelligence stays?</em></motion.p>
    </section>
  );
}
