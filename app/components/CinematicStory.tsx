"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const between = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function CinematicStory() {
  const storyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let targetProgress = 0;
    let renderedProgress = 0;
    let frame = 0;

    const paint = () => {
      renderedProgress = reducedMotion ? targetProgress : renderedProgress + (targetProgress - renderedProgress) * 0.075;
      const progress = clamp(renderedProgress);
      const chapter = progress < 0.2 ? "0" : progress < 0.6 ? "1" : "2";
      const lightWorld = between(progress, 0.18, 0.31);
      const blueReturn = between(progress, 0.72, 0.95);
      const textBluePhase = lightWorld * (1 - blueReturn);
      const textRed = Math.round(lerp(248, 46, textBluePhase));
      const textGreen = Math.round(lerp(243, 99, textBluePhase));
      const textBlue = Math.round(lerp(232, 152, textBluePhase));
      story.dataset.chapter = chapter;
      story.style.setProperty("--story-light", lightWorld.toFixed(3));
      story.style.setProperty("--story-blue-return", blueReturn.toFixed(3));
      story.style.setProperty("--story-copy-color", `rgb(${textRed} ${textGreen} ${textBlue})`);
      const firstApproach = between(progress, 0, 0.16);
      const secondSweep = between(progress, 0.16, 0.62);
      const finalRelease = between(progress, 0.62, 1);
      story.style.setProperty("--today-opacity", (1 - between(progress, 0.16, 0.28)).toFixed(3));
      story.style.setProperty("--today-y", `${lerp(0, -46, between(progress, 0.16, 0.3)).toFixed(2)}px`);
      story.style.setProperty("--today-scale", lerp(1, 0.94, between(progress, 0.16, 0.3)).toFixed(3));
      story.style.setProperty("--tomorrow-opacity", (between(progress, 0.17, 0.31) * (1 - between(progress, 0.5, 0.63))).toFixed(3));
      story.style.setProperty("--tomorrow-y", `${lerp(34, -34, between(progress, 0.22, 0.63)).toFixed(2)}px`);
      story.style.setProperty("--tomorrow-scale", lerp(0.94, 1, between(progress, 0.17, 0.31)).toFixed(3));
      story.style.setProperty("--imagine-opacity", between(progress, 0.59, 0.76).toFixed(3));
      story.style.setProperty("--imagine-y", `${lerp(42, 0, between(progress, 0.59, 0.76)).toFixed(2)}px`);
      story.style.setProperty("--imagine-scale", lerp(0.91, 1, between(progress, 0.59, 0.76)).toFixed(3));
      story.style.setProperty("--hands-opacity", lerp(0.84, 0.18, finalRelease).toFixed(3));
      story.style.setProperty("--left-x", `${(lerp(-42, -8, firstApproach) + lerp(0, -18, secondSweep) + lerp(0, -30, finalRelease)).toFixed(2)}px`);
      story.style.setProperty("--left-y", `${(lerp(12, 0, firstApproach) + lerp(0, -12, secondSweep) + lerp(0, -22, finalRelease)).toFixed(2)}px`);
      story.style.setProperty("--right-x", `${(lerp(42, 8, firstApproach) + lerp(0, 18, secondSweep) + lerp(0, 30, finalRelease)).toFixed(2)}px`);
      story.style.setProperty("--right-y", `${(lerp(-12, 0, firstApproach) + lerp(0, 12, secondSweep) + lerp(0, 22, finalRelease)).toFixed(2)}px`);
      story.style.setProperty("--hands-scale", (1 + firstApproach * 0.018 - finalRelease * 0.07).toFixed(3));
      story.style.setProperty("--sparkles-opacity", (between(progress, 0.06, 0.18) * (1 - between(progress, 0.72, 0.95))).toFixed(3));

      if (Math.abs(targetProgress - renderedProgress) > 0.0004) frame = requestAnimationFrame(paint);
      else frame = 0;
    };

    const measure = () => {
      const start = story.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(story.offsetHeight - window.innerHeight, 1);
      targetProgress = clamp((window.scrollY - start) / travel);
      if (!frame) frame = requestAnimationFrame(paint);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={storyRef} id="manifesto" className="story-scroll" aria-label="The IMAGINE idea">
      <div className="story-stage">
        <div className="story-world">
          <div className="story-grain" aria-hidden="true" />
          <div className="story-hands" aria-hidden="true">
            <div className="story-hand story-hand-left"><img src="/imagine-hands-editorial-v1.png" alt="" /></div>
            <div className="story-hand story-hand-right"><img src="/imagine-hands-editorial-v1.png" alt="" /></div>
          </div>
          <div className="story-sparkles" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--spark-index": index } as CSSProperties} />)}
          </div>
          <div className="story-copy">
            <p className="story-thought story-thought-today">Today intelligence creates<br />the output.</p>
            <p className="story-thought story-thought-tomorrow">Tomorrow intelligence<br />is the output.</p>
            <p className="story-thought story-thought-final"><strong>imagine</strong><small>is where imagination meets intelligence.</small></p>
          </div>
          <nav className="story-pagination" aria-label="Story chapters"><i /><i /><i /></nav>
        </div>
      </div>
    </section>
  );
}
