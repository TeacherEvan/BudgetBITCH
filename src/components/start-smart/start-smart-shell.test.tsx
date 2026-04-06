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
            housing: { confidence: "verified" },
          },
        }),
      }),
    );

    render(<StartSmartShell />);

    fireEvent.click(screen.getByRole("button", { name: /young adult/i }));
    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/state/i), {
      target: { value: "CA" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /build my survival blueprint/i }),
    );

    expect(await screen.findByText("Build starter emergency buffer")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
  });
});
