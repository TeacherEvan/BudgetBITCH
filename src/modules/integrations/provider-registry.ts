import type { ProviderDefinition, ProviderId } from "./provider-types";

export const providerRegistry: Record<ProviderId, ProviderDefinition> = {
  claude: {
    id: "claude",
    label: "Claude",
    officialLoginUrl: "https://platform.claude.com/login",
    officialDocsUrl: "https://docs.anthropic.com",
    riskLevel: "medium",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialLoginUrl: "https://platform.openai.com/login",
    officialDocsUrl: "https://platform.openai.com/docs",
    riskLevel: "medium",
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    officialLoginUrl: "https://github.com/features/copilot",
    officialDocsUrl: "https://docs.github.com/en/copilot",
    riskLevel: "medium",
  },
  openclaw: {
    id: "openclaw",
    label: "OpenClaw",
    officialLoginUrl: "https://openclaw.ai/",
    officialDocsUrl: "https://openclaw.ai/",
    riskLevel: "high",
  },
};
