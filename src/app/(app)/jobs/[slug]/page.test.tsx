import { render, screen } from "@testing-library/react";
import JobDetailPage from "./page";

describe("JobDetailPage", () => {
  it("renders the job details and fit impact summary", async () => {
    const view = await JobDetailPage({
      params: Promise.resolve({ slug: "remote-customer-support-specialist" }),
    });

    render(view);

    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
    expect(screen.getByText("Why this fits")).toBeInTheDocument();
    expect(screen.getByText("Salary range")).toBeInTheDocument();
  });
});
