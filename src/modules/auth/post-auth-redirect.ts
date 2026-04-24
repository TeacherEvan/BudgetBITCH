const fallbackPostAuthRedirect = "/auth/continue";
const safeSearchParamsByPath = {
  "/": new Set<string>(),
  "/auth/continue": new Set<string>(),
  "/dashboard": new Set(["from", "workspaceId"]),
} as const;

export function getSafePostAuthRedirect(candidate: string | null | undefined) {
  const normalized = candidate?.trim();

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallbackPostAuthRedirect;
  }

  const redirectUrl = new URL(normalized, "https://budgetbitch.local");
  const allowedSearchParams = safeSearchParamsByPath[redirectUrl.pathname as keyof typeof safeSearchParamsByPath];

  if (!allowedSearchParams) {
    return fallbackPostAuthRedirect;
  }

  const safeSearchParams = new URLSearchParams();

  for (const [key, value] of redirectUrl.searchParams.entries()) {
    if (allowedSearchParams.has(key)) {
      safeSearchParams.append(key, value);
    }
  }

  const safeQuery = safeSearchParams.toString();

  return safeQuery ? `${redirectUrl.pathname}?${safeQuery}` : redirectUrl.pathname;
}