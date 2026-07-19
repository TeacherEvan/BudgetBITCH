import type { ReactNode } from "react";

type FixedScreenShellProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function FixedScreenShell({
  children,
  header,
  footer,
  className,
  contentClassName,
}: FixedScreenShellProps) {
  return (
    <section
      data-testid="fixed-screen-shell"
      className={joinClassNames(
        "flex h-[100dvh] min-h-0 flex-col overflow-hidden md:h-full",
        className,
      )}
    >
      {header ? <div>{header}</div> : null}
      <div
        data-testid="fixed-screen-shell-content"
        className={joinClassNames("min-h-0 flex-1 overflow-y-auto", contentClassName)}
      >
        {children}
      </div>
      {footer ? <div data-testid="fixed-screen-shell-footer" className="shrink-0">{footer}</div> : null}
    </section>
  );
}