import { describe, expect, it } from "vitest";
import {
  isLocalConnectionString,
  isNeonConnectionString,
  isPooledNeonConnectionString,
  prismaCliDirectUrlErrorMessage,
  prismaCliProductionLocalhostUrlErrorMessage,
  prismaRuntimeDatabaseUrlErrorMessage,
  resolvePrismaCliDatabaseUrl,
  resolveRuntimeDatabaseUrl,
} from "./prisma-connection";

describe("prisma connection helpers", () => {
  it("detects Neon connection strings and pooled Neon hosts", () => {
    expect(
      isNeonConnectionString(
        "postgresql://budgetbitch:test@ep-cool-darkness-123456.us-east-2.aws.neon.tech/app?sslmode=require",
      ),
    ).toBe(true);
    expect(
      isPooledNeonConnectionString(
        "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
      ),
    ).toBe(true);
    expect(
      isPooledNeonConnectionString(
        "postgresql://budgetbitch:test@localhost:5432/app",
      ),
    ).toBe(false);
    expect(
      isLocalConnectionString("postgresql://budgetbitch:test@localhost:5432/app"),
    ).toBe(true);
  });

  it("throws a clear runtime error when DATABASE_URL is missing", () => {
    expect(() => resolveRuntimeDatabaseUrl("")).toThrow(prismaRuntimeDatabaseUrlErrorMessage);
  });

  it("requires DIRECT_URL for non-generate Prisma CLI commands when DATABASE_URL is pooled Neon", () => {
    expect(() =>
      resolvePrismaCliDatabaseUrl({
        databaseUrl:
          "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
        directUrl: undefined,
        isGenerateCommand: false,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
      }),
    ).toThrow(prismaCliDirectUrlErrorMessage);
  });

  it("prefers DIRECT_URL for non-generate Prisma CLI commands", () => {
    expect(
      resolvePrismaCliDatabaseUrl({
        databaseUrl:
          "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
        directUrl:
          "postgresql://budgetbitch:test@ep-cool-darkness-123456.us-east-2.aws.neon.tech/app?sslmode=require",
        isGenerateCommand: false,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
      }),
    ).toBe(
      "postgresql://budgetbitch:test@ep-cool-darkness-123456.us-east-2.aws.neon.tech/app?sslmode=require",
    );
  });

  it("rejects localhost database URLs for production Prisma CLI commands", () => {
    expect(() =>
      resolvePrismaCliDatabaseUrl({
        databaseUrl: "postgresql://budgetbitch:test@localhost:5432/app",
        directUrl: undefined,
        isGenerateCommand: false,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
        rejectLocalhostForProduction: true,
      }),
    ).toThrow(prismaCliProductionLocalhostUrlErrorMessage);

    expect(() =>
      resolvePrismaCliDatabaseUrl({
        databaseUrl: "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
        directUrl: "postgresql://budgetbitch:test@127.0.0.1:5432/app",
        isGenerateCommand: false,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
        rejectLocalhostForProduction: true,
      }),
    ).toThrow(prismaCliProductionLocalhostUrlErrorMessage);
  });

  it("allows prisma generate to use the runtime URL or fallback", () => {
    expect(
      resolvePrismaCliDatabaseUrl({
        databaseUrl:
          "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
        directUrl: undefined,
        isGenerateCommand: true,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
      }),
    ).toBe(
      "postgresql://budgetbitch:test@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/app?sslmode=require",
    );
    expect(
      resolvePrismaCliDatabaseUrl({
        databaseUrl: undefined,
        directUrl: undefined,
        isGenerateCommand: true,
        installTimeFallbackDatabaseUrl: "postgresql://placeholder:placeholder@localhost:5432/budgetbitch",
      }),
    ).toBe("postgresql://placeholder:placeholder@localhost:5432/budgetbitch");
  });
});