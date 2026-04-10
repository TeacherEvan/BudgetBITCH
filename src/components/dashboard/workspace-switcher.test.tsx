import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceSwitcher } from "./workspace-switcher";

describe("WorkspaceSwitcher", () => {
  const workspaces = [
    {
      id: "workspace-1",
      name: "Household",
      role: "editor" as const,
      isDefault: true,
    },
    {
      id: "workspace-2",
      name: "Side Hustle",
      role: "owner" as const,
    },
  ];

  it("renders visible workspace context and explicit switch links", () => {
    render(
      <WorkspaceSwitcher
        activeWorkspaceId="workspace-2"
        requestedWorkspaceId="workspace-2"
        resolutionSource="requested"
        workspaces={workspaces}
      />,
    );

    expect(screen.getByRole("heading", { name: /switch workspace/i })).toBeInTheDocument();
    expect(screen.getByText("Current workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open household workspace/i })).toHaveAttribute(
      "href",
      "/dashboard?workspaceId=workspace-1",
    );
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
  });

  it("explains when the requested workspace is unavailable", () => {
    render(
      <WorkspaceSwitcher
        activeWorkspaceId="workspace-1"
        requestedWorkspaceId="workspace-missing"
        resolutionSource="default"
        workspaces={workspaces}
      />,
    );

    expect(
      screen.getByText(/requested workspace is unavailable\. showing your default workspace instead\./i),
    ).toBeInTheDocument();
  });
});
