import { render, screen } from "@testing-library/react";
import StartSmartPage from "./page";

describe("StartSmartPage", () => {
  it("renders the onboarding headline and first-step controls", () => {
    render(<StartSmartPage />);

    expect(screen.getByText("Choose your chaos. Build your control.")).toBeInTheDocument();
    expect(screen.getByText("Single teen")).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /build my survival blueprint/i }),
    ).toBeInTheDocument();
  });
});
