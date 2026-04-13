import { render, screen, within } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders the settings hub summary, category navigation, and provider cards", () => {
    render(<IntegrationsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Integrations" })).toBeInTheDocument();
    expect(screen.getByText("Settings hub")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Integration categories" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jump to AI copilots" })).toHaveAttribute(
      "href",
      "#category-ai",
    );
    expect(screen.getByRole("link", { name: "Jump to Finance operations" })).toHaveAttribute(
      "href",
      "#category-finance_ops",
    );

    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GitHub Copilot")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw")).toBeInTheDocument();
    expect(screen.getByText("Plaid")).toBeInTheDocument();
    expect(screen.getByText("Vanguard")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Ramp")).toBeInTheDocument();
    expect(screen.getByText("Gusto")).toBeInTheDocument();
  });

  it("links the category navigator to the matching sections", () => {
    render(<IntegrationsPage />);

    expect(screen.getByRole("link", { name: "Jump to Tax and accounting" })).toHaveAttribute(
      "href",
      "#category-tax",
    );
    expect(screen.getByRole("region", { name: "Tax and accounting" })).toHaveAttribute(
      "id",
      "category-tax",
    );
    expect(
      screen.getByText("Documents, filings, and ledger access where trust cues must be obvious."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "AI copilots" })).toBeInTheDocument();

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
