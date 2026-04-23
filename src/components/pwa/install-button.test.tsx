import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetInstallPromptForTesting,
  storeInstallPrompt,
  type DeferredInstallPrompt,
} from "@/modules/pwa/install-prompt";
import { InstallButton } from "./install-button";

function createInstallPrompt() {
  const prompt = vi.fn().mockResolvedValue(undefined);

  return {
    prompt,
    preventDefault: vi.fn(),
    userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
  } as DeferredInstallPrompt;
}

describe("InstallButton", () => {
  beforeEach(() => {
    resetInstallPromptForTesting();
  });

  it("stays hidden until an install prompt is available", () => {
    render(<InstallButton />);

    expect(screen.queryByRole("button", { name: /install app/i })).not.toBeInTheDocument();
  });

  it("renders once an install prompt is available", () => {
    storeInstallPrompt(createInstallPrompt());

    render(<InstallButton />);

    expect(screen.getByRole("button", { name: /install app/i })).toBeInTheDocument();
  });

  it("opens the saved install prompt and hides the button after activation", async () => {
    const installPrompt = createInstallPrompt();

    storeInstallPrompt(installPrompt);
    render(<InstallButton />);

    fireEvent.click(screen.getByRole("button", { name: /install app/i }));

    expect(installPrompt.prompt).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /install app/i })).not.toBeInTheDocument();
    });
  });
});