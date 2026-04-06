import { existsSync } from "node:fs";
import process from "node:process";
import { defineConfig, env } from "prisma/config";

const loadEnvFileIfPresent = (path: string) => {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
};

loadEnvFileIfPresent(".env.local");
loadEnvFileIfPresent(".env");

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl ?? databaseUrl ?? env("DATABASE_URL"),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
