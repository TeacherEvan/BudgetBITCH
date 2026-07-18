import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// Convex function tests require the edge-runtime environment.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: true,
    include: ["convex/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "./src"),
    },
  },
});
