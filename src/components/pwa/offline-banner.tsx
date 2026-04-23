type OfflineBannerProps = {
  className?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  return (
    <section
      aria-label="Offline availability"
      className={joinClassNames(
        "rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-white",
        className,
      )}
    >
      <p className="bb-kicker">Offline-safe tools</p>
      <h2 className="mt-2 text-xl font-semibold md:text-2xl">
        Notes, calculator, and launch settings stay available on this device.
      </h2>
      <p className="bb-mini-copy mt-3 text-sm">
        Your saved notes, calculator draft, and launch settings stay available here. Dashboard,
        jobs, integrations, and other sync-required routes still need a live connection.
      </p>
    </section>
  );
}