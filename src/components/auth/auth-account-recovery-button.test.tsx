import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthAccountRecoveryButton } from "./auth-account-recovery-button";

const signOutMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signOut: signOutMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

describe("AuthAccountRecoveryButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("signs out to the sign-in page with an encoded root redirect", async () => {
    render(<AuthAccountRecoveryButton redirectTo="/" />);

    fireEvent.click(screen.getByRole("button", { name: /sign out and switch account/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith();
      expect(pushMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
      expect(refreshMock).toHaveBeenCalledWith();
    });
  });

  it("signs out to the sign-in page with an encoded dashboard redirect", async () => {
    render(<AuthAccountRecoveryButton redirectTo="/dashboard?from=welcome" />);

    fireEvent.click(screen.getByRole("button", { name: /sign out and switch account/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith();
      expect(pushMock).toHaveBeenCalledWith(
        "/sign-in?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
      );
      expect(refreshMock).toHaveBeenCalledWith();
    });
  });
});