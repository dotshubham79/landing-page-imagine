import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;
    const move = (event: MouseEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0) translate(-50%,-50%)`;
      cursor.dataset.active = document.elementFromPoint(event.clientX, event.clientY)?.closest("a,button,input") ? "true" : "false";
    };
    const leave = () => { cursor.style.opacity = "0"; };
    const enter = () => { cursor.style.opacity = "1"; };
    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    return () => { window.removeEventListener("mousemove", move); document.removeEventListener("mouseleave", leave); document.removeEventListener("mouseenter", enter); };
  }, []);
  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}
