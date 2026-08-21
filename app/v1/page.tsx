"use client";

import { useState } from "react";

export default function V1Preview() {
  const [awake, setAwake] = useState(false);

  return (
    <main className={`v1-gateway ${awake ? "v1-awake" : ""}`}>
      <div className="v1-field" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <a href="/" className="v1-back">← Return to the landing page</a>
      <button className="v1-core" onClick={() => setAwake((value) => !value)} aria-pressed={awake}>
        <img src="/imagine-logo-v3.png" alt="" />
        <span>{awake ? "Interface awake" : "Wake the interface"}</span>
      </button>
      <section>
        <p>IMAGINE / V1</p>
        <h1>{awake ? "Intelligence is now in the room." : "You found the door."}</h1>
        <p>V1 is being prepared for its first creators. Touch the mark to preview the feeling.</p>
      </section>
    </main>
  );
}
