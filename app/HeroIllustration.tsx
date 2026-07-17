"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IMAGINE_HERO — the illustration rebuilt as independent vector groups so every
 * element can move on its own (breathing character, floating orb, cursor-aware
 * pupil, orbiting moon, twinkling stars, an idea pulsing through the thread).
 * A staged entrance runs on mount; prefers-reduced-motion shows the finished
 * frame with only the faintest ambient drift.
 */
export default function HeroIllustration() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilRef = useRef<SVGGElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const svg = svgRef.current;
    const pupil = pupilRef.current;
    if (!svg || !pupil) return;

    // Curious, lagging pupil that tracks the cursor within a small radius.
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const relX = (event.clientX - (rect.left + rect.width * 0.575)) / rect.width;
      const relY = (event.clientY - (rect.top + rect.height * 0.35)) / rect.height;
      const max = 11;
      targetX = Math.max(-max, Math.min(max, relX * 46));
      targetY = Math.max(-max, Math.min(max, relY * 46));
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      pupil.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // 24 golden rays radiating from the eye, slightly uneven lengths.
  const rays = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const inner = 34;
    const outer = 74 + (i % 3) * 7 + (i % 2) * 4;
    return {
      x1: Math.cos(angle) * inner,
      y1: Math.sin(angle) * inner,
      x2: Math.cos(angle) * outer,
      y2: Math.sin(angle) * outer,
      key: i,
    };
  });

  return (
    <div className="hero-illustration">
      <svg
        ref={svgRef}
        className={`hero-svg ${play ? "hero-play" : ""}`}
        viewBox="0 0 1024 768"
        role="img"
        aria-label="A small figure stands on a hill, a single thought looping upward into a vast blue-and-mint orb with an open eye, an orbiting moon, and quiet stars."
      >
        <defs>
          <linearGradient id="orbFill" x1="18%" y1="88%" x2="82%" y2="12%">
            <stop offset="0%" stopColor="#8CBDE8" />
            <stop offset="46%" stopColor="#CFE7DF" />
            <stop offset="100%" stopColor="#B9E5D2" />
          </linearGradient>
          <radialGradient id="orbCenterGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="#FAF5E9" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#FAF5E9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F3D785" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#F3D785" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F3D785" stopOpacity="0" />
          </radialGradient>
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
          </filter>
          <filter id="orbTexture">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.32  0 0 0 0 0.45  0 0 0 0.5 0" />
          </filter>
          <clipPath id="orbClip">
            <circle cx="590" cy="272" r="163" />
          </clipPath>
        </defs>

        {/* ── background ── */}
        <g className="layer-background">
          <rect className="ivory-base" x="0" y="0" width="1024" height="768" fill="#F8F3E8" />
          <rect className="paper-grain" x="0" y="0" width="1024" height="768" filter="url(#paperGrain)" opacity="0.06" />
        </g>

        {/* ── environment: curved ground ── */}
        <g className="layer-environment">
          <path
            className="curved-ground"
            d="M 40 690 C 150 672 210 655 258 650 C 330 642 430 662 560 682 C 700 703 840 700 980 686"
            fill="none"
            stroke="#102F59"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={1}
          />
        </g>

        {/* ── orbit behind the orb ── */}
        <g className="layer-orbit-back">
          <ellipse
            cx="566"
            cy="300"
            rx="252"
            ry="96"
            fill="none"
            stroke="#102F59"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform="rotate(-19 566 300)"
            pathLength={1}
            className="orbit-ring"
          />
        </g>

        {/* ── celestial portal ── */}
        <g className="layer-portal">
          <g className="orb-body">
            <circle className="orb-fill" cx="590" cy="272" r="163" fill="url(#orbFill)" />
            <rect className="orb-texture" x="427" y="109" width="326" height="326" filter="url(#orbTexture)" opacity="0.16" clipPath="url(#orbClip)" />
            <circle className="orb-inner-bright" cx="590" cy="272" r="163" fill="url(#orbCenterGlow)" />
            <circle className="orb-outline" cx="590" cy="272" r="163" fill="none" stroke="#102F59" strokeWidth="3" />

            {/* eye */}
            <g className="eye" transform="translate(590 272)">
              <circle className="inner-glow" cx="0" cy="0" r="96" fill="url(#eyeGlow)" />
              <g className="golden-rays" stroke="#E7BE5E" strokeWidth="1.5" strokeLinecap="round">
                {rays.map((r) => (
                  <line key={r.key} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
                ))}
              </g>
              <path className="eye-white" d="M -84 0 C -46 -34 46 -34 84 0 C 46 34 -46 34 -84 0 Z" fill="#FAF5E9" stroke="#102F59" strokeWidth="1.4" />
              <g ref={pupilRef} className="pupil">
                <circle cx="0" cy="0" r="27" fill="#102F59" />
                <circle cx="-8" cy="-8" r="6" fill="#FAF5E9" opacity="0.6" />
              </g>
            </g>
          </g>
        </g>

        {/* ── orbit in front + moon ── */}
        <g className="layer-orbit-front">
          <path
            className="orbit-ring-front"
            d="M 344 356 C 430 430 640 452 762 360"
            fill="none"
            stroke="#102F59"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength={1}
          />
          <g className="moon-travel">
            <g className="moon">
              <circle cx="0" cy="0" r="26" fill="#F3D98D" stroke="#102F59" strokeWidth="2.4" />
              <circle cx="-8" cy="-6" r="4.2" fill="#102F59" opacity="0.18" />
              <circle cx="7" cy="4" r="3" fill="#102F59" opacity="0.16" />
              <circle cx="4" cy="-9" r="2.2" fill="#102F59" opacity="0.14" />
              <circle cx="-3" cy="9" r="2.6" fill="#102F59" opacity="0.13" />
            </g>
            <animateMotion
              dur="26s"
              begin="0s"
              repeatCount="indefinite"
              rotate="0"
              calcMode="linear"
              path="M 804.3 218 A 252 96 -19 1 1 327.7 382 A 252 96 -19 1 1 804.3 218 Z"
            />
          </g>
        </g>

        {/* ── imagination thread ── */}
        <g className="layer-thread">
          <path
            className="thread-lower"
            d="M 300 596 C 372 590 356 520 300 505 C 360 505 372 560 322 566 C 300 568 300 540 322 540"
            fill="none"
            stroke="#102F59"
            strokeWidth="2.2"
            strokeLinecap="round"
            pathLength={1}
          />
          <path
            className="thread-orbit"
            d="M 322 540 C 366 470 452 442 470 452 C 360 470 356 380 470 356"
            fill="none"
            stroke="#102F59"
            strokeWidth="2.2"
            strokeLinecap="round"
            pathLength={1}
          />
          <circle className="thread-pulse" r="3.5" fill="#385274">
            <animateMotion
              className="thread-pulse-motion"
              dur="10s"
              begin="4.4s"
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
              path="M 300 596 C 372 590 356 520 300 505 C 360 505 372 560 322 566 C 300 568 300 540 322 540 C 366 470 452 442 470 452 C 360 470 356 380 470 356"
            />
          </circle>
        </g>

        {/* ── character ── */}
        <g className="layer-character">
          <ellipse className="char-shadow" cx="256" cy="648" rx="30" ry="5.5" fill="#102F59" opacity="0.16" />
          <g className="char-body">
            {/* trousers */}
            <path className="char-trousers" d="M 240 598 L 272 598 L 270 641 L 260 641 L 256 611 L 252 641 L 242 641 Z" fill="#14284A" />
            {/* shoes */}
            <path d="M 240 640 L 253 640 L 253 646 L 236 646 C 236 642 238 640 240 640 Z" fill="#102F59" />
            <path d="M 259 640 L 272 640 L 276 646 L 259 646 Z" fill="#102F59" />
            {/* shirt */}
            <path className="char-shirt" d="M 238 560 C 238 552 246 548 256 548 C 266 548 274 552 274 560 L 274 600 L 238 600 Z" fill="#F7F1E4" stroke="#14284A" strokeWidth="1.6" />
            {/* arms */}
            <path d="M 238 562 C 232 570 232 586 236 598" fill="none" stroke="#14284A" strokeWidth="1.6" />
            <path d="M 274 562 C 280 570 280 586 276 598" fill="none" stroke="#14284A" strokeWidth="1.6" />
            {/* navy stripes */}
            <g className="char-stripes" stroke="#14284A" strokeWidth="2.4">
              <line x1="240" y1="566" x2="272" y2="566" />
              <line x1="239" y1="574" x2="273" y2="574" />
              <line x1="238" y1="582" x2="274" y2="582" />
              <line x1="238" y1="590" x2="274" y2="590" />
            </g>
            {/* neck */}
            <rect x="252" y="540" width="8" height="12" fill="#F7F1E4" stroke="#14284A" strokeWidth="1.2" />
            <g className="char-head-group">
              {/* head, facing upper-right */}
              <circle className="char-head" cx="256" cy="530" r="14.5" fill="#F7F1E4" stroke="#14284A" strokeWidth="1.6" />
              <circle className="char-eye" cx="263" cy="528" r="1.5" fill="#14284A" />
              {/* curly hair */}
              <path
                className="char-hair"
                d="M 243 528 C 240 514 250 505 259 507 C 270 507 274 516 270 524 C 273 520 268 512 262 510 C 268 509 266 502 258 502 C 250 500 242 506 243 514 C 240 517 240 524 243 528 Z"
                fill="#14284A"
              />
            </g>
          </g>
        </g>

        {/* ── atmosphere ── */}
        <g className="layer-atmosphere">
          <g className="stars-far" fill="#102F59">
            <circle className="twinkle t1" cx="452" cy="196" r="2" />
            <circle className="twinkle t2" cx="808" cy="416" r="1.6" />
            <circle className="twinkle t3" cx="404" cy="356" r="1.8" />
          </g>
          <g className="stars-mid">
            <path className="star4 twinkle t4" d="M 762 150 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" fill="#102F59" />
            <path className="star4 twinkle t5" d="M 660 452 l 4 11 l 11 4 l -11 4 l -4 11 l -4 -11 l -11 -4 l 11 -4 Z" fill="#102F59" />
            <path className="star-asterisk twinkle t6" d="M 452 372 v 20 M 442 377 l 20 10 M 462 377 l -20 10" stroke="#102F59" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="stars-near">
            <path className="golden-star twinkle t7" d="M 806 396 l 3.5 9 l 9 3.5 l -9 3.5 l -3.5 9 l -3.5 -9 l -9 -3.5 l 9 -3.5 Z" fill="#EAC15C" />
            <circle className="twinkle t8" cx="836" cy="196" r="2" fill="#102F59" />
            <circle className="dust d1" cx="500" cy="440" r="1.2" fill="#385274" opacity="0.5" />
            <circle className="dust d2" cx="720" cy="230" r="1.2" fill="#385274" opacity="0.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}
