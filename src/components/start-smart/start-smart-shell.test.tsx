import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
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

  it("renders one concise heading and only two compact status cards above the active panel", () => {
    render(<StartSmartShell />);

    const shellHeading = screen.getByRole("heading", {
      level: 1,
      name: "Build your first survival answer",
    });
    const header = shellHeading.closest("header");

    expect(shellHeading).toBeInTheDocument();
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText("Selected template")).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText("Active panel")).toBeInTheDocument();
    expect(within(header as HTMLElement).queryByText("Shared home base")).not.toBeInTheDocument();
    expect(within(header as HTMLElement).queryByText("Household snapshot")).not.toBeInTheDocument();
  });

  it("shows short panel deck cues and a compact panel counter in the footer", () => {
    render(<StartSmartShell />);

    const footer = screen.getByRole("button", { name: /back panel/i }).parentElement;

    expect(screen.getByText("Pick the closest route.")).toBeInTheDocument();
    expect(screen.getByText("Save your region once.")).toBeInTheDocument();
    expect(screen.getByText("Keep the essentials only.")).toBeInTheDocument();
    expect(screen.getByText("Review the first moves.")).toBeInTheDocument();
    expect(footer).not.toBeNull();
    expect(within(footer as HTMLElement).getByText("Panel 1 of 4")).toBeInTheDocument();
    expect(
      screen.queryByText("Choose the starting route that matches the current pressure."),
    ).not.toBeInTheDocument();
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

  it("hydrates the regional fields after an SSR render", async () => {
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "TH", stateCode: "10" }),
    );

    const container = document.createElement("div");
    container.innerHTML = renderToString(<StartSmartShell />);
    document.body.appendChild(container);

    let root: ReturnType<typeof hydrateRoot>;

    await act(async () => {
      root = hydrateRoot(container, <StartSmartShell />);
    });

    fireEvent.click(screen.getByRole("button", { name: /set home base/i }));

    expect(screen.getByRole("combobox", { name: /^country$/i })).toHaveValue("TH");
    expect(screen.getByLabelText(/state or region/i)).toHaveValue("10");

    await act(async () => {
      root.unmount();
    });

    container.remove();
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
    expect(
      within(screen.getByRole("button", { name: /back panel/i }).parentElement as HTMLElement).getByText(
        "Panel 4 of 4",
      ),
    ).toBeInTheDocument();
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

  it("resets the region code to a supported example when the country changes", async () => {
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

    await act(async () => {});

    expect(screen.getByLabelText(/state or region/i)).toHaveValue("01");
  });
});
