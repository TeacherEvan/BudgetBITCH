"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type { DashboardDailyCheckInState } from "@/modules/dashboard/dashboard-data";

type DailyCheckInCardProps = {
  canSubmit: boolean;
  initialCheckIn: DashboardDailyCheckInState;
  workspaceId: string | null;
  workspaceName: string | null;
};

type DailyCheckInSubmissionResponse = {
  headline: string;
  summary?: {
    cashflow?: {
      netCashflow?: number;
      plannedOutflow?: number;
      status?: "positive" | "negative";
    };
    alertCount?: number;
  };
  alerts?: Array<{
    message: string;
    severity: "warning" | "critical";
    title: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatCheckInDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatSubmittedAt(value: string | null) {
  if (!value) {
    return "No check-in submitted yet.";
  }

  return `Last submitted ${new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}.`;
}

export function DailyCheckInCard({
  canSubmit,
  initialCheckIn,
  workspaceId,
  workspaceName,
}: DailyCheckInCardProps) {
  const [plannedSpendInput, setPlannedSpendInput] = useState(
    initialCheckIn.plannedSpend?.toString() ?? "",
  );
  const [checkInState, setCheckInState] = useState(initialCheckIn);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusLabel = useMemo(() => {
    if (!canSubmit) {
      return "Live submission unavailable";
    }

    if (isSubmitting) {
      return "Submitting";
    }

    return checkInState.status === "submitted" ? "Submitted today" : "Ready to submit";
  }, [canSubmit, checkInState.status, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !workspaceId) {
      return;
    }

    const plannedSpend = Number(plannedSpendInput);

    if (!Number.isFinite(plannedSpend) || plannedSpend < 0) {
      setErrorMessage("Enter a non-negative planned spend before submitting today’s check-in.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/check-ins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          checkInDate: checkInState.checkInDate,
          plannedSpend,
          categorySpending: [],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to submit today’s check-in right now.");
      }

      const payload = (await response.json()) as DailyCheckInSubmissionResponse;
      setCheckInState({
        status: "submitted",
        checkInDate: checkInState.checkInDate,
        headline: payload.headline,
        plannedSpend:
          typeof payload.summary?.cashflow?.plannedOutflow === "number"
            ? payload.summary.cashflow.plannedOutflow
            : plannedSpend,
        alertCount:
          typeof payload.summary?.alertCount === "number"
            ? payload.summary.alertCount
            : payload.alerts?.length ?? 0,
        alerts: payload.alerts ?? [],
        cashStatus: payload.summary?.cashflow?.status ?? null,
        netCashflow:
          typeof payload.summary?.cashflow?.netCashflow === "number"
            ? payload.summary.cashflow.netCashflow
            : null,
        lastSubmittedAt: new Date().toISOString(),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit today’s check-in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bb-panel bb-panel-muted p-6" aria-labelledby="daily-check-in-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="bb-kicker">Daily check-in</p>
          <h2 id="daily-check-in-heading" className="mt-3 text-3xl font-semibold">
            Submit today&apos;s check-in
          </h2>
          <p className="bb-mini-copy mt-3 max-w-2xl">
            Use one planned-spend number to refresh today&apos;s board for {workspaceName ?? "this workspace"}.
          </p>
        </div>
        <span className="bb-status-pill">{statusLabel}</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <form className="bb-cluster" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="dashboard-planned-spend"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-50/75"
            >
              Planned spend for today
            </label>
            <input
              id="dashboard-planned-spend"
              name="plannedSpend"
              type="number"
              min="0"
              step="0.01"
              value={plannedSpendInput}
              onChange={(event) => setPlannedSpendInput(event.target.value)}
              disabled={!canSubmit || isSubmitting}
              className="mt-3 w-full rounded-[1.2rem] border border-[color:var(--border-soft)] bg-black/20 px-4 py-3 text-base text-white outline-none transition focus:border-[color:var(--border-strong)]"
              placeholder="0.00"
            />
            <p className="bb-mini-copy mt-3">
              Date locked to {formatCheckInDate(checkInState.checkInDate)} for {workspaceName ?? "this workspace"}.
            </p>
          </div>

          {!canSubmit ? (
            <p className="bb-mini-copy rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
              Live check-in submission needs an authenticated workspace membership.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-[1.2rem] border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" className="bb-button-primary" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting check-in
              </>
            ) : (
              "Submit today's check-in"
            )}
          </button>
        </form>

        <div className="grid gap-3">
          <article className="bb-compact-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-white">
                  {checkInState.headline ?? "No check-in submitted for this workspace yet."}
                </span>
                <p className="bb-mini-copy mt-2">{formatSubmittedAt(checkInState.lastSubmittedAt)}</p>
              </div>
              {checkInState.status === "submitted" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-(--accent-strong)" aria-hidden="true" />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="bb-mini-copy">Planned spend</p>
                <span className="bb-metric-value">{formatCurrency(checkInState.plannedSpend)}</span>
              </div>
              <div>
                <p className="bb-mini-copy">Open alerts</p>
                <span className="bb-metric-value">{checkInState.alertCount}</span>
              </div>
              <div>
                <p className="bb-mini-copy">Net cash after plan</p>
                <span className="bb-metric-value">{formatCurrency(checkInState.netCashflow)}</span>
                {checkInState.cashStatus ? (
                  <span className="bb-mini-copy mt-1 block capitalize">{checkInState.cashStatus}</span>
                ) : null}
              </div>
            </div>
          </article>

          {checkInState.alerts.length > 0 ? (
            checkInState.alerts.map((alert) => (
              <article key={`${alert.severity}-${alert.title}`} className="bb-compact-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-white">{alert.title}</span>
                    <p className="bb-mini-copy mt-2">{alert.message}</p>
                  </div>
                  <span className="bb-status-pill">{alert.severity}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="bb-compact-card">
              <span className="font-semibold text-white">No open alerts from today&apos;s check-in.</span>
              <p className="bb-mini-copy mt-2">
                Submit the next check-in whenever this workspace needs a fresh read.
              </p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
