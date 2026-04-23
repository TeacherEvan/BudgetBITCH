export type ProviderId =
  | "claude"
  | "openai"
  | "copilot"
  | "openclaw"
  | "gemini"
  | "perplexity"
  | "mistral"
  | "plaid"
  | "wise"
  | "revolut"
  | "vanguard"
  | "stripe"
  | "ramp"
  | "paypal"
  | "gusto"
  | "quickbooks"
  | "xero"
  | "deel";

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
