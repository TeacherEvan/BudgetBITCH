// Ambient declaration for the untyped `jest-axe` runtime module.
// Kept as a global script (no top-level imports) so tsc accepts it as the
// source of truth for the otherwise-untyped jest-axe package.
declare module "jest-axe" {
  export interface AxeResults {
    violations: unknown[];
  }
  export function axe(
    html: Element | string,
    options?: unknown,
  ): Promise<AxeResults>;
  export function configureAxe(
    options?: unknown,
  ): (html: Element | string, options?: unknown) => Promise<AxeResults>;
  export function toHaveNoViolations(results: AxeResults): {
    pass: boolean;
    message(): string;
  };
}

declare module "jest-axe/extend-expect" {}
