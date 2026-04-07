import { beforeEach, describe, expect, it, vi } from "vitest";

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

    expect(() => getPrismaClient()).toThrow(
      "DATABASE_URL is not configured for Prisma runtime access.",
    );
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
});
