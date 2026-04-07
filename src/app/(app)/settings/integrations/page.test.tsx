import { render, screen, within } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders provider cards for the supported integrations", () => {
    render(<IntegrationsPage />);

    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GitHub Copilot")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw")).toBeInTheDocument();
    expect(screen.getByText("Plaid")).toBeInTheDocument();
    expect(screen.getByText("Vanguard")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Ramp")).toBeInTheDocument();
    expect(screen.getByText("Gusto")).toBeInTheDocument();
    expect(screen.getAllByText("No silent sharing").length).toBeGreaterThanOrEqual(10);
  });

  it("uses grouped category summaries and client-side links for internal setup routes", () => {
    render(<IntegrationsPage />);

    expect(screen.getByRole("heading", { level: 2, name: "AI copilots" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Model-powered helpers, planning copilots, and prompt-heavy workflow tools.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Claude" })).toBeInTheDocument();

    const claudeCard = screen.getByRole("heading", { level: 3, name: "Claude" }).closest("article");

    expect(claudeCard).not.toBeNull();
    expect(
      within(claudeCard as HTMLElement).getByRole("link", {
        name: /setup wizard/i,
      }),
    ).toHaveAttribute("href", "/settings/integrations/claude");
  });

  it("shows OpenClaw as high risk with a setup wizard link", () => {
    render(<IntegrationsPage />);

    const openclawCard = screen
      .getByRole("heading", { level: 3, name: "OpenClaw" })
      .closest("article");

    expect(openclawCard).not.toBeNull();
    expect(within(openclawCard as HTMLElement).getByText("High risk")).toBeInTheDocument();
    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: /setup wizard/i }),
    ).toHaveAttribute("href", "/settings/integrations/openclaw");
  });
});
