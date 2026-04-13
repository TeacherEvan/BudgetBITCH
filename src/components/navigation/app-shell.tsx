"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/start-smart", label: "Start Smart" },
  { href: "/learn", label: "Learn" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings/integrations", label: "Settings" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="bb-app-shell">
      <a className="bb-app-skip-link" href="#app-content">
        Skip to content
      </a>

      <div className="bb-app-shell-frame">
        <header className="bb-app-shell-header">
          <Link className="bb-app-shell-brand" href="/dashboard">
            BudgetBITCH
          </Link>

          <button
            type="button"
            className="bb-button-secondary bb-app-menu-button"
            aria-expanded={menuOpen}
            aria-controls="app-navigation"
            aria-label="Open navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
          </button>
        </header>

        <nav
          id="app-navigation"
          aria-label="Primary"
          data-open={menuOpen ? "true" : "false"}
          className={menuOpen ? "bb-app-shell-nav bb-app-shell-nav-open" : "bb-app-shell-nav"}
        >
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="bb-app-shell-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          id="app-content"
          className="bb-app-shell-content"
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </div>
  );
}