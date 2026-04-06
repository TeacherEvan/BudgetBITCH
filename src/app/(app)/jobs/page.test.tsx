import { render, screen } from "@testing-library/react";
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
});
