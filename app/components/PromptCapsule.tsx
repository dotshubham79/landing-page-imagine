import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const ideas = [
  "Imagine something...",
  "Explain black holes to me...",
  "Build a world beneath the ocean...",
  "Show me supply and demand...",
  "Imagine a city in the clouds...",
];

type PromptCapsuleProps = {
  id: string;
  placeholder?: string;
  cycle?: boolean;
};

export function PromptCapsule({ id, placeholder = ideas[0], cycle = false }: PromptCapsuleProps) {
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!cycle) return;
    const timer = window.setInterval(() => setPlaceholderIndex((current) => (current + 1) % ideas.length), 5200);
    return () => window.clearInterval(timer);
  }, [cycle]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="prompt-wrap">
      <form id={id} className="liquid-glass imagine-input" onSubmit={submit}>
        <label className="sr-only" htmlFor={`${id}-field`}>What do you want to imagine?</label>
        <input
          id={`${id}-field`}
          value={value}
          onChange={(event) => { setValue(event.target.value); setSubmitted(false); }}
          placeholder={cycle ? ideas[placeholderIndex] : placeholder}
          autoComplete="off"
        />
        <motion.button type="submit" aria-label="Begin imagining" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <ArrowUpRight size={20} />
        </motion.button>
      </form>
      <p className={`prompt-response${submitted ? " is-visible" : ""}`} aria-live="polite">
        Your world is forming. IMAGINE is opening soon.
      </p>
    </div>
  );
}
