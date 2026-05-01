import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DailyCheckInCard } from "./daily-check-in-card";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      kicker: "Check-in lane",
      title: "Log today's number",
      description: `One number keeps ${values?.workspaceName ?? "this workspace"} aligned.`,
      liveSubmissionUnavailable: "Live entry locked",
      submitting: "Sending",
      submittedToday: "Sent today",
      readyToSubmit: "Ready now",
      plannedSpendLabel: "Planned spend for today",
      lockedDate: `Locked to ${values?.dateLabel ?? "Apr 9, 2026"} for ${values?.workspaceName ?? "this workspace"}.`,
      disabledHint: "Sign in to send live check-ins.",
      validationError: "Enter a non-negative planned spend before sending today's check-in.",
      submitError: "Unable to send today's check-in right now.",
      submitButton: "Send today's check-in",
      submittingButton: "Sending check-in",
      workspaceFallback: "this workspace",
      "cashStatus.positive": "Positive",
      "cashStatus.negative": "Negative",
      "severity.warning": "Warning",
      "severity.critical": "Critical",
      emptyHeadline: "No check-in yet for this workspace.",
      noCheckInYet: "No check-in yet.",
      submittedAt: `Sent ${values?.submittedAt ?? "Apr 9, 9:00 AM"}.`,
      plannedSpendMetric: "Planned spend",
      openAlertsMetric: "Open alerts",
      netCashAfterPlanMetric: "Net cash after plan",
      emptyAlertsTitle: "No alerts yet.",
      emptyAlertsDescription: "Send again when you need a refresh.",
    };

    return translations[key] ?? key;
  },
}));

describe("DailyCheckInCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the current check-in status with explicit action copy", () => {
    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "submitted",
          checkInDate: "2026-04-09",
          headline: "Today is still inside the plan.",
          plannedSpend: 42,
          alertCount: 0,
          alerts: [],
          cashStatus: "positive",
          netCashflow: 310,
          lastSubmittedAt: "2026-04-09T09:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /log today's number/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/planned spend for today/i)).toHaveValue(42);
    expect(screen.getByText(/one number keeps household aligned\./i)).toBeInTheDocument();
    expect(screen.getByText("Today is still inside the plan.")).toBeInTheDocument();
    expect(screen.getByText("Sent today")).toBeInTheDocument();
    expect(screen.getByText("$42.00")).toBeInTheDocument();
    expect(screen.getByText("No alerts yet.")).toBeInTheDocument();
    expect(screen.getByText(/send again when you need a refresh\./i)).toBeInTheDocument();
  });

  it("posts the planned spend and refreshes the card summary", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          headline: "Today needs a closer look.",
          summary: {
            alertCount: 1,
            cashflow: {
              plannedOutflow: 63,
              netCashflow: 125,
              status: "positive",
            },
          },
          alerts: [
            {
              severity: "warning",
              title: "Category close to limit",
              message: "Groceries are close to the monthly limit.",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/planned spend for today/i), {
      target: { value: "63" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send today's check-in/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse((requestInit as RequestInit).body as string);

    expect(body).toEqual({
      workspaceId: "workspace-1",
      checkInDate: "2026-04-09",
      plannedSpend: 63,
      categorySpending: [],
    });

    expect(await screen.findByText("Today needs a closer look.")).toBeInTheDocument();
    expect(screen.getByText("Category close to limit")).toBeInTheDocument();
    expect(screen.getByText("$63.00")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("keeps live submission disabled when no authenticated workspace is available", () => {
    render(
      <DailyCheckInCard
        canSubmit={false}
        workspaceId={null}
        workspaceName={null}
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /send today's check-in/i })).toBeDisabled();
    expect(screen.getByText(/sign in to send live check-ins\./i)).toBeInTheDocument();
  });

  it("shows a validation error for negative planned spend", async () => {
    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/planned spend for today/i), {
      target: { value: "-1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send today's check-in/i }).closest("form")!);

    expect(
      await screen.findByText(/enter a non-negative planned spend before sending today's check-in\./i),
    ).toBeInTheDocument();
  });

  it("shows a validation error when planned spend is left blank", async () => {
    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: /send today's check-in/i }).closest("form")!);

    expect(
      await screen.findByText(/enter a non-negative planned spend before sending today's check-in\./i),
    ).toBeInTheDocument();
  });

  it("shows the server error when submission fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Unable to send today's check-in right now." }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/planned spend for today/i), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send today's check-in/i }));

    expect(
      await screen.findByText(/unable to send today's check-in right now\./i),
    ).toBeInTheDocument();
  });

  it("falls back to the translated submit error when fetch rejects", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Failed to fetch"));

    render(
      <DailyCheckInCard
        canSubmit
        workspaceId="workspace-1"
        workspaceName="Household"
        initialCheckIn={{
          status: "not_started",
          checkInDate: "2026-04-09",
          headline: null,
          plannedSpend: null,
          alertCount: 0,
          alerts: [],
          cashStatus: null,
          netCashflow: null,
          lastSubmittedAt: null,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/planned spend for today/i), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send today's check-in/i }));

    expect(
      await screen.findByText(/unable to send today's check-in right now\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument();
  });
});
