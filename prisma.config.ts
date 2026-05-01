import { existsSync } from "node:fs";
import process from "node:process";
import { defineConfig, env } from "prisma/config";
import { resolvePrismaCliDatabaseUrl } from "./src/lib/prisma-connection";

const loadEnvFileIfPresent = (path: string) => {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
};

loadEnvFileIfPresent(".env.local");
loadEnvFileIfPresent(".env");

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const prismaCommand = process.argv.slice(2).join(" ");
const isGenerateCommand = prismaCommand.includes("generate");
const installTimeFallbackDatabaseUrl =
  "postgresql://placeholder:placeholder@localhost:5432/budgetbitch";
const resolvedDatabaseUrl = resolvePrismaCliDatabaseUrl({
  databaseUrl: databaseUrl ?? env("DATABASE_URL"),
  directUrl,
  isGenerateCommand,
  installTimeFallbackDatabaseUrl,
});

process.env.DATABASE_URL ??= resolvedDatabaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolvedDatabaseUrl,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
