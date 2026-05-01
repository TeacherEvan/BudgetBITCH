import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

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
    expect(screen.getByText("Northstar · Remote")).toBeInTheDocument();
    expect(screen.getByText("$48k-$62k")).toBeInTheDocument();
    expect(screen.getByText("daytime · remote")).toBeInTheDocument();
    expect(
      screen.getByText("Strong fit to stabilize schedule and raise income fast."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Steady remote support role with a solid base salary and clear hours."),
    ).toBeInTheDocument();
    expect(screen.getByText("Benefits")).toBeInTheDocument();
    expect(screen.getByText("healthcare")).toBeInTheDocument();
    expect(screen.getByText("pto")).toBeInTheDocument();
    expect(screen.getByText("remote stipend")).toBeInTheDocument();
    expect(screen.getByText("raise income fast")).toBeInTheDocument();
    expect(screen.getByText("stabilize schedule")).toBeInTheDocument();
    expect(screen.getByText("no degree pathway")).toBeInTheDocument();
  });

  it("delegates to notFound for an unknown job slug", async () => {
    await expect(
      JobDetailPage({ params: Promise.resolve({ slug: "missing-job" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });
});
