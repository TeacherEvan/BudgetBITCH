import { render, screen, within } from "@testing-library/react";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  it("renders explicit metadata, fit cues, and an open-job-details link", () => {
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
          jobType: "full_time",
          postingAgeDays: 4,
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
    expect(screen.getByText("full time")).toBeInTheDocument();
    expect(screen.getByText("Posted 4 days ago")).toBeInTheDocument();
    expect(screen.getByText("Why this fits")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("no degree pathway")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open job details/i })).toHaveAttribute(
      "href",
      "/jobs/remote-customer-support-specialist",
    );
  });


  it("renders singular posting age copy for one-day-old jobs", () => {
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
          jobType: "full_time",
          postingAgeDays: 1,
          fitSignals: ["raise_income_fast", "stabilize_schedule", "no_degree_pathway"],
        }}
      />,
    );

    expect(screen.getByText("Posted 1 day ago")).toBeInTheDocument();
  });

  it("renders same-day postings as posted today", () => {
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
          jobType: "full_time",
          postingAgeDays: 0,
          fitSignals: ["raise_income_fast", "stabilize_schedule", "no_degree_pathway"],
        }}
      />,
    );

    expect(screen.getByText("Posted today")).toBeInTheDocument();
  });
});
