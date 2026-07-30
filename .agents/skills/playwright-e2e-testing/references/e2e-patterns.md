# Playwright E2E Patterns Reference

## Debugging CI Failures

1. Inspect HTML reports & trace zips uploaded in CI artifacts:
   ```bash
   npx playwright show-trace test-results/path-to-trace.zip
   ```
2. Run tests in headed mode locally during investigation:
   ```bash
   npx playwright test --headed --debug
   ```

## Reuse Auth State
Save login storage state to file during global setup to skip UI login forms in every test spec:

```typescript
// global-setup.ts
await page.context().storageState({ path: "playwright/.auth/user.json" });
```
