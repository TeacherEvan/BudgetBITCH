// src/app/settings/a11y.test.tsx
// Production-readiness accessibility gate: assert the Settings screen meets
// WCAG baseline (no axe-core violations) when rendered with the real Provider
// tree and mocked Convex/auth.
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { ThemeProvider } from "@/components/providers/theme-provider";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const mockRouter = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue({ success: true }),
  useAction: () => vi.fn().mockResolvedValue({ success: true }),
  useQuery: () => null,
  useConvex: () => ({ query: vi.fn().mockResolvedValue(null) }),
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  ConvexReactClient: class {
    mutation = vi.fn().mockResolvedValue({ success: true });
    query = vi.fn().mockResolvedValue(null);
  },
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useAuthActions: () => ({ signOut: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@/hooks/use-local-db", () => ({
  useWizardProfile: () => ({ clear: vi.fn() }),
}));

vi.mock("@/hooks/use-critical-expense", () => ({
  useCriticalExpense: () => ({ commitment: null }),
}));

const sharedState = vi.hoisted<{ state: Record<string, unknown> }>(() => ({
  state: {
    myProfile: { shareCode: "ABCD1234", displayName: null, linkedBoardId: null },
    partnerName: null,
    isLinked: false,
    boardId: null,
    lastSyncedAt: null,
    linkByCode: vi.fn(async () => ({ ok: true as const })),
    unlink: vi.fn(async () => undefined),
    resolving: false,
  },
}));

vi.mock("@/hooks/use-shared-board", () => ({
  useSharedBoard: () => sharedState.state,
}));

import SettingsPage from "./page";

describe("SettingsPage accessibility", () => {
  beforeEach(() => {
    localStorage.clear();
    sharedState.state = {
      myProfile: { shareCode: "ABCD1234", displayName: null, linkedBoardId: null },
      partnerName: null,
      isLinked: false,
      boardId: null,
      lastSyncedAt: null,
      linkByCode: vi.fn(async () => ({ ok: true as const })),
      unlink: vi.fn(async () => undefined),
      resolving: false,
    };
  });

  it("has no axe-core violations on initial render", async () => {
    const { container } = render(
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});
