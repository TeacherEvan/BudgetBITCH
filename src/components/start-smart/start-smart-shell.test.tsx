import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartSmartShell } from "./start-smart-shell";

describe("StartSmartShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the generated blueprint details after submit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
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
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<StartSmartShell workspaceId="ws_live_123" />);

    fireEvent.click(screen.getByRole("button", { name: /young adult/i }));
    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/state/i), {
      target: { value: "CA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /build my survival blueprint/i }));

    expect(await screen.findByText("Build starter emergency buffer")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getAllByText("Blueprint").length).toBeGreaterThan(0);

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.body).toBeTypeOf("string");

    const requestBody = JSON.parse(String(requestInit?.body));
    expect(requestBody.workspaceId).toBe("ws_live_123");
  });

  it("shows field-level validation and blocks submit when regional codes are invalid", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<StartSmartShell workspaceId="ws_live_123" />);

    fireEvent.click(screen.getByRole("button", { name: /build my survival blueprint/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fix the highlighted fields to continue.",
    );
    expect(screen.getByText("Enter a valid 2-letter country code.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid 2- or 3-letter state or region code."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/state or region/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks submit when no accessible workspace is available", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<StartSmartShell workspaceId={null} />);

    fireEvent.click(screen.getByRole("button", { name: /young adult/i }));
    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText(/state/i), {
      target: { value: "CA" },
    });

    expect(
      screen.getByRole("button", { name: /build my survival blueprint/i }),
    ).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
