import { parsePublishableKey } from "@clerk/shared/keys";

export const clerkConfigurationErrorMessage =
  "Clerk authentication is not configured on the server.";

export const clerkJwtIssuerDomainErrorMessage =
  "CLERK_JWT_ISSUER_DOMAIN is not configured for Convex authentication.";

function hasPlaceholderValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return false;
  }

  return /replace_me|your-app/i.test(trimmedValue);
}

export function getClerkFrontendHost(value: string | undefined) {
  const publishableKey = value?.trim();

  if (!publishableKey || hasPlaceholderValue(publishableKey)) {
    return null;
  }

  if (!/^pk_(test|live)_.+$/.test(publishableKey)) {
    return null;
  }

  const decodedHost = parsePublishableKey(publishableKey)?.frontendApi?.trim();

  if (!decodedHost || !/^[a-z0-9.-]+$/i.test(decodedHost) || !decodedHost.includes(".")) {
    return null;
  }

  return decodedHost;
}

function isClerkPublishableKeyConfigured(value: string | undefined) {
  return Boolean(getClerkFrontendHost(value));
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return isClerkPublishableKeyConfigured(publishableKey) && isClerkSatelliteConfigured();
}

export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  return Boolean(secretKey && !hasPlaceholderValue(secretKey)) &&
    isClerkPublishableKeyConfigured(publishableKey) &&
    isClerkSatelliteConfigured();
}

export function getClerkJwtIssuerDomain() {
  const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

  if (!issuerDomain) {
    throw new Error(clerkJwtIssuerDomainErrorMessage);
  }

  return issuerDomain.replace(/\/+$/, "");
}
