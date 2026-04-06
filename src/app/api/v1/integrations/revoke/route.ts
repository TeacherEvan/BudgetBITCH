import { buildIntegrationRevokedAuditEvent } from "@/modules/audit/integration-audit";
import { revokeConnectionVaultEntry } from "@/modules/integrations/connection-vault";
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

  return NextResponse.json({
    connectionId: input.connectionId,
    provider: input.provider,
    secretFingerprint: vaultEntry.secretFingerprint,
    status: vaultEntry.status,
    revokedAt: vaultEntry.revokedAt,
    auditEvent,
  });
}
