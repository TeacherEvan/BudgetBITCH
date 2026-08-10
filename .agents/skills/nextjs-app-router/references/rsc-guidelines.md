# React Server Components (RSC) & Boundary Reference

## Component Boundary Rules

1. **Passing Server Components to Client Components**:
   Pass server components as `children` or JSX props into client components to maintain server rendering benefits.

```tsx
// Client component wrapper
'use client';
export function Modal({ children }: { children: React.ReactNode }) {
  return <div className="modal-overlay">{children}</div>;
}
```

2. **Data Fetching Patterns**:
   - Fetch data directly inside Server Components using async/await.
   - Use `cache()` or `revalidatePath` / `revalidateTag` for on-demand cache invalidation.
   - Avoid exposing API keys or secrets in client component props.
