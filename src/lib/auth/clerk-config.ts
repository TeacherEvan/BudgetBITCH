export const clerkConfigurationErrorMessage =
  "Clerk authentication is not configured on the server.";

export const clerkJwtIssuerDomainErrorMessage =
  "CLERK_JWT_ISSUER_DOMAIN is not configured for Convex authentication.";

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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  return Boolean(publishableKey) && isClerkSatelliteConfigured();
}

export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  return Boolean(publishableKey && secretKey) && isClerkSatelliteConfigured();
}

export function getClerkJwtIssuerDomain() {
  const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

  if (!issuerDomain) {
    throw new Error(clerkJwtIssuerDomainErrorMessage);
  }

  return issuerDomain.replace(/\/+$/, "");
}
