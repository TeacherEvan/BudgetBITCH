import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthAccountRecoveryButton } from "./auth-account-recovery-button";

const signOutMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    signOut: signOutMock,
  }),
}));

describe("AuthAccountRecoveryButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("signs out to the sign-in page with an encoded root redirect", async () => {
    render(<AuthAccountRecoveryButton redirectTo="/" />);

    fireEvent.click(screen.getByRole("button", { name: /sign out and switch account/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({
        redirectUrl: "/sign-in?redirectTo=%2F",
      });
    });
  });

  it("signs out to the sign-in page with an encoded dashboard redirect", async () => {
    render(<AuthAccountRecoveryButton redirectTo="/dashboard?from=welcome" />);

    fireEvent.click(screen.getByRole("button", { name: /sign out and switch account/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({
        redirectUrl: "/sign-in?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
      });
    });
  });
});