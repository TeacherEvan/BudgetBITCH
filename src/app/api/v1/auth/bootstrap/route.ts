import { NextResponse } from "next/server";
import {
  authBootstrapAuthenticationRequiredMessage,
  getConvexAuthenticatedIdentity,
  isAuthBootstrapError,
  syncConvexLocalProfile,
  toAuthBootstrapErrorResponse,
} from "@/lib/auth/convex-session";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";

const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires an email-backed account before local setup can finish.";

function authBootstrapJsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}


export async function POST() {
  let identity;

  try {
    identity = await getConvexAuthenticatedIdentity();
  } catch (error) {
    if (isAuthBootstrapError(error)) {
      return NextResponse.json(toAuthBootstrapErrorResponse(error), {
        status: error.status,
      });
    }

    throw error;
  }

  if (!identity) {
    return authBootstrapJsonError(
      "missing-session",
      authBootstrapAuthenticationRequiredMessage,
      401,
    );
  }

  const userId = identity.tokenIdentifier;
  const email = identity.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return authBootstrapJsonError(
      "missing-email",
      missingAuthenticatedUserEmailErrorMessage,
      400,
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
      displayName: identity.name,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === bootstrapUserLinkConflictErrorMessage
    ) {
      return authBootstrapJsonError(
        "relink-conflict",
        bootstrapUserLinkConflictErrorMessage,
        409,
      );
    }

    if (isAuthBootstrapError(error)) {
      return NextResponse.json(toAuthBootstrapErrorResponse(error), {
        status: error.status,
      });
    }

    throw error;
  }
}