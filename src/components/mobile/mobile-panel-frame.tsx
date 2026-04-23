import type { ReactNode } from "react";

type MobilePanelFrameProps = {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function MobilePanelFrame({
  children,
  className,
  panelClassName,
}: MobilePanelFrameProps) {
  return (
    <div
      data-testid="mobile-panel-frame"
      className={joinClassNames("min-h-full md:contents", className)}
    >
      <div
        className={joinClassNames(
          "min-h-full md:contents",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}