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
  provider: keyof typeof providerRegistry;
  secret: string;
};

export type RevokeIntegrationInput = {
  workspaceId: string;
  actorUserId: string;
  provider: keyof typeof providerRegistry;
};

export class IntegrationGatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "IntegrationGatewayError";
  }
}

type IntegrationConnectionLookupClient = Pick<
  ReturnType<typeof getPrismaClient>,
  "integrationConnection"
>;

async function loadWorkspaceProviderConnection(
  client: IntegrationConnectionLookupClient,
  workspaceId: string,
  provider: keyof typeof providerRegistry,
) {
  const connections = await client.integrationConnection.findMany({
    where: { workspaceId, provider },
    orderBy: { updatedAt: "desc" },
    take: 2,
  });

  if (connections.length > 1) {
    throw new IntegrationGatewayError(
      "Multiple integration records exist for this workspace and provider.",
      409,
    );
  }

  return connections[0] ?? null;
}

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
  const prisma = getPrismaClient();
  const providerDefinition = providerRegistry[input.provider];

  return prisma.$transaction(async (tx) => {
    const existingConnection = await loadWorkspaceProviderConnection(
      tx,
      input.workspaceId,
      input.provider,
    );
    const savedConnection = existingConnection
      ? await tx.integrationConnection.update({
          where: { id: existingConnection.id },
          data: {
            workspaceId: input.workspaceId,
            provider: input.provider,
            displayName: providerDefinition.label,
            authType: "api_key",
            encryptedSecret: vaultEntry.encryptedSecret,
            secretFingerprint: vaultEntry.secretFingerprint,
            status: vaultEntry.status,
            revokedAt: null,
          },
        })
      : await tx.integrationConnection.create({
          data: {
            workspaceId: input.workspaceId,
            provider: input.provider,
            displayName: providerDefinition.label,
            authType: "api_key",
            encryptedSecret: vaultEntry.encryptedSecret,
            secretFingerprint: vaultEntry.secretFingerprint,
            status: vaultEntry.status,
          },
        });

    const auditEvent = buildIntegrationConnectedAuditEvent({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      provider: input.provider,
      targetId: savedConnection.id,
    });

    await tx.auditEvent.create({
      data: {
        ...auditEvent,
        metadataJson: auditEvent.metadataJson as Prisma.InputJsonValue,
      },
    });

    return {
      connectionId: savedConnection.id,
      provider: input.provider,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
      auditEvent,
    };
  });
}

export async function revokeIntegration(input: RevokeIntegrationInput) {
  const prisma = getPrismaClient();
  const providerDefinition = providerRegistry[input.provider];

  return prisma.$transaction(async (tx) => {
    const existingConnection = await loadWorkspaceProviderConnection(
      tx,
      input.workspaceId,
      input.provider,
    );

    if (!existingConnection) {
      throw new IntegrationGatewayError(
        "No integration connection exists for this workspace and provider.",
        404,
      );
    }

    if (!existingConnection.encryptedSecret || !existingConnection.secretFingerprint) {
      throw new IntegrationGatewayError(
        "The stored integration secret is incomplete and cannot be revoked.",
        409,
      );
    }

    const vaultEntry = revokeConnectionVaultEntry({
      provider: input.provider,
      encryptedSecret: existingConnection.encryptedSecret,
      secretFingerprint: existingConnection.secretFingerprint,
      status: existingConnection.status === "revoked" ? "revoked" : "connected",
    });

    const savedConnection = await tx.integrationConnection.update({
      where: { id: existingConnection.id },
      data: {
        workspaceId: input.workspaceId,
        provider: input.provider,
        displayName: providerDefinition.label,
        authType: "api_key",
        encryptedSecret: existingConnection.encryptedSecret,
        secretFingerprint: vaultEntry.secretFingerprint,
        status: vaultEntry.status,
        revokedAt: vaultEntry.revokedAt,
      },
    });

    const auditEvent = buildIntegrationRevokedAuditEvent({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      provider: input.provider,
      targetId: savedConnection.id,
    });

    await tx.auditEvent.create({
      data: {
        ...auditEvent,
        metadataJson: auditEvent.metadataJson as Prisma.InputJsonValue,
      },
    });

    return {
      connectionId: savedConnection.id,
      provider: input.provider,
      secretFingerprint: vaultEntry.secretFingerprint,
      status: vaultEntry.status,
      revokedAt: vaultEntry.revokedAt,
      auditEvent,
    };
  });
}
