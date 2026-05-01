"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

class DailyCheckInSubmitError extends Error {}

function formatCurrency(value: number | null, locale: string) {
  return value === null
    ? "—"
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(value);
}

function formatCheckInDate(value: string, locale: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatSubmittedAt(value: string | null, locale: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DailyCheckInCard({
  canSubmit,
  initialCheckIn,
  workspaceId,
  workspaceName,
}: DailyCheckInCardProps) {
  const locale = useLocale();
  const t = useTranslations("dailyCheckIn");
  const [plannedSpendInput, setPlannedSpendInput] = useState(
    initialCheckIn.plannedSpend?.toString() ?? "",
  );
  const [checkInState, setCheckInState] = useState(initialCheckIn);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusLabel = useMemo(() => {
    if (!canSubmit) {
      return t("liveSubmissionUnavailable");
    }

    if (isSubmitting) {
      return t("submitting");
    }

    return checkInState.status === "submitted" ? t("submittedToday") : t("readyToSubmit");
  }, [canSubmit, checkInState.status, isSubmitting, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !workspaceId) {
      return;
    }

    if (plannedSpendInput.trim() === "") {
      setErrorMessage(t("validationError"));
      return;
    }

    const plannedSpend = Number(plannedSpendInput);

    if (!Number.isFinite(plannedSpend) || plannedSpend < 0) {
      setErrorMessage(t("validationError"));
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
        throw new DailyCheckInSubmitError(payload?.error ?? t("submitError"));
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
        error instanceof DailyCheckInSubmitError ? error.message : t("submitError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const resolvedWorkspaceName = workspaceName ?? t("workspaceFallback");
  const submittedAtLabel = formatSubmittedAt(checkInState.lastSubmittedAt, locale);

  return (
    <section className="bb-panel bb-panel-muted p-6" aria-labelledby="daily-check-in-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="bb-kicker">{t("kicker")}</p>
          <h2 id="daily-check-in-heading" className="mt-3 text-3xl font-semibold">
            {t("title")}
          </h2>
          <p className="bb-helper-copy mt-3 max-w-2xl">
            {t("description", { workspaceName: resolvedWorkspaceName })}
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
              {t("plannedSpendLabel")}
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
              {t("lockedDate", {
                dateLabel: formatCheckInDate(checkInState.checkInDate, locale),
                workspaceName: resolvedWorkspaceName,
              })}
            </p>
          </div>

          {!canSubmit ? (
            <p className="bb-mini-copy rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
              {t("disabledHint")}
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
                {t("submittingButton")}
              </>
            ) : (
              t("submitButton")
            )}
          </button>
        </form>

        <div className="grid gap-3">
          <article className="bb-compact-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-white">
                  {checkInState.headline ?? t("emptyHeadline")}
                </span>
                <p className="bb-mini-copy mt-2">
                  {submittedAtLabel
                    ? t("submittedAt", { submittedAt: submittedAtLabel })
                    : t("noCheckInYet")}
                </p>
              </div>
              {checkInState.status === "submitted" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-(--accent-strong)" aria-hidden="true" />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="bb-mini-copy">{t("plannedSpendMetric")}</p>
                <span className="bb-metric-value">{formatCurrency(checkInState.plannedSpend, locale)}</span>
              </div>
              <div>
                <p className="bb-mini-copy">{t("openAlertsMetric")}</p>
                <span className="bb-metric-value">{checkInState.alertCount}</span>
              </div>
              <div>
                <p className="bb-mini-copy">{t("netCashAfterPlanMetric")}</p>
                <span className="bb-metric-value">{formatCurrency(checkInState.netCashflow, locale)}</span>
                {checkInState.cashStatus ? (
                  <span className="bb-mini-copy mt-1 block">{t(`cashStatus.${checkInState.cashStatus}`)}</span>
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
                  <span className="bb-status-pill">{t(`severity.${alert.severity}`)}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="bb-compact-card">
              <span className="font-semibold text-white">{t("emptyAlertsTitle")}</span>
              <p className="bb-mini-copy mt-2">{t("emptyAlertsDescription")}</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
