import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  isNeonConnectionString,
  isPooledNeonConnectionString,
  resolveRuntimeDatabaseUrl,
} from "./prisma-connection";

declare global {
  var __budgetBitchPrisma__: PrismaClient | undefined;
}

let hasWarnedAboutDirectNeonRuntimeUrl = false;

function warnAboutDirectNeonRuntimeUrl(databaseUrl: string) {
  if (process.env.NODE_ENV === "test" || hasWarnedAboutDirectNeonRuntimeUrl) {
    return;
  }

  if (!isNeonConnectionString(databaseUrl) || isPooledNeonConnectionString(databaseUrl)) {
    return;
  }

  hasWarnedAboutDirectNeonRuntimeUrl = true;
  console.warn(
    "DATABASE_URL points at a direct Neon host. Use the pooled Neon connection string for runtime traffic and reserve DIRECT_URL for Prisma CLI commands.",
  );
}

function createPrismaClient() {
  const databaseUrl = resolveRuntimeDatabaseUrl(process.env.DATABASE_URL);

  warnAboutDirectNeonRuntimeUrl(databaseUrl);

  const adapter = new PrismaPg(databaseUrl);

  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  if (!globalThis.__budgetBitchPrisma__) {
    globalThis.__budgetBitchPrisma__ = createPrismaClient();
  }

  return globalThis.__budgetBitchPrisma__;
}
