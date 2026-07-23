## Description

Provide a brief summary of the changes introduced by this Pull Request.

---

## Type of Change

- [ ] `fix`: Bug fix (non-breaking change which fixes an issue)
- [ ] `feat`: New feature (non-breaking change which adds functionality)
- [ ] `refactor`: Code refactoring (no feature or bug changes)
- [ ] `docs`: Documentation updates
- [ ] `ci`: CI/CD pipeline or workflow changes
- [ ] `chore`: Maintenance, dependencies, or tool updates

---

## Quality Gate Verification Checklist

Before submitting this PR, verify that all quality gates pass locally:

- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run check:idb` passes (IndexedDB schema guard)
- [ ] `npm test` passes (Vitest unit & component test suite)
- [ ] `npm run test:convex` passes (Convex backend tests)
- [ ] `npm run build` succeeds cleanly
- [ ] Or run `npm run ci` to verify all 6 checks in one command

---

## Risk & Breaking Change Assessment

- [ ] Does this PR modify database schemas (`convex/schema.ts` or IndexedDB `local-db.ts`)?
- [ ] Does this PR modify environment variables or deployment URLs?
- [ ] Is fallback behavior provided for offline users or state hydration?
