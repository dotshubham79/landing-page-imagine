"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export function ProductPaths() {
  const gatewayRef = useRef<HTMLElement>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const roles = [
    { name: "student", art: "student" },
    { name: "educator", art: "educator" },
    { name: "filmmaker", art: "filmmaker" },
    { name: "creator", art: "creator" },
    { name: "developer", art: "developer" },
    { name: "just imaginative", art: "imaginative" },
  ];

  const moveLogo = (event: ReactPointerEvent<HTMLElement>) => {
    const gateway = gatewayRef.current;
    if (!gateway) return;
    const bounds = gateway.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    gateway.style.setProperty("--gateway-x", `${x * 25}px`);
    gateway.style.setProperty("--gateway-y", `${y * 20}px`);
    gateway.style.setProperty("--gateway-rx", `${y * -10}deg`);
    gateway.style.setProperty("--gateway-ry", `${x * 12}deg`);
  };

  const resetLogo = () => {
    const gateway = gatewayRef.current;
    if (!gateway) return;
    gateway.style.setProperty("--gateway-x", "0px");
    gateway.style.setProperty("--gateway-y", "0px");
    gateway.style.setProperty("--gateway-rx", "0deg");
    gateway.style.setProperty("--gateway-ry", "0deg");
  };

  const enterSurface = () => {
    setChooserOpen(true);
  };

  const chooseRole = () => {
    window.location.assign("https://imagine-lab.tech");
  };

  return (
    <section ref={gatewayRef} className="product-gateway" aria-label="Enter the intelligent surface" onPointerMove={moveLogo} onPointerLeave={resetLogo}>
      <div className="gateway-stage">
        <div className="gateway-grain" aria-hidden="true" />
        <div className="gateway-particles" aria-hidden="true">
          {Array.from({ length: 26 }, (_, index) => <i key={index} style={{ "--particle": index } as CSSProperties} />)}
        </div>
        <h2 aria-hidden="true">imagine</h2>
        <p className="gateway-line">with your eyes open</p>
        <button type="button" className="gateway-logo" onClick={enterSurface} aria-label="Enter the intelligent surface">
          <span className="gateway-logo-aura" aria-hidden="true" />
          <img src="/imagine-logo-center-v5.png" alt="" />
        </button>
        <section className={`identity-chooser ${chooserOpen ? "is-open" : ""}`} aria-hidden={!chooserOpen} aria-label="Choose how you imagine">
          <div className="identity-flash" aria-hidden="true" />
          <div className="identity-rings" aria-hidden="true"><i /><i /><i /></div>
          <button className="identity-close" type="button" onClick={() => setChooserOpen(false)} aria-label="Return to the IMAGINE invitation">return</button>
          <div className="identity-content">
            <span className="identity-spark" aria-hidden="true">✦</span>
            <p>who are you today?</p>
            <div className="identity-options">
              {roles.map((role, index) => (
                <button key={role.name} type="button" onClick={chooseRole} style={{ "--role-index": index } as CSSProperties}>
                  <i className={`identity-art identity-art--${role.art}`} aria-hidden="true" />
                  <span>{role.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
