import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DailyCheckInCard } from "./daily-check-in-card";

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

    expect(screen.getByRole("heading", { name: /submit today's check-in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/planned spend for today/i)).toHaveValue(42);
    expect(screen.getByText("Today is still inside the plan.")).toBeInTheDocument();
    expect(screen.getByText("Submitted today")).toBeInTheDocument();
    expect(screen.getByText("$42.00")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /submit today's check-in/i }));

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

    expect(screen.getByRole("button", { name: /submit today's check-in/i })).toBeDisabled();
    expect(
      screen.getByText(/live check-in submission needs an authenticated workspace membership\./i),
    ).toBeInTheDocument();
  });
});
