import { render, screen } from "@testing-library/react";
import StartSmartPage from "./page";

describe("StartSmartPage", () => {
  it("renders the compact onboarding headline and first-step controls", () => {
    render(<StartSmartPage />);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(
      screen.getByText("Build a fixed-screen survival answer in four compact panels."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Single teen").length).toBeGreaterThan(0);
    expect(screen.getByText("Panel deck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set home base/i })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^country$/i })).not.toBeInTheDocument();
  });
});
