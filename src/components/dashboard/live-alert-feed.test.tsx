import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createPublishableKey(host: string) {
  return `pk_test_${Buffer.from(`${host}$`, "utf8").toString("base64url")}`;
}

const useQueryMock = vi.hoisted(() => vi.fn());
const viewerCurrentQuery = vi.hoisted(() => Symbol("viewer.current"));
const listAlertInboxRowsQuery = vi.hoisted(() => Symbol("live.listAlertInboxRows"));

vi.mock("convex/react", () => ({
  useQuery: useQueryMock,
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    viewer: {
      current: viewerCurrentQuery,
    },
    live: {
      listAlertInboxRows: listAlertInboxRowsQuery,
    },
  },
}));

import { LiveAlertFeed } from "./live-alert-feed";

describe("LiveAlertFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("shows a workspace selection fallback", () => {
    render(<LiveAlertFeed workspaceId={null} />);

    expect(screen.getByText(/select a workspace to view live alerts/i)).toBeInTheDocument();
  });

  it("shows a graceful fallback when Convex auth is unavailable", () => {
    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(
      screen.getByText(/live alerts stay on standby until convex auth is configured/i),
    ).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("shows a graceful fallback when the Convex URL is not absolute", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "steady-ox-280.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", createPublishableKey("clerk.budgetbitch.test"));

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(
      screen.getByText(/live alerts stay on standby until convex auth is configured/i),
    ).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("shows a projection-sync message when the viewer record is not ready", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", createPublishableKey("clerk.budgetbitch.test"));

    useQueryMock.mockImplementation((query) => {
      if (query === viewerCurrentQuery) {
        return {
          projectionReady: false,
          workspaces: [],
        };
      }

      return undefined;
    });

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(
      screen.getByText(/after your convex viewer profile finishes syncing/i),
    ).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(viewerCurrentQuery, {
      workspaceLimit: 10,
    });
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, "skip");
  });

  it("renders live alert rows when Convex returns data", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", createPublishableKey("clerk.budgetbitch.test"));

    useQueryMock.mockImplementation((query) => {
      if (query === viewerCurrentQuery) {
        return {
          projectionReady: true,
          workspaces: [
            {
              workspaceId: "workspace-1",
              role: "owner",
              isDefault: true,
              lastOpenedAt: null,
            },
          ],
        };
      }

      if (query === listAlertInboxRowsQuery) {
        return [
          {
            _id: "row-1",
            title: "Bills due soon",
            message: "Rent is due today.",
            severity: "critical",
            checkInDate: "2026-04-09",
          },
        ];
      }

      return undefined;
    });

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/bills due soon/i)).toBeInTheDocument();
    expect(screen.getByText(/rent is due today/i)).toBeInTheDocument();
    expect(screen.getByText(/check-in 2026-04-09/i)).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, {
      workspaceId: "workspace-1",
      limit: 6,
      status: "open",
    });
  });
});
