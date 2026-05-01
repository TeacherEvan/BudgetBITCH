export const e2eAuthOverrideCookieName = "budgetbitch:e2e-auth-state";

type CookieValue = {
  value: string;
};

type CookieStoreLike = {
  get(name: string): CookieValue | undefined;
};

function isNonProductionRuntime() {
  return process.env.NODE_ENV !== "production";
}

function hasSignedInOverrideValue(value: string | null | undefined) {
  return value?.trim() === "signed-in";
}

export function hasNonProductionSignedInE2eOverrideFromCookieHeader(
  cookieHeader: string | null | undefined,
) {
  if (!isNonProductionRuntime() || !cookieHeader) {
    return false;
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${e2eAuthOverrideCookieName}=signed-in`);
}

export function hasNonProductionSignedInE2eOverrideFromHeaders(headers: Headers) {
  return hasNonProductionSignedInE2eOverrideFromCookieHeader(headers.get("cookie"));
}

export function hasNonProductionSignedInE2eOverrideFromCookieStore(
  cookieStore: CookieStoreLike,
) {
  if (!isNonProductionRuntime()) {
    return false;
  }

  return hasSignedInOverrideValue(cookieStore.get(e2eAuthOverrideCookieName)?.value);
}