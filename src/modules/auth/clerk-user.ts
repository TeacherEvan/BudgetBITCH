type ClerkEmailAddress = {
  emailAddress?: string | null;
  verification?: {
    status?: string | null;
  } | null;
};

type ClerkUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: ClerkEmailAddress | null;
  emailAddresses?: ClerkEmailAddress[] | null;
} | null | undefined;

export const missingClerkUserEmailErrorMessage =
  "BudgetBITCH requires a verified email-backed Clerk account before local setup can finish.";

export function getClerkUserDisplayName(user: ClerkUserLike) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return fullName || user?.username?.trim() || null;
}

export function getClerkUserEmail(user: ClerkUserLike) {
  const candidates = [user?.primaryEmailAddress, ...(user?.emailAddresses ?? [])];

  for (const candidate of candidates) {
    if (candidate?.verification?.status !== "verified") {
      continue;
    }

    const emailAddress = candidate.emailAddress?.trim();

    if (emailAddress) {
      return emailAddress;
    }
  }

  return "";
}