"use client";

import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import HeroIllustration from "./HeroIllustration";

type ObjectName = "sun" | "earth" | "moon";
type Point = { x: number; y: number };

const sceneNames = ["IMAGINE", "The separation", "The inversion", "The fourth mode", "The proof"];
const initialPositions: Record<ObjectName, Point> = {
  sun: { x: 0, y: 0 },
  earth: { x: 0, y: 0 },
  moon: { x: 0, y: 0 },
};

const commands = [
  "Create the Sun, Earth, and Moon.",
  "Move the Moon closer.",
  "Make the Moon orbit Earth.",
  "Now show me how an eclipse happens.",
];

function BrandLockup({ large = false }: { large?: boolean }) {
  return (
    <div className={`brand-lockup ${large ? "brand-lockup-large" : ""}`} aria-label="IMAGINE">
      <span className="brand-mark" aria-hidden="true"><img src="/imagine-logo.png" alt="" /></span>
      <span>IMAGINE</span>
    </div>
  );
}

function SunRays() {
  return <>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</>;
}

function WorldObjects({
  variant,
  positions,
  demoStep = 4,
  selected,
  draggable = [],
  onPointerDown,
}: {
  variant: "seed" | "active" | "mode" | "demo";
  positions: Record<ObjectName, Point>;
  demoStep?: number;
  selected?: ObjectName | null;
  draggable?: ObjectName[];
  onPointerDown?: (name: ObjectName, event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const objectStyle = (name: ObjectName) => ({
    "--object-x": `${positions[name].x}px`,
    "--object-y": `${positions[name].y}px`,
  }) as CSSProperties;

  const interactive = (name: ObjectName) => draggable.includes(name) && onPointerDown;

  return (
    <div className={`world-system world-${variant} demo-step-${demoStep}`} aria-label="A persistent world containing the Sun, Earth, and Moon">
      <div className="world-grid" />
      <div className="relationship-orbit"><span>MOON ORBITS EARTH</span></div>
      <button
        type="button"
        className={`world-object object-sun ${selected === "sun" ? "is-selected" : ""}`}
        style={objectStyle("sun")}
        onPointerDown={interactive("sun") ? (event) => onPointerDown!("sun", event) : undefined}
        disabled={!interactive("sun")}
        aria-label={interactive("sun") ? "Drag the Sun" : "Sun"}
      >
        <span className="sun-core"><SunRays /></span>
        {variant !== "seed" && <span className="object-label">SUN <i>#sun-01</i></span>}
        <span className="selection-handles" />
      </button>

      <button
        type="button"
        className={`world-object object-earth ${selected === "earth" ? "is-selected" : ""}`}
        style={objectStyle("earth")}
        onPointerDown={interactive("earth") ? (event) => onPointerDown!("earth", event) : undefined}
        disabled={!interactive("earth")}
        aria-label={interactive("earth") ? "Drag Earth" : "Earth"}
      >
        <span className="earth-core"><i /><i /></span>
        {variant !== "seed" && <span className="object-label">EARTH <i>#earth-02</i></span>}
        <span className="selection-handles" />
      </button>

      <div className="moon-orbiter" style={objectStyle("moon")}>
        <button
          type="button"
          className={`world-object object-moon ${selected === "moon" ? "is-selected" : ""}`}
          onPointerDown={interactive("moon") ? (event) => onPointerDown!("moon", event) : undefined}
          disabled={!interactive("moon")}
          aria-label={interactive("moon") ? "Drag the Moon" : "Moon"}
        >
          <span className="moon-core"><i /><i /><i /></span>
          {variant !== "seed" && <span className="object-label">MOON <i>#moon-03</i></span>}
          <span className="selection-handles" />
        </button>
      </div>

      <div className="eclipse-light" />
      <div className="eclipse-shadow" />
      {variant === "active" && <>
        <span className="hand-note note-understands">understands</span>
        <span className="hand-note note-responds">responds</span>
        <span className="hand-note note-remembers">remembers</span>
        <span className="hand-note note-moves">moves</span>
      </>}
      {variant === "demo" && demoStep >= 4 && (
        <div className="eclipse-explanation"><strong>An eclipse is a relationship.</strong><span>The Moon enters the path of sunlight already shared by these same objects.</span></div>
      )}
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState(0);
  const [eyeOpening, setEyeOpening] = useState(false);
  const [modeBeat, setModeBeat] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoRun, setDemoRun] = useState(0);
  const [positions, setPositions] = useState<Record<ObjectName, Point>>(initialPositions);
  const [selectedObject, setSelectedObject] = useState<ObjectName | null>(null);
  const [drag, setDrag] = useState<{ name: ObjectName; startX: number; startY: number; origin: Point } | null>(null);
  const sections = useRef<Array<HTMLElement | null>>([]);
  const touchStartY = useRef<number | null>(null);

  const goTo = (index: number) => sections.current[Math.max(0, Math.min(4, index))]?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(Number((current.target as HTMLElement).dataset.index));
    }, { threshold: [0.42, 0.62, 0.82] });
    sections.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!["ArrowDown", "ArrowRight", "PageDown", " ", "ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) return;
      if ((event.target as HTMLElement).tagName === "BUTTON") return;
      event.preventDefault();
      const direction = ["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key) ? -1 : 1;
      goTo(active + direction);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active]);

  useEffect(() => {
    const handleMove = (event: globalThis.PointerEvent) => {
      if (!drag) return;
      setPositions((current) => ({
        ...current,
        [drag.name]: {
          x: Math.max(-150, Math.min(150, drag.origin.x + event.clientX - drag.startX)),
          y: Math.max(-110, Math.min(110, drag.origin.y + event.clientY - drag.startY)),
        },
      }));
    };
    const handleUp = () => {
      if (!drag) return;
      setDrag(null);
      window.setTimeout(() => setSelectedObject(null), 450);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [drag]);

  useEffect(() => {
    if (active !== 3) return;
    setModeBeat(0);
    const timer = window.setTimeout(() => setModeBeat(1), 1900);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (active === 4) {
      setDemoStep(0);
      setDemoPaused(false);
    }
  }, [active, demoRun]);

  useEffect(() => {
    if (active !== 4 || demoPaused || demoStep >= 4) return;
    const timer = window.setTimeout(() => setDemoStep((step) => step + 1), demoStep === 0 ? 550 : 2350);
    return () => window.clearTimeout(timer);
  }, [active, demoPaused, demoStep, demoRun]);

  const startDrag = (name: ObjectName, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setSelectedObject(name);
    setDrag({ name, startX: event.clientX, startY: event.clientY, origin: positions[name] });
  };

  const openEye = () => {
    if (eyeOpening) return;
    setEyeOpening(true);
    window.setTimeout(() => goTo(1), 520);
    window.setTimeout(() => setEyeOpening(false), 1280);
  };

  const replayDemo = () => {
    setPositions(initialPositions);
    setDemoPaused(false);
    setDemoStep(0);
    setDemoRun((run) => run + 1);
  };

  const resetDemo = () => {
    setPositions(initialPositions);
    setDemoStep(0);
    setDemoPaused(true);
    setSelectedObject(null);
  };

  const handleTouchEnd = (event: ReactTouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - event.changedTouches[0].clientY;
    touchStartY.current = null;
    if (Math.abs(delta) > 52) goTo(active + (delta > 0 ? 1 : -1));
  };

  return (
    <main
      className={`deck five-scene-deck ${demoPaused ? "demo-paused" : ""}`}
      onTouchStart={(event) => { touchStartY.current = event.touches[0].clientY; }}
      onTouchEnd={handleTouchEnd}
    >
      <header className="deck-header">
        <button className="header-brand" onClick={() => goTo(0)} aria-label="Return to Scene 01"><BrandLockup /></button>
        <nav className="scene-nav" aria-label="Direct scene navigation">
          {sceneNames.map((name, index) => <button key={name} onClick={() => goTo(index)} className={active === index ? "active" : ""} aria-label={`Scene ${index + 1}: ${name}`} aria-current={active === index ? "page" : undefined}><i /><span>{String(index + 1).padStart(2, "0")}</span></button>)}
        </nav>
        <div className="scene-progress" aria-label={`Scene ${active + 1} of 5`}><strong>{String(active + 1).padStart(2, "0")}</strong><i /><span>05</span></div>
      </header>

      <span className={`journey-point point-scene-${active} ${eyeOpening ? "is-aperture" : ""}`} aria-hidden="true" />

      <section ref={(node) => { sections.current[0] = node; }} data-index="0" className={`scene scene-imagine ${active === 0 ? "is-active" : ""}`} aria-labelledby="scene-one-title">
        <div className="scene-one-copy">
          <BrandLockup large />
          <h1 id="scene-one-title">A creative interface<br />for intelligence<span>.</span></h1>
          <button className="master-line" onClick={openEye} aria-label="Imagine with your eyes open. Open Scene 02.">
            <span>Imagine with your eyes open.</span>
            <i className="closed-eye"><b /><em>↓</em></i>
          </button>
        </div>
        <HeroIllustration />
      </section>

      <section ref={(node) => { sections.current[1] = node; }} data-index="1" className={`scene scene-separation ${active === 1 ? "is-active" : ""}`} aria-labelledby="scene-two-title">
        <div className="scene-heading separation-heading">
          <p className="scene-label">02 · THE SEPARATION</p>
          <h2 id="scene-two-title">Today, intelligence creates the output.<br /><em>But it rarely travels with it.</em></h2>
          <p>AI can make an explanation, an image, a clip, or an application. Once delivered, much of the context and understanding that created it remains behind the interface.</p>
        </div>
        <div className="separation-stage">
          <div className="intelligence-filament"><i /><i /><i /><b /></div>
          <div className="artifact artifact-explanation" tabIndex={0}>
            <small>EXPLANATION</small><h3>Why eclipses happen</h3><p>An eclipse occurs when one celestial body moves into the shadow of another.</p><span className="text-lines"><i /><i /><i /></span>
            <div className="missing-context"><strong>Not naturally available inside the delivery</strong><span>object identity · relationships · memory</span></div>
          </div>
          <div className="artifact artifact-media" tabIndex={0}>
            <small>GENERATED MEDIA</small><div className="media-frame"><span className="mini-sun" /><span className="mini-earth" /><span className="mini-moon" /></div><strong>A beautiful result</strong>
            <div className="missing-context"><strong>Not naturally available inside the delivery</strong><span>behavior · object identity · intention</span></div>
          </div>
          <div className="artifact artifact-action" tabIndex={0}>
            <small>COMPLETED TASK</small><div className="action-flow"><span>brief</span><i /> <span>build</span><i /> <span>done</span></div><strong>Orbit Explorer shipped</strong>
            <div className="missing-context"><strong>Not naturally available inside the delivery</strong><span>evolving intention · memory · relationships</span></div>
          </div>
        </div>
        <p className="separation-closing">The creation remains.<br /><strong>The intelligence leaves.</strong></p>
      </section>

      <section ref={(node) => { sections.current[2] = node; }} data-index="2" className={`scene scene-inversion ${active === 2 ? "is-active" : ""}`} aria-labelledby="scene-three-title">
        <div className="inversion-copy">
          <p className="scene-label">03 · THE INVERSION</p>
          <h2 id="scene-three-title">What if the intelligence <em>stayed?</em></h2>
          <p>What if everything created remained understandable, editable, connected, and responsive to what you think next?</p>
          <div className="precision-note"><strong>In precise terms</strong><span>Context, object identity, relationships, behavior, and memory remain available after generation.</span></div>
          <p className="inversion-caption">If you create an earth, the object would carry the <em>property of earth, the intelligence of earth.</em></p>
          <span className="truth-label">INTERACTION PROTOTYPE</span>
        </div>
        <div className="active-world-frame">
          <div className="canvas-status"><span><i /> CONTEXT ACTIVE</span><b>same world · no reset</b></div>
          <WorldObjects variant="active" positions={positions} selected={selectedObject} draggable={["moon"]} onPointerDown={startDrag} />
          <div className="assurance-strip"><span>OBJECT IDENTITY</span><span>RELATIONSHIPS</span><span>BEHAVIOR</span><span>MEMORY</span></div>
        </div>
        <button className="inversion-closing" onClick={() => goTo(3)}>The output would no longer be the end.<br /><strong>It would become the interface.</strong><i>→</i></button>
      </section>

      <section ref={(node) => { sections.current[3] = node; }} data-index="3" className={`scene scene-modes beat-${modeBeat} ${active === 3 ? "is-active" : ""}`} aria-labelledby="scene-four-title">
        <div className="modes-heading">
          <p className="scene-label">04 · THE FOURTH MODE</p>
          <h2 id="scene-four-title">AI today does three things—<br />and does them well.</h2>
          <div className="beat-switch" aria-label="Scene 04 beats"><button className={modeBeat === 0 ? "active" : ""} onClick={() => setModeBeat(0)}>Current modes</button><button className={modeBeat === 1 ? "active" : ""} onClick={() => setModeBeat(1)}>The fourth</button></div>
        </div>
        <div className="mode-field">
          <article className="mode mode-ask"><small>ASK</small><p>You ask. It answers.</p><div className="ask-language"><i /><i /><i /></div></article>
          <article className="mode mode-generate"><small>GENERATE</small><p>You prompt. It makes.</p><div className="generate-frame"><span /><span /><span /></div></article>
          <article className="mode mode-delegate"><small>DELEGATE</small><p>You delegate. An agent acts.</p><div className="delegate-flow"><span>intent</span><i /><span>action</span><i /><span>done</span></div></article>
          <div className="fourth-world"><WorldObjects variant="mode" positions={positions} /><div className="contribution contribution-language">language</div><div className="contribution contribution-objects">objects</div><div className="contribution contribution-behavior">behavior</div></div>
          <div className="create-reveal"><p>What if there were a fourth?</p><strong>CREATE</strong><span>You think. The world responds, remembers, and continues.</span><em>Real time. Creative. Thinking with you—not for you.</em></div>
        </div>
        <span className="truth-label modes-truth">FUTURE VISION</span>
        <button className="see-proof" onClick={() => goTo(4)}>See it happen <i>↓</i></button>
      </section>

      <section ref={(node) => { sections.current[4] = node; }} data-index="4" className={`scene scene-proof ${active === 4 ? "is-active" : ""}`} aria-labelledby="scene-five-title">
        <div className="proof-heading">
          <p className="scene-label">05 · THE PROOF</p>
          <h2 id="scene-five-title">The interface carries the intelligence<br />of whatever you are <em>thinking about.</em></h2>
          <p>In simpler words: you say something, and it happens in front of you.</p>
          <div className="thought-rhythm"><span>You speak.</span><i /><span>It materializes.</span><i /><span>You interact.</span><i /><span>It remembers.</span><i /><span>You continue.</span></div>
        </div>
        <div className="product-environment">
          <aside className="thought-area" aria-label="Thought history">
            <div className="thought-live"><span className="voice-dot" /><strong>LIVE THOUGHT</strong><i>{demoPaused ? "paused" : "listening"}</i></div>
            <div className="command-history">
              {commands.map((command, index) => <button key={command} onClick={() => { setDemoStep(index + 1); setDemoPaused(false); }} className={demoStep === index + 1 ? "current" : demoStep > index + 1 ? "complete" : ""}><span>“{command}”</span><i>{demoStep > index + 1 ? "retained" : demoStep === index + 1 ? "happening" : ""}</i></button>)}
            </div>
            <div className="demo-controls"><button onClick={() => setDemoPaused((paused) => !paused)}>{demoPaused ? "Resume" : "Pause"}</button><button onClick={replayDemo}>Replay</button><button onClick={resetDemo}>Reset</button></div>
          </aside>
          <div className="product-canvas">
            <div className="canvas-status"><span><i /> CONTEXT ACTIVE</span><b>INTERACTION PROTOTYPE</b></div>
            <WorldObjects variant="demo" positions={positions} demoStep={demoStep} selected={selectedObject} draggable={["sun", "earth", "moon"]} onPointerDown={startDrag} />
            <div className="canvas-footer"><span>objects 03</span><span>identities stable</span><span>state remembered</span></div>
            <span className="drag-prompt">Try dragging the Moon.</span>
          </div>
        </div>
      </section>

      <div className={`eye-transition ${eyeOpening ? "active" : ""}`} aria-hidden="true"><span className="eye-lid eye-lid-top" /><span className="eye-lid eye-lid-bottom" /><span className="transition-eye"><i><b /></i></span></div>
    </main>
  );
}
