export const clerkConfigurationErrorMessage =
  "Clerk authentication is not configured on the server.";

export const clerkJwtIssuerDomainErrorMessage =
  "CLERK_JWT_ISSUER_DOMAIN is not configured for Convex authentication.";

function isLikelyClerkKey(key: string | undefined, prefix: "pk" | "sk") {
  const trimmedKey = key?.trim();

  if (!trimmedKey) {
    return false;
  }

  return new RegExp(`^${prefix}_(test|live)_[A-Za-z0-9_-]{20,}$`).test(trimmedKey);
}

export function isClerkPublishableKeyConfigured() {
  return isLikelyClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, "pk");
}

export function isClerkSecretKeyConfigured() {
  return isLikelyClerkKey(process.env.CLERK_SECRET_KEY, "sk");
}

export function isClerkSatelliteConfigured() {
  if (process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE?.trim() !== "true") {
    return true;
  }

  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim() ||
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim(),
  );
}

export function isClerkClientConfigured() {
  return isClerkPublishableKeyConfigured() && isClerkSatelliteConfigured();
}

export function isClerkConfigured() {
  return isClerkClientConfigured() && isClerkSecretKeyConfigured();
}

export function getClerkJwtIssuerDomain() {
  const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

  if (!issuerDomain) {
    throw new Error(clerkJwtIssuerDomainErrorMessage);
  }

  return issuerDomain.replace(/\/+$/, "");
}
