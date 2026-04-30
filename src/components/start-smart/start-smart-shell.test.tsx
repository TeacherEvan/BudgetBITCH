import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HOME_LOCATION_STORAGE_KEY,
  readStoredHomeLocation,
} from "@/modules/home-location/home-location";
import { StartSmartShell } from "./start-smart-shell";

describe("StartSmartShell", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("hydrates the regional fields from the shared home-location store", () => {
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "TH", stateCode: "10" }),
    );

    render(<StartSmartShell />);
    fireEvent.click(screen.getByRole("button", { name: /set home base/i }));

    expect(screen.getByRole("combobox", { name: /^country$/i })).toHaveValue("TH");
    expect(screen.getByLabelText(/state or region/i)).toHaveValue("10");
    expect(screen.getAllByText("10, Thailand").length).toBeGreaterThan(0);
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
    fireEvent.change(screen.getByRole("combobox", { name: /^country$/i }), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/state/i), {
      target: { value: "CA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /open money snapshot/i }));
    fireEvent.click(screen.getByRole("button", { name: /build my survival blueprint/i }));

    expect(await screen.findByText("Build starter emergency buffer")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getAllByText("Survival Plan").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(readStoredHomeLocation()).toEqual({
        countryCode: "US",
        stateCode: "CA",
      }),
    );
  });

  it("shows field-level validation and blocks submit when regional codes are invalid", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<StartSmartShell />);

    fireEvent.click(screen.getByRole("button", { name: /set home base/i }));
    fireEvent.click(screen.getByRole("button", { name: /open money snapshot/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fix the highlighted fields to continue.",
    );
    expect(screen.getByText("Enter a valid 2-letter country code.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid 2- or 3-character state or region code."),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^country$/i })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/state or region/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resets the region code to a supported example when the country changes", () => {
    render(<StartSmartShell />);

    fireEvent.click(screen.getByRole("button", { name: /set home base/i }));

    fireEvent.change(screen.getByLabelText(/^country$/i), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/state or region/i), {
      target: { value: "CA" },
    });

    fireEvent.change(screen.getByLabelText(/^country$/i), {
      target: { value: "SG" },
    });

    expect(screen.getByLabelText(/state or region/i)).toHaveValue("01");
  });
});
