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
    halo.position.set(0, -.78, -.35);
    scene.add(halo);

    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, -.78, 0);
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

    const shape = new THREE.Shape();
    const width = 2.15;
    const height = 2.25;
    const radius = .52;
    const left = -width / 2;
    const bottom = -height / 2;
    shape.moveTo(left + radius, bottom);
    shape.lineTo(left + width - radius, bottom);
    shape.quadraticCurveTo(left + width, bottom, left + width, bottom + radius);
    shape.lineTo(left + width, bottom + height - radius);
    shape.quadraticCurveTo(left + width, bottom + height, left + width - radius, bottom + height);
    shape.lineTo(left + radius, bottom + height);
    shape.quadraticCurveTo(left, bottom + height, left, bottom + height - radius);
    shape.lineTo(left, bottom + radius);
    shape.quadraticCurveTo(left, bottom, left + radius, bottom);

    const geometry = new THREE.ShapeGeometry(shape, 8);
    const shapePositions = geometry.getAttribute("position");
    const shapeUvs = geometry.getAttribute("uv");
    for (let index = 0; index < shapePositions.count; index += 1) {
      shapeUvs.setXY(
        index,
        (shapePositions.getX(index) - left) / width,
        (shapePositions.getY(index) - bottom) / height,
      );
    }
    shapeUvs.needsUpdate = true;
    const texture = new THREE.TextureLoader().load("/imagine-logo-v3.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(84 / 120, 90 / 120);
    texture.offset.set(29 / 120, 10 / 120);
    const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: .28, metalness: .06 });
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
    root.current.style.setProperty("--hand-x", `${x * 8}px`);
    root.current.style.setProperty("--hand-y", `${y * 6}px`);
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
        <img src="/imagine-creation-hero-v8.png" alt="" />
      </div>

      <header className="hero-title">
        <h1>IMAGINE</h1>
        <p>A creative interface for intelligence.</p>
      </header>

      <button className="floating-logo" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1">
        <ThreeLogo />
      </button>

      <div className="entry-veil" aria-hidden="true" />
    </main>
  );
}
