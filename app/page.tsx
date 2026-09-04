"use client";

import { Hero } from "./components/Hero";
import { CinematicStory } from "./components/CinematicStory";
import { ProductPaths } from "./components/ProductPaths";

export default function Home() {
  return <main><Hero /><CinematicStory /><ProductPaths /></main>;
}
