import { render, screen } from "@testing-library/react";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  it("renders job basics and an open-job link", () => {
    render(
      <JobCard
        job={{
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          location: "Remote",
          salaryLabel: "$48k-$62k",
          fitSummary: "Good fit to stabilize schedule and raise income fast.",
        }}
      />,
    );

    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open job/i })).toBeInTheDocument();
  });
});
