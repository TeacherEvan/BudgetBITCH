import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import SignUpPage from "./page";

describe("SignUpPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects sign-up traffic to sign-in", async () => {
    await expect(SignUpPage()).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("preserves a safe root target when redirecting to sign-in", async () => {
    await expect(
      SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "/" }),
      }),
    ).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2F");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
  });

  it("drops unsafe redirect targets when redirecting to sign-in", async () => {
    await expect(
      SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
      }),
    ).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("preserves a safe dashboard target when redirecting to sign-in", async () => {

    await expect(
      SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    ).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome");
    expect(redirectMock).toHaveBeenCalledWith(
      "/sign-in?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });
});