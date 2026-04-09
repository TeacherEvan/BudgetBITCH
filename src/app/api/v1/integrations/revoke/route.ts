import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeIntegration } from "@/modules/integrations/integration-gateway";

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
  const result = await revokeIntegration(input);

  return NextResponse.json(result);
}
