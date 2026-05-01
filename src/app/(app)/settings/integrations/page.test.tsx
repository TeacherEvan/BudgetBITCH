import { render, screen, within } from "@testing-library/react";
import { localeMessages } from "@/i18n/messages";
import { vi } from "vitest";

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
        "categorySummary.ai": "Prompt-heavy tools and assistant access.",
        "categorySummary.banking": "Bank connections and verification rails.",
        "categorySummary.investing": "Portfolio, account, and brokerage access.",
        "categorySummary.payroll": "Income and worker operations.",
        "categorySummary.tax": "Tax filings, books, and accounting workflows.",
        "categorySummary.finance_ops": "Operational money tooling and expense controls.",
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

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    integrationsHub: {
      eyebrow: "Connection Hub",
      title: "Connect only the providers you can scan and trust fast.",
      description:
        "Each section keeps the official route, risk, and next action easy to scan.",
      guardrails: {
        officialRoutesFirst: {
          label: "Official routes",
          title: "Use the provider's official login, docs, or setup route first.",
        },
        noSilentSharing: {
          label: "No silent sharing",
          title: "Only providers you explicitly connect receive the minimum required data.",
        },
        revokePathStaysObvious: {
          label: "Easy revoke path",
          title: "You should always be able to find the disconnect or revoke path quickly.",
        },
      },
      groupedScan: "Grouped scan",
      providerCount: "{count} providers",
      categories: {
        ai: {
          label: "AI copilots",
          summary: "Model helpers and prompt-heavy workflow tools.",
        },
        banking: {
          label: "Banking rails",
          summary: "Account verification and official banking connections.",
        },
        investing: {
          label: "Investing",
          summary: "Brokerage and portfolio access with clear permissions.",
        },
        payroll: {
          label: "Payroll",
          summary: "Income and worker setup with clear checks.",
        },
        tax: {
          label: "Tax and accounting",
          summary: "Documents and ledger access with visible trust cues.",
        },
        finance_ops: {
          label: "Finance operations",
          summary: "Expense, card, and ops tooling kept simple on purpose.",
        },
      },
    },
  }),
}));

import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders provider cards with explicit action labels for setup flows", async () => {
    render(await IntegrationsPage());

    const [officialRoutesGuardrail] = screen.getAllByText("Official routes");
    const [noSilentSharingGuardrail] = screen.getAllByText("No silent sharing");
    const [easyRevokePathGuardrail] = screen.getAllByText("Easy revoke path");

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(officialRoutesGuardrail).toHaveAttribute(
      "title",
      "Use the provider's official login, docs, or setup route first.",
    );
    expect(noSilentSharingGuardrail).toHaveAttribute(
      "title",
      "Only providers you explicitly connect receive the minimum required data.",
    );
    expect(easyRevokePathGuardrail).toHaveAttribute(
      "title",
      "You should always be able to find the disconnect or revoke path quickly.",
    );
    expect(screen.getByText("7 providers")).toBeInTheDocument();
    expect(screen.getAllByText("3 providers")).toHaveLength(2);
    expect(screen.getByText("Model helpers and prompt-heavy workflow tools.")).toBeInTheDocument();
    expect(screen.getByText("Account verification and official banking connections.")).toBeInTheDocument();

    const representativeProviders = [
      {
        label: "Claude",
        setupPath: "/settings/integrations/claude",
        loginUrl: "https://platform.claude.com/login",
        docsUrl: "https://docs.anthropic.com",
      },
      {
        label: "GitHub Copilot",
        setupPath: "/settings/integrations/copilot",
        loginUrl: "https://github.com/features/copilot",
        docsUrl: "https://docs.github.com/en/copilot",
      },
      {
        label: "Wise",
        setupPath: "/settings/integrations/wise",
        loginUrl: "https://wise.com/login/",
        docsUrl: "https://docs.wise.com/api-docs",
      },
      {
        label: "PayPal",
        setupPath: "/settings/integrations/paypal",
        loginUrl:
          "https://www.paypal.com/signin?returnUri=https%3A%2F%2Fdeveloper.paypal.com%2Fdashboard%2Fapplications%2Fsandbox&intent=developer",
        docsUrl: "https://developer.paypal.com/docs/",
      },
      {
        label: "Deel",
        setupPath: "/settings/integrations/deel",
        loginUrl: "https://app.deel.com/login",
        docsUrl: "https://developer.deel.com/api/introduction",
      },
    ] as const;

    for (const provider of representativeProviders) {
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
  }, 15_000);

  it("keeps zh and th integrations guardrails aligned with the compact object shape", () => {
    expect(localeMessages.zh.integrationsHub.guardrails.officialRoutesFirst).toEqual({
      label: "官方入口",
      title: "优先使用服务提供商官方登录、文档或设置路径。",
    });
    expect(localeMessages.zh.integrationsHub.guardrails.noSilentSharing).toEqual({
      label: "绝不静默共享",
      title: "只有你明确连接的服务提供商才会接收所需的最少数据。",
    });
    expect(localeMessages.th.integrationsHub.guardrails.officialRoutesFirst).toEqual({
      label: "เส้นทางทางการ",
      title: "ใช้เส้นทางเข้าสู่ระบบ เอกสาร หรือการตั้งค่าทางการของผู้ให้บริการก่อน",
    });
    expect(localeMessages.th.integrationsHub.guardrails.revokePathStaysObvious).toEqual({
      label: "ทางยกเลิกชัดเจน",
      title: "คุณควรหาเส้นทางตัดการเชื่อมต่อหรือเพิกถอนได้อย่างรวดเร็วเสมอ",
    });
  });
});
