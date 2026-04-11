import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, "../..");
const prismaCliEntrypoint = path.join(repositoryRoot, "node_modules", "prisma", "build", "index.js");

describe("Prisma generate install path", () => {
  it("succeeds without explicit database env vars", () => {
    const result = spawnSync(process.execPath, [prismaCliEntrypoint, "generate"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "",
        DIRECT_URL: "",
        SHADOW_DATABASE_URL: "",
      },
    });

    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

    if (result.status !== 0) {
      throw new Error(output);
    }

    expect(output).toContain("Generated Prisma Client");
  }, 15_000);
});
