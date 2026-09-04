import { useEffect, useRef } from "react";
import * as THREE from "three";

const artworkSize = { width: 1672, height: 941 } as const;
const fingertips = {
  left: { x: 803, y: 400 },
  right: { x: 891, y: 486 },
} as const;

function coveredImagePoint(image: HTMLImageElement | null, sourceX: number, sourceY: number) {
  if (!image?.naturalWidth || !image.naturalHeight) return null;
  const bounds = image.getBoundingClientRect();
  const scale = Math.max(bounds.width / artworkSize.width, bounds.height / artworkSize.height);
  const drawnWidth = artworkSize.width * scale;
  const drawnHeight = artworkSize.height * scale;
  return {
    x: bounds.left + (bounds.width - drawnWidth) / 2 + sourceX * scale,
    y: bounds.top + (bounds.height - drawnHeight) / 2 + sourceY * scale,
  };
}

export function HeroParticles() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const count = reduceMotion ? 60 : 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const spread = new Float32Array(count);
    const leftPalette = [0xf5eedb, 0xffd6a0, 0xf1a16c].map((color) => new THREE.Color(color));
    const rightPalette = [0xfff9e9, 0xf6c982, 0xf2ad72].map((color) => new THREE.Color(color));

    for (let index = 0; index < count; index += 1) {
      seeds[index] = Math.random();
      spread[index] = 0.025 + Math.random() * 0.09;
      const palette = index % 2 === 0 ? leftPalette : rightPalette;
      const color = palette[index % palette.length];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    const context = sprite.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.26, "rgba(255,255,255,.95)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(sprite);
    const material = new THREE.PointsMaterial({ size: 0.027, map: texture, vertexColors: true, transparent: true, opacity: 0.42, alphaTest: 0.02, depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);

    const leftOrigin = new THREE.Vector3();
    const rightOrigin = new THREE.Vector3();
    const target = new THREE.Vector3();
    const viewportToWorld = (x: number, y: number) => {
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const width = height * camera.aspect;
      return new THREE.Vector3((x - 0.5) * width, (0.5 - y) * height, 0);
    };
    const track = () => {
      const hostBounds = host.getBoundingClientRect();
      const read = (selector: string, point: { x: number; y: number }, fallbackX: number, fallbackY: number) => {
        const pixel = coveredImagePoint(document.querySelector<HTMLImageElement>(selector), point.x, point.y);
        if (!pixel || !hostBounds.width || !hostBounds.height) return viewportToWorld(fallbackX, fallbackY);
        return viewportToWorld((pixel.x - hostBounds.left) / hostBounds.width, (pixel.y - hostBounds.top) / hostBounds.height);
      };
      leftOrigin.copy(read("#hero-hand-left img", fingertips.left, 0.475, 0.45));
      rightOrigin.copy(read("#hero-hand-right img", fingertips.right, 0.525, 0.54));
      target.copy(viewportToWorld(0.5, 0.5));
    };

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      const time = clock.getElapsedTime();
      track();
      const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let index = 0; index < count; index += 1) {
        const progress = (seeds[index] + time * (index % 2 === 0 ? 0.12 : 0.135)) % 1;
        const eased = progress * progress * (3 - 2 * progress);
        const origin = index % 2 === 0 ? leftOrigin : rightOrigin;
        const envelope = Math.sin(progress * Math.PI);
        const curl = spread[index] * envelope;
        attribute.setXYZ(index,
          THREE.MathUtils.lerp(origin.x, target.x, eased) + Math.sin(index * 1.71 + time * 0.9) * curl,
          THREE.MathUtils.lerp(origin.y, target.y, eased) + Math.cos(index * 2.07 + time * 0.74) * curl,
          Math.sin(index * 1.19 + time * 0.55) * curl * 0.5,
        );
      }
      attribute.needsUpdate = true;
      renderer.render(scene, camera);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    };
    render();

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      track();
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="hero-particles" aria-hidden="true" />;
}
