import { render, screen, within } from "@testing-library/react";
import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders the jobs hub with route-board lanes and recommended listings", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("Quick job routes for real-life pressure.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick route board" })).toBeInTheDocument();
    expect(screen.getByText("Career pivot lane")).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
    expect(screen.getByText("Steady routine lane")).toBeInTheDocument();
    expect(screen.getByText("Remote Customer Support Specialist")).toBeInTheDocument();
  });

  it("renders the compact filter summary and denser job details", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Route brief")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compact filter summary" })).toBeInTheDocument();
    expect(screen.getByText("Workplace")).toBeInTheDocument();
    expect(screen.getAllByText("remote").length).toBeGreaterThan(0);
    expect(screen.getByText("Salary floor")).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(screen.getAllByText("raise income fast").length).toBeGreaterThan(0);
    expect(screen.getAllByText("stabilize schedule").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Steady remote support role with a solid base salary and clear hours."),
    ).toBeInTheDocument();

    const remoteSupportCard = screen
      .getByText("Remote Customer Support Specialist")
      .closest("article");

    expect(remoteSupportCard).not.toBeNull();
    expect(within(remoteSupportCard as HTMLElement).getByText("daytime")).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByRole("link", {
        name: /open job/i,
      }),
    ).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  });
});
