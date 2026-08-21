"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

    const sparkleCanvas = document.createElement("canvas");
    sparkleCanvas.width = 64;
    sparkleCanvas.height = 64;
    const sparkleContext = sparkleCanvas.getContext("2d");
    if (sparkleContext) {
      const gradient = sparkleContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(.2, "rgba(255,223,142,.95)");
      gradient.addColorStop(1, "rgba(255,190,54,0)");
      sparkleContext.fillStyle = gradient;
      sparkleContext.fillRect(0, 0, 64, 64);
    }
    const sparkleTexture = new THREE.CanvasTexture(sparkleCanvas);
    const energyCount = 112;
    const energyGeometry = new THREE.BufferGeometry();
    const energyPositions = new Float32Array(energyCount * 3);
    const energyColors = new Float32Array(energyCount * 3);
    const energySeeds = new Float32Array(energyCount);
    const energyWiggle = new Float32Array(energyCount);
    const leftGold = new THREE.Color(0xf3a931);
    const rightGold = new THREE.Color(0xffd889);
    for (let i = 0; i < energyCount; i += 1) {
      energySeeds[i] = Math.random();
      energyWiggle[i] = (Math.random() - .5) * .28;
      const color = i % 2 ? leftGold : rightGold;
      energyColors[i * 3] = color.r;
      energyColors[i * 3 + 1] = color.g;
      energyColors[i * 3 + 2] = color.b;
    }
    energyGeometry.setAttribute("position", new THREE.BufferAttribute(energyPositions, 3));
    energyGeometry.setAttribute("color", new THREE.BufferAttribute(energyColors, 3));
    const energyMaterial = new THREE.PointsMaterial({
      size: .075,
      map: sparkleTexture,
      vertexColors: true,
      transparent: true,
      opacity: .78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const energy = new THREE.Points(energyGeometry, energyMaterial);
    scene.add(energy);

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

    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, 0, 0);
    for (let ring = 0; ring < 3; ring += 1) {
      const geometry = new THREE.BufferGeometry();
      const count = 70 + ring * 22;
      const ringPositions = new Float32Array(count * 3);
      const radius = .82 + ring * .27;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        ringPositions[i * 3] = Math.cos(angle) * radius;
        ringPositions[i * 3 + 1] = Math.sin(angle) * radius * .6;
        ringPositions[i * 3 + 2] = 0;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(ringPositions, 3));
      const material = new THREE.PointsMaterial({ color: ring === 1 ? 0xd6a541 : 0xb9a579, size: .018, transparent: true, opacity: .14 - ring * .025, depthWrite: false });
      const points = new THREE.Points(geometry, material);
      points.rotation.z = ring * .3;
      orbitGroup.add(points);
    }
    scene.add(orbitGroup);

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
      camera.position.x = eased.x * .16;
      camera.position.y = eased.y * .1;
      camera.lookAt(0, -.15, 0);
      haloMaterial.uniforms.uTime.value = time;
      haloMaterial.uniforms.uPointer.value.copy(eased);
      dust.rotation.z = time * .004;
      dust.rotation.y = eased.x * .025;
      orbitGroup.rotation.z = time * .035;
      orbitGroup.rotation.x = eased.y * .06;
      const energyAttribute = energyGeometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < energyCount; i += 1) {
        const progress = (energySeeds[i] + time * .13) % 1;
        const easedProgress = progress * progress * (3 - 2 * progress);
        const fromRight = i % 2 === 0;
        const originX = fromRight ? 2.12 : -2.12;
        const originY = fromRight ? .3 : -.24;
        energyAttribute.setXYZ(
          i,
          originX * (1 - easedProgress),
          originY * (1 - easedProgress) + Math.sin(progress * Math.PI * 2 + i) * energyWiggle[i] * (1 - progress),
          Math.sin(i * 1.91) * .1,
        );
      }
      energyAttribute.needsUpdate = true;
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
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      dustGeometry.dispose();
      dustMaterial.dispose();
      energyGeometry.dispose();
      energyMaterial.dispose();
      sparkleTexture.dispose();
      halo.geometry.dispose();
      haloMaterial.dispose();
      orbitGroup.children.forEach((child) => {
        const points = child as THREE.Points;
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
      });
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
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
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
    setEntering(true);
    window.setTimeout(() => window.location.assign("/v1"), 700);
  }

  return (
    <main ref={root} className={`minimal-creation ${ready ? "ready" : ""} ${entering ? "entering" : ""}`} onPointerMove={trackPointer}>
      <div className="paper-grain" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />
      <ThreeAtmosphere />

      <div className="hands" aria-hidden="true">
        <div className="hand hand-left"><img src="/imagine-hands-reaching-v9.png" alt="" /></div>
        <div className="hand hand-right"><img src="/imagine-hands-reaching-v9.png" alt="" /></div>
      </div>

      <header className="hero-title">
        <h1>IMAGINE</h1>
        <p>Where imagination becomes intelligence.</p>
      </header>

      <div className="logo-sparkles" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      <button className="floating-logo" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1">
        <ThreeLogo />
      </button>

      <div className="entry-veil" aria-hidden="true" />
    </main>
  );
}
