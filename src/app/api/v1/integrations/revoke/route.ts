import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { buildIntegrationRevokedAuditEvent } from "@/modules/audit/integration-audit";
import { revokeConnectionVaultEntry } from "@/modules/integrations/connection-vault";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  workspaceId: z.string(),
  actorUserId: z.string(),
  connectionId: z.string(),
  provider: z.enum(["claude", "openai", "copilot", "openclaw"]),
  encryptedSecret: z.string(),
  secretFingerprint: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);

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

  return NextResponse.json({
    connectionId: input.connectionId,
    provider: input.provider,
    secretFingerprint: vaultEntry.secretFingerprint,
    status: vaultEntry.status,
    revokedAt: vaultEntry.revokedAt,
    auditEvent,
  });
}
