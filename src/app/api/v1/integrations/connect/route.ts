import { NextResponse } from "next/server";
import { z } from "zod";
import {
  IntegrationRouteGuardError,
  authorizeIntegrationMutation,
} from "@/lib/auth/integration-route-guard";
import {
  IntegrationGatewayError,
  connectIntegration,
} from "@/modules/integrations/integration-gateway";

const schema = z.object({
  workspaceId: z.string().trim().min(1),
  provider: z.enum(["claude", "openai", "copilot", "openclaw"]),
  secret: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const encryptionKey = process.env.PROVIDER_SECRET_ENCRYPTION_KEY;

    if (!encryptionKey) {
      return NextResponse.json(
        {
          error: "PROVIDER_SECRET_ENCRYPTION_KEY is not configured on the server.",
        },
        { status: 500 },
      );
    }

    const actor = await authorizeIntegrationMutation(input.workspaceId);
    const result = await connectIntegration(
      {
        workspaceId: actor.workspaceId,
        actorUserId: actor.actorUserId,
        provider: input.provider,
        secret: input.secret,
      },
      { encryptionKey },
    );

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof IntegrationRouteGuardError ||
      error instanceof IntegrationGatewayError
    ) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
