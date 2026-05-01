import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      kicker: "Alert lane",
      title: "Watch the pressure points",
      description: "Projected alerts land here first.",
      selectWorkspace: "Select a workspace to see alerts.",
      standbyNoUrl: "Standby. Add the Convex URL to enable alerts.",
      standbyNoBridge: "Standby. Realtime auth is not ready yet.",
      loading: "Loading alerts...",
      viewerSync: "Viewer sync in progress. Alerts appear after it finishes.",
      workspaceSync: "Waiting on workspace access sync.",
      empty: "No live alerts yet. They appear after the first projected check-in.",
      checkInDate: `Check-in ${values?.date ?? "2026-04-09"}`,
      "severity.info": "Info",
      "severity.warning": "Warning",
      "severity.critical": "Critical",
    };

    return translations[key] ?? key;
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

    expect(screen.getByText(/projected alerts land here first\./i)).toBeInTheDocument();
    expect(screen.getByText(/select a workspace to see alerts\./i)).toBeInTheDocument();
  });

  it("shows a graceful fallback when Convex auth is unavailable", () => {
    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/standby\. add the convex url to enable alerts\./i)).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("shows a graceful fallback when the Convex realtime auth bridge is not ready", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/standby\. realtime auth is not ready yet\./i)).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("shows a graceful fallback when the Convex URL cannot be normalized", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "not a url");

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/standby\. add the convex url to enable alerts\./i)).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("uses the realtime bridge when the Convex cloud host omits the scheme", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "steady-ox-280.convex.cloud");

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/standby\. realtime auth is not ready yet\./i)).toBeInTheDocument();
    expect(useQueryMock).not.toHaveBeenCalled();
  });

  it("shows a projection-sync message when the viewer record is not ready", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_AUTH_BRIDGE_READY", "true");

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

    expect(screen.getByText(/viewer sync in progress\. alerts appear after it finishes\./i)).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(viewerCurrentQuery, {
      workspaceLimit: 10,
    });
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, "skip");
  });

  it("shows a workspace access sync message when the viewer cannot read the workspace yet", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_AUTH_BRIDGE_READY", "true");

    useQueryMock.mockImplementation((query) => {
      if (query === viewerCurrentQuery) {
        return {
          projectionReady: true,
          workspaces: [],
        };
      }

      return undefined;
    });

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(screen.getByText(/waiting on workspace access sync\./i)).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, "skip");
  });

  it("shows an empty projected-alert state when no rows are returned", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_AUTH_BRIDGE_READY", "true");

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
        return [];
      }

      return undefined;
    });

    render(<LiveAlertFeed workspaceId="workspace-1" />);

    expect(
      screen.getByText(/no live alerts yet\. they appear after the first projected check-in\./i),
    ).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, {
      workspaceId: "workspace-1",
      limit: 6,
      status: "open",
    });
  });

  it("renders live alert rows when Convex returns data", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://budgetbitch.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_AUTH_BRIDGE_READY", "true");

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
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(listAlertInboxRowsQuery, {
      workspaceId: "workspace-1",
      limit: 6,
      status: "open",
    });
  });
});
