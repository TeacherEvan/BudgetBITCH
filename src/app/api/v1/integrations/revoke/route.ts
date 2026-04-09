import { NextResponse } from "next/server";
import { z } from "zod";
import {
  IntegrationRouteGuardError,
  authorizeIntegrationMutation,
} from "@/lib/auth/integration-route-guard";
import {
  IntegrationGatewayError,
  revokeIntegration,
} from "@/modules/integrations/integration-gateway";

const schema = z.object({
  workspaceId: z.string().trim().min(1),
  provider: z.enum(["claude", "openai", "copilot", "openclaw"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const actor = await authorizeIntegrationMutation(input.workspaceId);
    const result = await revokeIntegration({
      workspaceId: actor.workspaceId,
      actorUserId: actor.actorUserId,
      provider: input.provider,
    });

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
