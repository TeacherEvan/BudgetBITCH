import { render, screen, within } from "@testing-library/react";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  it("renders denser job metadata, fit chips, and an open-job link", () => {
    render(
      <JobCard
        job={{
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          location: "Remote",
          salaryLabel: "$48k-$62k",
          fitSummary: "Strong fit to raise income fast and stabilize schedule.",
          summary: "Steady remote support role with a solid base salary and clear hours.",
          workplace: "remote",
          schedule: "daytime",
          fitSignals: ["raise_income_fast", "stabilize_schedule", "no_degree_pathway"],
        }}
      />,
    );

    const card = screen.getByText("Remote Customer Support Specialist").closest("article");

    expect(card).not.toBeNull();
    expect(
      screen.getByText("Steady remote support role with a solid base salary and clear hours."),
    ).toBeInTheDocument();
    expect(screen.getByText("daytime")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("no degree pathway")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open job/i })).toBeInTheDocument();
  });
});
