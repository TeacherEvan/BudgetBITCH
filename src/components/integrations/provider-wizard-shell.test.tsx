import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProviderWizardShell } from "./provider-wizard-shell";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      backToConnectionHub: "Back to connection hub",
      tools: "Tools",
      privacyShieldTitle: "Privacy Shield",
      officialLinksTitle: "Official links",
      officialLogin: "Official login",
      officialDocs: "Official docs",
      privacyBadge: "No silent sharing",
      systemAccessWarning: "System access warning",
      "disclosureHeadings.minimumData": "Minimum data",
      "disclosureHeadings.noSilentSharing": "No silent sharing",
      "disclosureHeadings.revokeAnyTime": "Revoke any time",
      "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
      "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
      "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
    };

    return translations[key] ?? key;
  },
}));

describe("ProviderWizardShell", () => {
  it("renders the shell copy, back link, children, and the shared tool rail", () => {
    render(
      <ProviderWizardShell
        eyebrow="OpenAI Setup"
        title="Connect OpenAI"
        description="Use the official route first. Safety details stay below."
        actions={[
          { kind: "primary", label: "Open setup wizard", href: "/settings/integrations/openai" },
          { kind: "secondary", label: "Open official login", href: "https://platform.openai.com/login" },
          { kind: "tertiary", label: "Open official docs", href: "https://platform.openai.com/docs" },
        ]}
      >
        <div>Child panel one</div>
        <div>Child panel two</div>
      </ProviderWizardShell>,
    );

    expect(screen.getByText("OpenAI Setup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect OpenAI" })).toBeInTheDocument();
    expect(screen.getByText("Use the official route first. Safety details stay below.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
    expect(screen.getByRole("heading", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByText("Child panel one")).toBeInTheDocument();
    expect(screen.getByText("Child panel two")).toBeInTheDocument();
  });
});
