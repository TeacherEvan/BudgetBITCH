import { render, screen, within } from "@testing-library/react";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  it("renders scan-first job facts, a short fit cue, and an explicit details link", () => {
    render(
      <JobCard
        job={{
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          location: "Remote",
          salaryLabel: "$48k-$62k",
          hasSpecificFitCue: true,
          fitSummary: "Strong fit to raise income fast and stabilize schedule.",
          summary: "Steady remote support role with a solid base salary and clear hours.",
          workplace: "remote",
          schedule: "daytime",
          jobType: "full_time",
          postingAgeDays: 4,
          fitSignals: [
            "raise_income_fast",
            "stabilize_schedule",
            "no_degree_pathway",
            "caregiving_friendly",
          ],
        }}
      />,
    );

    const card = screen.getByText("Remote Customer Support Specialist").closest("article");

    expect(card).not.toBeNull();
    expect(screen.getByText("Northstar")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("$48k-$62k")).toBeInTheDocument();
    expect(screen.getByText("daytime")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText(/remote\s*·\s*full time/i)).toBeInTheDocument();
    expect(screen.getByText("Posted 4 days ago")).toBeInTheDocument();
    expect(screen.getByText("Best for")).toBeInTheDocument();
    expect(
      screen.getByText("Strong fit to raise income fast and stabilize schedule."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Steady remote support role with a solid base salary and clear hours."),
    ).not.toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("raise income fast")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("stabilize schedule")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("no degree pathway")).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText("caregiving friendly")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open job details/i })).toHaveAttribute(
      "href",
      "/jobs/remote-customer-support-specialist",
    );
  });

  it("falls back to a short role summary when fit scoring stays generic", () => {
    render(
      <JobCard
        job={{
          slug: "weekend-bookkeeping-assistant",
          title: "Weekend Bookkeeping Assistant",
          company: "Pine & Paper",
          location: "Remote",
          salaryLabel: "$24k-$32k",
          hasSpecificFitCue: false,
          fitSummary: "Strong fit based on your blueprint.",
          summary: "Part-time remote work suited for second-income support and bookkeeping exposure.",
          workplace: "remote",
          schedule: "weekend",
          jobType: "part_time",
          postingAgeDays: 8,
          fitSignals: ["second_job_friendly", "flexible_hours", "no_degree_pathway"],
        }}
      />,
    );

    expect(
      screen.getByText((content) =>
        content.startsWith("Part-time remote work suited for second-income support"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Strong fit based on your blueprint.")).not.toBeInTheDocument();
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
          hasSpecificFitCue: true,
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
          hasSpecificFitCue: true,
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
