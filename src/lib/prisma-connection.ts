export const prismaRuntimeDatabaseUrlErrorMessage =
  "DATABASE_URL is not configured for Prisma runtime access.";

export const prismaCliDirectUrlErrorMessage =
  "DIRECT_URL is required for Prisma CLI commands when DATABASE_URL uses Neon's pooled connection string.";

function parseConnectionString(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    return new URL(trimmedValue);
  } catch {
    return null;
  }
}

export function isNeonConnectionString(value: string | undefined) {
  const parsedUrl = parseConnectionString(value);

  return Boolean(parsedUrl?.hostname.toLowerCase().endsWith(".neon.tech"));
}

export function isPooledNeonConnectionString(value: string | undefined) {
  const parsedUrl = parseConnectionString(value);

  return Boolean(parsedUrl && isNeonConnectionString(value) && parsedUrl.hostname.includes("-pooler."));
}

export function resolveRuntimeDatabaseUrl(databaseUrl: string | undefined) {
  const trimmedDatabaseUrl = databaseUrl?.trim();

  if (!trimmedDatabaseUrl) {
    throw new Error(prismaRuntimeDatabaseUrlErrorMessage);
  }

  return trimmedDatabaseUrl;
}

export function resolvePrismaCliDatabaseUrl({
  databaseUrl,
  directUrl,
  isGenerateCommand,
  installTimeFallbackDatabaseUrl,
}: {
  databaseUrl: string | undefined;
  directUrl: string | undefined;
  isGenerateCommand: boolean;
  installTimeFallbackDatabaseUrl: string;
}) {
  const trimmedDatabaseUrl = databaseUrl?.trim();
  const trimmedDirectUrl = directUrl?.trim();

  if (isGenerateCommand) {
    return trimmedDatabaseUrl ?? trimmedDirectUrl ?? installTimeFallbackDatabaseUrl;
  }

  if (trimmedDirectUrl) {
    return trimmedDirectUrl;
  }

  if (isPooledNeonConnectionString(trimmedDatabaseUrl)) {
    throw new Error(prismaCliDirectUrlErrorMessage);
  }

  if (trimmedDatabaseUrl) {
    return trimmedDatabaseUrl;
  }

  throw new Error(prismaRuntimeDatabaseUrlErrorMessage);
}