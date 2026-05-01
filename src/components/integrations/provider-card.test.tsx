import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProviderCard } from "./provider-card";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      integrationActions: {
        openSetupWizard: "Open setup wizard",
        openOfficialLogin: "Open official login",
        openOfficialDocs: "Open official docs",
      },
      providerCard: {
        "categoryLabel.ai": "AI",
        "categoryLabel.banking": "Banking",
        "categoryLabel.investing": "Investing",
        "categoryLabel.payroll": "Payroll",
        "categoryLabel.tax": "Tax",
        "categoryLabel.finance_ops": "Finance ops",
        "categorySummary.ai": "Assistant tools and prompt access.",
        "categorySummary.banking": "Official bank and account links.",
        "categorySummary.investing": "Portfolio and brokerage access.",
        "categorySummary.payroll": "Income and worker setup.",
        "categorySummary.tax": "Tax and ledger workflows.",
        "categorySummary.finance_ops": "Expense and money ops tools.",
        "risk.low": "Low risk",
        "risk.medium": "Medium risk",
        "risk.high": "High risk",
        "setupState.setupWizard": "Setup wizard",
        "setupState.guidanceOnly": "Guidance only",
        quickActions: "Quick actions",
      },
      integrationsShared: {
        privacyBadge: "No silent sharing",
      },
    };

    return translations[namespace]?.[key] ?? key;
  },
}));

describe("ProviderCard", () => {
  it("keeps the category, summary, risk, privacy, and setup state easy to scan", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Assistant tools and prompt access.")).toBeInTheDocument();
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
    expect(screen.getByText("No silent sharing")).toBeInTheDocument();
    expect(screen.getByText("Setup wizard")).toBeInTheDocument();
  });

  it("renders explicit setup and official action labels for internal flows", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      providerRegistry.openai.officialLoginUrl,
    );
    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      providerRegistry.openai.officialDocsUrl,
    );
  });

  it("renders explicit docs and login labels for guidance-only providers", () => {
    render(<ProviderCard provider={providerRegistry.plaid} />);

    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      providerRegistry.plaid.officialDocsUrl,
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      providerRegistry.plaid.officialLoginUrl,
    );
  });

  it("keeps quick actions out of the card heading outline", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    const card = screen.getByRole("heading", { level: 3, name: "OpenAI" }).closest("article");

    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("Quick actions")).toBeInTheDocument();
    expect(
      within(card as HTMLElement).queryByRole("heading", { name: "Quick actions" }),
    ).not.toBeInTheDocument();
  });
});
