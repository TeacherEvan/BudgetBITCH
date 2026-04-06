import { buildIntegrationConnectedAuditEvent } from "@/modules/audit/integration-audit";
import { createConnectionVaultEntry } from "@/modules/integrations/connection-vault";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  workspaceId: z.string(),
  actorUserId: z.string(),
  connectionId: z.string(),
  provider: z.enum(["claude", "openai", "copilot", "openclaw"]),
  secret: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);
  const encryptionKey = process.env.PROVIDER_SECRET_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return NextResponse.json(
      {
        error:
          "PROVIDER_SECRET_ENCRYPTION_KEY is not configured on the server.",
      },
      { status: 500 },
    );
  }

  const vaultEntry = createConnectionVaultEntry({
    provider: input.provider,
    secret: input.secret,
    encryptionKey,
  });

  const auditEvent = buildIntegrationConnectedAuditEvent({
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
    auditEvent,
  });
}
