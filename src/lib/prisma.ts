import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __budgetBitchPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured for Prisma runtime access.",
    );
  }

  const adapter = new PrismaPg(databaseUrl);

  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  if (!globalThis.__budgetBitchPrisma__) {
    globalThis.__budgetBitchPrisma__ = createPrismaClient();
  }

  return globalThis.__budgetBitchPrisma__;
}
