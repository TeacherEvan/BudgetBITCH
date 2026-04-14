"use client";

import { useState } from "react";
import { SearchableCombobox, type SearchableComboboxOption } from "@/components/launch/searchable-combobox";
import { loadLaunchCityOptions } from "@/modules/launch/option-catalog";

export const LAUNCH_PROFILE_STORAGE_KEY = "budgetbitch:launch-profile";

export type LaunchWizardLayoutPreset = "billboard" | "launcher_grid" | "panel_stack";
export type LaunchWizardMotionPreset = "cinematic" | "balanced" | "reduced";
export type LaunchWizardThemePreset = "midnight" | "aurora" | "sunrise";
export type LaunchWizardCryptoPlatform = "later" | "coinbase" | "kraken" | "binance";

export type LaunchWizardProfile = {
  completed: true;
  completedAt: string;
  city: string;
  layoutPreset: LaunchWizardLayoutPreset;
  motionPreset: LaunchWizardMotionPreset;
  themePreset: LaunchWizardThemePreset;
  cryptoPlatform: LaunchWizardCryptoPlatform;
};

export type LaunchWizardProps = {
  onComplete?: (profile: LaunchWizardProfile) => void;
};

type LaunchWizardOption = {
  label: string;
  value: LaunchWizardLayoutPreset | LaunchWizardMotionPreset | LaunchWizardThemePreset | LaunchWizardCryptoPlatform;
};

const layoutOptions: LaunchWizardOption[] = [
  { label: "Billboard window", value: "billboard" },
  { label: "Launcher grid", value: "launcher_grid" },
  { label: "Panel stack", value: "panel_stack" },
];

const motionOptions: LaunchWizardOption[] = [
  { label: "Cinematic", value: "cinematic" },
  { label: "Balanced", value: "balanced" },
  { label: "Reduced", value: "reduced" },
];

const themeOptions: LaunchWizardOption[] = [
  { label: "Midnight", value: "midnight" },
  { label: "Aurora", value: "aurora" },
  { label: "Sunrise", value: "sunrise" },
];

const cryptoOptions: LaunchWizardOption[] = [
  { label: "Later", value: "later" },
  { label: "Coinbase", value: "coinbase" },
  { label: "Kraken", value: "kraken" },
  { label: "Binance", value: "binance" },
];

function persistLaunchProfile(profile: LaunchWizardProfile) {
  window.localStorage.setItem(LAUNCH_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function isLaunchWizardProfile(value: unknown): value is LaunchWizardProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const profile = value as Partial<LaunchWizardProfile>;

  return (
    profile.completed === true &&
    typeof profile.completedAt === "string" &&
    typeof profile.city === "string" &&
    typeof profile.layoutPreset === "string" &&
    typeof profile.motionPreset === "string" &&
    typeof profile.themePreset === "string" &&
    typeof profile.cryptoPlatform === "string"
  );
}

export default function LaunchWizard({ onComplete }: LaunchWizardProps) {
  const [cityValue, setCityValue] = useState("");
  const [cityLabel, setCityLabel] = useState("");
  const [layoutPreset, setLayoutPreset] = useState<LaunchWizardLayoutPreset>("launcher_grid");
  const [motionPreset, setMotionPreset] = useState<LaunchWizardMotionPreset>("cinematic");
  const [themePreset, setThemePreset] = useState<LaunchWizardThemePreset>("midnight");
  const [cryptoPlatform, setCryptoPlatform] = useState<LaunchWizardCryptoPlatform>("later");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCityComboboxOptions(): Promise<SearchableComboboxOption[]> {
    const options = await loadLaunchCityOptions();

    return options.map((option) => ({
      value: option.value,
      label: option.label,
      description: option.regionLabel,
      keywords: option.keywords,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCity = cityLabel.trim();

    if (!trimmedCity) {
      setErrorMessage("Enter a city to continue.");
      return;
    }

    const profile: LaunchWizardProfile = {
      completed: true,
      completedAt: new Date().toISOString(),
      city: trimmedCity,
      layoutPreset,
      motionPreset,
      themePreset,
      cryptoPlatform,
    };

    try {
      persistLaunchProfile(profile);
    } catch {
      setErrorMessage("Unable to save launch settings in this browser.");
      return;
    }

    setErrorMessage(null);
    onComplete?.(profile);
  }

  return (
    <main className="bb-page-shell">
      <section className="bb-launch-shell mx-auto max-w-7xl overflow-hidden">
        <article className="bb-panel bb-panel-strong bb-launch-main p-6 md:p-8">
          <header className="space-y-4">
            <p className="bb-kicker">Launch wizard</p>
            <h1 className="max-w-2xl text-4xl font-semibold md:text-5xl">
              Launch your dashboard window.
            </h1>
            <p className="bb-copy max-w-2xl text-base md:text-lg">
              Set the launch look, pick the city label from a searchable list, and keep the first
              screen tight enough to stay in view.
            </p>
          </header>

          <form className="bb-launch-form" onSubmit={handleSubmit} noValidate>
            <div className="bb-launch-field-grid">
              <SearchableCombobox
                label="City"
                value={cityValue}
                onChange={setCityValue}
                onOptionSelect={(option) => setCityLabel(option.label)}
                loadOptions={loadCityComboboxOptions}
                placeholder="Search a city label"
              />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">Visual style</span>
                <select
                  aria-label="Visual style"
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  value={layoutPreset}
                  onChange={(event) => setLayoutPreset(event.target.value as LaunchWizardLayoutPreset)}
                >
                  {layoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="bb-launch-field-grid">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">Motion level</span>
                <select
                  aria-label="Motion level"
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  value={motionPreset}
                  onChange={(event) => setMotionPreset(event.target.value as LaunchWizardMotionPreset)}
                >
                  {motionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">Theme</span>
                <select
                  aria-label="Theme"
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  value={themePreset}
                  onChange={(event) => setThemePreset(event.target.value as LaunchWizardThemePreset)}
                >
                  {themeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Crypto platform placeholder</span>
              <select
                aria-label="Crypto platform placeholder"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                value={cryptoPlatform}
                onChange={(event) =>
                  setCryptoPlatform(event.target.value as LaunchWizardCryptoPlatform)
                }
              >
                {cryptoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="bb-mini-copy rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3">
              No precise location data is collected. We only keep the city label you choose.
            </p>

            <p className="bb-mini-copy rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Crypto platform choice is a placeholder for later. It is saved locally, not connected
              to any live integration.
            </p>

            {errorMessage ? (
              <p className="text-sm text-rose-200" role="alert" aria-live="assertive">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Save launch settings
              </button>
              <span className="bb-mini-copy">The dashboard opens after you save these choices.</span>
            </div>
          </form>
        </article>

        <aside className="bb-launch-sidebar grid gap-4 self-start">
          <article className="bb-panel bb-panel-accent p-6">
            <p className="bb-kicker">Permission copy</p>
            <h2 className="mt-3 text-3xl font-semibold">City only</h2>
            <p className="bb-mini-copy mt-3">
              We only keep the city label you enter. No GPS, no address, and no location history.
            </p>
          </article>

          <article className="bb-panel bb-panel-muted p-6">
            <p className="bb-kicker">Current choices</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">City</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {cityLabel.trim() || "Not set"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">Layout</p>
                <p className="mt-1 text-lg font-semibold text-white">{layoutPreset}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">Motion</p>
                <p className="mt-1 text-lg font-semibold text-white">{motionPreset}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">Theme</p>
                <p className="mt-1 text-lg font-semibold text-white">{themePreset}</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
