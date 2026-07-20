---
name: budgetbitch-repo-orientation
description: Use when working in the BudgetBITCH repo and needing to choose the right starting files or trust the right docs. The app is a single root code tree (a prior nested budgetbitch/ prototype was removed on 2026-07-20).
---

# BudgetBITCH Repo Orientation

## Overview

This repo is a single Next.js + Convex codebase rooted at the repository root. (A prior nested `budgetbitch/` WorkOS AuthKit prototype subtree existed but was removed on 2026-07-20; do not look for it.) Start from repo docs first, then move into the smallest relevant surface.

## Quick Reference

| Task | Start here | Avoid |
| --- | --- | --- |
| Root app route/UI change | `README.md` → `docs/CODEBASE_INDEX.md` → `src/app/**` | Jumping straight into components |
| Root app business logic | `src/modules/**` after the route/API entry point | Editing UI before finding the domain boundary |
| Root Convex work | `convex/_generated/ai/guidelines.md` → `convex/README.md` → `convex/**` | Using memory instead of the Convex repo guidance |

## Rules

1. There is one codebase: the root app. Work there by default.
2. Prefer repo docs over memory when deciding where to start.
3. For Convex code, read the Convex guidelines file before changing functions, schema, or auth.

## Common Mistakes

- Starting in `src/components/**` before checking `src/app/**` or `src/modules/**`
- Looking for the removed nested `budgetbitch/` prototype subtree
- Skipping the Convex guidelines and relying on general Convex knowledge
