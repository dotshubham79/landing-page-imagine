"use client";

import { CustomCursor } from "./components/CustomCursor";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { IntelligenceSection } from "./components/IntelligenceSection";
import { ManifestoSection } from "./components/ManifestoSection";
import { PathsSection } from "./components/PathsSection";
import { PersistentWorldSection } from "./components/PersistentWorldSection";
import { WorldSection } from "./components/WorldSection";

export default function Home() {
  return (
    <main id="top">
      <CustomCursor />
      <Hero />
      <ManifestoSection />
      <WorldSection />
      <IntelligenceSection />
      <PathsSection />
      <PersistentWorldSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
