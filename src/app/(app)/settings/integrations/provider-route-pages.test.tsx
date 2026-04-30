import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import DeelIntegrationPage from "./deel/page";
import GeminiIntegrationPage from "./gemini/page";
import MistralIntegrationPage from "./mistral/page";
import PayPalIntegrationPage from "./paypal/page";
import PerplexityIntegrationPage from "./perplexity/page";
import RevolutIntegrationPage from "./revolut/page";
import WiseIntegrationPage from "./wise/page";
import XeroIntegrationPage from "./xero/page";

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
      "integrationProviderPages.deel.eyebrow": "Deel Setup",
      "integrationProviderPages.deel.title": "Connect Deel",
      "integrationProviderPages.deel.description":
        "Use the official Deel route, review the privacy disclosure, and only enable payroll access for the workspace that needs it.",
      "integrationProviderPages.gemini.eyebrow": "Gemini Setup",
      "integrationProviderPages.gemini.title": "Connect Gemini",
      "integrationProviderPages.gemini.description":
        "Use the official Google AI Studio path, verify the privacy disclosure, and only connect Gemini when this workspace clearly needs it.",
      "integrationProviderPages.mistral.eyebrow": "Mistral Setup",
      "integrationProviderPages.mistral.title": "Connect Mistral",
      "integrationProviderPages.mistral.description":
        "Use the official Mistral console path, confirm the privacy disclosure, and only enable the connection for workspaces that require it.",
      "integrationProviderPages.paypal.eyebrow": "PayPal Setup",
      "integrationProviderPages.paypal.title": "Connect PayPal",
      "integrationProviderPages.paypal.description":
        "Use the official PayPal developer route, review the privacy disclosure, and only complete setup for the workspace that explicitly needs it.",
      "integrationProviderPages.perplexity.eyebrow": "Perplexity Setup",
      "integrationProviderPages.perplexity.title": "Connect Perplexity",
      "integrationProviderPages.perplexity.description":
        "Follow the official Perplexity console flow, review the privacy disclosure, and keep the connection limited to the workspace that needs it.",
      "integrationProviderPages.revolut.eyebrow": "Revolut Setup",
      "integrationProviderPages.revolut.title": "Connect Revolut",
      "integrationProviderPages.revolut.description":
        "Follow the official Revolut developer path, verify the privacy disclosure, and keep the connection scoped to the workspace that needs it.",
      "integrationProviderPages.wise.eyebrow": "Wise Setup",
      "integrationProviderPages.wise.title": "Connect Wise",
      "integrationProviderPages.wise.description":
        "Use the official Wise route, review the privacy disclosure, and only connect the account once the workspace scope is clear.",
      "integrationProviderPages.xero.eyebrow": "Xero Setup",
      "integrationProviderPages.xero.title": "Connect Xero",
      "integrationProviderPages.xero.description":
        "Follow the official Xero developer flow, confirm the privacy disclosure, and connect only after the accounting scope is clear.",
      "disclosures.minimumData": "Only explicitly connected providers receive the minimum required data.",
      "disclosures.noSilentSharing": "No silent sharing or automatic cross-provider routing.",
      "disclosures.revokeAnyTime": "You can revoke and disconnect this provider at any time.",
    };

    return translations[namespace ? `${namespace}.${key}` : key] ?? translations[key] ?? key;
  },
}));

const providerCases = [
  {
    label: "Deel",
    heading: "Connect Deel",
    setupPath: "/settings/integrations/deel",
    loginUrl: "https://app.deel.com/login",
    docsUrl: "https://developer.deel.com/api/introduction",
    Page: DeelIntegrationPage,
  },
  {
    label: "Gemini",
    heading: "Connect Gemini",
    setupPath: "/settings/integrations/gemini",
    loginUrl:
      "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Faistudio.google.com%2Fapi-keys",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    Page: GeminiIntegrationPage,
  },
  {
    label: "Mistral",
    heading: "Connect Mistral",
    setupPath: "/settings/integrations/mistral",
    loginUrl: "https://console.mistral.ai/",
    docsUrl: "https://docs.mistral.ai/",
    Page: MistralIntegrationPage,
  },
  {
    label: "PayPal",
    heading: "Connect PayPal",
    setupPath: "/settings/integrations/paypal",
    loginUrl:
      "https://www.paypal.com/signin?returnUri=https%3A%2F%2Fdeveloper.paypal.com%2Fdashboard%2Fapplications%2Fsandbox&intent=developer",
    docsUrl: "https://developer.paypal.com/docs/",
    Page: PayPalIntegrationPage,
  },
  {
    label: "Perplexity",
    heading: "Connect Perplexity",
    setupPath: "/settings/integrations/perplexity",
    loginUrl: "https://console.perplexity.ai/",
    docsUrl: "https://docs.perplexity.ai/",
    Page: PerplexityIntegrationPage,
  },
  {
    label: "Revolut",
    heading: "Connect Revolut",
    setupPath: "/settings/integrations/revolut",
    loginUrl: "https://developer.revolut.com/portal/signup",
    docsUrl: "https://developer.revolut.com/docs/build-banking-apps",
    Page: RevolutIntegrationPage,
  },
  {
    label: "Wise",
    heading: "Connect Wise",
    setupPath: "/settings/integrations/wise",
    loginUrl: "https://wise.com/login/",
    docsUrl: "https://docs.wise.com/api-docs",
    Page: WiseIntegrationPage,
  },
  {
    label: "Xero",
    heading: "Connect Xero",
    setupPath: "/settings/integrations/xero",
    loginUrl: "https://developer.xero.com/app/manage",
    docsUrl: "https://developer.xero.com/documentation/",
    Page: XeroIntegrationPage,
  },
] as const;

describe("integration provider route pages", () => {
  it.each(providerCases)(
    "renders the $label route with its shared back link and tool rail",
    ({ heading, setupPath, loginUrl, docsUrl, Page }) => {
      render(<Page />);

      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
        "href",
        "/settings/integrations",
      );
      expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
        "href",
        setupPath,
      );
      expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
        "href",
        loginUrl,
      );
      expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
        "href",
        docsUrl,
      );
    },
  );
});