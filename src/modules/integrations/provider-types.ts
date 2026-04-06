export type ProviderId =
  | "claude"
  | "openai"
  | "copilot"
  | "openclaw"
  | "plaid"
  | "vanguard"
  | "stripe"
  | "ramp"
  | "gusto"
  | "quickbooks";

export type ProviderRiskLevel = "low" | "medium" | "high";

export type ProviderCategory =
  | "ai"
  | "banking"
  | "investing"
  | "payroll"
  | "tax"
  | "finance_ops";

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  officialLoginUrl: string;
  officialDocsUrl: string;
  riskLevel: ProviderRiskLevel;
  category: ProviderCategory;
  setupPath?: string;
};
