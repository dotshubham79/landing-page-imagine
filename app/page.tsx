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

function FingertipParticles() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, .1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const particleCount = 360;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    const spread = new Float32Array(particleCount);
    const warm = [new THREE.Color(0x7c6049), new THREE.Color(0xb1885f), new THREE.Color(0xe5cfad)];
    const cool = [new THREE.Color(0xd19f45), new THREE.Color(0xf0c76d), new THREE.Color(0xfff0c4)];
    for (let i = 0; i < particleCount; i += 1) {
      seeds[i] = Math.random();
      spread[i] = .045 + Math.random() * .12;
      const palette = i % 2 === 0 ? cool : warm;
      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const textureContext = textureCanvas.getContext("2d");
    if (textureContext) {
      const gradient = textureContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(.48, "rgba(255,255,255,1)");
      gradient.addColorStop(.72, "rgba(255,255,255,.72)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      textureContext.fillStyle = gradient;
      textureContext.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(textureCanvas);
    const material = new THREE.PointsMaterial({
      size: .032,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: .9,
      alphaTest: .035,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);

    const divineOrigin = new THREE.Vector3();
    const humanOrigin = new THREE.Vector3();
    const viewportToWorld = (x: number, y: number) => {
      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      return new THREE.Vector3((x - .5) * visibleWidth, (.5 - y) * visibleHeight, 0);
    };
    const trackFingertips = () => {
      const hostBounds = host.getBoundingClientRect();
      const read = (selector: string, fallbackX: number, fallbackY: number) => {
        const node = document.querySelector<HTMLElement>(selector);
        if (!node || !hostBounds.width || !hostBounds.height) return viewportToWorld(fallbackX, fallbackY);
        const bounds = node.getBoundingClientRect();
        return viewportToWorld(
          (bounds.left + bounds.width / 2 - hostBounds.left) / hostBounds.width,
          (bounds.top + bounds.height / 2 - hostBounds.top) / hostBounds.height,
        );
      };
      divineOrigin.copy(read("[data-fingertip='divine']", .565, .415));
      humanOrigin.copy(read("[data-fingertip='human']", .425, .505));
    };

    const pointer = new THREE.Vector2();
    const easedPointer = new THREE.Vector2();
    const onPointerMove = (event: globalThis.PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    let animation = 0;
    const render = () => {
      const time = clock.getElapsedTime();
      trackFingertips();
      easedPointer.lerp(pointer, .05);
      camera.position.x = easedPointer.x * .12;
      camera.position.y = easedPointer.y * .08;
      camera.lookAt(0, 0, 0);

      const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i += 1) {
        const progress = (seeds[i] + time * .145) % 1;
        const easedProgress = 1 - Math.pow(1 - progress, 1.65);
        const origin = i % 2 === 0 ? divineOrigin : humanOrigin;
        const envelope = 1 - progress;
        attribute.setXYZ(
          i,
          origin.x * (1 - easedProgress) + Math.sin(i * 1.73 + time * .7) * spread[i] * .42 * envelope,
          origin.y * (1 - easedProgress) + Math.cos(i * 2.11 + time * .9) * spread[i] * envelope,
          Math.sin(i * 1.31 + time * .55) * spread[i] * .5 * envelope,
        );
      }
      attribute.needsUpdate = true;
      renderer.render(scene, camera);
      if (!reduceMotion) animation = requestAnimationFrame(render);
    };
    render();

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="fingertip-particles" aria-hidden="true" />;
}

type TeamParticle = {
  sourceX: number;
  sourceY: number;
  controlX: number;
  controlY: number;
  targetX: number;
  targetY: number;
  born: number;
  duration: number;
  size: number;
  color: string;
  drift: number;
  alpha: number;
};

function TeamFormationParticles({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const palette = ["#0b1835", "#24344c", "#c18b53", "#d9b382", "#e7c77f", "#f8f6f0"];
    const particles: TeamParticle[] = [];
    const timeouts: number[] = [];
    let animation = 0;
    let restingInterval = 0;
    let running = true;
    let pixelRatio = 1;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const randomSource = () => {
      const photo = document.querySelector<HTMLElement>(".team-photo-stage");
      const bounds = photo?.getBoundingClientRect();
      if (!bounds) return { x: 0, y: window.innerHeight * .5 };
      const mobile = window.innerWidth <= 900;
      return mobile
        ? { x: bounds.left + bounds.width * (.18 + Math.random() * .72), y: bounds.bottom - Math.random() * 24 }
        : { x: bounds.right - Math.random() * 30, y: bounds.top + bounds.height * (.18 + Math.random() * .68) };
    };

    const textTargets = (selector: string) => {
      const points: Array<{ x: number; y: number }> = [];
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          const value = node.textContent ?? "";
          for (let index = 0; index < value.length; index += 1) {
            if (/\s/.test(value[index])) continue;
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const bounds = range.getBoundingClientRect();
            if (bounds.width > 0 && bounds.height > 0) {
              points.push({
                x: bounds.left + bounds.width * (.18 + Math.random() * .64),
                y: bounds.top + bounds.height * (.18 + Math.random() * .64),
              });
            }
          }
          node = walker.nextNode();
        }
      });
      return points;
    };

    const addParticle = (target: { x: number; y: number }, born = performance.now(), source?: { x: number; y: number }) => {
      const start = source ?? randomSource();
      const mobile = window.innerWidth <= 900;
      const direction = mobile ? 1 : -1;
      particles.push({
        sourceX: start.x,
        sourceY: start.y,
        controlX: (start.x + target.x) * .5 + (mobile ? (Math.random() - .5) * 72 : 20 + Math.random() * 84),
        controlY: (start.y + target.y) * .5 + direction * (28 + Math.random() * 88),
        targetX: target.x,
        targetY: target.y,
        born,
        duration: 700 + Math.random() * 470,
        size: .75 + Math.random() * 1.65,
        color: palette[Math.floor(Math.random() * palette.length)],
        drift: (Math.random() - .5) * 10,
        alpha: .34 + Math.random() * .58,
      });
    };

    const formText = (selector: string, count: number, delay: number) => {
      const timeout = window.setTimeout(() => {
        const targets = textTargets(selector);
        if (!targets.length) return;
        for (let index = 0; index < count; index += 1) {
          addParticle(targets[Math.floor(Math.random() * targets.length)], performance.now() + index * 2.2);
        }
      }, delay);
      timeouts.push(timeout);
    };

    const dissolveLabel = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail) return;
      for (let index = 0; index < 11; index += 1) {
        addParticle({
          x: detail.x + (Math.random() - .5) * 52,
          y: detail.y + (Math.random() - .5) * 34,
        }, performance.now(), detail);
      }
    };

    const accentText = (event: Event) => {
      const detail = (event as CustomEvent<{ left: number; top: number; width: number; height: number }>).detail;
      if (!detail) return;
      for (let index = 0; index < 9; index += 1) {
        addParticle({
          x: detail.left + Math.random() * detail.width,
          y: detail.top + Math.random() * detail.height,
        });
      }
    };

    const render = (now: number) => {
      if (!running) return;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!document.hidden) {
        context.save();
        context.globalCompositeOperation = "source-over";
        for (let index = particles.length - 1; index >= 0; index -= 1) {
          const particle = particles[index];
          const raw = Math.max(0, Math.min(1, (now - particle.born) / particle.duration));
          const eased = 1 - Math.pow(1 - raw, 3);
          const inverse = 1 - eased;
          const x = inverse * inverse * particle.sourceX + 2 * inverse * eased * particle.controlX + eased * eased * particle.targetX;
          const y = inverse * inverse * particle.sourceY + 2 * inverse * eased * particle.controlY + eased * eased * particle.targetY + Math.sin(raw * Math.PI * 2.2) * particle.drift * inverse;
          const arrival = raw > .72 ? (1 - raw) / .28 : 1;
          context.globalAlpha = Math.max(0, particle.alpha * arrival);
          context.fillStyle = particle.color;
          context.shadowColor = particle.color;
          context.shadowBlur = particle.size > 1.7 ? 3 : 0;
          context.beginPath();
          context.arc(x, y, particle.size * (1 - raw * .22), 0, Math.PI * 2);
          context.fill();
          if (raw >= 1) particles.splice(index, 1);
        }
        context.restore();
      }
      animation = requestAnimationFrame(render);
    };

    resize();
    formText(".team-headline", window.innerWidth <= 900 ? 92 : 156, 720);
    formText(".team-founders", window.innerWidth <= 900 ? 58 : 92, 1090);
    formText(".team-closing", window.innerWidth <= 900 ? 34 : 54, 1430);
    restingInterval = window.setInterval(() => {
      const targets = textTargets(".team-copy [data-particle-copy]");
      if (!targets.length || document.hidden) return;
      const count = window.innerWidth <= 900 ? 1 : 2;
      for (let index = 0; index < count; index += 1) addParticle(targets[Math.floor(Math.random() * targets.length)]);
    }, 1250);
    window.addEventListener("resize", resize);
    window.addEventListener("team:dissolve-label", dissolveLabel);
    window.addEventListener("team:accent-text", accentText);
    animation = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animation);
      window.clearInterval(restingInterval);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      window.removeEventListener("resize", resize);
      window.removeEventListener("team:dissolve-label", dissolveLabel);
      window.removeEventListener("team:accent-text", accentText);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="team-formation-canvas" aria-hidden="true" />;
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
        fragmentShader: `varying vec2 vUv; void main(){float d=length(vUv-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(1.,.64,.1,a*a*.58);}`,
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
      group.position.y = Math.sin(time * .82) * .09;
      group.rotation.z = Math.sin(time * .68) * .012;
      key.intensity = 8 + Math.sin(time * .95) * 1.1;
      glow.scale.setScalar(.96 + Math.sin(time * .85) * .04);
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
  const teamLayer = useRef<HTMLElement>(null);
  const founderLabel = useRef<HTMLDivElement>(null);
  const founderLabelTimer = useRef<number | null>(null);
  const [entering, setEntering] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [activeFounder, setActiveFounder] = useState<"Shubham" | "Binayak" | null>(null);

  useEffect(() => {
    if (!root.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([".hands", ".floating-logo", ".fingertip-particles"], { opacity: 1 });
        gsap.set([".hand-left", ".hand-right", ".three-logo", ".hero-title h1", ".hero-title p"], { opacity: 1, clearProps: "transform" });
        gsap.set(".logo-aura", { opacity: .72, scale: 1 });
        return;
      }

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".hands", { opacity: 0 }, { opacity: 1, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".hand-left", { xPercent: -10, yPercent: 8, rotation: -2.5 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".hand-right", { xPercent: 10, yPercent: -8, rotation: -2.25 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: motion.timeline.handsDuration, ease: "power2.out" }, 0)
        .fromTo(".fingertip-particles", { opacity: 0 }, { opacity: 1, duration: .48 }, motion.timeline.particlesStart)
        .fromTo(".floating-logo", { opacity: 0 }, { opacity: 1, duration: .4 }, motion.timeline.logoStart)
        .fromTo(".three-logo", { opacity: 0, scale: .02, filter: "blur(14px) brightness(1.8)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: 1.35, ease: "back.out(1.8)", clearProps: "transform,filter" }, motion.timeline.logoStart)
        .fromTo(".logo-aura", { opacity: 0, scale: .45 }, { opacity: .8, scale: 1, duration: 1.1 }, motion.timeline.logoStart + .15)
        .fromTo(".hero-title h1", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .72 }, motion.timeline.headerStart)
        .fromTo(".hero-title p", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: .68 }, motion.timeline.headerStart + .12);

      gsap.to(".logo-aura", { opacity: .92, scale: 1.12, duration: 3.6, delay: motion.timeline.complete, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-left", { xPercent: .42, yPercent: -.24, rotation: .12, duration: 3.5, delay: motion.timeline.handsDuration, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-right", { xPercent: -.42, yPercent: .24, rotation: .12, duration: 3.5, delay: motion.timeline.handsDuration, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (!teamOpen || !root.current || !teamLayer.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(".team-reveal", { autoAlpha: 1 });
        gsap.set([".team-photo-stage", ".team-label", ".team-headline", ".team-founders", ".team-closing", ".team-close"], { opacity: 1, clearProps: "transform,filter,clipPath" });
        return;
      }

      gsap.timeline({ defaults: { ease: "power3.inOut" } })
        .set(".team-reveal", { autoAlpha: 1 })
        .to([".hero-title", ".hands", ".fingertip-particles", ".floating-logo", ".team-trigger"], {
          opacity: 0,
          scale: .985,
          filter: "blur(8px)",
          duration: .62,
          stagger: .025,
        }, 0)
        .fromTo(".team-photo-stage", {
          opacity: .72,
          xPercent: -18,
          y: 16,
          filter: "saturate(.88) contrast(.96)",
          clipPath: "inset(0 100% 0 0)",
        }, {
          opacity: 1,
          xPercent: 0,
          y: 0,
          filter: "saturate(1) contrast(1)",
          clipPath: "inset(0 0% 0 0)",
          duration: 1.18,
          ease: "power3.out",
        }, .16)
        .fromTo(".team-photo-light", { opacity: 0, xPercent: -22 }, { opacity: .7, xPercent: 0, duration: .72, ease: "sine.out" }, .74)
        .fromTo([".team-close", ".team-label"], { opacity: 0, y: -8 }, {
          opacity: 1,
          y: 0,
          duration: .46,
          stagger: .08,
          ease: "power3.out",
        }, .78)
        .fromTo(".team-headline", { opacity: 0, y: 10, filter: "blur(5px)", clipPath: "inset(0 100% 0 0)" }, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          clipPath: "inset(0 0% 0 0)",
          duration: .72,
          ease: "power3.out",
        }, 1.12)
        .fromTo(".team-founders", { opacity: 0, y: 10, filter: "blur(4px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .64, ease: "power3.out" }, 1.48)
        .fromTo(".team-closing", { opacity: 0, y: 8, filter: "blur(3px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .62, ease: "power3.out" }, 1.82)
        .to(".team-photo-stage", { y: 2, duration: .15, ease: "sine.inOut" }, 1.18)
        .to(".team-photo-stage", { y: 0, duration: .24, ease: "sine.out" }, 1.33);
    }, root);

    return () => context.revert();
  }, [teamOpen]);

  useEffect(() => {
    if (!teamOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTeam();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [teamOpen]);

  function placeConnectionLines(cursor: { x: number; y: number }, approach: number) {
    if (!root.current) return;
    const logo = root.current.querySelector<HTMLElement>(".floating-logo");
    const humanTip = root.current.querySelector<HTMLElement>("[data-fingertip='human']");
    const divineTip = root.current.querySelector<HTMLElement>("[data-fingertip='divine']");
    if (!logo || !humanTip || !divineTip) return;
    const center = (node: HTMLElement) => {
      const bounds = node.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    };
    const logoCenter = center(logo);
    const placeLine = (selector: string, start: { x: number; y: number }, end: { x: number; y: number }, opacity: number) => {
      const line = root.current?.querySelector<HTMLElement>(selector);
      if (!line) return;
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      line.style.width = `${Math.hypot(deltaX, deltaY)}px`;
      line.style.opacity = `${opacity}`;
      line.style.transform = `translate3d(${start.x}px,${start.y}px,0) rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    };
    placeLine(".connection-line-human", center(humanTip), cursor, approach * .42);
    placeLine(".connection-line-cursor", cursor, logoCenter, approach * .32);
    placeLine(".connection-line-divine", center(divineTip), logoCenter, approach * .22);
  }

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (!root.current || event.pointerType !== "mouse" || teamOpen || connecting || entering) return;
    const logo = root.current.querySelector<HTMLElement>(".floating-logo");
    if (!logo) return;

    const logoBounds = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoBounds.left + logoBounds.width / 2,
      y: logoBounds.top + logoBounds.height / 2,
    };
    const distanceX = event.clientX - logoCenter.x;
    const distanceY = event.clientY - logoCenter.y;
    const magneticRadius = Math.min(380, Math.max(250, window.innerWidth * .24));
    const distance = Math.hypot(distanceX, distanceY);
    const approach = Math.max(0, Math.min(1, 1 - distance / magneticRadius));
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    root.current.style.setProperty("--left-hand-x", `${x * 3 + approach * 11}px`);
    root.current.style.setProperty("--left-hand-y", `${y * 2 - approach * 3.5}px`);
    root.current.style.setProperty("--right-hand-x", `${x * -1.4}px`);
    root.current.style.setProperty("--right-hand-y", `${y * -.9}px`);
    root.current.style.setProperty("--human-reach-rotation", `${approach * -.55}deg`);
    root.current.style.setProperty("--human-tip-x", `${approach * 4.5}px`);
    root.current.style.setProperty("--human-tip-y", `${approach * -1.8}px`);
    root.current.style.setProperty("--logo-x", `${distanceX * .028 * approach}px`);
    root.current.style.setProperty("--logo-y", `${distanceY * .028 * approach}px`);
    root.current.classList.toggle("approaching", approach > .035);

    const cursor = { x: event.clientX, y: event.clientY };
    placeConnectionLines(cursor, approach);
  }

  function enterV1() {
    if (connecting || entering || teamOpen || !root.current) return;
    setConnecting(true);
    root.current.classList.remove("approaching");
    const logoBounds = root.current.querySelector<HTMLElement>(".floating-logo")?.getBoundingClientRect();
    if (logoBounds) {
      placeConnectionLines({ x: logoBounds.left + logoBounds.width / 2, y: logoBounds.top + logoBounds.height / 2 }, 1);
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setEntering(true);
      window.setTimeout(() => window.location.assign("https://imagine-lab.tech"), 560);
      return;
    }

    gsap.timeline({ defaults: { ease: "power2.inOut" } })
      .to(root.current, {
        "--left-hand-x": "15px",
        "--left-hand-y": "-5px",
        "--human-reach-rotation": "-.72deg",
        "--human-tip-x": "6px",
        "--human-tip-y": "-2.8px",
        duration: .34,
      }, 0)
      .to(root.current, {
        "--right-hand-x": "-4px",
        "--right-hand-y": "2px",
        "--divine-tip-x": "-2.5px",
        "--divine-tip-y": "1px",
        duration: .32,
      }, .04)
      .to(".three-logo", { scale: .965, duration: .18, ease: "power2.out" }, 0)
      .to([".connection-line-human", ".connection-line-divine", ".connection-line-cursor"], { opacity: .72, duration: .28 }, 0)
      .to(".three-logo", { scale: 1, duration: .22, clearProps: "transform" }, .34)
      .fromTo(".connection-spark", { opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: .24, ease: "back.out(1.8)" }, .52)
      .fromTo(".connection-dust", { opacity: 0, scale: .5, rotation: -8 }, { opacity: .78, scale: 1.08, rotation: 5, duration: .42 }, .56)
      .fromTo(".connection-ripple", { opacity: .55, scale: .25 }, { opacity: 0, scale: 18, duration: .78, ease: "power2.out" }, .58)
      .fromTo(".connection-hand-light", { opacity: 0, scale: .7 }, { opacity: .46, scale: 1.35, duration: .42, yoyo: true, repeat: 1 }, .62)
      .to(".connection-spark", { opacity: 0, scale: 1.45, duration: .38 }, .8)
      .to(".connection-dust", { opacity: 0, scale: 1.28, duration: .4 }, .86)
      .to([".connection-line-human", ".connection-line-divine", ".connection-line-cursor"], { opacity: 0, duration: .32 }, .92)
      .call(() => setEntering(true), [], 1.04)
      .call(() => window.location.assign("https://imagine-lab.tech"), [], 1.84);
  }

  function resetConnection() {
    if (!root.current || connecting || entering) return;
    root.current.classList.remove("approaching");
    root.current.style.setProperty("--human-reach-rotation", "0deg");
    root.current.style.setProperty("--human-tip-x", "0px");
    root.current.style.setProperty("--human-tip-y", "0px");
    root.current.style.setProperty("--left-hand-x", "0px");
    root.current.style.setProperty("--left-hand-y", "0px");
    root.current.style.setProperty("--right-hand-x", "0px");
    root.current.style.setProperty("--right-hand-y", "0px");
    root.current.style.setProperty("--logo-x", "0px");
    root.current.style.setProperty("--logo-y", "0px");
    root.current.querySelectorAll<HTMLElement>(".connection-line").forEach((line) => {
      line.style.opacity = "0";
    });
  }

  function openTeam() {
    if (teamOpen || entering || connecting) return;
    resetConnection();
    setTeamOpen(true);
  }

  function closeTeam() {
    if (!teamOpen || !root.current) return;
    if (founderLabelTimer.current) window.clearTimeout(founderLabelTimer.current);
    setActiveFounder(null);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setTeamOpen(false);
      return;
    }
    gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: () => setTeamOpen(false) })
      .to([".team-copy", ".team-close"], { opacity: 0, y: -8, duration: .3 }, 0)
      .to(".team-photo-stage", { opacity: 0, xPercent: -7, filter: "saturate(.82)", clipPath: "inset(0 14% 0 0)", duration: .56 }, .04)
      .to(".team-reveal", { autoAlpha: 0, duration: .38 }, .42)
      .to([".hero-title", ".hands", ".fingertip-particles", ".floating-logo", ".team-trigger"], {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: .68,
        stagger: .035,
      }, .44);
  }

  function moveTeamPhoto(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const x = (event.clientX / window.innerWidth - .5) * 3;
    const y = (event.clientY / window.innerHeight - .5) * 2;
    gsap.to(".team-photo-image", { x, y, duration: .7, ease: "power2.out", overwrite: "auto" });
  }

  function resetTeamPhoto(event?: PointerEvent<HTMLElement>) {
    if (event && event.pointerType !== "mouse") return;
    gsap.to(".team-photo-image", { x: 0, y: 0, duration: .8, ease: "power2.out", overwrite: "auto" });
    if (event?.pointerType === "mouse") hideFounderLabel();
  }

  function moveFounderLabel(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || !founderLabel.current) return;
    gsap.to(founderLabel.current, {
      x: event.clientX + 18,
      y: event.clientY + 16,
      duration: .18,
      ease: "power2.out",
      overwrite: "auto",
    });
  }

  function showFounderLabel(name: "Shubham" | "Binayak", event: PointerEvent<HTMLButtonElement>, temporary = false) {
    if (founderLabelTimer.current) window.clearTimeout(founderLabelTimer.current);
    setActiveFounder(name);
    if (founderLabel.current) {
      gsap.set(founderLabel.current, { x: event.clientX + 18, y: event.clientY + 16 });
      gsap.to(founderLabel.current, { opacity: 1, duration: .2, ease: "power2.out", overwrite: "auto" });
    }
    if (temporary) founderLabelTimer.current = window.setTimeout(hideFounderLabel, 1350);
  }

  function hideFounderLabel() {
    if (founderLabelTimer.current) window.clearTimeout(founderLabelTimer.current);
    founderLabelTimer.current = null;
    const label = founderLabel.current;
    if (!label) {
      setActiveFounder(null);
      return;
    }
    const bounds = label.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("team:dissolve-label", { detail: { x: bounds.left + 6, y: bounds.top + bounds.height * .5 } }));
    gsap.to(label, { opacity: 0, duration: .24, ease: "power2.out", overwrite: "auto", onComplete: () => setActiveFounder(null) });
  }

  function accentTeamText(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("team:accent-text", {
      detail: { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height },
    }));
  }

  return (
    <main ref={root} className={`minimal-creation ${connecting ? "connecting" : ""} ${entering ? "entering" : ""}`} onPointerMove={trackPointer} onPointerLeave={resetConnection}>
      <div className="paper-grain" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />
      <FingertipParticles />

      <button className="team-trigger" type="button" onClick={openTeam} aria-haspopup="dialog" aria-expanded={teamOpen}>
        <span>Team</span>
      </button>

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

      <div className="connection-feedback" aria-hidden="true">
        <span className="connection-line connection-line-human" />
        <span className="connection-line connection-line-divine" />
        <span className="connection-line connection-line-cursor" />
        <span className="connection-hand-light" />
        <span className="connection-ripple" />
        <span className="connection-dust" />
        <span className="connection-spark" />
      </div>

      <header className="hero-title">
        <h1>IMAGINE</h1>
        <p>where imagination meets intelligence.</p>
      </header>

      <button className="floating-logo" type="button" onPointerDown={(event) => {
        if (event.button === 0) enterV1();
      }} onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enterV1();
        }
      }} aria-label="Complete the connection and enter IMAGINE">
        <span className="logo-aura" aria-hidden="true" />
        <ThreeLogo />
      </button>

      <section ref={teamLayer} className="team-reveal" role="dialog" aria-modal="true" aria-label="The people making IMAGINE possible" aria-hidden={!teamOpen}>
        {teamOpen && <TeamFormationParticles active={teamOpen} />}
        <button className="team-close" type="button" onClick={closeTeam} aria-label="Return to the IMAGINE landing page">
          <span aria-hidden="true">&#8592;</span> Back to IMAGINE
        </button>

        <div className="team-photo-stage" onPointerMove={moveTeamPhoto} onPointerLeave={resetTeamPhoto}>
          <img className="team-photo-image team-photo-base" src="/imagine-team-photo-v1.jpg" alt="Binayak and Shubham arriving together in a golf cart" />
          <img className={`team-photo-image team-founder-focus team-founder-focus-binayak ${activeFounder === "Binayak" ? "is-active" : ""}`} src="/imagine-team-photo-v1.jpg" alt="" aria-hidden="true" />
          <img className={`team-photo-image team-founder-focus team-founder-focus-shubham ${activeFounder === "Shubham" ? "is-active" : ""}`} src="/imagine-team-photo-v1.jpg" alt="" aria-hidden="true" />
          <span className="team-photo-light" aria-hidden="true" />
          <span className="team-photo-fragments" aria-hidden="true" />
          <button
            className="founder-hotspot founder-hotspot-binayak"
            type="button"
            aria-label="Binayak — Engineering, systems, and intelligence"
            onPointerEnter={(event) => event.pointerType === "mouse" && showFounderLabel("Binayak", event)}
            onPointerMove={moveFounderLabel}
            onPointerLeave={(event) => event.pointerType === "mouse" && hideFounderLabel()}
            onPointerUp={(event) => event.pointerType !== "mouse" && showFounderLabel("Binayak", event, true)}
            onFocus={() => setActiveFounder("Binayak")}
            onBlur={() => setActiveFounder(null)}
          />
          <button
            className="founder-hotspot founder-hotspot-shubham"
            type="button"
            aria-label="Shubham — Creative direction, product, and vision"
            onPointerEnter={(event) => event.pointerType === "mouse" && showFounderLabel("Shubham", event)}
            onPointerMove={moveFounderLabel}
            onPointerLeave={(event) => event.pointerType === "mouse" && hideFounderLabel()}
            onPointerUp={(event) => event.pointerType !== "mouse" && showFounderLabel("Shubham", event, true)}
            onFocus={() => setActiveFounder("Shubham")}
            onBlur={() => setActiveFounder(null)}
          />
        </div>

        <div className="team-copy">
          <span className="team-label">The team</span>
          <h2 className="team-headline" data-particle-copy onPointerEnter={accentTeamText}>
            <span>Two brothers building</span>
            <span>a new way to interact</span>
            <span>with intelligence.</span>
          </h2>
          <div className="team-founders" data-particle-copy onPointerEnter={accentTeamText}>
            <div className="team-founder">
              <strong>Shubham</strong>
              <p>Creative direction, product, and vision.</p>
            </div>
            <div className="team-founder">
              <strong>Binayak</strong>
              <p>Engineering, systems, and intelligence.</p>
            </div>
          </div>
          <p className="team-closing" data-particle-copy onPointerEnter={accentTeamText}>Together, we&apos;re building intelligence you can see, shape, and interact with.</p>
        </div>

        <div ref={founderLabel} className={`founder-cursor-label ${activeFounder ? "is-ready" : ""}`} aria-hidden="true">
          <span />{activeFounder}
        </div>
      </section>

      <div className="entry-veil" aria-hidden="true" />
    </main>
  );
}
