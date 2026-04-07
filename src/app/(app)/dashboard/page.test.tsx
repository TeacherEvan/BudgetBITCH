import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("renders grouped control-board clusters and guarded routes", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /treasure map/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /run the board/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /control signals/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /side quests, clearly marked/i })).toBeInTheDocument();
    expect(screen.getAllByText(/money survival blueprint/i)).toHaveLength(3);
    expect(screen.getByText(/not started/i)).toBeInTheDocument();
    expect(screen.getByText(/guarded/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /start smart/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /open learn/i })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: /open jobs/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /open hub/i })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
  });
});
