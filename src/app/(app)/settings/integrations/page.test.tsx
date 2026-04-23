import { render, screen, within } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders provider cards with explicit action labels for setup flows", () => {
    render(<IntegrationsPage />);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();

    const providers = [
      {
        label: "Claude",
        setupPath: "/settings/integrations/claude",
        loginUrl: "https://platform.claude.com/login",
        docsUrl: "https://docs.anthropic.com",
      },
      {
        label: "OpenAI",
        setupPath: "/settings/integrations/openai",
        loginUrl: "https://platform.openai.com/login",
        docsUrl: "https://platform.openai.com/docs",
      },
      {
        label: "GitHub Copilot",
        setupPath: "/settings/integrations/copilot",
        loginUrl: "https://github.com/features/copilot",
        docsUrl: "https://docs.github.com/en/copilot",
      },
      {
        label: "OpenClaw",
        setupPath: "/settings/integrations/openclaw",
        loginUrl: "https://openclaw.ai/",
        docsUrl: "https://openclaw.ai/",
      },
      {
        label: "Gemini",
        setupPath: "/settings/integrations/gemini",
        loginUrl:
          "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Faistudio.google.com%2Fapi-keys",
        docsUrl: "https://ai.google.dev/gemini-api/docs",
      },
      {
        label: "Perplexity",
        setupPath: "/settings/integrations/perplexity",
        loginUrl: "https://console.perplexity.ai/",
        docsUrl: "https://docs.perplexity.ai/",
      },
      {
        label: "Mistral",
        setupPath: "/settings/integrations/mistral",
        loginUrl: "https://console.mistral.ai/",
        docsUrl: "https://docs.mistral.ai/",
      },
      {
        label: "Wise",
        setupPath: "/settings/integrations/wise",
        loginUrl: "https://wise.com/login/",
        docsUrl: "https://docs.wise.com/api-docs",
      },
      {
        label: "Revolut",
        setupPath: "/settings/integrations/revolut",
        loginUrl: "https://developer.revolut.com/portal/signup",
        docsUrl: "https://developer.revolut.com/docs/build-banking-apps",
      },
      {
        label: "PayPal",
        setupPath: "/settings/integrations/paypal",
        loginUrl:
          "https://www.paypal.com/signin?returnUri=https%3A%2F%2Fdeveloper.paypal.com%2Fdashboard%2Fapplications%2Fsandbox&intent=developer",
        docsUrl: "https://developer.paypal.com/docs/",
      },
      {
        label: "Xero",
        setupPath: "/settings/integrations/xero",
        loginUrl: "https://developer.xero.com/app/manage",
        docsUrl: "https://developer.xero.com/documentation/",
      },
      {
        label: "Deel",
        setupPath: "/settings/integrations/deel",
        loginUrl: "https://app.deel.com/login",
        docsUrl: "https://developer.deel.com/api/introduction",
      },
    ] as const;

    for (const provider of providers) {
      expect(screen.getByText(provider.label)).toBeInTheDocument();

      const card = screen
        .getByRole("heading", { level: 3, name: provider.label })
        .closest("article");

      expect(card).not.toBeNull();
      expect(
        within(card as HTMLElement).getByRole("link", { name: "Open setup wizard" }),
      ).toHaveAttribute("href", provider.setupPath);
      expect(
        within(card as HTMLElement).getByRole("link", { name: "Open official login" }),
      ).toHaveAttribute("href", provider.loginUrl);
      expect(
        within(card as HTMLElement).getByRole("link", { name: "Open official docs" }),
      ).toHaveAttribute("href", provider.docsUrl);
    }
  });
});
