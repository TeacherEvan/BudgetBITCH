---
name: budgetbitch-repo-orientation
description: Use when working in the BudgetBITCH repo and needing to choose the right starting files, trust the right docs, or distinguish the root app from the nested `budgetbitch/` prototype.
---

# BudgetBITCH Repo Orientation

## Overview

This repo has two separate app trees. The root BudgetBITCH app is the primary codebase; `budgetbitch/` is a separate prototype/reference subtree. Start from repo docs first, then move into the smallest relevant surface.

## Quick Reference

| Task | Start here | Avoid |
|---|---|---|
| Root app route/UI change | `README.md` → `docs/CODEBASE_INDEX.md` → `src/app/**` | Jumping straight into components or the nested prototype |
| Root app business logic | `src/modules/**` after the route/API entry point | Editing UI before finding the domain boundary |
| Root Convex work | `convex/_generated/ai/guidelines.md` → `convex/README.md` → `convex/**` | Using memory instead of the Convex repo guidance |
| Nested prototype change | `budgetbitch/README.md` → files inside `budgetbitch/` | Mixing root docs or root app code into the prototype |

## Rules

1. Treat the root app and `budgetbitch/` as separate systems.
2. If a task does not explicitly mention the prototype, assume the root app.
3. Prefer repo docs over memory when deciding where to start.
4. For Convex code, read the Convex guidelines file before changing functions, schema, or auth.

## Common Mistakes

- Starting in `src/components/**` before checking `src/app/**` or `src/modules/**`
- Using root navigation docs for `budgetbitch/` work
- Assuming a fix in one tree applies to the other
- Skipping the Convex guidelines and relying on general Convex knowledge

