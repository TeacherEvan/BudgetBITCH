---
name: code-review-and-refactoring
description: >-
  Provides a structured workflow and checklist for performing code reviews, security audits, performance profiling, and safe refactoring. Use when reviewing code changes, auditing PRs, or refactoring existing modules.
---

# Code Review & Refactoring Guide

Use this skill to perform systematic code reviews, identify edge cases, enforce security standards, and execute zero-regression refactoring.

## Code Review Workflow

### Step 1: Verification & Inspection
1. Run existing unit and integration tests before modifying code.
2. Read full error logs and tracebacks rather than patching top-level symptoms.

### Step 2: Quality & Security Check
- **Injection & Input Validation**: Are user inputs sanitized and typed?
- **State Management**: Are race conditions or unhandled null states present?
- **Error Handling**: Are errors caught gracefully with clear fallback UI/logs?
- **Performance**: Are expensive loops, redundant network calls, or memory leaks avoided?

### Step 3: Refactoring Execution Rules
- Make small, incremental edits.
- Preserve public function signatures and API contracts.
- Run build/typecheck commands (`npm run build`, `npm run typecheck`) after edits to verify zero breakages.

## Reference Checklist

- Consult [references/checklist.md](./references/checklist.md) for the detailed audit checklist.
