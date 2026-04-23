import type { ReactNode } from "react";
import { AppNav } from "@/components/dashboard/app-nav";

type MobileAppShellProps = {
  children?: ReactNode;
};

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="bb-mobile-shell flex min-h-screen flex-col bg-[rgba(8,21,18,0.96)] text-white md:h-screen md:bg-transparent">
      <AppNav />
      <div className="bb-mobile-content min-h-0 flex-1" data-slot="mobile-shell-content">
        {children}
      </div>
    </div>
  );
}