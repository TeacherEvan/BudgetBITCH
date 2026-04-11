export type DeploymentCapabilityStatus = "ready" | "needs_setup";

export type DeploymentCapability = {
  id: string;
  title: string;
  summary: string;
  status: DeploymentCapabilityStatus;
  readyCount: number;
  totalCount: number;
  configuredEnvVars: string[];
  missingEnvVars: string[];
};

export type DeploymentReadiness = {
  capabilities: DeploymentCapability[];
  readyCount: number;
  totalCount: number;
};

type DeploymentCapabilityDefinition = Pick<DeploymentCapability, "id" | "summary" | "title"> & {
  envVars: string[];
};

const capabilityDefinitions: DeploymentCapabilityDefinition[] = [
  {
    id: "auth_workspace_mode",
    title: "Auth and live workspace mode",
    summary: "Swap the dashboard out of demo mode and resolve real workspace memberships.",
    envVars: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "DATABASE_URL"],
  },
  {
    id: "convex_live_alerts",
    title: "Convex live alerts",
    summary: "Keep live alert subscriptions and server-side Convex calls pointed at the same deployment.",
    envVars: ["NEXT_PUBLIC_CONVEX_URL", "CLERK_JWT_ISSUER_DOMAIN"],
  },
  {
    id: "protected_replays",
    title: "Protected replay and cron",
    summary: "Protect scheduled projection replays and internal sync requests with server-owned shared secrets.",
    envVars: ["CONVEX_SYNC_SECRET", "CRON_SECRET"],
  },
  {
    id: "provider_vault",
    title: "Provider secret vault",
    summary: "Encrypt connected provider secrets before they are stored or reused by integration flows.",
    envVars: ["PROVIDER_SECRET_ENCRYPTION_KEY"],
  },
  {
    id: "email_delivery",
    title: "Email delivery rail",
    summary: "Support outbound email flows and links that land users back in the right app environment.",
    envVars: ["RESEND_API_KEY", "NEXT_PUBLIC_APP_URL"],
  },
  {
    id: "workflow_webhooks",
    title: "Workflow and webhooks",
    summary: "Accept signed webhooks and trigger background event flows without faking trust at the boundary.",
    envVars: ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY", "WEBHOOK_SIGNING_SECRET"],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    summary: "Capture production failures with a real error trail instead of waiting for screenshots and guesswork.",
    envVars: ["SENTRY_DSN"],
  },
];

function hasTrimmedEnvValue(envName: string) {
  return Boolean(process.env[envName]?.trim());
}

function buildCapability(definition: DeploymentCapabilityDefinition): DeploymentCapability {
  const configuredEnvVars = definition.envVars.filter(hasTrimmedEnvValue);
  const missingEnvVars = definition.envVars.filter((envName) => !configuredEnvVars.includes(envName));
  const readyCount = configuredEnvVars.length;

  return {
    id: definition.id,
    title: definition.title,
    summary: definition.summary,
    status: readyCount === definition.envVars.length ? "ready" : "needs_setup",
    readyCount,
    totalCount: definition.envVars.length,
    configuredEnvVars,
    missingEnvVars,
  };
}

export function getDeploymentReadiness(): DeploymentReadiness {
  const capabilities = capabilityDefinitions.map(buildCapability);

  return {
    capabilities,
    readyCount: capabilities.filter((capability) => capability.status === "ready").length,
    totalCount: capabilities.length,
  };
}
