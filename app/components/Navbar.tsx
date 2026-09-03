import { Orbit } from "lucide-react";

export function Navbar() {
  return (
    <header className="site-nav-wrap">
      <nav className="liquid-glass site-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="IMAGINE home">
          <Orbit size={18} strokeWidth={1.35} />
          <span>IMAGINE</span>
        </a>
        <div className="nav-links">
          <a href="#learn">Learn</a>
          <a href="#create">Create</a>
          <a href="#manifesto">Manifesto</a>
        </div>
        <div className="nav-actions">
          <a className="sign-in" href="/signin-with-chatgpt?returnTo=%2F">Sign in</a>
          <a className="liquid-glass enter-button" href="#imagine">Enter Imagine</a>
        </div>
      </nav>
    </header>
  );
}
