import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetInstallPromptForTesting, type DeferredInstallPrompt } from "@/modules/pwa/install-prompt";
import { PwaProvider } from "./pwa-provider";

function createInstallPromptEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as DeferredInstallPrompt;

  Object.assign(event, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
  });

  return event;
}

describe("PwaProvider", () => {
  const registerMock = vi.fn();
  const originalServiceWorker = navigator.serviceWorker;
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    resetInstallPromptForTesting();
    registerMock.mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: registerMock },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it("registers the service worker on mount", async () => {
    render(
      <PwaProvider>
        <main>BudgetBITCH</main>
      </PwaProvider>,
    );

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
    });
    expect(screen.getByText("BudgetBITCH")).toBeInTheDocument();
  });

  it("shows the install button after beforeinstallprompt and hides it after appinstalled", async () => {
    render(
      <PwaProvider>
        <main>BudgetBITCH</main>
      </PwaProvider>,
    );

    expect(screen.queryByRole("button", { name: /install app/i })).not.toBeInTheDocument();

    const promptEvent = createInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(promptEvent, "preventDefault");

    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /install app/i })).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /install app/i })).not.toBeInTheDocument();
    });
  });

  it("warns instead of leaking a rejected registration promise", async () => {
    registerMock.mockRejectedValueOnce(new Error("boom"));

    render(
      <PwaProvider>
        <main>BudgetBITCH</main>
      </PwaProvider>,
    );

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Service worker registration failed.",
        expect.any(Error),
      );
    });
  });
});