import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const paths = [
  { id: "learn", tag: "Learn", title: "IMAGINE Learn", video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4", copy: "Turn questions into worlds you can explore. See ideas, manipulate them, ask what changes, and keep learning inside an explanation that remembers where your mind has been." },
  { id: "create", tag: "Create", title: "IMAGINE Create", video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4", copy: "Imagine characters, environments, stories, interactions, products, scenes, and impossible ideas — then keep shaping them instead of regenerating from zero." },
];

export function PathsSection() {
  return (
    <section className="paths section-shell">
      <motion.header initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }}><h2>Where will you imagine?</h2><p>Two ways in</p></motion.header>
      <div className="path-grid">
        {paths.map((path, index) => (
          <motion.article id={path.id} className="liquid-glass path-card" key={path.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}>
            <div className="path-film"><video src={path.video} muted autoPlay loop playsInline preload="metadata" aria-label={`${path.title} world`} /><div /></div>
            <div className="path-copy"><p className="eyebrow">{path.tag}</p><div className="path-title-row"><h3>{path.title}</h3><a className="liquid-glass round-link" href="#final" aria-label={`Enter ${path.title}`}><ArrowUpRight size={17} /></a></div><p>{path.copy}</p></div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
