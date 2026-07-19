import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "./reset-password-form";

const signInMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: signInMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("@/lib/legal/versions", () => ({
  shortLocale: (l: string) => l,
}));

vi.mock("@/lib/auth/routes", () => ({
  AUTH_ROUTES: { signIn: "/sign-in" },
}));

describe("ResetPasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prefills email and code from props", () => {
    render(<ResetPasswordForm email="user@example.com" code="ABC123" />);
    expect(screen.getByDisplayValue("user@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("ABC123")).toBeTruthy();
  });

  it("submits reset-verification with the new password", async () => {
    let captured: FormData | undefined;
    signInMock.mockImplementationOnce(async (_provider: string, fd: FormData) => {
      captured = fd;
    });
    render(<ResetPasswordForm email="user@example.com" code="ABC123" />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(captured).toBeDefined();
      expect(captured!.get("flow")).toBe("reset-verification");
      expect(captured!.get("email")).toBe("user@example.com");
      expect(captured!.get("code")).toBe("ABC123");
      expect(captured!.get("newPassword")).toBe("newpassword123");
    });
  });

  it("shows an invalid-code message when the code is rejected", async () => {
    signInMock.mockRejectedValueOnce(new Error("Invalid code"));
    render(<ResetPasswordForm email="user@example.com" code="BAD" />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeTruthy();
    });
  });
});
