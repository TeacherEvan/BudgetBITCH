# TypeScript Type Patterns Reference

## Generics & Utility Types

### 1. Constrained Generics
Always constrain generic type parameters to ensure type safety:

```typescript
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 2. Immutability with `Readonly` and `as const`
Use `as const` assertions for literal objects and array definitions:

```typescript
const CONFIG = {
  apiEndpoint: "https://api.example.com",
  timeoutMs: 5000,
} as const;

type Config = typeof CONFIG;
```

## Runtime Schema Validation

Combine TypeScript types with runtime validation (e.g. Zod or Valibot) for boundaries (API responses, user inputs, environment variables):

```typescript
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

export type User = z.infer<typeof UserSchema>;
```
