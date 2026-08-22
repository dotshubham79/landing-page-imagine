"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
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

    const streamVertexShader = `
      attribute float aSeed;
      attribute float aSize;
      attribute vec3 aOffset;
      attribute vec3 color;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uBend;
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
        vec3 base = mix(uOrigin, vec3(0.), eased);
        vec3 fieldPosition = base * 1.8 + aOffset * 2.5 + vec3(uTime * .14);
        vec3 turbulence = curlNoise(fieldPosition);
        vec3 position = base;
        position += aOffset * (1. - eased) * .34;
        position += turbulence * (.035 + life * .22);
        position.y += uBend * life;

        vColor = color;
        vAlpha = smoothstep(0., .08, progress) * (1. - smoothstep(.76, 1., progress));
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * modelViewPosition;
        gl_PointSize = aSize * (8. / -modelViewPosition.z) * (.72 + life * .5);
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

    const createEnergyStream = (palette: number[], count: number, size: number, opacity: number, origin: THREE.Vector3, speed: number, bend: number) => {
      const geometry = new THREE.BufferGeometry();
      const streamPositions = new Float32Array(count * 3);
      const streamColors = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      const sizes = new Float32Array(count);
      const offsets = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        seeds[i] = Math.random();
        sizes[i] = size * (.55 + Math.random() * .9);
        offsets[i * 3] = (Math.random() - .5) * .46;
        offsets[i * 3 + 1] = (Math.random() - .5) * .46;
        offsets[i * 3 + 2] = (Math.random() - .5) * .5;
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
          uOrigin: { value: origin },
          uOpacity: { value: opacity },
        },
        vertexShader: streamVertexShader,
        fragmentShader: streamFragmentShader,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      return { geometry, material };
    };

    const divineStream = createEnergyStream([0xffffff, 0xc8f5ff, 0x79d9ff], 900, 3.4, .9, new THREE.Vector3(2.12, .46, 0), .16, -.11);
    const humanStream = createEnergyStream([0xffd36c, 0xf7a92f, 0xff7a21], 900, 3.7, .86, new THREE.Vector3(-2.12, -.38, 0), .145, .1);

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
      divineStream.material.uniforms.uTime.value = time;
      humanStream.material.uniforms.uTime.value = time;
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
      divineStream.geometry.dispose();
      divineStream.material.dispose();
      humanStream.geometry.dispose();
      humanStream.material.dispose();
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
    if (!root.current) return;
    const frame = requestAnimationFrame(() => setReady(true));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([".hands", ".floating-logo", ".logo-sparkles", ".three-atmosphere"], { opacity: 1 });
        gsap.set([".hand-left", ".hand-right", ".three-logo"], { clearProps: "transform" });
        gsap.set(".logo-aura", { opacity: .72, scale: 1 });
        return;
      }

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".hands", { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0)
        .fromTo(".hand-left", { xPercent: -7, yPercent: 5, rotation: -1.2 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: 1.2 }, 0)
        .fromTo(".hand-right", { xPercent: 7, yPercent: -5, rotation: -1.1 }, { xPercent: 0, yPercent: 0, rotation: 0, duration: 1.2 }, 0)
        .fromTo(".three-atmosphere", { opacity: 0 }, { opacity: 1, duration: 1.25 }, .42)
        .fromTo(".floating-logo", { opacity: 0 }, { opacity: 1, duration: 1 }, 1)
        .fromTo(".three-logo", { scale: .8 }, { scale: 1, duration: 1, ease: "back.out(1.55)", clearProps: "transform" }, 1)
        .fromTo(".logo-aura", { opacity: 0, scale: .72 }, { opacity: .72, scale: 1, duration: .9 }, 1)
        .fromTo(".logo-sparkles", { opacity: 0 }, { opacity: 1, duration: .7 }, 1.18);

      gsap.to(".logo-aura", { opacity: .98, scale: 1.2, duration: 1.55, delay: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-left", { xPercent: .5, yPercent: -.28, rotation: .15, duration: 3.5, delay: 1.25, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".hand-right", { xPercent: -.5, yPercent: .28, rotation: .15, duration: 3.5, delay: 1.25, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);

    return () => {
      cancelAnimationFrame(frame);
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
    setEntering(true);
    window.setTimeout(() => window.location.assign("/v1"), 700);
  }

  return (
    <main ref={root} className={`minimal-creation ${ready ? "ready" : ""} ${entering ? "entering" : ""}`} onPointerMove={trackPointer}>
      <div className="paper-grain" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />
      <ThreeAtmosphere />

      <div className="hands" aria-hidden="true">
        <div className="hand hand-left"><img src="/imagine-hands-transparent-v10.png" alt="" /></div>
        <div className="hand hand-right"><img src="/imagine-hands-transparent-v10.png" alt="" /></div>
      </div>

      <header className="hero-title">
        <h1>IMAGINE</h1>
        <p>Where imagination becomes intelligence.</p>
      </header>

      <div className="logo-sparkles" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      <button className="floating-logo" type="button" onClick={enterV1} aria-label="Enter IMAGINE V1">
        <span className="logo-aura" aria-hidden="true" />
        <ThreeLogo />
      </button>

      <div className="entry-veil" aria-hidden="true" />
    </main>
  );
}
