import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaRuntimeDatabaseUrlErrorMessage } from "./prisma-connection";

const prismaClientMock = vi.fn();
const prismaPgMock = vi.fn();

vi.mock("@prisma/client", () => ({
  PrismaClient: prismaClientMock,
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: prismaPgMock,
}));

describe("getPrismaClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    prismaClientMock.mockReset();
    prismaPgMock.mockReset();

    prismaPgMock.mockImplementation(function PrismaPg(
      this: { connectionString?: string },
      connectionString: string,
    ) {
      this.connectionString = connectionString;
    });
    prismaClientMock.mockImplementation(function PrismaClient(
      this: { adapter?: unknown; marker?: string },
      { adapter }: { adapter: unknown },
    ) {
      this.adapter = adapter;
      this.marker = "prisma-client";
    });

    (
      globalThis as typeof globalThis & { __budgetBitchPrisma__?: unknown }
    ).__budgetBitchPrisma__ = undefined;
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const { getPrismaClient } = await import("./prisma");

    expect(() => getPrismaClient()).toThrow(prismaRuntimeDatabaseUrlErrorMessage);
    expect(prismaPgMock).not.toHaveBeenCalled();
    expect(prismaClientMock).not.toHaveBeenCalled();
  });

  it("creates one singleton client and reuses it on subsequent calls", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://budgetbitch:test@localhost:5432/app",
    );

    const { getPrismaClient } = await import("./prisma");
    const first = getPrismaClient();
    const second = getPrismaClient();

    expect(prismaPgMock).toHaveBeenCalledWith(
      "postgres://budgetbitch:test@localhost:5432/app",
    );
    expect(prismaClientMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("warns once when DATABASE_URL points at a direct Neon host", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://budgetbitch:test@ep-cool-darkness-123456.us-east-2.aws.neon.tech/app?sslmode=require",
    );

    const { getPrismaClient } = await import("./prisma");

    getPrismaClient();
    getPrismaClient();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "DATABASE_URL points at a direct Neon host. Use the pooled Neon connection string for runtime traffic and reserve DIRECT_URL for Prisma CLI commands.",
    );
  });

  it("does not warn when DATABASE_URL already uses a pooled Neon host", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
    );

    const { getPrismaClient } = await import("./prisma");

    getPrismaClient();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
