"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  DashboardPageData,
  DashboardJobPreferenceSummary,
  DashboardPersonalizationProfile,
} from "@/modules/dashboard/dashboard-data";

type MoneyDashboardProps = {
  data: DashboardPageData;
};

type PanelId = "record" | "budget" | "local" | "privacy";

type SubmitState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function panelClass(isActive: boolean) {
  return [
    "relative overflow-hidden rounded-[28px] border px-4 py-4 text-left shadow-[0_18px_60px_rgba(34,18,4,0.3)] backdrop-blur-xl md:px-5 md:py-5",
    isActive
      ? "border-amber-300/70 bg-[linear-gradient(180deg,rgba(85,52,8,0.34),rgba(14,10,7,0.84))]"
      : "border-amber-100/15 bg-[linear-gradient(180deg,rgba(45,30,12,0.18),rgba(11,10,8,0.72))]",
  ].join(" ");
}

function microLabelClass() {
  return "text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-amber-100/70";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPronounLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value.replaceAll("_", "/");
}

function formatTokenLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value.replaceAll("_", " ");
}

async function postJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: string | { message?: string } }
      | null;
    const message =
      typeof errorBody?.error === "string"
        ? errorBody.error
        : errorBody?.error?.message ?? "The request could not be completed.";
    throw new Error(message);
  }

  return response.json();
}

function buildInitialPrivacyForm(profile: DashboardPersonalizationProfile | null) {
  return {
    genderIdentity: profile?.genderIdentity ?? "prefer_not_to_say",
    pronouns: profile?.pronouns ?? "prefer_not_to_say",
    communicationStyle: profile?.communicationStyle ?? "balanced",
    coachingIntensity: profile?.coachingIntensity ?? "focused",
    consented: profile?.consented ?? false,
  };
}

function buildInitialJobPreferenceForm(jobPreferences: DashboardJobPreferenceSummary) {
  return {
    roleInterests: jobPreferences.roleInterests.join(", "),
    certifications: jobPreferences.certifications.join(", "),
    licenseTypes: jobPreferences.licenseTypes.join(", "),
    careWorkInterest: jobPreferences.careWorkInterest,
    childCareInterest: jobPreferences.childCareInterest,
    petCareInterest: jobPreferences.petCareInterest,
    nursingInterest: jobPreferences.nursingInterest,
    teachingInterest: jobPreferences.teachingInterest,
    notificationEnabled: jobPreferences.notificationEnabled,
  };
}

function splitList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function subscribeToClientReady() {
  return () => undefined;
}

export function MoneyDashboard({ data }: MoneyDashboardProps) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);
  const isInteractiveReady = useSyncExternalStore(subscribeToClientReady, () => true, () => false);
  const [activePanel, setActivePanel] = useState<PanelId>("record");
  const [expenseForm, setExpenseForm] = useState({
    merchantName: "",
    amount: "",
    budgetCategoryId: data.accounting.expenseForm.categoryOptions[0]?.value ?? "",
    accountId: data.accounting.expenseForm.accountOptions[0]?.value ?? "",
    occurredAt: data.accounting.expenseForm.defaultOccurredAt,
    note: "",
  });
  const [expenseState, setExpenseState] = useState<SubmitState>({ status: "idle", message: null });
  const [locationForm, setLocationForm] = useState({
    city: data.homeLocation?.city ?? "",
    stateCode: data.homeLocation?.stateCode ?? "",
    countryCode: data.homeLocation?.countryCode ?? "US",
    consented: true,
  });
  const [locationState, setLocationState] = useState<SubmitState>({ status: "idle", message: null });
  const [privacyForm, setPrivacyForm] = useState(buildInitialPrivacyForm(data.personalization.profile));
  const [privacyState, setPrivacyState] = useState<SubmitState>({ status: "idle", message: null });
  const [jobPreferenceForm, setJobPreferenceForm] = useState(
    buildInitialJobPreferenceForm(data.personalization.jobPreferences),
  );
  const [jobPreferenceState, setJobPreferenceState] = useState<SubmitState>({ status: "idle", message: null });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [isSubmittingPrivacy, setIsSubmittingPrivacy] = useState(false);
  const [isSubmittingJobPreferences, setIsSubmittingJobPreferences] = useState(false);

  const workspaceName = data.activeWorkspace?.name ?? "No workspace selected";
  const localAreaLabel = data.homeLocation?.label ?? data.localAreaLabel;
  const negativeCashflow = data.accounting.snapshot.cashflow.status === "negative";
  const locationWorkspaceId = data.isDemo
    ? data.accounting.expenseForm.workspaceId
    : data.activeWorkspace?.workspaceId ?? null;

  useEffect(() => {
    if (activePanel === "record" || refreshTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = null;
  }, [activePanel]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  function scheduleRecordRefresh() {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      router.refresh();
    }, 400);
  }

  async function handleExpenseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data.accounting.expenseForm.workspaceId) {
      setExpenseState({ status: "error", message: "Choose a live workspace before saving an expense." });
      return;
    }

    setIsSubmittingExpense(true);
    setExpenseState({ status: "idle", message: null });

    try {
      await postJson("/api/v1/accounting/expenses", {
        workspaceId: data.accounting.expenseForm.workspaceId,
        merchantName: expenseForm.merchantName,
        amount: expenseForm.amount,
        budgetCategoryId: expenseForm.budgetCategoryId || undefined,
        accountId: expenseForm.accountId || undefined,
        occurredAt: expenseForm.occurredAt,
        note: expenseForm.note,
      });
      setExpenseState({ status: "success", message: "Expense saved to the money dashboard." });
      setExpenseForm((current) => ({ ...current, merchantName: "", amount: "", note: "" }));
      scheduleRecordRefresh();
    } catch (error) {
      setExpenseState({
        status: "error",
        message: error instanceof Error ? error.message : "Expense save failed.",
      });
    } finally {
      setIsSubmittingExpense(false);
    }
  }

  async function handleLocationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!locationWorkspaceId) {
      setLocationState({ status: "error", message: "A live workspace is required before saving home area data." });
      return;
    }

    setIsSubmittingLocation(true);
    setLocationState({ status: "idle", message: null });

    try {
      await postJson("/api/v1/accounting/home-location", {
        workspaceId: locationWorkspaceId,
        city: locationForm.city,
        stateCode: locationForm.stateCode,
        countryCode: locationForm.countryCode,
        consented: locationForm.consented,
      });
      setLocationState({ status: "success", message: "Home area saved. Only city and state are kept." });
    } catch (error) {
      setLocationState({
        status: "error",
        message: error instanceof Error ? error.message : "Home area save failed.",
      });
    } finally {
      setIsSubmittingLocation(false);
    }
  }

  async function handlePrivacySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmittingPrivacy(true);
    setPrivacyState({ status: "idle", message: null });

    try {
      await postJson("/api/v1/personalization/profile", privacyForm);
      setPrivacyState({ status: "success", message: "Privacy and personalization settings saved." });
    } catch (error) {
      setPrivacyState({
        status: "error",
        message: error instanceof Error ? error.message : "Privacy settings save failed.",
      });
    } finally {
      setIsSubmittingPrivacy(false);
    }
  }

  async function handleJobPreferenceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmittingJobPreferences(true);
    setJobPreferenceState({ status: "idle", message: null });

    try {
      await postJson("/api/v1/personalization/job-preferences", {
        roleInterests: splitList(jobPreferenceForm.roleInterests),
        certifications: splitList(jobPreferenceForm.certifications),
        licenseTypes: splitList(jobPreferenceForm.licenseTypes),
        careWorkInterest: jobPreferenceForm.careWorkInterest,
        childCareInterest: jobPreferenceForm.childCareInterest,
        petCareInterest: jobPreferenceForm.petCareInterest,
        nursingInterest: jobPreferenceForm.nursingInterest,
        teachingInterest: jobPreferenceForm.teachingInterest,
        notificationEnabled: jobPreferenceForm.notificationEnabled,
      });
      setJobPreferenceState({
        status: "success",
        message: "Job preference signals saved. Matches will refresh for your stated interests.",
      });
    } catch (error) {
      setJobPreferenceState({
        status: "error",
        message: error instanceof Error ? error.message : "Job preference save failed.",
      });
    } finally {
      setIsSubmittingJobPreferences(false);
    }
  }

  return (
    <section
      className="relative isolate min-h-[calc(100dvh-6rem)] overflow-hidden rounded-[34px] border border-amber-200/15 bg-[radial-gradient(circle_at_top,rgba(156,107,25,0.18),transparent_28%),linear-gradient(180deg,rgba(28,18,9,0.98),rgba(7,7,6,0.96))] p-4 text-stone-100 shadow-[0_28px_100px_rgba(0,0,0,0.42)] md:p-6"
      aria-busy={!isInteractiveReady}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute inset-x-6 top-6 h-28 rounded-4xl bg-[repeating-linear-gradient(90deg,rgba(251,191,36,0.16),rgba(251,191,36,0.16)_1px,transparent_1px,transparent_36px)] blur-[1px]" />
        <div className="absolute bottom-6 left-6 right-6 h-24 rounded-4xl bg-[repeating-linear-gradient(0deg,rgba(245,158,11,0.12),rgba(245,158,11,0.12)_2px,transparent_2px,transparent_24px)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col gap-4">
        <header className="grid gap-4 rounded-[30px] border border-amber-200/15 bg-[linear-gradient(135deg,rgba(92,58,14,0.42),rgba(17,13,10,0.82))] p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] md:p-6">
          <div>
            <p className={microLabelClass()}>Golden ledger</p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-amber-50 md:text-5xl">
              Money dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200/80 md:text-base">
              Record expenses, protect the plan, and keep privacy promises visible.
            </p>

            <fieldset disabled={!isInteractiveReady} className="mt-5 min-w-0 border-0 p-0">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Money dashboard panels">
                {([
                  ["record", "Record"],
                  ["budget", "Budget"],
                  ["local", "Local"],
                  ["privacy", "Privacy"],
                ] as const).map(([panelId, label]) => (
                  <button
                    key={panelId}
                    type="button"
                    onClick={() => setActivePanel(panelId)}
                    role="tab"
                    id={`panel-tab-${panelId}`}
                    aria-controls={`panel-${panelId}`}
                    aria-selected={activePanel === panelId}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70",
                      activePanel === panelId
                        ? "border-amber-200/80 bg-amber-200/18 text-amber-50"
                        : "border-amber-100/20 bg-black/20 text-stone-200/80 hover:border-amber-200/40",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <article className="rounded-3xl border border-amber-100/15 bg-black/20 p-4">
              <p className={microLabelClass()}>Workspace</p>
              <p className="mt-3 text-2xl font-semibold text-amber-50">{workspaceName}</p>
              <p className="mt-2 text-sm text-stone-200/70">Role: {formatTokenLabel(data.activeWorkspace?.role ?? null)}</p>
            </article>
            <article className="rounded-3xl border border-amber-100/15 bg-black/20 p-4">
              <p className={microLabelClass()}>Home area</p>
              <p className="mt-3 text-2xl font-semibold text-amber-50">{localAreaLabel}</p>
              <p className="mt-2 text-sm text-stone-200/70">City/state only. No exact coordinates are stored.</p>
            </article>
            <article className="rounded-3xl border border-amber-100/15 bg-black/20 p-4">
              <p className={microLabelClass()}>Cashflow</p>
              <p className={["mt-3 text-2xl font-semibold", negativeCashflow ? "text-rose-300" : "text-emerald-300"].join(" ")}>
                {formatCurrency(data.accounting.snapshot.cashflow.netCashflow)}
              </p>
              <p className="mt-2 text-sm text-stone-200/70">After due-soon bills and recorded spending.</p>
            </article>
            <article className="rounded-3xl border border-amber-100/15 bg-black/20 p-4">
              <p className={microLabelClass()}>Privacy</p>
              <p className="mt-3 text-lg font-semibold text-amber-50">{data.privacyCommitments[0]}</p>
              <p className="mt-2 text-sm text-stone-200/70">Version {data.personalization.profile?.privacyVersion ?? "v1"}</p>
            </article>
          </div>
        </header>

        <div
          role="tabpanel"
          id={`panel-${activePanel}`}
          aria-labelledby={`panel-tab-${activePanel}`}
          className="grid flex-1 gap-4"
        >
          {activePanel === "record" ? (
            <article className={panelClass(activePanel === "record")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={microLabelClass()}>Record</p>
                  <h2 className="mt-2 text-2xl font-semibold text-amber-50">Expense entry</h2>
                </div>
                <span className="rounded-full border border-amber-100/15 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                  {data.activeWorkspace ? "Live workspace" : "Demo"}
                </span>
              </div>

              <form className="mt-4" onSubmit={handleExpenseSubmit}>
                <fieldset
                  disabled={!isInteractiveReady || isSubmittingExpense}
                  className="grid gap-3 border-0 p-0 md:grid-cols-2"
                >
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  Merchant
                  <input
                    value={expenseForm.merchantName}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, merchantName: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none ring-0 placeholder:text-stone-400"
                    placeholder="Corner Store"
                  />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  Amount
                  <input
                    value={expenseForm.amount}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none ring-0"
                    inputMode="decimal"
                    placeholder="18.25"
                  />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  Category
                  <select
                    value={expenseForm.budgetCategoryId}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, budgetCategoryId: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                  >
                    {data.accounting.expenseForm.categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  Account
                  <select
                    value={expenseForm.accountId}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, accountId: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                  >
                    {data.accounting.expenseForm.accountOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  Date
                  <input
                    type="date"
                    value={expenseForm.occurredAt}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, occurredAt: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                  />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-stone-100 md:col-span-2">
                  Note
                  <input
                    value={expenseForm.note}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, note: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                    placeholder="Lunch after errands"
                  />
                  </label>

                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-full border border-amber-300/60 bg-amber-200/15 px-5 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/22 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingExpense ? "Saving expense..." : "Save expense"}
                    </button>
                    {expenseState.message ? (
                      <p
                        className={[
                          "text-sm",
                          expenseState.status === "error" ? "text-rose-300" : "text-emerald-300",
                        ].join(" ")}
                      >
                        {expenseState.message}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              </form>

              <div className="mt-5 grid gap-3 rounded-3xl border border-amber-100/10 bg-black/18 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={microLabelClass()}>Recent activity</p>
                    <h3 className="mt-2 text-lg font-semibold text-stone-50">Recent activity</h3>
                  </div>
                  <Link href="/calculator" className="text-sm font-semibold text-amber-200 transition hover:text-amber-100">
                    Open calculator
                  </Link>
                </div>

                {data.accounting.recentExpenses.length > 0 ? (
                  <ul className="grid gap-2">
                    {data.accounting.recentExpenses.map((expense) => (
                      <li key={expense.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100/10 bg-black/15 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-stone-100">{expense.merchantName ?? "Manual expense"}</p>
                          <p className="text-xs text-stone-300/75">{expense.categoryName ?? "Unsorted"}</p>
                        </div>
                        <p className="text-sm font-semibold text-amber-100">{formatCurrency(expense.amount)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-300/75">No expenses recorded yet.</p>
                )}
              </div>
            </article>
          ) : null}

          {activePanel === "budget" ? (
            <article className={panelClass(activePanel === "budget")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={microLabelClass()}>Budget</p>
                  <h2 className="mt-2 text-2xl font-semibold text-amber-50">Budget snapshot</h2>
                </div>
                <Link href="/cashflow" className="text-sm font-semibold text-amber-200 transition hover:text-amber-100">
                  Open cashflow
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Available cash</p>
                  <p className="mt-3 text-2xl font-semibold text-amber-50">
                    {formatCurrency(data.accounting.snapshot.cashflow.availableCash)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Due soon</p>
                  <p className="mt-3 text-2xl font-semibold text-amber-50">
                    {formatCurrency(data.accounting.snapshot.cashflow.dueSoonTotal)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Spent total</p>
                  <p className="mt-3 text-2xl font-semibold text-amber-50">
                    {formatCurrency(data.accounting.snapshot.cashflow.spentTotal)}
                  </p>
                </article>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="grid gap-3">
                  {data.accounting.snapshot.categories.map((category) => (
                    <article key={category.id} className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-50">{category.name}</p>
                          <p className="mt-1 text-xs text-stone-300/70">
                            {formatCurrency(category.spent)} spent of {formatCurrency(category.monthlyLimit)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-amber-100">
                          {formatCurrency(category.remaining)} left
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="grid gap-3">
                  <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                    <p className={microLabelClass()}>Advice</p>
                    <ul className="mt-3 grid gap-3">
                      {data.accounting.advice.map((card) => (
                        <li key={card.id} className="rounded-[20px] border border-amber-100/10 bg-black/18 p-3">
                          <p className="text-sm font-semibold text-stone-50">{card.title}</p>
                          <p className="mt-1 text-sm leading-6 text-stone-200/75">{card.detail}</p>
                          <Link href="/learn" className="mt-3 inline-flex text-sm font-semibold text-amber-200 hover:text-amber-100">
                            Open Learn
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                    <p className={microLabelClass()}>Due soon</p>
                    {data.accounting.snapshot.dueSoonBills.length > 0 ? (
                      <ul className="mt-3 grid gap-2">
                        {data.accounting.snapshot.dueSoonBills.map((bill) => (
                          <li key={bill.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100/10 bg-black/18 px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-stone-50">{bill.title}</p>
                              <p className="text-xs text-stone-300/70">Due in {bill.dueInDays} days</p>
                            </div>
                            <p className="text-sm font-semibold text-amber-100">{formatCurrency(bill.amount)}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-stone-300/75">No bills are due in the next week.</p>
                    )}
                  </article>
                </div>
              </div>
            </article>
          ) : null}

          {activePanel === "local" ? (
            <article className={panelClass(activePanel === "local")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={microLabelClass()}>Local</p>
                  <h2 className="mt-2 text-2xl font-semibold text-amber-50">Local signals</h2>
                </div>
                <Link href="/jobs" className="text-sm font-semibold text-amber-200 transition hover:text-amber-100">
                  Open job details
                </Link>
              </div>

              <form className="mt-4" onSubmit={handleLocationSubmit}>
                <fieldset
                  disabled={!isInteractiveReady || isSubmittingLocation}
                  className="grid gap-3 border-0 p-0"
                >
                  <label className="grid gap-2 text-sm font-medium text-stone-100">
                  City
                  <input
                    value={locationForm.city}
                    onChange={(event) =>
                      setLocationForm((current) => ({ ...current, city: event.target.value }))
                    }
                    className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                    placeholder="Austin"
                  />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-stone-100">
                    State
                    <input
                      value={locationForm.stateCode}
                      onChange={(event) =>
                        setLocationForm((current) => ({ ...current, stateCode: event.target.value.toUpperCase() }))
                      }
                      className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                      placeholder="TX"
                    />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-stone-100">
                    Country
                    <select
                      value={locationForm.countryCode}
                      onChange={(event) =>
                        setLocationForm((current) => ({ ...current, countryCode: event.target.value }))
                      }
                      className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                    </label>
                  </div>
                  <label className="flex items-start gap-3 rounded-[22px] border border-amber-100/10 bg-black/18 px-4 py-3 text-sm text-stone-100">
                    <input
                      type="checkbox"
                      checked={locationForm.consented}
                      onChange={(event) =>
                        setLocationForm((current) => ({ ...current, consented: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-amber-300/40 bg-black/20"
                    />
                    <span>Store only city and state for local relevance.</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-full border border-amber-300/60 bg-amber-200/15 px-5 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/22 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingLocation ? "Saving home area..." : "Save home area"}
                    </button>
                    {locationState.message ? (
                      <p
                        className={[
                          "text-sm",
                          locationState.status === "error" ? "text-rose-300" : "text-emerald-300",
                        ].join(" ")}
                      >
                        {locationState.message}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              </form>

              <div className="mt-5 grid gap-3">
                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Match signals</p>
                  <h3 className="mt-2 text-lg font-semibold text-stone-50">Job preference signals</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-200/75">
                    Matches only use the roles, licenses, certifications, and care-work interests you explicitly save here.
                  </p>

                  <form className="mt-4" onSubmit={handleJobPreferenceSubmit}>
                    <fieldset
                      disabled={!isInteractiveReady || isSubmittingJobPreferences}
                      className="grid gap-3 border-0 p-0"
                    >
                      <label className="grid gap-2 text-sm font-medium text-stone-100">
                      Requested roles
                      <input
                        value={jobPreferenceForm.roleInterests}
                        onChange={(event) =>
                          setJobPreferenceForm((current) => ({ ...current, roleInterests: event.target.value }))
                        }
                        className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                        placeholder="bookkeeping, nurse, dog walker"
                      />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-stone-100">
                      Certifications
                      <input
                        value={jobPreferenceForm.certifications}
                        onChange={(event) =>
                          setJobPreferenceForm((current) => ({ ...current, certifications: event.target.value }))
                        }
                        className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                        placeholder="RN, CPR"
                      />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-stone-100">
                      License types
                      <input
                        value={jobPreferenceForm.licenseTypes}
                        onChange={(event) =>
                          setJobPreferenceForm((current) => ({ ...current, licenseTypes: event.target.value }))
                        }
                        className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                        placeholder="registered_nurse, state_teaching_license"
                      />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([
                          ["careWorkInterest", "General care work"],
                          ["childCareInterest", "Childcare"],
                          ["petCareInterest", "Pet care"],
                          ["nursingInterest", "Nursing"],
                          ["teachingInterest", "Teaching"],
                          ["notificationEnabled", "Keep job notifications on"],
                        ] as const).map(([key, label]) => (
                          <label
                            key={key}
                            className="flex items-start gap-3 rounded-[22px] border border-amber-100/10 bg-black/18 px-4 py-3 text-sm text-stone-100"
                          >
                            <input
                              type="checkbox"
                              checked={jobPreferenceForm[key]}
                              onChange={(event) =>
                                setJobPreferenceForm((current) => ({ ...current, [key]: event.target.checked }))
                              }
                              className="mt-1 h-4 w-4 rounded border-amber-300/40 bg-black/20"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          className="rounded-full border border-amber-300/60 bg-amber-200/15 px-5 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/22 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmittingJobPreferences ? "Saving job signals..." : "Save job signals"}
                        </button>
                        {jobPreferenceState.message ? (
                          <p
                            className={[
                              "text-sm",
                              jobPreferenceState.status === "error" ? "text-rose-300" : "text-emerald-300",
                            ].join(" ")}
                          >
                            {jobPreferenceState.message}
                          </p>
                        ) : null}
                      </div>
                    </fieldset>
                  </form>
                </article>

                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={microLabelClass()}>Official search</p>
                      <p className="mt-2 text-sm leading-6 text-stone-200/80">
                        Use your saved area for official job routing instead of stale copied listings.
                      </p>
                    </div>
                    <Link
                      href={data.localSignals.officialJobSearchHref}
                      className="rounded-full border border-amber-100/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10"
                    >
                      Open official job search
                    </Link>
                  </div>
                </article>

                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Matched jobs</p>
                  <ul className="mt-3 grid gap-3">
                    {data.localSignals.jobMatches.slice(0, 2).map((job) => (
                      <li key={job.slug} className="rounded-[20px] border border-amber-100/10 bg-black/18 p-3">
                        <p className="text-sm font-semibold text-stone-50">{job.title}</p>
                        <p className="mt-1 text-xs text-stone-300/70">{job.company} · {job.location}</p>
                        <p className="mt-2 text-sm text-stone-200/75">{job.reasons[0]}</p>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-[22px] border border-amber-100/10 bg-black/18 p-4">
                  <p className={microLabelClass()}>Finance headlines</p>
                  <ul className="mt-3 grid gap-2">
                    {data.localSignals.financeHeadlines.map((headline) => (
                      <li key={headline.id} className="rounded-2xl border border-amber-100/10 bg-black/18 px-3 py-2 text-sm text-stone-100">
                        {headline.title}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </article>
          ) : null}

          {activePanel === "privacy" ? (
            <article className={panelClass(activePanel === "privacy")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={microLabelClass()}>Privacy</p>
                  <h2 className="mt-2 text-2xl font-semibold text-amber-50">Privacy promise</h2>
                </div>
                <Link href="/settings/integrations" className="text-sm font-semibold text-amber-200 transition hover:text-amber-100">
                  Open official docs
                </Link>
              </div>

              <ul className="mt-4 grid gap-2">
                {data.privacyCommitments.map((item) => (
                  <li key={item} className="rounded-[20px] border border-amber-100/10 bg-black/18 px-4 py-3 text-sm leading-6 text-stone-100">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-3xl border border-amber-100/10 bg-black/18 p-4">
                <p className={microLabelClass()}>Personalization</p>
                <h3 className="mt-2 text-xl font-semibold text-stone-50">Personalization</h3>
                <p className="mt-2 text-sm leading-6 text-stone-200/75">
                  Tone and reminders can adapt to what you explicitly choose. Nothing is sold or shared.
                </p>

                <form className="mt-4" onSubmit={handlePrivacySubmit}>
                  <fieldset
                    disabled={!isInteractiveReady || isSubmittingPrivacy}
                    className="grid gap-3 border-0 p-0"
                  >
                    <label className="grid gap-2 text-sm font-medium text-stone-100">
                    Gender identity
                    <select
                      value={privacyForm.genderIdentity}
                      onChange={(event) =>
                        setPrivacyForm((current) => ({ ...current, genderIdentity: event.target.value }))
                      }
                      className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                    >
                      <option value="woman">Woman</option>
                      <option value="man">Man</option>
                      <option value="nonbinary">Nonbinary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-stone-100">
                    Pronouns
                    <select
                      value={privacyForm.pronouns}
                      onChange={(event) =>
                        setPrivacyForm((current) => ({ ...current, pronouns: event.target.value }))
                      }
                      className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                    >
                      <option value="she_her">She / her</option>
                      <option value="he_him">He / him</option>
                      <option value="they_them">They / them</option>
                      <option value="name_only">Name only</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-stone-100">
                      Communication style
                      <select
                        value={privacyForm.communicationStyle}
                        onChange={(event) =>
                          setPrivacyForm((current) => ({ ...current, communicationStyle: event.target.value }))
                        }
                        className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                      >
                        <option value="gentle">Gentle</option>
                        <option value="balanced">Balanced</option>
                        <option value="direct">Direct</option>
                      </select>
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-stone-100">
                      Coaching intensity
                      <select
                        value={privacyForm.coachingIntensity}
                        onChange={(event) =>
                          setPrivacyForm((current) => ({ ...current, coachingIntensity: event.target.value }))
                        }
                        className="rounded-2xl border border-amber-100/15 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="focused">Focused</option>
                        <option value="deep">Deep</option>
                      </select>
                      </label>
                    </div>
                    <label className="flex items-start gap-3 rounded-[22px] border border-amber-100/10 bg-black/18 px-4 py-3 text-sm text-stone-100">
                      <input
                        type="checkbox"
                        checked={privacyForm.consented}
                        onChange={(event) =>
                          setPrivacyForm((current) => ({ ...current, consented: event.target.checked }))
                        }
                        className="mt-1 h-4 w-4 rounded border-amber-300/40 bg-black/20"
                      />
                      <span>Keep personalization user-only and never for marketing.</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="rounded-full border border-amber-300/60 bg-amber-200/15 px-5 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/22 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingPrivacy ? "Saving privacy settings..." : "Save privacy settings"}
                      </button>
                      {privacyState.message ? (
                        <p
                          className={[
                            "text-sm",
                            privacyState.status === "error" ? "text-rose-300" : "text-emerald-300",
                          ].join(" ")}
                        >
                          {privacyState.message}
                        </p>
                      ) : null}
                    </div>
                  </fieldset>
                </form>

                <div className="mt-4 rounded-[20px] border border-amber-100/10 bg-black/18 px-4 py-3 text-sm text-stone-200/80">
                  Current tone: {formatTokenLabel(data.personalization.profile?.communicationStyle ?? null)} · Pronouns: {formatPronounLabel(data.personalization.profile?.pronouns ?? null)}
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}