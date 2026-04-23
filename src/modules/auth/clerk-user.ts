type ClerkEmailAddress = {
  emailAddress?: string | null;
};

type ClerkUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: ClerkEmailAddress | null;
  emailAddresses?: ClerkEmailAddress[] | null;
} | null | undefined;

export const missingClerkUserEmailErrorMessage =
  "BudgetBITCH requires an email-backed Clerk account before local setup can finish.";

export function getClerkUserDisplayName(user: ClerkUserLike) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return fullName || user?.username?.trim() || null;
}

export function getClerkUserEmail(user: ClerkUserLike) {
  return user?.primaryEmailAddress?.emailAddress?.trim() ??
    user?.emailAddresses?.[0]?.emailAddress?.trim() ??
    "";
}