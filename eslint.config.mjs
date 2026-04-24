import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
     ".next/**",
      ".worktrees/**",
      ".vercel/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "budgetbitch/convex/_generated/**",
      "convex/_generated/**",
      "node_modules/**",
    ],
  },
];

export default eslintConfig;
