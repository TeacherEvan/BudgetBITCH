import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAuthenticatedUserDisplayName,
  getAuthenticatedUserEmail,
  getAuthenticatedUserId,
} from "@/lib/auth/session";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";

const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires a verified Google email account before local setup can finish.";

export async function POST() {
  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const email = getAuthenticatedUserEmail(session);

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
      displayName: getAuthenticatedUserDisplayName(session),
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