import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "./forgot-password-form";

const signInMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const onBackMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: signInMock }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("@/lib/legal/versions", () => ({
  shortLocale: (l: string) => l,
}));

describe("ForgotPasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits a reset flow for the entered email", async () => {
    let captured: FormData | undefined;
    signInMock.mockImplementationOnce(async (_provider: string, fd: FormData) => {
      captured = fd;
    });
    render(<ForgotPasswordForm onBack={onBackMock} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

    await waitFor(() => {
      expect(captured).toBeDefined();
      expect(captured!.get("flow")).toBe("reset");
      expect(captured!.get("email")).toBe("user@example.com");
    });
  });

  it("always shows the sent confirmation, even on error", async () => {
    signInMock.mockRejectedValueOnce(new Error("boom"));
    render(<ForgotPasswordForm onBack={onBackMock} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

    await waitFor(() => {
      expect(screen.getByText(/reset code is on its way/i)).toBeTruthy();
    });
  });

  it("returns to sign-in via the back button", () => {
    render(<ForgotPasswordForm onBack={onBackMock} />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(onBackMock).toHaveBeenCalled();
  });
});
