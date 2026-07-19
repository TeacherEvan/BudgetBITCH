"use client";

import type { GeolocationPermissionState } from "@/modules/home-base/location-permission";
import { GEOLOCATION_NOTICE } from "@/modules/home-base/location-permission";

type HomeBasePanelProps = {
  areaLabel?: string;
  manualLabel: string;
  permissionState?: GeolocationPermissionState;
  isLocating?: boolean;
  errorMessage?: string | null;
  onManualLabelChange: (value: string) => void;
  onUseMyArea: () => void;
};

function getPermissionHint(permissionState: GeolocationPermissionState) {
  switch (permissionState) {
    case "granted":
      return "Location access is ready when you want to use it.";
    case "prompt":
      return "Your browser will ask before using your area.";
    case "denied":
      return "Location access is blocked, so type your area manually.";
    default:
      return "If location is unavailable here, enter your area manually.";
  }
}

export function HomeBasePanel({
  areaLabel,
  manualLabel,
  permissionState = "unsupported",
  isLocating = false,
  errorMessage = null,
  onManualLabelChange,
  onUseMyArea,
}: HomeBasePanelProps) {
  return (
    <section className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/70">Home base</p>
        <h2 className="text-2xl font-semibold text-white">Set your area once.</h2>
        <p className="text-sm text-emerald-50/80">
          Use your area for jobs and local updates, or type a manual city, region, and country
          label.
        </p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-emerald-300/15 bg-emerald-400/5 p-4">
        <button
          type="button"
          onClick={onUseMyArea}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLocating}
        >
          {isLocating ? "Finding your area..." : "Use my area"}
        </button>
        <p className="text-xs text-emerald-100/70">{GEOLOCATION_NOTICE}</p>
        <p className="text-xs text-emerald-100/55">{getPermissionHint(permissionState)}</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Area label</span>
        <input
          value={manualLabel}
          onChange={(event) => onManualLabelChange(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
          placeholder="City, region, country"
        />
      </label>

      {areaLabel ? (
        <p className="text-sm text-emerald-50/80">Current area: {areaLabel}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-rose-200" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}