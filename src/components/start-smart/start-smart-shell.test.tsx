import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartSmartShell } from "./start-smart-shell";

describe("StartSmartShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the generated blueprint details after submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          blueprint: {
            priorityStack: ["cover_essentials"],
            riskWarnings: ["income_volatility_risk"],
            next7Days: ["List all fixed bills"],
            next30Days: ["Build starter emergency buffer"],
            learnModuleKeys: ["budgeting_basics"],
            recommendedIntegrations: ["openai"],
          },
          regional: {
            locationKey: "us-ca-los-angeles",
            housing: { confidence: "verified" },
          },
        }),
      }),
    );

    render(<StartSmartShell />);

    fireEvent.click(screen.getByRole("button", { name: /young adult/i }));
    fireEvent.change(screen.getByLabelText(/^Country$/i), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/^Province or state$/i), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByLabelText(/^City$/i), {
      target: { value: "los-angeles" },
    });
    fireEvent.click(screen.getByRole("button", { name: /build my survival blueprint/i }));

    expect(await screen.findByText("Build starter emergency buffer")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getAllByText("Blueprint").length).toBeGreaterThan(0);
  });

  it("shows field-level validation and blocks submit when location selects are empty", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<StartSmartShell />);

    fireEvent.click(screen.getByRole("button", { name: /build my survival blueprint/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fix the highlighted fields to continue.",
    );
    expect(screen.getByText("Select a country.")).toBeInTheDocument();
    expect(screen.getByText("Select a province or state.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Country$/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Province or state$/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
