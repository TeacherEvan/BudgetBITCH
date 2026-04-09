import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  buildIntegrationConnectedAuditEvent,
  buildIntegrationRevokedAuditEvent,
} from "@/modules/audit/integration-audit";
import {
  createConnectionVaultEntry,
  revokeConnectionVaultEntry,
} from "@/modules/integrations/connection-vault";
import { providerRegistry } from "./provider-registry";

export type IntegrationGatewayEnv = {
  encryptionKey?: string;
};

export type ConnectIntegrationInput = {
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  provider: keyof typeof providerRegistry;
  secret: string;
};

export type RevokeIntegrationInput = {
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  provider: keyof typeof providerRegistry;
  encryptedSecret: string;
  secretFingerprint: string;
};

export async function connectIntegration(
  input: ConnectIntegrationInput,
  env: IntegrationGatewayEnv,
) {
  if (!env.encryptionKey) {
    throw new Error("PROVIDER_SECRET_ENCRYPTION_KEY is not configured on the server.");
  }

  const vaultEntry = createConnectionVaultEntry({
    provider: input.provider,
    secret: input.secret,
    encryptionKey: env.encryptionKey,
  });
  const auditEvent = buildIntegrationConnectedAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    provider: input.provider,
    targetId: input.connectionId,
  });
  const prisma = getPrismaClient();
  const providerDefinition = providerRegistry[input.provider];

  await prisma.integrationConnection.upsert({
    where: { id: input.connectionId },
    update: {
      workspaceId: input.workspaceId,
      provider: input.provider,
      displayName: providerDefinition.label,
      authType: "api_key",
      encryptedSecret: vaultEntry.encryptedSecret,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
      revokedAt: null,
    },
    create: {
      id: input.connectionId,
      workspaceId: input.workspaceId,
      provider: input.provider,
      displayName: providerDefinition.label,
      authType: "api_key",
      encryptedSecret: vaultEntry.encryptedSecret,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
    },
  });

  await prisma.auditEvent.create({
    data: {
      ...auditEvent,
      metadataJson: auditEvent.metadataJson as Prisma.InputJsonValue,
    },
  });

  return {
    connectionId: input.connectionId,
    provider: input.provider,
    secretFingerprint: vaultEntry.secretFingerprint,
    status: vaultEntry.status,
    auditEvent,
  };
}

export async function revokeIntegration(input: RevokeIntegrationInput) {
  const vaultEntry = revokeConnectionVaultEntry({
    provider: input.provider,
    encryptedSecret: input.encryptedSecret,
    secretFingerprint: input.secretFingerprint,
    status: "connected",
  });
  const auditEvent = buildIntegrationRevokedAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    provider: input.provider,
    targetId: input.connectionId,
  });
  const prisma = getPrismaClient();
  const providerDefinition = providerRegistry[input.provider];

  await prisma.integrationConnection.upsert({
    where: { id: input.connectionId },
    update: {
      workspaceId: input.workspaceId,
      provider: input.provider,
      displayName: providerDefinition.label,
      authType: "api_key",
      encryptedSecret: input.encryptedSecret,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
      revokedAt: vaultEntry.revokedAt,
    },
    create: {
      id: input.connectionId,
      workspaceId: input.workspaceId,
      provider: input.provider,
      displayName: providerDefinition.label,
      authType: "api_key",
      encryptedSecret: input.encryptedSecret,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
      revokedAt: vaultEntry.revokedAt,
    },
  });

  await prisma.auditEvent.create({
    data: {
      ...auditEvent,
      metadataJson: auditEvent.metadataJson as Prisma.InputJsonValue,
    },
  });

  return {
    connectionId: input.connectionId,
    provider: input.provider,
    secretFingerprint: vaultEntry.secretFingerprint,
    status: vaultEntry.status,
    revokedAt: vaultEntry.revokedAt,
    auditEvent,
  };
}
