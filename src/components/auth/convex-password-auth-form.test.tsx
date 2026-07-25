import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConvexPasswordAuthForm } from "./convex-password-auth-form";

const signInMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: signInMock }),
  useAuthToken: () => "jwt",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/lib/legal/versions", () => ({
  shortLocale: (l: string) => l,
  TERMS_VERSION: "1",
  PRIVACY_VERSION: "1",
}));
vi.mock("@/lib/convex/sync-snapshots", () => ({
  flushOfflineQueue: () => undefined,
}));

function renderSignIn() {
  return render(
    <ConvexPasswordAuthForm
      flow="signIn"
      redirectTo="/dashboard"
      submitLabel="Sign In"
      emailLabel="Email address"
      passwordLabel="Password"
      helperText=""
    />,
  );
}

describe("ConvexPasswordAuthForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("masks the raw InvalidAccountId error as a friendly credential hint", async () => {
    signInMock.mockRejectedValueOnce(new Error("InvalidAccountId"));
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "whatever123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/check your email and password/i),
      ).toBeTruthy();
    });
    // Never leaks the raw backend error string.
    expect(screen.queryByText(/invalidaccountid/i)).toBeNull();
  });

  it("masks a wrong-password (InvalidSecret) error the same way", async () => {
    signInMock.mockRejectedValueOnce(new Error("InvalidSecret"));
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/check your email and password/i),
      ).toBeTruthy();
    });
  });

  it("redirects to redirectTo on successful sign-in", async () => {
    signInMock.mockResolvedValueOnce({ signingIn: true });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "correct123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });
});
