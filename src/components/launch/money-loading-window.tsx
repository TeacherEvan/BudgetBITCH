"use client";

type MoneyLoadingWindowProps = {
  visible: boolean;
  reasons: string[];
  reducedMotion: boolean;
  showArt?: boolean;
};

export function MoneyLoadingWindow({
  visible,
  reasons,
  reducedMotion,
  showArt = false,
}: MoneyLoadingWindowProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-6 backdrop-blur-md">
      <div className="bb-panel bb-panel-strong w-full max-w-xl p-8">
        <p className="bb-kicker">Loading window</p>
        <h2 className="mt-3 text-3xl font-semibold">Preparing your money board</h2>
        <p className="bb-mini-copy mt-3">Active work: {reasons.join(", ")}</p>
        <div className="mt-6">
          {showArt ? (
            <div className={reducedMotion ? "grid gap-3" : "grid gap-3 animate-pulse"}>
              <div className="h-6 rounded-full bg-emerald-300/30" />
              <div className="h-20 rounded-[2rem] bg-amber-300/20" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 rounded-2xl bg-emerald-400/20" />
                <div className="h-12 rounded-2xl bg-emerald-400/15" />
                <div className="h-12 rounded-2xl bg-emerald-400/10" />
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="h-6 rounded-full bg-white/10" />
              <div className="h-20 rounded-[2rem] border border-dashed border-white/15 bg-white/4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}