import process from "node:process";
import { defineConfig, env } from "prisma/config";

process.loadEnvFile(".env.local");
process.loadEnvFile(".env");

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
