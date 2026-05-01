import { render, screen, within } from "@testing-library/react";
import { HOME_LOCATION_STORAGE_KEY } from "@/modules/home-location/home-location";
import JobsPage from "./page";

describe("JobsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("wraps the jobs hub in the reusable mobile panel frame", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
  });

  it("renders the jobs hub with route-board lanes and recommended listings", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("Quick job routes for real-life pressure.")).toBeInTheDocument();
    expect(screen.getByText("Scan by relief type, then open the full brief.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick route board" })).toBeInTheDocument();
    expect(screen.getByText("Career pivot lane")).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
    expect(screen.getByText("Steady routine lane")).toBeInTheDocument();
    expect(screen.getByText("Cleaner systems experience with room to move up.")).toBeInTheDocument();
    expect(screen.getByText("Faster pay bumps and low-friction extra income.")).toBeInTheDocument();
    expect(screen.getByText("Predictable hours with fewer schedule swings.")).toBeInTheDocument();
    expect(screen.getByText("Relief routes live.")).toBeInTheDocument();
    expect(screen.getByText("Remote-first.")).toBeInTheDocument();
    expect(screen.getByText("Top live salary.")).toBeInTheDocument();
    expect(screen.getByText("Board preference")).toBeInTheDocument();
    expect(screen.getByText("Remote Customer Support Specialist")).toBeInTheDocument();
  });

  it("renders the compact filter summary and explicit job-card cues", async () => {
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "SG", stateCode: "01" }),
    );

    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Route brief")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compact board cues" })).toBeInTheDocument();
    expect(screen.getByText("Preferred workplace")).toBeInTheDocument();
    expect(screen.getAllByText("remote").length).toBeGreaterThan(0);
    expect(screen.getByText("Pay target")).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(screen.getByText("Lane count")).toBeInTheDocument();
    expect(screen.getByText("3 lanes")).toBeInTheDocument();
    expect(screen.getByText("Priority fit")).toBeInTheDocument();
    expect(screen.getAllByText("raise income fast").length).toBeGreaterThan(0);
    expect(screen.getAllByText("stabilize schedule").length).toBeGreaterThan(0);
    expect(screen.getByText("Saved home base")).toBeInTheDocument();
    expect(screen.getByText("01, Singapore")).toBeInTheDocument();
    expect(screen.getByText("Recommended matches")).toBeInTheDocument();
    expect(screen.getByText("5 recommended matches")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open setup wizard/i })).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Keep the board tight: remote-first, salary-floor guarded, and matched to the two most urgent blueprint goals.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Steady remote support role with a solid base salary and clear hours."),
    ).not.toBeInTheDocument();

    const remoteSupportCard = screen
      .getByText("Remote Customer Support Specialist")
      .closest("article");

    expect(remoteSupportCard).not.toBeNull();
    expect(within(remoteSupportCard as HTMLElement).getByText("daytime")).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByText(/remote\s*·\s*full time/i),
    ).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByText("Posted 4 days ago"),
    ).toBeInTheDocument();
    expect(within(remoteSupportCard as HTMLElement).getByText("Best for")).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByRole("link", {
        name: /open job details/i,
      }),
    ).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  });
});
