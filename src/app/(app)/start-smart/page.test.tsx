import { render, screen } from "@testing-library/react";
import StartSmartPage from "./page";

describe("StartSmartPage", () => {
  it("renders the compact onboarding headline and first-step controls", () => {
    render(<StartSmartPage />);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByText("Build your survival blueprint in one quick pass.")).toBeInTheDocument();
    expect(screen.getAllByText("Single teen").length).toBeGreaterThan(0);
    expect(screen.getByText("Step map")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^country$/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /japan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /build my survival blueprint/i })).toBeInTheDocument();
  });
});
