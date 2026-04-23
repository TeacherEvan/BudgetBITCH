import { render, screen, within } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders provider cards with explicit action labels for setup flows", () => {
    render(<IntegrationsPage />);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GitHub Copilot")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw")).toBeInTheDocument();

    const claudeCard = screen.getByRole("heading", { level: 3, name: "Claude" }).closest("article");
    const openclawCard = screen
      .getByRole("heading", { level: 3, name: "OpenClaw" })
      .closest("article");

    expect(claudeCard).not.toBeNull();
    expect(openclawCard).not.toBeNull();

    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open setup wizard" }),
    ).toHaveAttribute("href", "/settings/integrations/claude");
    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open official login" }),
    ).toHaveAttribute("href", "https://platform.claude.com/login");
    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open official docs" }),
    ).toHaveAttribute("href", "https://docs.anthropic.com");

    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open setup wizard" }),
    ).toHaveAttribute("href", "/settings/integrations/openclaw");
    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open official login" }),
    ).toHaveAttribute("href", "https://openclaw.ai/");
    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open official docs" }),
    ).toHaveAttribute("href", "https://openclaw.ai/");
  });
});
