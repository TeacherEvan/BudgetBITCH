import { NextResponse } from "next/server";
import { z } from "zod";
import { connectIntegration } from "@/modules/integrations/integration-gateway";

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

  const result = await connectIntegration(input, { encryptionKey });

  return NextResponse.json(result);
}
