import { NextResponse } from "next/server";
import { getConvexAuthenticatedIdentity, syncConvexLocalProfile } from "@/lib/auth/convex-session";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";

const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires an email-backed account before local setup can finish.";

export async function POST() {
  const identity = await getConvexAuthenticatedIdentity();

  if (!identity) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const userId = identity.tokenIdentifier;
  const email = identity.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json(
      { error: missingAuthenticatedUserEmailErrorMessage },
      { status: 400 },
    );
  }

  try {
    const result = await bootstrapUser({
      clerkUserId: userId,
      email,
      displayName: identity.name,
    });

    await syncConvexLocalProfile({
      profileId: result.userId,
      email,
      displayName: identity.name,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === bootstrapUserLinkConflictErrorMessage
    ) {
      return NextResponse.json(
        { error: bootstrapUserLinkConflictErrorMessage },
        { status: 409 },
      );
    }

    throw error;
  }
}