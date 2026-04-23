# Neon Production Reconciliation Plan

This document captures the reviewed migration plan for reconciling the Neon production schema with the checked-in Prisma schema and migration history.

Status: planning only

- No SQL from this plan has been applied.
- The goal is to close schema drift safely before any production database changes are approved.
- Target Neon project: `bold-fog-67864585`
- PostgreSQL version: `17`
- Compared branches: `production` vs `vercel-dev`

## Summary

The current drift appears additive. The checked-in Prisma schema and migration history describe enums, tables, indexes, and foreign keys that exist in the Neon `vercel-dev` branch but not in `production`.

That means the safest default path is:

1. confirm the exact production state
2. rehearse on a fresh production-cloned child branch
3. apply the checked-in migrations in order only if rehearsal shows production is simply missing whole objects
4. split the work into manual reconciliation steps if production already contains partial copies of those objects

## Drift Summary

### Tables

Production is missing, or must be verified against, these application tables:

- `UserProfile`
- `Workspace`
- `WorkspaceMember`
- `Account`
- `BudgetCategory`
- `Bill`
- `ReminderRule`
- `NotificationPreference`
- `ApiToken`
- `IntegrationConnection`
- `ConsentReceipt`
- `AuditEvent`
- `StartSmartProfile`
- `RegionalSnapshot`
- `MoneyBlueprintSnapshot`
- `DailyCheckIn`
- `DailyCheckInAlert`
- `ProjectionOutbox`
- `WorkspaceUserPreference`

### Indexes

The drift report includes unique and secondary indexes for user identity, workspace membership, Start Smart snapshots, daily check-ins, outbox replay, and workspace preferences.

Key index groups:

- user and membership uniqueness
- Start Smart lookup indexes
- daily check-in uniqueness and alert lookup indexes
- projection outbox dedupe and scheduling indexes
- workspace preference lookup indexes

### Constraints

The drift report includes:

- primary keys on all application tables
- foreign keys from workspace-owned tables back to `Workspace`
- foreign keys from membership, preference, and check-in tables back to `UserProfile`
- foreign keys from `RegionalSnapshot` and `MoneyBlueprintSnapshot` back to `StartSmartProfile`
- foreign keys from `DailyCheckInAlert` back to `DailyCheckIn`

### Enums

The production branch must be reconciled with these Prisma enums:

- `WorkspaceType`
- `WorkspaceRole`
- `AuditAction`
- `StartSmartStatus`
- `ConfidenceLabel`
- `DailyCheckInStatus`
- `DailyCheckInAlertStatus`
- `DailyCheckInAlertSeverity`
- `ProjectionTopic`
- `ProjectionOutboxStatus`

### Ownership And Privileges

The Prisma migrations do not declare ownership or grants. These must be verified explicitly during rehearsal and again after production apply.

### Views, Triggers, Policies, Extensions

None are defined in the checked-in Prisma migrations for this drift scope.

## Checked-In Migration Order

Review and, later, apply these migrations in timestamp order only:

1. `20260406112000_init_core_schema`
2. `20260406114443_add_start_smart_blueprint`
3. `20260409120000_add_daily_check_in_schema`

Why this order:

- the initial migration creates the shared workspace, user, finance, audit, and integration foundations
- the Start Smart migration depends on `Workspace`
- the daily check-in migration depends on `Workspace` and `UserProfile`

## Migration Strategy

### Phase 0: Freeze Risk

- Pause schema-changing deploys until the drift is understood.
- Keep application traffic running unless preflight shows a conflicting partial schema.
- Use the Neon direct connection string for Prisma CLI work through `DIRECT_URL`.

### Phase 1: Preflight Production State

Run these checks against production before approving any migration execution.

#### Check Prisma migration status

```bash
DIRECT_URL='postgresql://...' npx prisma migrate status --schema prisma/schema.prisma
```

Expected result:

- a clean report showing which migrations are applied or pending
- no provider mismatch
- no unexpected failed migration state

#### Diff production against the checked-in Prisma schema without applying anything

```bash
DIRECT_URL='postgresql://...' npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Expected result:

- additive SQL only
- no drops, renames, or conflicting type rewrites

#### Inspect the Prisma migration ledger directly

```sql
SELECT migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY finished_at NULLS LAST, migration_name;
```

Expected result:

- either all three migrations are missing
- or a clean prefix is present

Stop if:

- a migration is marked applied but its objects are missing
- the ledger suggests partial history that the schema does not match

#### Inventory table existence

```sql
SELECT n.nspname AS schema, c.relname AS name, c.relkind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'UserProfile','Workspace','WorkspaceMember','Account','BudgetCategory','Bill',
    'ReminderRule','NotificationPreference','ApiToken','IntegrationConnection',
    'ConsentReceipt','AuditEvent','StartSmartProfile','RegionalSnapshot',
    'MoneyBlueprintSnapshot','DailyCheckIn','DailyCheckInAlert',
    'ProjectionOutbox','WorkspaceUserPreference'
  )
ORDER BY c.relname;
```

#### Inventory enum labels

```sql
SELECT t.typname, e.enumlabel, e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'WorkspaceType','WorkspaceRole','AuditAction',
    'StartSmartStatus','ConfidenceLabel',
    'DailyCheckInStatus','DailyCheckInAlertStatus',
    'DailyCheckInAlertSeverity','ProjectionTopic','ProjectionOutboxStatus'
  )
ORDER BY t.typname, e.enumsortorder;
```

#### Inventory foreign-key presence for the later migrations

```sql
SELECT conname, conrelid::regclass AS table_name, contype
FROM pg_constraint
WHERE conname IN (
  'WorkspaceMember_workspaceId_fkey','WorkspaceMember_userId_fkey',
  'StartSmartProfile_workspaceId_fkey','RegionalSnapshot_workspaceId_fkey',
  'RegionalSnapshot_profileId_fkey','MoneyBlueprintSnapshot_workspaceId_fkey',
  'MoneyBlueprintSnapshot_profileId_fkey','DailyCheckIn_workspaceId_fkey',
  'DailyCheckIn_actorUserId_fkey','DailyCheckInAlert_workspaceId_fkey',
  'DailyCheckInAlert_checkInId_fkey','ProjectionOutbox_workspaceId_fkey',
  'WorkspaceUserPreference_workspaceId_fkey','WorkspaceUserPreference_userId_fkey'
);
```

#### Capture a schema-only backup

```bash
pg_dump "$DIRECT_URL" --schema-only --no-owner --file production-schema-before.sql
```

## Phase 2: Rehearsal On A Fresh Child Branch

Create a fresh Neon child branch from production and rehearse there first.

Validation goals on the rehearsal branch:

- Prisma migration history matches the intended sequence
- schema diff becomes empty after rehearsal apply
- runtime smoke flows still work against the reconciled schema

Minimum smoke flows:

- auth bootstrap
- workspace preference bootstrap
- Start Smart blueprint persistence
- Jobs recommendation read path
- daily check-in write path
- projection outbox write path

## Phase 3: Production Apply Decision

### Safe Path: Whole Objects Are Missing

If rehearsal shows production is simply missing whole objects, apply the checked-in migrations in order:

1. `20260406112000_init_core_schema`
2. `20260406114443_add_start_smart_blueprint`
3. `20260409120000_add_daily_check_in_schema`

This should be low-risk and near zero-downtime because the work is additive.

### Escalation Path: Partial Objects Already Exist

Do not run the checked-in migration unchanged if production already has any conflicting subset of these objects.

Instead, split the reconciliation into manual steps on the rehearsal branch first.

Examples:

- If tables already exist but indexes are missing, create large secondary indexes with `CREATE INDEX CONCURRENTLY` during the manual reconciliation plan.
- If tables already exist but foreign keys are missing, add them as `NOT VALID`, repair any orphaned rows, then `VALIDATE CONSTRAINT`.
- If an enum already exists with a conflicting label set, resolve the enum drift manually before Prisma history is advanced.
- If `_prisma_migrations` is wrong but the schema is correct, repair ledger state only after the schema shape is verified.

## Phase 4: Post-Apply Verification

After a production apply is approved and executed, verify all of the following:

- `prisma migrate status` is clean
- `_prisma_migrations` contains the expected ordered history
- the Neon schema diff is empty against the rehearsal branch or checked-in schema target
- ownership and grants are valid for the app role
- auth bootstrap works
- Start Smart blueprint generation persists successfully
- daily check-in submission persists successfully

## Zero-Downtime Notes

If production is only missing whole objects, the checked-in migration sequence is already close to zero-downtime.

Manual split work is only needed when production contains partial state, especially:

- partial tables with real data
- same-name enums with different labels
- missing indexes on already-populated tables
- missing foreign keys on already-populated tables

## Residual Risks

- The biggest unknown is whether production is missing whole objects or contains conflicting partial copies.
- Enum drift is higher-risk than missing tables because same-name enum conflicts cannot be resolved by rerunning the checked-in `CREATE TYPE` statements.
- Grants are not encoded in the Prisma migrations and may still be wrong even when objects exist.
- If the production ledger in `_prisma_migrations` does not match the real schema state, `migrate deploy` can fail or skip required work.

## Review Checklist

Before approving any production SQL execution, confirm:

- the preflight outputs have been captured
- the rehearsal branch migration run succeeded
- the post-rehearsal schema diff is empty
- no manual enum reconciliation is still pending
- no app-role grant issues remain unresolved
