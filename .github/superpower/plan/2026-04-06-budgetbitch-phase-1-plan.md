# BudgetBITCH Phase 1 Implementation Plan

**Date:** 2026-04-06  
**Status:** Approved for execution  
**Project:** BudgetBITCH

## Goal

Deliver a Vercel-ready, WebKit-friendly Phase 1 of BudgetBITCH with secure authentication, workspace isolation, budgeting core, reminders and automation, notification and email delivery, calendar projection foundations, trusted API primitives, provider connection wizards, privacy-shield onboarding, and a cinematic storybook dashboard.

## Architecture

Use a secure modular monolith with Next.js App Router. Business logic lives in domain modules under `src/modules/**`. Route handlers stay thin. Side effects run through background jobs. All sensitive actions are auditable.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Auth:** Clerk
- **Database:** PostgreSQL + Prisma
- **Validation:** Zod
- **Jobs:** Inngest
- **Email:** Resend + React Email
- **Testing:** Vitest, Testing Library, Playwright
- **Deployment:** Vercel
- **Monitoring:** Sentry

## Why this stack

- **Clerk** provides passkeys, MFA, sessions, and org-ready auth without custom auth plumbing.
- **Prisma + PostgreSQL** fit the relational core required by the design.
- **Inngest** works well with Vercel-style apps for scheduled and async work.
- **Resend** is a practical transactional email choice.
- **Vitest + Playwright** provide fast domain tests plus end-to-end confidence.

## Phase 1 scope lock

### Included

- sign-in and protected app routes
- personal workspace creation
- workspace role foundations
- accounts, budget categories, recurring bills
- due-soon reminder automation
- in-app and email notification fanout
- provider-agnostic calendar event projection
- signed webhook and API primitives
- visual-first dashboard shell
- audit logging for sensitive actions
- provider connection hub
- setup wizards for Claude, OpenAI, GitHub Copilot, and OpenClaw
- mandatory privacy shield disclosure flow
- encrypted provider secret storage and revoke flow

### Explicitly excluded

- full business collaboration workflows
- external calendar write-back to real providers
- advanced agent UI beyond onboarding integrations
- advisor-first AI features
- full SSO rollout
- SMS delivery
- broad provider marketplace beyond the four named integrations

## Hard privacy rules

### Prohibited in provider setup and privacy flows

- affiliate links
- ad-tech trackers
- marketing pixels
- third-party session replay on credential screens
- silent provider fallback
- automatic cross-provider prompt routing
- hidden partner SDKs that can access prompt or credential data

### Required protections

- encrypted secret storage server-side
- per-provider scoped credentials
- no raw secret re-display after submission
- audit events for connect, rotate, revoke, and test
- explicit provider-by-provider data flow disclosure
- stored consent receipts
- one-click revoke and disconnect
- no content sent to any provider until user explicitly enables that provider
- privacy copy must clearly state that only explicitly connected providers receive the minimum required data

### Marketing-safe privacy language

Allowed claims:

- no advertisers or affiliates get user data from our app
- no silent sharing
- only explicitly connected providers receive data
- users can see every connection path before enabling it

Disallowed claim:

- “no third party ever sees your data”

## Execution rules

- Keep business logic in `src/modules/**`, not in route handlers.
- Keep route handlers thin: validate → authorize → call module → log audit.
- Write a test before each new domain service or route behavior.
- Treat every cross-system action as auditable.
- Never expose secrets or trust decisions to the client.
- Keep playful visuals strongest in dashboards; keep auth/admin/privacy/security screens calmer.
- Prefer SVG/chart/card visuals over text-heavy tables for primary UX.

## Task 0: Bootstrap the application

### Step 1: Scaffold the app

**Command**

```bash
npm --prefer-ipv4 create next-app@latest . -- --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --yes
```

**Expected output**

```text
Success! Created BudgetBITCH at /home/ewaldt/Documents/VS/GAMES/BudgetBITCH
```

### Step 2: Install runtime dependencies

**Command**

```bash
npm --prefer-ipv4 install @clerk/nextjs @prisma/client zod date-fns inngest resend @react-email/components @react-email/render framer-motion recharts lucide-react @sentry/nextjs
```

### Step 3: Install dev dependencies

**Command**

```bash
npm --prefer-ipv4 install -D prisma vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test dotenv-cli
```

### Step 4: Add baseline scripts

**File:** `package.json`

Add or update scripts to exactly:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  }
}
```

### Step 5: Add environment templates

**File:** `.env.example`

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budgetbitch
RESEND_API_KEY=re_replace_me
INNGEST_EVENT_KEY=evt_replace_me
INNGEST_SIGNING_KEY=signkey_replace_me
WEBHOOK_SIGNING_SECRET=whsec_replace_me
SENTRY_DSN=https://replace-me.ingest.sentry.io/project
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File:** `.env.local`

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budgetbitch
RESEND_API_KEY=re_replace_me
INNGEST_EVENT_KEY=evt_replace_me
INNGEST_SIGNING_KEY=signkey_replace_me
WEBHOOK_SIGNING_SECRET=whsec_replace_me
SENTRY_DSN=https://replace-me.ingest.sentry.io/project
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Verify the scaffold

**Commands**

```bash
npm run lint
npm run test
npx playwright install --with-deps
npm run test:e2e
```

**Expected output**

```text
✓ lint completes
✓ vitest runs
✓ playwright installs browsers
✓ e2e runner starts successfully
```

## Task 1: Add the security and route-protection foundation

### Step 1: Write the failing test

**File:** `src/lib/auth/route-guard.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { canAccessAppRoute } from "./route-guard";

describe("canAccessAppRoute", () => {
  it("denies anonymous users", () => {
    expect(canAccessAppRoute(null)).toEqual({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("allows signed-in users", () => {
    expect(canAccessAppRoute({ userId: "user_123" })).toEqual({
      allowed: true,
    });
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/lib/auth/route-guard.test.ts
```

### Step 3: Implement the minimal auth gate

**File:** `src/lib/auth/route-guard.ts`

```ts
export type RouteGuardSession = { userId: string } | null;

export function canAccessAppRoute(session: RouteGuardSession) {
  if (!session?.userId) {
    return {
      allowed: false as const,
      reason: "unauthenticated" as const,
    };
  }

  return {
    allowed: true as const,
  };
}
```

**File:** `middleware.ts`

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/lib/auth/route-guard.test.ts
```

**Expected output**

```text
PASS src/lib/auth/route-guard.test.ts
✓ denies anonymous users
✓ allows signed-in users
```

## Task 2: Create the Prisma schema for workspaces, budgets, reminders, audit, and provider connections

### Step 1: Write the failing permissions test

**File:** `src/modules/workspaces/permissions.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { canManageWorkspaceMembers, canViewAuditLog } from "./permissions";

describe("workspace permissions", () => {
  it("allows only owners to manage members", () => {
    expect(canManageWorkspaceMembers("owner")).toBe(true);
    expect(canManageWorkspaceMembers("editor")).toBe(false);
    expect(canManageWorkspaceMembers("approver")).toBe(false);
    expect(canManageWorkspaceMembers("read_only")).toBe(false);
  });

  it("allows owners and read-only auditors to view audit log", () => {
    expect(canViewAuditLog("owner")).toBe(true);
    expect(canViewAuditLog("read_only")).toBe(true);
    expect(canViewAuditLog("editor")).toBe(false);
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/workspaces/permissions.test.ts
```

### Step 3: Implement permissions and schema

**File:** `src/modules/workspaces/permissions.ts`

```ts
export type WorkspaceRole = "owner" | "editor" | "approver" | "read_only";

export function canManageWorkspaceMembers(role: WorkspaceRole) {
  return role === "owner";
}

export function canViewAuditLog(role: WorkspaceRole) {
  return role === "owner" || role === "read_only";
}
```

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum WorkspaceType {
  personal
  household
  business
}

enum WorkspaceRole {
  owner
  editor
  approver
  read_only
}

enum AuditAction {
  workspace_created
  workspace_member_added
  budget_category_created
  bill_created
  reminder_created
  notification_sent
  api_token_created
  webhook_delivered
  integration_connected
  integration_revoked
  consent_recorded
}

model UserProfile {
  id           String            @id @default(cuid())
  clerkUserId  String            @unique
  email        String            @unique
  displayName  String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  memberships  WorkspaceMember[]
  auditEvents  AuditEvent[]
}

model Workspace {
  id             String                    @id @default(cuid())
  name           String
  type           WorkspaceType
  createdAt      DateTime                  @default(now())
  updatedAt      DateTime                  @updatedAt
  members        WorkspaceMember[]
  accounts       Account[]
  categories     BudgetCategory[]
  bills          Bill[]
  reminderRules  ReminderRule[]
  notifications  NotificationPreference[]
  auditEvents    AuditEvent[]
  apiTokens      ApiToken[]
  integrations   IntegrationConnection[]
  consents       ConsentReceipt[]
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole
  createdAt   DateTime      @default(now())

  workspace Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

model Account {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  balance     Decimal  @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model BudgetCategory {
  id           String   @id @default(cuid())
  workspaceId  String
  name         String
  monthlyLimit Decimal  @db.Decimal(12, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model Bill {
  id             String   @id @default(cuid())
  workspaceId    String
  title          String
  amount         Decimal  @db.Decimal(12, 2)
  dueDate        DateTime
  recurrenceRule String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model ReminderRule {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  triggerType String
  actionType  String
  offsetDays  Int?
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model NotificationPreference {
  id          String   @id @default(cuid())
  workspaceId String
  inApp       Boolean  @default(true)
  email       Boolean  @default(true)
  push        Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model ApiToken {
  id         String   @id @default(cuid())
  workspaceId String
  label      String
  tokenHash  String
  scopes     String[]
  createdAt  DateTime @default(now())
  lastUsedAt DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model IntegrationConnection {
  id                 String   @id @default(cuid())
  workspaceId        String
  provider           String
  displayName        String
  authType           String
  encryptedSecret    String?
  secretFingerprint  String?
  status             String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  revokedAt          DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model ConsentReceipt {
  id                 String   @id @default(cuid())
  workspaceId        String
  provider           String
  disclosureVersion  String
  disclosuresJson    Json
  acceptedAt         DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model AuditEvent {
  id           String      @id @default(cuid())
  workspaceId  String
  actorUserId  String
  action       AuditAction
  targetType   String
  targetId     String
  metadataJson Json
  createdAt    DateTime    @default(now())

  workspace Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actor     UserProfile @relation(fields: [actorUserId], references: [id], onDelete: Cascade)
}
```

### Step 4: Run test and migrate

**Commands**

```bash
npm run test -- src/modules/workspaces/permissions.test.ts
npm run db:generate
npm run db:migrate -- --name init_core_schema
```

## Task 3: Add audit logging utility

### Step 1: Write the failing test

**File:** `src/modules/audit/audit-log.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { buildAuditEvent } from "./audit-log";

describe("buildAuditEvent", () => {
  it("creates a normalized audit payload", () => {
    expect(
      buildAuditEvent({
        workspaceId: "ws_1",
        actorUserId: "user_1",
        action: "workspace_created",
        targetType: "workspace",
        targetId: "ws_1",
        metadata: { name: "Personal Vault" },
      }),
    ).toMatchObject({
      workspaceId: "ws_1",
      actorUserId: "user_1",
      action: "workspace_created",
      targetType: "workspace",
      targetId: "ws_1",
    });
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/audit/audit-log.test.ts
```

### Step 3: Implement the utility

**File:** `src/modules/audit/audit-log.ts`

```ts
export type BuildAuditEventInput = {
  workspaceId: string;
  actorUserId: string;
  action:
    | "workspace_created"
    | "workspace_member_added"
    | "budget_category_created"
    | "bill_created"
    | "reminder_created"
    | "notification_sent"
    | "api_token_created"
    | "webhook_delivered"
    | "integration_connected"
    | "integration_revoked"
    | "consent_recorded";
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
};

export function buildAuditEvent(input: BuildAuditEventInput) {
  return {
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadataJson: input.metadata,
  };
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/audit/audit-log.test.ts
```

## Task 4: Build the budgeting health engine

### Step 1: Write the failing test

**File:** `src/modules/budgets/budget-health.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { getBudgetHealth } from "./budget-health";

describe("getBudgetHealth", () => {
  it("marks categories over 80 percent spent as at_risk", () => {
    const result = getBudgetHealth({
      categories: [{ name: "Food", limit: 500, spent: 450 }],
    });

    expect(result.categories[0]).toEqual({
      name: "Food",
      limit: 500,
      spent: 450,
      ratio: 0.9,
      status: "at_risk",
    });
  });

  it("marks categories over 100 percent as over", () => {
    const result = getBudgetHealth({
      categories: [{ name: "Fun", limit: 100, spent: 140 }],
    });

    expect(result.categories[0].status).toBe("over");
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/budgets/budget-health.test.ts
```

### Step 3: Implement the engine

**File:** `src/modules/budgets/budget-health.ts`

```ts
type CategoryInput = {
  name: string;
  limit: number;
  spent: number;
};

type BudgetHealthInput = {
  categories: CategoryInput[];
};

export function getBudgetHealth(input: BudgetHealthInput) {
  return {
    categories: input.categories.map((category) => {
      const ratio = category.limit === 0 ? 0 : category.spent / category.limit;

      return {
        ...category,
        ratio,
        status: ratio >= 1 ? "over" : ratio >= 0.8 ? "at_risk" : "safe",
      };
    }),
  };
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/budgets/budget-health.test.ts
```

## Task 5: Build the due-soon automation rule

### Step 1: Write the failing test

**File:** `src/modules/automation/rules/bill-due-soon.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { evaluateBillDueSoon } from "./bill-due-soon";

describe("evaluateBillDueSoon", () => {
  it("triggers when a bill is due within three days", () => {
    expect(
      evaluateBillDueSoon({
        today: "2026-04-06",
        dueDate: "2026-04-08",
        thresholdDays: 3,
      }),
    ).toEqual({
      shouldTrigger: true,
      reason: "bill_due_soon",
      daysUntilDue: 2,
    });
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/automation/rules/bill-due-soon.test.ts
```

### Step 3: Implement the rule

**File:** `src/modules/automation/rules/bill-due-soon.ts`

```ts
import { differenceInCalendarDays, parseISO } from "date-fns";

type EvaluateBillDueSoonInput = {
  today: string;
  dueDate: string;
  thresholdDays: number;
};

export function evaluateBillDueSoon(input: EvaluateBillDueSoonInput) {
  const daysUntilDue = differenceInCalendarDays(
    parseISO(input.dueDate),
    parseISO(input.today),
  );

  return {
    shouldTrigger: daysUntilDue >= 0 && daysUntilDue <= input.thresholdDays,
    reason: "bill_due_soon" as const,
    daysUntilDue,
  };
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/automation/rules/bill-due-soon.test.ts
```

## Task 6: Build notification fanout and email rendering

### Step 1: Write the failing test

**File:** `src/modules/notifications/fanout.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { buildNotificationFanout } from "./fanout";

describe("buildNotificationFanout", () => {
  it("selects in_app and email channels when enabled", () => {
    expect(
      buildNotificationFanout({
        inApp: true,
        email: true,
        push: false,
      }),
    ).toEqual(["in_app", "email"]);
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/notifications/fanout.test.ts
```

### Step 3: Implement fanout logic

**File:** `src/modules/notifications/fanout.ts`

```ts
type NotificationPreferences = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export function buildNotificationFanout(preferences: NotificationPreferences) {
  const channels: Array<"in_app" | "email" | "push"> = [];

  if (preferences.inApp) channels.push("in_app");
  if (preferences.email) channels.push("email");
  if (preferences.push) channels.push("push");

  return channels;
}
```

**File:** `src/modules/email/templates/bill-due-soon.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type BillDueSoonEmailProps = {
  recipientName: string;
  billTitle: string;
  dueDate: string;
};

export function BillDueSoonEmail({
  recipientName,
  billTitle,
  dueDate,
}: BillDueSoonEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{billTitle} is due soon</Preview>
      <Body style={{ backgroundColor: "#052e16", color: "#ffffff" }}>
        <Container style={{ padding: "24px" }}>
          <Heading>{recipientName}, your bill is nearly due</Heading>
          <Section>
            <Text>{billTitle}</Text>
            <Text>Due date: {dueDate}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/notifications/fanout.test.ts
```

## Task 7: Add provider-agnostic calendar projection

### Step 1: Write the failing test

**File:** `src/modules/calendar/project-reminder.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { projectReminderToCalendarEvent } from "./project-reminder";

describe("projectReminderToCalendarEvent", () => {
  it("maps reminder data into a calendar event shape", () => {
    expect(
      projectReminderToCalendarEvent({
        title: "Pay rent",
        startAt: "2026-04-08T09:00:00.000Z",
        endAt: "2026-04-08T09:15:00.000Z",
      }),
    ).toEqual({
      title: "Pay rent",
      startsAt: "2026-04-08T09:00:00.000Z",
      endsAt: "2026-04-08T09:15:00.000Z",
    });
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/calendar/project-reminder.test.ts
```

### Step 3: Implement the projection

**File:** `src/modules/calendar/project-reminder.ts`

```ts
type ReminderProjectionInput = {
  title: string;
  startAt: string;
  endAt: string;
};

export function projectReminderToCalendarEvent(input: ReminderProjectionInput) {
  return {
    title: input.title,
    startsAt: input.startAt,
    endsAt: input.endAt,
  };
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/calendar/project-reminder.test.ts
```

## Task 8: Add trusted API token and webhook signing primitives

### Step 1: Write the failing test

**File:** `src/modules/integrations/sign-webhook.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { signWebhookPayload } from "./sign-webhook";

describe("signWebhookPayload", () => {
  it("returns a stable hex signature", async () => {
    const signature = await signWebhookPayload(
      '{"event":"budget.updated"}',
      "super_secret_key",
    );

    expect(signature).toMatch(/^[a-f0-9]+$/);
    expect(signature.length).toBe(64);
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/integrations/sign-webhook.test.ts
```

### Step 3: Implement the signer

**File:** `src/modules/integrations/sign-webhook.ts`

```ts
import crypto from "node:crypto";

export async function signWebhookPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
```

**File:** `src/app/api/v1/budgets/health/route.ts`

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBudgetHealth } from "@/modules/budgets/budget-health";

const schema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      limit: z.number(),
      spent: z.number(),
    }),
  ),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);

  return NextResponse.json(getBudgetHealth(input));
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/integrations/sign-webhook.test.ts
```

## Task 9: Build the cinematic dashboard shell

### Step 1: Write the failing component test

**File:** `src/app/(app)/dashboard/page.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("renders the main spectacle cards", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Treasure Map")).toBeInTheDocument();
    expect(screen.getByText("Luck Meter")).toBeInTheDocument();
    expect(screen.getByText("Bills Due Soon")).toBeInTheDocument();
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/app/(app)/dashboard/page.test.tsx
```

### Step 3: Implement the page

**File:** `src/app/(app)/dashboard/page.tsx`

```tsx
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#34d399_0%,_#14532d_45%,_#052e16_100%)] p-6 text-white">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
        <article className="rounded-[32px] border border-emerald-200/20 bg-white/10 p-6 backdrop-blur">
          <h1 className="text-3xl font-bold">Treasure Map</h1>
          <p className="mt-2 text-sm text-emerald-50/80">
            Your budget journey at a glance.
          </p>
        </article>

        <article className="rounded-[32px] border border-yellow-200/20 bg-yellow-300/10 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Luck Meter</h2>
          <p className="mt-2 text-sm text-yellow-50/80">
            Visual risk signal for the current month.
          </p>
        </article>

        <article className="rounded-[32px] border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Bills Due Soon</h2>
          <p className="mt-2 text-sm text-cyan-50/80">
            Upcoming due dates and reminder urgency.
          </p>
        </article>
      </section>
    </main>
  );
}
```

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/app/(app)/dashboard/page.test.tsx
```

## Task 10: Provider registry and official-link manifest

### Step 1: Write the failing test

**File:** `src/modules/integrations/provider-registry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { providerRegistry } from "./provider-registry";

describe("providerRegistry", () => {
  it("contains the supported providers with official URLs and risk metadata", () => {
    expect(providerRegistry.claude.officialLoginUrl).toContain(
      "platform.claude.com",
    );
    expect(providerRegistry.openai.officialLoginUrl).toContain(
      "platform.openai.com",
    );
    expect(providerRegistry.copilot.officialLoginUrl).toContain("github.com");
    expect(providerRegistry.openclaw.officialDocsUrl).toContain("openclaw.ai");
    expect(providerRegistry.openclaw.riskLevel).toBe("high");
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/integrations/provider-registry.test.ts
```

### Step 3: Implement the registry

**Files**

- `src/modules/integrations/provider-types.ts`
- `src/modules/integrations/provider-registry.ts`

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/integrations/provider-registry.test.ts
```

## Task 11: Wizard state machine and privacy shield

### Step 1: Write the failing tests

**Files**

- `src/modules/integrations/wizard-machine.test.ts`
- `src/modules/privacy/consent-ledger.test.ts`

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- src/modules/integrations/wizard-machine.test.ts
npm run test -- src/modules/privacy/consent-ledger.test.ts
```

### Step 3: Implement the logic

**Files**

- `src/modules/integrations/wizard-machine.ts`
- `src/modules/privacy/consent-ledger.ts`

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- src/modules/integrations/wizard-machine.test.ts
npm run test -- src/modules/privacy/consent-ledger.test.ts
```

## Task 12: Build the connection hub UI

### Step 1: Write the failing component test

**File:** `src/app/(app)/settings/integrations/page.test.tsx`

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/app/(app)/settings/integrations/page.test.tsx
```

### Step 3: Implement the connection hub

**Files**

- `src/app/(app)/settings/integrations/page.tsx`
- `src/components/integrations/provider-card.tsx`
- `src/components/integrations/privacy-badge.tsx`

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/app/(app)/settings/integrations/page.test.tsx
```

## Task 13: Claude and OpenAI setup wizards

### Step 1: Write the failing tests

**Files**

- `src/app/(app)/settings/integrations/claude/page.test.tsx`
- `src/app/(app)/settings/integrations/openai/page.test.tsx`

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- src/app/(app)/settings/integrations/claude/page.test.tsx
npm run test -- src/app/(app)/settings/integrations/openai/page.test.tsx
```

### Step 3: Implement the wizard pages

**Files**

- `src/app/(app)/settings/integrations/claude/page.tsx`
- `src/app/(app)/settings/integrations/openai/page.tsx`
- `src/components/integrations/provider-wizard-shell.tsx`
- `src/components/integrations/official-link-list.tsx`
- `src/components/integrations/privacy-disclosure-panel.tsx`

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- src/app/(app)/settings/integrations/claude/page.test.tsx
npm run test -- src/app/(app)/settings/integrations/openai/page.test.tsx
```

## Task 14: Copilot and OpenClaw setup wizards

### Step 1: Write the failing tests

**Files**

- `src/app/(app)/settings/integrations/copilot/page.test.tsx`
- `src/app/(app)/settings/integrations/openclaw/page.test.tsx`

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- src/app/(app)/settings/integrations/copilot/page.test.tsx
npm run test -- src/app/(app)/settings/integrations/openclaw/page.test.tsx
```

### Step 3: Implement the wizard pages

**Files**

- `src/app/(app)/settings/integrations/copilot/page.tsx`
- `src/app/(app)/settings/integrations/openclaw/page.tsx`
- `src/components/integrations/risk-checklist.tsx`
- `src/components/integrations/system-access-warning.tsx`

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- src/app/(app)/settings/integrations/copilot/page.test.tsx
npm run test -- src/app/(app)/settings/integrations/openclaw/page.test.tsx
```

## Task 15: Secret vault and revoke flow

### Step 1: Write the failing test

**File:** `src/modules/integrations/connection-vault.test.ts`

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/integrations/connection-vault.test.ts
```

### Step 3: Implement the vault and APIs

**Files**

- `src/modules/integrations/connection-vault.ts`
- `src/modules/audit/integration-audit.ts`
- `src/app/api/v1/integrations/connect/route.ts`
- `src/app/api/v1/integrations/revoke/route.ts`

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/integrations/connection-vault.test.ts
```

## Task 16: Add background jobs for reminder and notification delivery

### Step 1: Write the failing test

**File:** `src/modules/jobs/reminder-job.test.ts`

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- src/modules/jobs/reminder-job.test.ts
```

### Step 3: Implement job payload builder

**Files**

- `src/modules/jobs/reminder-job.ts`
- `src/inngest/client.ts`

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- src/modules/jobs/reminder-job.test.ts
```

## Task 17: Add end-to-end coverage for the first visual slice and connection wizards

### Step 1: Write the failing E2E tests

**Files**

- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/integrations-claude.spec.ts`
- `tests/e2e/integrations-openai.spec.ts`
- `tests/e2e/integrations-copilot.spec.ts`
- `tests/e2e/integrations-openclaw.spec.ts`

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts
npm run test:e2e -- tests/e2e/integrations-claude.spec.ts
npm run test:e2e -- tests/e2e/integrations-openai.spec.ts
npm run test:e2e -- tests/e2e/integrations-copilot.spec.ts
npm run test:e2e -- tests/e2e/integrations-openclaw.spec.ts
```

### Step 3: Implement any missing wiring

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts
npm run test:e2e -- tests/e2e/integrations-claude.spec.ts
npm run test:e2e -- tests/e2e/integrations-openai.spec.ts
npm run test:e2e -- tests/e2e/integrations-copilot.spec.ts
npm run test:e2e -- tests/e2e/integrations-openclaw.spec.ts
```

## Task 18: Final verification and deployment readiness

### Step 1: Run the full verification suite

**Commands**

```bash
npm run lint
npm run test
npm run test:e2e
npm run db:generate
npm run build
```

### Step 2: Prepare deployment

**Files**

- `README.md`
- `.env.example`
- `sentry.client.config.ts`
- `sentry.server.config.ts`

### Step 3: Deploy

**Command**

```bash
vercel
```

## Planned repo structure

```text
.github/
  superpower/
    brainstorm/
    plan/

prisma/
  schema.prisma

src/
  app/
    (app)/
      dashboard/
      settings/
        integrations/
    api/
      v1/
        budgets/
          health/
        integrations/
          connect/
          revoke/
  components/
    integrations/
  inngest/
    client.ts
  lib/
    auth/
  modules/
    audit/
    automation/
    budgets/
    calendar/
    email/
    integrations/
    jobs/
    notifications/
    privacy/
    workspaces/

tests/
  e2e/
```

## Success condition

Phase 1 is complete when the application:

- boots locally and builds on Vercel
- protects app routes
- supports a personal workspace and core budget health flows
- supports reminder automation and notification fanout
- exposes trusted API primitives
- provides provider setup wizards with explicit privacy disclosures
- stores provider secrets securely
- prevents silent provider sharing and affiliate-style data leakage
- passes unit and end-to-end tests
