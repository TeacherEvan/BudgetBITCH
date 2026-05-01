export function isAbsoluteHttpUrl(value: string | undefined | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeConvexCloudUrl(value: string | undefined | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  if (isAbsoluteHttpUrl(trimmedValue)) {
    return trimmedValue;
  }

  const convexCloudHost = trimmedValue.match(/^([a-z0-9-]+\.convex\.cloud)\/?$/i);

  if (convexCloudHost) {
    return `https://${convexCloudHost[1].toLowerCase()}`;
  }

  const convexDeployment = trimmedValue.match(/^(?:prod:|dev:)?([a-z0-9][a-z0-9-]*[a-z0-9])$/i);

  if (convexDeployment) {
    return `https://${convexDeployment[1].toLowerCase()}.convex.cloud`;
  }

  return null;
}
