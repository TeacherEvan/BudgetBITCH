import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clerkProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  )),
);
const clerkUseAuthMock = vi.hoisted(() => vi.fn());
const convexProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="convex-provider">{children}</div>
  )),
);
const convexClientMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: clerkProviderMock,
  useAuth: clerkUseAuthMock,
}));

vi.mock("convex/react", () => ({
  ConvexReactClient: convexClientMock,
}));

vi.mock("convex/react-clerk", () => ({
  ConvexProviderWithClerk: convexProviderMock,
}));

import { AppProviders } from "./app-providers";

describe("AppProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders children without providers when Clerk is not configured", () => {
    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByText("BudgetBITCH")).toBeInTheDocument();
    expect(screen.queryByTestId("clerk-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("convex-provider")).not.toBeInTheDocument();
  });

  it("wraps children in Clerk only when Convex is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("clerk-provider")).toBeInTheDocument();
    expect(screen.queryByTestId("convex-provider")).not.toBeInTheDocument();
    expect(convexClientMock).not.toHaveBeenCalled();
    expect(clerkProviderMock.mock.calls[0]?.[0].publishableKey).toBe(
      "pk_test_budgetbitch",
    );
  });

  it("skips Convex when the URL is not absolute", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "steady-ox-280.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("clerk-provider")).toBeInTheDocument();
    expect(screen.queryByTestId("convex-provider")).not.toBeInTheDocument();
    expect(convexClientMock).not.toHaveBeenCalled();
  });

  it("wraps children in Clerk and Convex when both are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://happy-animal-123.convex.cloud");

    render(
      <AppProviders>
        <main>BudgetBITCH</main>
      </AppProviders>,
    );

    expect(screen.getByTestId("clerk-provider")).toBeInTheDocument();
    expect(screen.getByTestId("convex-provider")).toBeInTheDocument();
    expect(convexClientMock).toHaveBeenCalledWith(
      "https://happy-animal-123.convex.cloud",
    );
    expect(convexProviderMock.mock.calls[0]?.[0].useAuth).toBe(clerkUseAuthMock);
  });
});
