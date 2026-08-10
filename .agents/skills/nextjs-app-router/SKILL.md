---
name: nextjs-app-router
description: >-
  Provides best practices, component boundaries, and optimization patterns for Next.js App Router applications. Activate when building, refactoring, or optimizing Next.js pages, layouts, server components, or client components.
---

# Next.js App Router Best Practices

Guidelines for architecting fast, secure, and maintainable Next.js App Router applications.

## Key Principles

### 1. Server Components by Default
- Keep components as React Server Components (RSC) by default.
- Only add `'use client'` directive to leaf components that require interactivity (`useState`, `useEffect`, event listeners, or browser APIs).

```tsx
// Good: Server component fetching data and passing down to client leaf
import { UserAvatar } from "./user-avatar"; // Client component

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await fetchUser(id);
  return (
    <main className="p-6">
      <h1>{user.name}</h1>
      <UserAvatar imageUrl={user.avatarUrl} />
    </main>
  );
}
```

### 2. Async Params & SearchParams (Next.js 15+)
- Always `await` `params` and `searchParams` props in Page and Layout components:

```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  // ...
}
```

### 3. Server Actions & Mutations
- Enforce strict validation inside Server Actions.
- Return structured status objects `{ success: true, data } | { success: false, error: string }` instead of throwing raw errors across the wire.

### 4. Layouts & Streaming
- Utilize `loading.tsx` and React `Suspense` for instant loading states and progressive streaming.

## Reference Guides

- Read [references/rsc-guidelines.md](./references/rsc-guidelines.md) for server/client boundary patterns and caching strategies.
