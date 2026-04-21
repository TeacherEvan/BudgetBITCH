import Link from "next/link";
import { Home } from "lucide-react";

export function AppNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center border-b border-white/10 bg-[rgba(8,21,18,0.92)] px-4 py-2 backdrop-blur"
      aria-label="App navigation"
    >
      <Link
        href="/dashboard"
        className="bb-button-ghost flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
        aria-label="Go to dashboard"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>
    </nav>
  );
}
