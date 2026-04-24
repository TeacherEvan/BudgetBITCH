import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";
import {
  getClerkUserDisplayName,
  getClerkUserEmail,
  missingClerkUserEmailErrorMessage,
} from "@/modules/auth/clerk-user";

export async function POST() {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: clerkConfigurationErrorMessage },
      { status: 503 },
    );
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const user = await currentUser();
  const email = getClerkUserEmail(user);

  if (!email) {
    return NextResponse.json(
      { error: missingClerkUserEmailErrorMessage },
      { status: 400 },
    );
  }

  try {
    const result = await bootstrapUser({
      clerkUserId: userId,
      email,
      displayName: getClerkUserDisplayName(user),
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