import { NextResponse } from "next/server";
import { normalizeHomeAreaInput } from "@/modules/accounting/accounting-schema";
import {
  createWorkspaceApiAccessErrorResponse,
  resolveWorkspaceApiAccess,
} from "@/lib/auth/workspace-api-access";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, ...locationInput } = body as Record<string, unknown> & {
      workspaceId?: unknown;
    };

    if (typeof workspaceId !== "string" || workspaceId.trim().length === 0) {
      return NextResponse.json({ error: "A workspaceId is required." }, { status: 400 });
    }

    const access = await resolveWorkspaceApiAccess(workspaceId);
    const input = normalizeHomeAreaInput(locationInput);

    if (!input.consented) {
      return NextResponse.json(
        { error: "Location consent is required before storing a home area." },
        { status: 400 },
      );
    }

    if (access.accessMode === "demo") {
      return NextResponse.json({
        homeLocation: {
          id: "demo-home-location",
          workspaceId: access.workspaceId,
          city: input.city,
          stateCode: input.stateCode,
          countryCode: input.countryCode,
          source: "user_selected",
        },
      });
    }

    const prisma = getPrismaClient();
    const homeLocation = await prisma.workspaceHomeLocation.upsert({
      where: {
        workspaceId_city_stateCode_countryCode: {
          workspaceId: access.workspaceId,
          city: input.city,
          stateCode: input.stateCode,
          countryCode: input.countryCode,
        },
      },
      update: {
        consentedAt: new Date(),
        source: "user_selected",
      },
      create: {
        workspaceId: access.workspaceId,
        city: input.city,
        stateCode: input.stateCode,
        countryCode: input.countryCode,
        consentedAt: new Date(),
        source: "user_selected",
      },
      select: {
        id: true,
        workspaceId: true,
        city: true,
        stateCode: true,
        countryCode: true,
        source: true,
      },
    });

    return NextResponse.json({ homeLocation });
  } catch (error) {
    const accessErrorResponse = createWorkspaceApiAccessErrorResponse(error);

    if (accessErrorResponse) {
      return accessErrorResponse;
    }

    throw error;
  }
}