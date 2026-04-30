import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import OpenAiIntegrationPage from "./page";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      backToConnectionHub: "Back to connection hub",
      tools: "Tools",
      privacyShieldTitle: "Privacy Shield",
      privacyShieldDescription: `Review how ${values?.providerLabel ?? ""} receives data before enabling any connection.`.trim(),
      officialLinksTitle: "Official links",
      officialLogin: "Official login",
      officialDocs: "Official docs",
      privacyBadge: "No silent sharing",
      systemAccessWarning: "System access warning",
      "integrationProviderPages.openai.eyebrow": "OpenAI Setup",
      "integrationProviderPages.openai.title": "Connect OpenAI",
      "integrationProviderPages.openai.description":
        "Follow the official OpenAI path, verify the disclosure copy, and connect only if this workspace explicitly needs it.",
      "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
      "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
      "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
    };

    return translations[namespace ? `${namespace}.${key}` : key] ?? translations[key] ?? key;
  },
}));

describe("OpenAiIntegrationPage", () => {
  it("renders the OpenAI setup wizard with privacy disclosures and the shared tool rail", () => {
    render(<OpenAiIntegrationPage />);

    expect(screen.getByRole("heading", { name: "Connect OpenAI" })).toBeInTheDocument();
    expect(
      screen.getByText("Only explicitly connected providers receive the minimum required data."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      expect.stringContaining("platform.openai.com"),
    );
    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      expect.stringContaining("platform.openai.com"),
    );
  });
});
