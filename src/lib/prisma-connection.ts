export const prismaRuntimeDatabaseUrlErrorMessage =
  "DATABASE_URL is not configured for Prisma runtime access.";

export const prismaCliDirectUrlErrorMessage =
  "DIRECT_URL is required for Prisma CLI commands when DATABASE_URL uses Neon's pooled connection string.";

export const prismaCliProductionLocalhostUrlErrorMessage =
  "Production Prisma CLI commands cannot use a localhost DATABASE_URL or DIRECT_URL. Set Vercel DATABASE_URL to the pooled connection string and DIRECT_URL to the direct Postgres connection string.";

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

export function isLocalConnectionString(value: string | undefined) {
  const parsedUrl = parseConnectionString(value);

  if (!parsedUrl) {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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
  rejectLocalhostForProduction = false,
}: {
  databaseUrl: string | undefined;
  directUrl: string | undefined;
  isGenerateCommand: boolean;
  installTimeFallbackDatabaseUrl: string;
  rejectLocalhostForProduction?: boolean;
}) {
  const trimmedDatabaseUrl = databaseUrl?.trim();
  const trimmedDirectUrl = directUrl?.trim();

  if (isGenerateCommand) {
    return trimmedDatabaseUrl ?? trimmedDirectUrl ?? installTimeFallbackDatabaseUrl;
  }

  if (trimmedDirectUrl) {
    if (rejectLocalhostForProduction && isLocalConnectionString(trimmedDirectUrl)) {
      throw new Error(prismaCliProductionLocalhostUrlErrorMessage);
    }

    return trimmedDirectUrl;
  }

  if (isPooledNeonConnectionString(trimmedDatabaseUrl)) {
    throw new Error(prismaCliDirectUrlErrorMessage);
  }

  if (trimmedDatabaseUrl) {
    if (rejectLocalhostForProduction && isLocalConnectionString(trimmedDatabaseUrl)) {
      throw new Error(prismaCliProductionLocalhostUrlErrorMessage);
    }

    return trimmedDatabaseUrl;
  }

  throw new Error(prismaRuntimeDatabaseUrlErrorMessage);
}