"use client";

type MoneyLoadingArtProps = {
  reducedMotion: boolean;
};

export function MoneyLoadingArt({ reducedMotion }: MoneyLoadingArtProps) {
  return (
    <div className={reducedMotion ? "grid gap-3" : "grid gap-3 animate-pulse"}>
      <div className="h-6 rounded-full bg-emerald-300/30" />
      <div className="h-20 rounded-[2rem] bg-amber-300/20" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-12 rounded-2xl bg-emerald-400/20" />
        <div className="h-12 rounded-2xl bg-emerald-400/15" />
        <div className="h-12 rounded-2xl bg-emerald-400/10" />
      </div>
    </div>
  );
}