import { auth, currentUser } from "@clerk/nextjs/server";

export type RequestAuth = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
};

function isExplicitPlaywrightBypassEnabled() {
  return (
    process.env.NODE_ENV === "test" &&
    process.env.E2E_BYPASS_AUTH === "true" &&
    process.env.E2E_BYPASS_AUTH_SOURCE === "playwright"
  );
}

export async function getRequestAuth(): Promise<RequestAuth> {
  if (isExplicitPlaywrightBypassEnabled()) {
    return {
      userId: process.env.E2E_TEST_CLERK_USER_ID ?? "clerk_e2e_user",
      email: process.env.E2E_TEST_EMAIL ?? "start-smart-e2e@example.com",
      displayName: process.env.E2E_TEST_NAME ?? "Start Smart E2E",
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      email: null,
      displayName: null,
    };
  }

  const clerkUser = await currentUser();

  return {
    userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    displayName: clerkUser?.fullName ?? clerkUser?.username ?? null,
  };
}