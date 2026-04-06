export type ProviderId = "claude" | "openai" | "copilot" | "openclaw";

export type ProviderRiskLevel = "low" | "medium" | "high";

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  officialLoginUrl: string;
  officialDocsUrl: string;
  riskLevel: ProviderRiskLevel;
};
