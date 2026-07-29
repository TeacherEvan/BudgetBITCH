// Flat config for ESLint 9+ - based on eslint-config-next
const path = require("path");

// This is the base config from eslint-config-next (converted to flat config)
const baseConfig = {
  plugins: {
    import: require("eslint-plugin-import"),
    react: require("eslint-plugin-react"),
    "jsx-a11y": require("eslint-plugin-jsx-a11y"),
    "react-hooks": require("eslint-plugin-react-hooks"),
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
  },
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      requireConfigFile: false,
      project: ["./tsconfig.json"],
      tsconfigRootDir: __dirname,
    },
  },
  settings: {
    react: { version: "detect" },
    "import/parsers": {
      [require.resolve("@typescript-eslint/parser")]: [".ts", ".mts", ".cts", ".tsx", ".d.ts"],
    },
    "import/resolver": {
      [require.resolve("eslint-import-resolver-node")]: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      [require.resolve("eslint-import-resolver-typescript")]: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    "import/no-anonymous-default-export": "warn",
    "react/no-unknown-property": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
    "jsx-a11y/aria-props": "warn",
    "jsx-a11y/aria-proptypes": "warn",
    "jsx-a11y/aria-unsupported-elements": "warn",
    "jsx-a11y/role-has-required-aria-props": "warn",
    "jsx-a11y/role-supports-aria-props": "warn",
    "react/jsx-no-target-blank": "off",
    // react-hooks rules
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/set-state-in-effect": "off", // Not in latest plugin
    "react-hooks/purity": "off", // Not in latest plugin
    // @typescript-eslint rules
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};

module.exports = [
  baseConfig,
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
      "convex/**",
      "WelcomeWindow-startup/**",
      "eslint.config.cjs",
      "playwright.config.ts",
      "postcss.config.mjs",
      "next.config.ts",
      "vitest.config.ts",
      "tsconfig.json",
      "scripts/**",
      "*.config.*",
      "public/sw.js",
      "node_modules/**",
    ],
  },
  {
    files: ["**/*.ts?(x)"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
];