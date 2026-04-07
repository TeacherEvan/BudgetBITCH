import { render, screen, within } from "@testing-library/react";
import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders the jobs hub with practical filters and recommended listings", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(
      screen.getByText("Income options that match real-life pressure."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
  });

  it("renders the filter contract and recommended job details", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Practical filters")).toBeInTheDocument();
    expect(screen.getByText("Workplace")).toBeInTheDocument();
    expect(screen.getByText("remote")).toBeInTheDocument();
    expect(screen.getByText("Salary floor")).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(screen.getByText("raise income fast")).toBeInTheDocument();
    expect(screen.getByText("stabilize schedule")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recommended jobs" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Northstar")).toBeInTheDocument();
    expect(screen.getByText("$48k-$62k")).toBeInTheDocument();

    const remoteSupportCard = screen
      .getByText("Remote Customer Support Specialist")
      .closest("article");

    expect(remoteSupportCard).not.toBeNull();
    expect(
      within(remoteSupportCard as HTMLElement).getByRole("link", {
        name: "Open job",
      }),
    ).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  });
});
