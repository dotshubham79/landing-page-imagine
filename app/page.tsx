"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import motion from "./imagine-motion.json";

function ThreeAtmosphere() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, .1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 720;
    const positions = new Float32Array(dustCount * 3);
    const scales = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i += 1) {
      const radius = 1.1 + Math.pow(Math.random(), .58) * 5.6;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * .58 - .7;
      positions[i * 3 + 2] = (Math.random() - .5) * 2.8;
      scales[i] = .4 + Math.random() * 1.2;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    const dustMaterial = new THREE.PointsMaterial({ color: 0xc6a464, size: .018, transparent: true, opacity: .28, depthWrite: false, blending: THREE.NormalBlending });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const streamVertexShader = `
      attribute float aSeed;
      attribute float aSize;
      attribute vec3 aOffset;
      attribute vec3 color;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uBend;
      uniform float uEmission;
      uniform float uMix;
      uniform vec2 uPointer;
      uniform vec3 uOrigin;
      varying vec3 vColor;
      varying float vAlpha;

      float noiseField(vec3 p, float seed) {
        float broad = sin(dot(p, vec3(1.27, 1.71, 2.13)) + seed);
        float detail = sin(dot(p, vec3(2.43, -1.19, 1.53)) - seed * 1.73);
        return broad + detail * .46;
      }

      vec3 potential(vec3 p) {
        return vec3(
          noiseField(p, 2.1),
          noiseField(p.yzx, 13.7),
          noiseField(p.zxy, 29.3)
        );
      }

      vec3 curlNoise(vec3 p) {
        float e = .085;
        vec3 dx = (potential(p + vec3(e, 0., 0.)) - potential(p - vec3(e, 0., 0.))) / (2. * e);
        vec3 dy = (potential(p + vec3(0., e, 0.)) - potential(p - vec3(0., e, 0.))) / (2. * e);
        vec3 dz = (potential(p + vec3(0., 0., e)) - potential(p - vec3(0., 0., e))) / (2. * e);
        return normalize(vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x) + vec3(.0001));
      }

      void main() {
        float progress = fract(aSeed + uTime * uSpeed);
        float eased = progress * progress * (3. - 2. * progress);
        float life = sin(progress * 3.14159265);
        vec3 destination = mix(uOrigin + aOffset * .3, vec3(0.), uMix);
        vec3 base = mix(uOrigin, destination, eased);
        vec3 fieldPosition = base * 1.8 + aOffset * 2.5 + vec3(uTime * .14);
        vec3 turbulence = curlNoise(fieldPosition);
        vec3 position = base;
        position += aOffset * (1. - eased) * .34;
        position += turbulence * (.045 + life * .28);
        position.y += uBend * life;
        vec2 cursor = uPointer * vec2(1.35, .82);
        vec2 cursorDelta = position.xy - cursor;
        float cursorDistance = max(length(cursorDelta), .08);
        float cursorInfluence = (1. - smoothstep(.15, 1.1, cursorDistance)) * life;
        position.xy += vec2(-cursorDelta.y, cursorDelta.x) / cursorDistance * cursorInfluence * .12;

        vColor = color;
        vAlpha = smoothstep(0., .055, progress) * (1. - smoothstep(.9, 1., progress)) * uEmission;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * modelViewPosition;
        gl_PointSize = aSize * (14. / -modelViewPosition.z) * (.8 + life * .7);
      }
    `;
    const streamFragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uOpacity;
      void main() {
        float distanceToCenter = length(gl_PointCoord - .5) * 2.;
        float haze = smoothstep(1., 0., distanceToCenter);
        float core = smoothstep(.34, 0., distanceToCenter);
        gl_FragColor = vec4(vColor, (haze * .55 + core * .75) * vAlpha * uOpacity);
      }
    `;

    const createEnergyStream = (palette: Array<number | string>, count: number, size: number, opacity: number, origin: THREE.Vector3, speed: number, bend: number, blending: THREE.Blending) => {
      const geometry = new THREE.BufferGeometry();
      const streamPositions = new Float32Array(count * 3);
      const streamColors = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      const sizes = new Float32Array(count);
      const offsets = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        seeds[i] = Math.random();
        sizes[i] = size * (.55 + Math.random() * .9);
        offsets[i * 3] = (Math.random() - .5) * .62;
        offsets[i * 3 + 1] = (Math.random() - .5) * .62;
        offsets[i * 3 + 2] = (Math.random() - .5) * .58;
        const color = new THREE.Color(palette[i % palette.length]);
        streamColors[i * 3] = color.r;
        streamColors[i * 3 + 1] = color.g;
        streamColors[i * 3 + 2] = color.b;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(streamPositions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(streamColors, 3));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: speed },
          uBend: { value: bend },
          uEmission: { value: 0 },
          uMix: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uOrigin: { value: origin },
          uOpacity: { value: opacity },
        },
        vertexShader: streamVertexShader,
        fragmentShader: streamFragmentShader,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      return { geometry, material };
    };

    const divineOrigin = new THREE.Vector3();
    const humanOrigin = new THREE.Vector3();
    const divineStream = createEnergyStream(motion.particles.divine, motion.particles.countPerStream, 3.7, 1, divineOrigin, .19, -.075, THREE.AdditiveBlending);
    const humanStream = createEnergyStream(motion.particles.human, motion.particles.countPerStream, 3.5, .82, humanOrigin, .175, .07, THREE.NormalBlending);

    const coreCanvas = document.createElement("canvas");
    coreCanvas.width = 64;
    coreCanvas.height = 64;
    const coreContext = coreCanvas.getContext("2d");
    if (coreContext) {
      const coreGradient = coreContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      coreGradient.addColorStop(0, "rgba(255,255,255,1)");
      coreGradient.addColorStop(.18, "rgba(255,255,255,.98)");
      coreGradient.addColorStop(.58, "rgba(255,255,255,.44)");
      coreGradient.addColorStop(1, "rgba(255,255,255,0)");
      coreContext.fillStyle = coreGradient;
      coreContext.fillRect(0, 0, 64, 64);
    }
    const coreTexture = new THREE.CanvasTexture(coreCanvas);
    const createVisibleCore = (palette: string[], count: number, size: number) => {
      const geometry = new THREE.BufferGeometry();
      const corePositions = new Float32Array(count * 3);
      const coreColors = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      const drift = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        seeds[i] = Math.random();
        drift[i] = .035 + Math.random() * .085;
        const color = new THREE.Color(palette[i % palette.length]);
        coreColors[i * 3] = color.r;
        coreColors[i * 3 + 1] = color.g;
        coreColors[i * 3 + 2] = color.b;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(corePositions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(coreColors, 3));
      const material = new THREE.PointsMaterial({
        size,
        map: coreTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      return { geometry, material, seeds, drift, count };
    };
    const divineCore = createVisibleCore(["#159ed7", "#45ccff", "#b9f2ff", "#ffffff"], 380, .075);
    const humanCore = createVisibleCore(["#ff7214", "#f7a92f", "#ffd65e", "#fff0ad"], 380, .078);

    const particlePhase = { emission: reduceMotion ? 1 : 0, mix: reduceMotion ? 1 : 0 };
    const particleTimeline = reduceMotion ? null : gsap.timeline()
      .to(particlePhase, { emission: 1, duration: .45, ease: "power2.out" }, motion.timeline.particlesStart)
      .to(particlePhase, { mix: 1, duration: 1.5, ease: "power2.inOut" }, motion.timeline.mixStart);

    const viewportToWorld = (x: number, y: number) => {
      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      return new THREE.Vector3((x - .5) * visibleWidth, (.5 - y) * visibleHeight, 0);
    };
    const alignStreamsToFingertips = () => {
      const hostBounds = host.getBoundingClientRect();
      const divineTip = document.querySelector<HTMLElement>("[data-fingertip='divine']");
      const humanTip = document.querySelector<HTMLElement>("[data-fingertip='human']");
      const readTip = (node: HTMLElement | null, fallbackX: number, fallbackY: number) => {
        if (!node || !hostBounds.width || !hostBounds.height) return viewportToWorld(fallbackX, fallbackY);
        const bounds = node.getBoundingClientRect();
        return viewportToWorld(
          (bounds.left + bounds.width / 2 - hostBounds.left) / hostBounds.width,
          (bounds.top + bounds.height / 2 - hostBounds.top) / hostBounds.height,
        );
      };
      divineOrigin.copy(readTip(divineTip, .565, .415));
      humanOrigin.copy(readTip(humanTip, .425, .505));
    };
    alignStreamsToFingertips();

    const haloMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(0, 0) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uPointer;
        void main(){
          vec2 p=vUv-.5;
          p+=uPointer*.018;
          float d=length(p);
          float core=smoothstep(.37,.0,d);
          float pulse=.82+.18*sin(uTime*2.25);
          vec3 gold=vec3(1.0,.63,.12);
          gl_FragColor=vec4(gold,core*core*.24*pulse);
        }
      `,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 4.1), haloMaterial);
    halo.position.set(0, 0, -.35);
    scene.add(halo);

    const pointer = new THREE.Vector2();
    const eased = new THREE.Vector2();
    const onPointer = (event: globalThis.PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const clock = new THREE.Clock();
    let animation = 0;
    const render = () => {
      const time = clock.getElapsedTime();
      eased.lerp(pointer, .035);
      alignStreamsToFingertips();
      camera.position.x = eased.x * .16;
      camera.position.y = eased.y * .1;
      camera.lookAt(0, -.15, 0);
      haloMaterial.uniforms.uTime.value = time;
      haloMaterial.uniforms.uPointer.value.copy(eased);
      dust.rotation.z = time * .004;
      dust.rotation.y = eased.x * .025;
      divineStream.material.uniforms.uTime.value = time;
      humanStream.material.uniforms.uTime.value = time;
      divineStream.material.uniforms.uEmission.value = particlePhase.emission;
      humanStream.material.uniforms.uEmission.value = particlePhase.emission;
      divineStream.material.uniforms.uMix.value = particlePhase.mix;
      humanStream.material.uniforms.uMix.value = particlePhase.mix;
      divineStream.material.uniforms.uPointer.value.copy(eased);
      humanStream.material.uniforms.uPointer.value.copy(eased);
      const updateVisibleCore = (
        stream: typeof divineCore,
        origin: THREE.Vector3,
        speed: number,
        bendDirection: number,
      ) => {
        const attribute = stream.geometry.getAttribute("position") as THREE.BufferAttribute;
        stream.material.opacity = particlePhase.emission * .96;
        for (let i = 0; i < stream.count; i += 1) {
          const progress = (stream.seeds[i] + time * speed) % 1;
          const easedProgress = progress * progress * (3 - 2 * progress);
          const travel = easedProgress * (.28 + particlePhase.mix * .72);
          const envelope = 1 - progress;
          attribute.setXYZ(
            i,
            origin.x * (1 - travel),
            origin.y * (1 - travel) + Math.sin(progress * Math.PI * 4 + i * .71) * stream.drift[i] * envelope + Math.sin(progress * Math.PI) * bendDirection,
            Math.sin(i * 1.37 + time) * .055 * envelope,
          );
        }
        attribute.needsUpdate = true;
      };
      updateVisibleCore(divineCore, divineOrigin, .235, -.045);
      updateVisibleCore(humanCore, humanOrigin, .215, .045);
      renderer.render(scene, camera);
      if (!reduceMotion) animation = requestAnimationFrame(render);
    };
    render();

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      alignStreamsToFingertips();
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      particleTimeline?.kill();
      dustGeometry.dispose();
      dustMaterial.dispose();
      divineStream.geometry.dispose();
      divineStream.material.dispose();
      humanStream.geometry.dispose();
      humanStream.material.dispose();
      divineCore.geometry.dispose();
      divineCore.material.dispose();
      humanCore.geometry.dispose();
      humanCore.material.dispose();
      coreTexture.dispose();
      halo.geometry.dispose();
      haloMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="three-atmosphere" aria-hidden="true" />;
}

function ThreeLogo() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 100);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const key = new THREE.PointLight(0xffc24b, 9, 12);
    key.position.set(-1.2, 1.6, 3);
    scene.add(key);
    const rim = new THREE.PointLight(0xffffff, 4, 10);
    rim.position.set(2, -1, 2.5);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 3.8),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `varying vec2 vUv; void main(){float d=length(vUv-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(1.,.61,.08,a*a*.42);}`,
      }),
    );
    glow.position.z = -.3;
    group.add(glow);

    const geometry = new THREE.PlaneGeometry(2.7, 2.7, 12, 12);
    const texture = new THREE.TextureLoader().load("/imagine-logo-center-v5.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: .005,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const pointer = new THREE.Vector2();
    const eased = new THREE.Vector2();
    const move = (event: globalThis.PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth * 2 - 1;
      pointer.y = event.clientY / window.innerHeight * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });

    const clock = new THREE.Clock();
    let animation = 0;
    const render = () => {
      const time = clock.getElapsedTime();
      eased.lerp(pointer, .075);
      mesh.rotation.y += (eased.x * .34 - mesh.rotation.y) * .09;
      mesh.rotation.x += (-eased.y * .28 - mesh.rotation.x) * .09;
      group.position.y = Math.sin(time * 1.75) * .11;
      group.rotation.z = Math.sin(time * .75) * .015;
      key.intensity = 8 + Math.sin(time * 2.6) * 1.5;
      glow.scale.setScalar(.94 + Math.sin(time * 2.15) * .06);
      renderer.render(scene, camera);
      animation = requestAnimationFrame(render);
    };
    render();

    const resize = () => renderer.setSize(host.clientWidth, host.clientHeight);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      glow.geometry.dispose();
      (glow.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="three-logo" aria-hidden="true" />;
}

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([".hands", ".floating-logo"], { opacity: 1 });
        gsap.set([".hand-left", ".hand-right", ".three-logo", ".hero-title h1", ".hero-title p"], { opacity: 1, clearProps: "transform" });
        gsap.set(".logo-aura", { opacity: .72, scale: 1 });
        return;
      }

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".hands", { opacity: 0 }, { opacity: 1, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".hand-left", { xPercent: -10, yPercent: 8, rotation: -2.5 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".hand-right", { xPercent: 10, yPercent: -8, rotation: -2.25 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".floating-logo", { opacity: 0 }, { opacity: 1, duration: .4 }, motion.timeline.logoStart)
        .fromTo(".three-logo", { opacity: 0, scale: .02, filter: "blur(14px) brightness(1.8)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: 1.35, ease: "back.out(1.8)", clearProps: "transform,filter" }, motion.timeline.logoStart)
        .fromTo(".logo-aura", { opacity: 0, scale: .45 }, { opacity: .8, scale: 1, duration: 1.1 }, motion.timeline.logoStart + .15)
        .fromTo(".hero-title h1", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .72 }, motion.timeline.headerStart)
        .fromTo(".hero-title p", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: .68 }, motion.timeline.headerStart + .12);

      gsap.to(".logo-aura", { opacity: 1, scale: 1.2, duration: 1.55, delay: motion.timeline.complete, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-left", { xPercent: .42, yPercent: -.24, rotation: .12, duration: 3.5, delay: motion.timeline.handsDuration, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-right", { xPercent: -.42, yPercent: .24, rotation: .12, duration: 3.5, delay: motion.timeline.handsDuration, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);

    return () => {
      context.revert();
    };
  }, []);

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (!root.current) return;
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    root.current.style.setProperty("--left-hand-x", `${x * 7}px`);
    root.current.style.setProperty("--left-hand-y", `${y * 5}px`);
    root.current.style.setProperty("--right-hand-x", `${x * -6}px`);
    root.current.style.setProperty("--right-hand-y", `${y * -4}px`);
    root.current.style.setProperty("--logo-x", `${x * 13}px`);
    root.current.style.setProperty("--logo-y", `${y * 10}px`);
  }

  function enterV1() {
    if (entering) return;
    gsap.to(".three-logo", { scale: motion.logo.clickScale, duration: .15, repeat: 1, yoyo: true, ease: "power2.inOut" });
    window.setTimeout(() => setEntering(true), 310);
    window.setTimeout(() => window.location.assign("/v1"), 980);
  }

  return (
    <main ref={root} className={`minimal-creation ${entering ? "entering" : ""}`} onPointerMove={trackPointer}>
      <div className="paper-grain" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />

      <div className="hands" aria-hidden="true">
        <div className="hand hand-left" id="hand-human">
          <div className="hand-art">
            <img src="/imagine-hands-transparent-v10.png" alt="" />
            <span className="fingertip-anchor fingertip-human" data-fingertip="human" />
          </div>
        </div>
        <div className="hand hand-right" id="hand-divine">
          <div className="hand-art">
            <img src="/imagine-hands-transparent-v10.png" alt="" />
            <span className="fingertip-anchor fingertip-divine" data-fingertip="divine" />
          </div>
        </div>
      </div>

      <header className="hero-title">
        <h1>IMAGINE</h1>
        <p>Where imagination becomes intelligence.</p>
      </header>

      <button className="floating-logo" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1">
        <span className="logo-aura" aria-hidden="true" />
        <ThreeLogo />
      </button>

      <div className="entry-veil" aria-hidden="true" />
    </main>
  );
}
