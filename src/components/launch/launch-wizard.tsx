"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchableCombobox, type SearchableComboboxOption } from "@/components/launch/searchable-combobox";
import { HomeLocationCard } from "@/components/home-location/home-location-card";

export const LAUNCH_PROFILE_STORAGE_KEY = "budgetbitch:launch-profile";

export type LaunchWizardExpense = {
  title: string;
  amount: number;
};

export type LaunchWizardProfile = {
  completed: true;
  completedAt: string;
  expenses: LaunchWizardExpense[];
};

export type LaunchWizardProps = {
  onComplete?: (profile: LaunchWizardProfile) => void;
};

const expenseCategoryKeys = [
  "rentMortgage",
  "groceries",
  "utilities",
  "transportFuel",
  "phoneInternet",
  "insurance",
  "debtPayments",
  "healthcare",
  "childcareFamilySupport",
  "funEntertainment",
] as const;

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
    Array.isArray(profile.expenses) &&
    profile.expenses.every(
      (expense) =>
        expense &&
        typeof expense === "object" &&
        typeof expense.title === "string" &&
        typeof expense.amount === "number" &&
        Number.isFinite(expense.amount) &&
        expense.amount > 0,
    )
  );
}

function formatCurrencyAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export default function LaunchWizard({ onComplete }: LaunchWizardProps) {
  const t = useTranslations("launchWizard");
  const [selectedCategoryValue, setSelectedCategoryValue] = useState("");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [expenses, setExpenses] = useState<LaunchWizardExpense[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [comboboxResetSignal, setComboboxResetSignal] = useState(0);

  async function loadExpenseOptions(): Promise<SearchableComboboxOption[]> {
    return expenseCategoryKeys.map((key) => ({
      value: key,
      label: t(`categories.${key}`),
      keywords: [t(`categories.${key}`).toLowerCase()],
    }));
  }

  function handleAddExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolvedTitle = customTitle.trim() || selectedCategoryLabel.trim();

    if (!resolvedTitle) {
      setErrorMessage(t("errors.titleRequired"));
      return;
    }

    const parsedAmount = Number.parseFloat(amountValue);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(t("errors.amountRequired"));
      return;
    }

    setExpenses((current) => [...current, { title: resolvedTitle, amount: parsedAmount }]);
    setSelectedCategoryValue("");
    setSelectedCategoryLabel("");
    setCustomTitle("");
    setAmountValue("");
    setComboboxResetSignal((value) => value + 1);
    setErrorMessage(null);
  }

  function handleFinishStartup() {
    if (expenses.length === 0) {
      setErrorMessage(t("errors.atLeastOne"));
      return;
    }

    const profile: LaunchWizardProfile = {
      completed: true,
      completedAt: new Date().toISOString(),
      expenses,
    };

    try {
      persistLaunchProfile(profile);
    } catch {
      setErrorMessage(t("errors.saveFailed"));
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
            <p className="bb-kicker">{t("kicker")}</p>
            <h1 className="max-w-2xl text-4xl font-semibold md:text-5xl">{t("title")}</h1>
            <p className="bb-copy max-w-2xl text-base md:text-lg">{t("description")}</p>
          </header>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 text-white">
            <p className="bb-kicker">{t("topCategoriesTitle")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {expenseCategoryKeys.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-emerald-50/85"
                >
                  {t(`categories.${key}`)}
                </span>
              ))}
            </div>
          </div>

          <form className="bb-launch-form mt-6" onSubmit={handleAddExpense} noValidate>
            <div className="bb-launch-field-grid gap-4">
              <SearchableCombobox
                key={`expense-combobox-${comboboxResetSignal}`}
                label={t("entryLabel")}
                value={selectedCategoryValue}
                onChange={setSelectedCategoryValue}
                onOptionSelect={(option) => setSelectedCategoryLabel(option.label)}
                loadOptions={loadExpenseOptions}
                placeholder={t("entryPlaceholder")}
              />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">{t("customTitleLabel")}</span>
                <input
                  aria-label={t("customTitleLabel")}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder={t("customTitlePlaceholder")}
                  type="text"
                  value={customTitle}
                />
              </label>
            </div>

            <div className="bb-launch-field-grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">{t("amountLabel")}</span>
                <input
                  aria-label={t("amountLabel")}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setAmountValue(event.target.value)}
                  step="0.01"
                  type="number"
                  value={amountValue}
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {t("addExpense")}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p className="text-sm text-rose-200" role="alert" aria-live="assertive">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFinishStartup}
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t("finish")}
              </button>
              <span className="bb-mini-copy">{t("helperDescription")}</span>
            </div>
          </form>
        </article>

        <aside className="bb-launch-sidebar grid gap-4 self-start">
          <article className="bb-panel bb-panel-accent p-6">
            <p className="bb-kicker">{t("helperTitle")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{t("title")}</h2>
            <p className="bb-mini-copy mt-3">{t("helperDescription")}</p>
          </article>

          <HomeLocationCard
            kicker="Home base"
            title="Sticky home location"
            description="When you set a home base in Start Smart, dashboard and jobs will reuse it instead of asking again."
            emptyStateCopy="No home base saved yet. You can lock it in during Start Smart after this first-run setup."
            className="bb-panel bb-panel-muted p-6"
          />

          <article className="bb-panel bb-panel-muted p-6">
            <p className="bb-kicker">{t("summaryTitle")}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">
                  {t("currentCountLabel")}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{expenses.length}</p>
              </div>
              {expenses.length === 0 ? (
                <p className="bb-mini-copy rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  {t("emptySummary")}
                </p>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={`${expense.title}-${expense.amount}`}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">
                      {t("entryLabel")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">{expense.title}</p>
                    <p className="bb-mini-copy mt-2">{formatCurrencyAmount(expense.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
