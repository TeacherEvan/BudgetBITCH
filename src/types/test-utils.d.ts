// Global type augmentations for the test toolchain.
// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) on
// vitest's Assertion interface so `tsc --noEmit` (npm run typecheck) passes in
// test files without per-file imports. The jest-axe module + toHaveNoViolations
// matcher are declared separately in jest-axe.d.ts (kept as a global script so
// tsc accepts it as the source of truth for the untyped jest-axe package).
import "@testing-library/jest-dom/vitest";
import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
