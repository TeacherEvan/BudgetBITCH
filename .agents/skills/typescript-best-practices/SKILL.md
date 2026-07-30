---
name: typescript-best-practices
description: >-
  Provides authoritative guidelines, design patterns, and anti-pattern warnings for writing clean, strict, and safe TypeScript code. Use this skill whenever writing, refactoring, or reviewing TypeScript files or types.
---

# TypeScript Best Practices

This skill outlines essential rules and design patterns for maintaining high type safety, runtime reliability, and code readability across TypeScript projects.

## Core Rules

### 1. Enable Strict Mode & Avoid `any`
- Never use `any`. Use `unknown` for values of dynamic/unknown type and narrow them with type guards.
- Use explicit type guards (`typeof`, `instanceof`, custom type predicates) before accessing properties on `unknown`.

```typescript
// Good
function parseResponse(data: unknown): string {
  if (typeof data === "string") {
    return data.trim();
  }
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  throw new Error("Invalid response format");
}
```

### 2. Prefer Discriminated Unions over Optional Field Bags
- Represent mutually exclusive states using discriminated unions instead of a single object with optional flags.

```typescript
// Good
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

### 3. Return Types & Explicit Signatures
- Always specify return types for exported functions, complex helpers, and API endpoints.
- Leverage `readonly` for array and object parameters that should not be mutated.

### 4. Async & Promise Safety
- Always handle errors with `try/catch` or return structured result types.
- Use `Promise.allSettled` when executing multiple independent async operations to avoid premature partial failures.

## Reference Guides

- Read [references/type-patterns.md](./references/type-patterns.md) for advanced generics, utility types, and schema validation.
