import { NextResponse } from "next/server";
import { z } from "zod";
import {
  WorkspaceRouteGuardError,
  authorizeWorkspaceMutation,
} from "@/lib/auth/workspace-route-guard";
import { submitDailyCheckIn } from "@/modules/check-ins/submit-daily-check-in";

const schema = z.object({
  workspaceId: z.string().trim().min(1),
  checkInDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedSpend: z.number().finite().nonnegative(),
  categorySpending: z
    .array(
      z.object({
        categoryId: z.string().trim().min(1),
        spent: z.number().finite().nonnegative(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const actor = await authorizeWorkspaceMutation(input.workspaceId);
    const result = await submitDailyCheckIn({
      workspaceId: actor.workspaceId,
      actorUserId: actor.actorUserId,
      checkInDate: input.checkInDate,
      plannedSpend: input.plannedSpend,
      categorySpending: input.categorySpending,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspaceRouteGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
