"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useHomeLocation } from "@/modules/home-location/use-home-location";

type HomeLocationCardProps = {
  kicker?: string;
  title?: string;
  description: string;
  emptyStateCopy: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function HomeLocationCard({
  kicker = "Home base",
  title = "Sticky home location",
  description,
  emptyStateCopy,
  actionHref,
  actionLabel,
  className,
}: HomeLocationCardProps) {
  const { homeLocation, homeLocationLabel } = useHomeLocation();

  return (
    <article
      className={joinClassNames(
        "rounded-[28px] border border-white/10 bg-black/20 p-5 text-white",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-2xl border border-white/10 bg-white/10 p-2 text-emerald-100">
          <MapPin aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">{kicker}</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm font-medium text-white">
            {homeLocation ? homeLocationLabel : emptyStateCopy}
          </p>
          <p className="mt-2 text-sm text-emerald-50/75">{description}</p>
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="mt-4 inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}