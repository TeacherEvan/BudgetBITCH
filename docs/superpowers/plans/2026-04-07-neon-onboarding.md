# Neon Onboarding Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the root BudgetBITCH app running cleanly against Neon project `bold-fog-67864585` in org `org-bold-mouse-11702997` with a repeatable local setup, explicit pooled/direct connection handling, and one command to verify both connections before Prisma work.

**Architecture:** Keep the app’s existing Prisma runtime split intact: `DATABASE_URL` remains the pooled runtime connection, `DIRECT_URL` remains the direct Prisma CLI connection, and `SHADOW_DATABASE_URL` stays optional for local `prisma migrate dev`. Add one small Neon env parser plus one standalone Node verification script so onboarding errors are caught before the app boots or migrations run.

**Tech Stack:** Node 22, Next.js 16, Prisma 7, PostgreSQL, Neon, Vitest, `pg`

---

## File Map

- Create: `scripts/db/neon-config.mjs` — parses and validates Neon env values for pooled/direct/shadow usage.
- Create: `scripts/db/neon-config.test.mjs` — verifies the Neon env parser and error messages.
- Create: `scripts/db/check-neon.mjs` — connects with both `DATABASE_URL` and `DIRECT_URL` and prints a short verification summary.
- Modify: `package.json` — adds `db:check` for local Neon verification.
- Modify: `.env.example` — tightens the Neon comments around project `bold-fog-67864585` and clarifies pooled vs direct values.
- Modify: `README.md` — adds a short “Start with Neon” flow and safe migration guidance.
- Modify: `docs/CODEBASE_INDEX.md` — indexes the new Neon helper and verification script.
- Modify: `docs/DEV_TREE.md` — adds `scripts/db/**` to the orientation tree.

### Task 1: Add A Small Neon Env Parser

**Files:**
- Create: `scripts/db/neon-config.mjs`
- Create: `scripts/db/neon-config.test.mjs`

- [ ] **Step 1: Write the failing Neon env parser tests**

```js
// scripts/db/neon-config.test.mjs
import { describe, expect, it } from "vitest";

import { parseNeonConfig } from "./neon-config.mjs";

describe("parseNeonConfig", () => {
  it("accepts a pooled DATABASE_URL and a direct DIRECT_URL", () => {
    expect(
      parseNeonConfig({
        DATABASE_URL:
          "postgresql://user:pass@ep-cool-rain-a1b2c3-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require",
        DIRECT_URL:
          "postgresql://user:pass@ep-cool-rain-a1b2c3.eu-west-1.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toEqual({
      databaseUrl:
        "postgresql://user:pass@ep-cool-rain-a1b2c3-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require",
      directUrl:
        "postgresql://user:pass@ep-cool-rain-a1b2c3.eu-west-1.aws.neon.tech/neondb?sslmode=require",
      shadowDatabaseUrl: null,
      usesShadowDatabase: false,
    });
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() =>
      parseNeonConfig({
        DIRECT_URL:
          "postgresql://user:pass@ep-cool-rain-a1b2c3.eu-west-1.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toThrow("DATABASE_URL is required.");
  });

  it("rejects a pooled DIRECT_URL", () => {
    expect(() =>
      parseNeonConfig({
        DATABASE_URL:
          "postgresql://user:pass@ep-cool-rain-a1b2c3-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require",
        DIRECT_URL:
          "postgresql://user:pass@ep-cool-rain-a1b2c3-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toThrow("DIRECT_URL must use the direct Neon host, not the pooler host.");
  });
});
```

- [ ] **Step 2: Run the focused test to confirm it fails first**

Run: `npm test -- scripts/db/neon-config.test.mjs -v`
Expected: FAIL with `Cannot find module './neon-config.mjs'`

- [ ] **Step 3: Implement the Neon env parser**

```js
// scripts/db/neon-config.mjs
const pooledHostPattern = /-pooler\./;
const neonHostPattern = /\.neon\.tech$/;

function requireConnectionString(name, value) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${name} is required.`);
  }

  return trimmed;
}

function parseConnectionUrl(name, value) {
  const connectionString = requireConnectionString(name, value);
  const url = new URL(connectionString);

  if (!neonHostPattern.test(url.hostname)) {
    throw new Error(`${name} must point to a Neon host ending in .neon.tech.`);
  }

  return { connectionString, url };
}

export function parseNeonConfig(env = process.env) {
  const database = parseConnectionUrl("DATABASE_URL", env.DATABASE_URL);
  const direct = parseConnectionUrl("DIRECT_URL", env.DIRECT_URL);
  const shadowValue = env.SHADOW_DATABASE_URL?.trim() || null;

  if (!pooledHostPattern.test(database.url.hostname)) {
    throw new Error("DATABASE_URL must use the Neon pooled host.");
  }

  if (pooledHostPattern.test(direct.url.hostname)) {
    throw new Error("DIRECT_URL must use the direct Neon host, not the pooler host.");
  }

  if (shadowValue) {
    const shadow = parseConnectionUrl("SHADOW_DATABASE_URL", shadowValue);

    if (pooledHostPattern.test(shadow.url.hostname)) {
      throw new Error("SHADOW_DATABASE_URL must use a direct Neon host.");
    }
  }

  return {
    databaseUrl: database.connectionString,
    directUrl: direct.connectionString,
    shadowDatabaseUrl: shadowValue,
    usesShadowDatabase: Boolean(shadowValue),
  };
}
```

- [ ] **Step 4: Re-run the focused parser test**

Run: `npm test -- scripts/db/neon-config.test.mjs -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/db/neon-config.mjs scripts/db/neon-config.test.mjs
git commit -m "feat: add Neon env parser"
```

### Task 2: Add A Repeatable Neon Connection Check Command

**Files:**
- Create: `scripts/db/check-neon.mjs`
- Modify: `package.json`
- Reuse: `scripts/db/neon-config.mjs`

- [ ] **Step 1: Write the standalone Neon connection check script**

```js
// scripts/db/check-neon.mjs
import process from "node:process";

import pg from "pg";

import { parseNeonConfig } from "./neon-config.mjs";

const { Client } = pg;

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
  process.loadEnvFile(".env");
}

async function runQuery(label, connectionString) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(
      "select current_database() as database_name, current_user as user_name",
    );

    return result.rows[0];
  } finally {
    await client.end();
  }
}

async function main() {
  const config = parseNeonConfig();
  const pooled = await runQuery("DATABASE_URL", config.databaseUrl);
  const direct = await runQuery("DIRECT_URL", config.directUrl);

  console.log("Neon connection check passed.");
  console.log(`DATABASE_URL OK -> database=${pooled.database_name} user=${pooled.user_name}`);
  console.log(`DIRECT_URL OK -> database=${direct.database_name} user=${direct.user_name}`);

  if (config.usesShadowDatabase) {
    console.log("SHADOW_DATABASE_URL configured for prisma migrate dev.");
  } else {
    console.log("SHADOW_DATABASE_URL not configured. This is fine unless you need prisma migrate dev.");
  }
}

main().catch((error) => {
  console.error("Neon connection check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
```

```json
// package.json
{
  "scripts": {
    "db:check": "node scripts/db/check-neon.mjs"
  }
}
```

- [ ] **Step 2: Run the new command without local env values to confirm the failure mode is clear**

Run: `npm run db:check`
Expected: FAIL with `DATABASE_URL is required.` or the next missing-value error from `parseNeonConfig`

- [ ] **Step 3: Populate `.env.local` from Neon Connect for this project and verify both connections**

```dotenv
# .env.local
# Neon org: org-bold-mouse-11702997
# Neon project: bold-fog-67864585
DATABASE_URL=postgresql://<user>:<password>@<pooled-host>/neondb?sslmode=require
DIRECT_URL=postgresql://<user>:<password>@<direct-host>/neondb?sslmode=require
# Optional for prisma migrate dev only:
# SHADOW_DATABASE_URL=postgresql://<user>:<password>@<direct-host>/<shadow-db>?sslmode=require
```

Run: `npm run db:check`
Expected: PASS with one `DATABASE_URL OK` line and one `DIRECT_URL OK` line

- [ ] **Step 4: Confirm Prisma still uses the intended split**

Run: `npm run db:generate`
Expected: PASS

Run: `npm run db:push`
Expected: PASS if the target Neon branch is empty or intentionally managed with `db push`

Run: `npm run db:migrate -- --name neon_baseline`
Expected: PASS only if `SHADOW_DATABASE_URL` is configured and local development migrations are desired

- [ ] **Step 5: Commit**

```bash
git add scripts/db/check-neon.mjs package.json
git commit -m "feat: add Neon connection verification command"
```

### Task 3: Tighten The Neon Onboarding Docs

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Update the env template with explicit Neon guidance for this repo**

```dotenv
# .env.example
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me

# Neon org: org-bold-mouse-11702997
# Neon project: bold-fog-67864585
# Copy the pooled connection string from Neon Connect for app/runtime traffic.
DATABASE_URL=postgresql://neon_user:neon_password@your-project-pooler.region.aws.neon.tech/neondb?sslmode=require

# Copy the direct connection string from Neon Connect for Prisma CLI commands.
DIRECT_URL=postgresql://neon_user:neon_password@your-project.region.aws.neon.tech/neondb?sslmode=require

# Optional: only for prisma migrate dev when you want a dedicated shadow database.
# SHADOW_DATABASE_URL=postgresql://neon_user:neon_password@your-project.region.aws.neon.tech/neondb_shadow?sslmode=require
```

- [ ] **Step 2: Add a short “Start with Neon” section to the README**

```md
## Start with Neon

1. Open Neon project `bold-fog-67864585` in org `org-bold-mouse-11702997`.
2. Copy the pooled connection string into `DATABASE_URL` in `.env.local`.
3. Copy the direct connection string into `DIRECT_URL` in `.env.local`.
4. Only set `SHADOW_DATABASE_URL` if you plan to run `npm run db:migrate -- --name <migration_name>`.
5. Run `npm install`.
6. Run `npm run db:check`.
7. Run `npm run db:generate`.
8. Start the app with `npm run dev`.

### Safe Prisma usage with Neon

- Use `DATABASE_URL` for the running app.
- Use `DIRECT_URL` for Prisma CLI work.
- Prefer `npm run db:generate` and `npm run db:check` first.
- Use `npm run db:push` only for disposable branches or explicitly non-migration flows.
- Use `npm run db:migrate -- --name <name>` only when `SHADOW_DATABASE_URL` is configured and you intend to create a checked-in migration.
```

- [ ] **Step 3: Index the new Neon helper files for future navigation**

```md
<!-- docs/CODEBASE_INDEX.md -->
- **Neon env parser** — `scripts/db/neon-config.mjs` — validates pooled/direct/shadow connection expectations
- **Neon connection check** — `scripts/db/check-neon.mjs` — verifies both Neon connections before app or Prisma work
```

```md
<!-- docs/DEV_TREE.md -->
├── scripts/
│   └── db/
│       ├── check-neon.mjs
│       ├── neon-config.mjs
│       └── neon-config.test.mjs
```

- [ ] **Step 4: Run the focused verification after the doc updates**

Run: `npm test -- scripts/db/neon-config.test.mjs -v`
Expected: PASS

Run: `npm run db:check`
Expected: PASS once `.env.local` contains the real Neon values from project `bold-fog-67864585`

Run: `npm run db:generate`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: add Neon startup guidance"
```

## Self-Review

- **Spec coverage:** The plan covers getting started with Neon in this repo: env values, pooled/direct split, a concrete verification command, Prisma-safe usage, and documentation. It intentionally does not add new schema changes or deployment automation because the request was onboarding, not broader infrastructure work.
- **Placeholder scan:** No `TODO`, `TBD`, or “implement later” placeholders remain. Every task has exact files, commands, and code.
- **Type consistency:** The plan consistently uses `parseNeonConfig`, `db:check`, `DATABASE_URL`, `DIRECT_URL`, and `SHADOW_DATABASE_URL` throughout.
- **Assumptions:** The plan assumes the Neon Connect dialog exposes the default database as `neondb`. If Neon shows a different database name for project `bold-fog-67864585`, use that exact name in `.env.local` and `.env.example` examples.