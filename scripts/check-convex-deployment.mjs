// Build-time guard: fail the production build if the Convex deployment URL
// baked into the client (NEXT_PUBLIC_CONVEX_URL) does not match the canonical
// prod deployment.
//
// WHY: a stale NEXT_PUBLIC_CONVEX_URL (Vercel env set months earlier) shipped
// a build that could never connect to auth — useConvexAuth() never resolved,
// so every gated page hung ~5s then "failed to load". Local dev/.env.local was
// correct, so the bug was invisible until prod users hit it.
//
// SCOPE: only enforces during a Vercel *production* build, where the real
// NEXT_PUBLIC_CONVEX_URL env is present. Local dev, CI (placeholder URL), and
// preview builds are intentionally NOT enforced — they legitimately use other
// URLs. Failing prod here blocks the broken auto-deploy before it ships.
//
// CANONICAL SLUG: read from BUDGETBITCH_PROD_CONVEX_SLUG (non-secret Vercel
// env). Update that var if the prod deployment is intentionally rotated.

const EXPECTED_SLUG = (process.env.BUDGETBITCH_PROD_CONVEX_SLUG || "steady-ox-280").toLowerCase();
const isVercelProd = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

if (!isVercelProd) {
  console.log("[check-convex-deployment] Skipped (not a Vercel production build).");
  process.exit(0);
}

const checks = [
  { name: "NEXT_PUBLIC_CONVEX_URL", value: process.env.NEXT_PUBLIC_CONVEX_URL, critical: true },
  { name: "NEXT_PUBLIC_CONVEX_SITE_URL", value: process.env.NEXT_PUBLIC_CONVEX_SITE_URL, critical: false },
  { name: "CONVEX_SITE_URL", value: process.env.CONVEX_SITE_URL, critical: false },
];

let failed = false;
for (const { name, value, critical } of checks) {
  if (!value) {
    const msg = `[check-convex-deployment] ${critical ? "FAIL" : "WARN"}: ${name} is empty in production build.`;
    console.error(msg);
    if (critical) failed = true;
    continue;
  }
  const match = value.match(/^https:\/\/([a-z0-9-]+)\.convex\.(?:cloud|site)\/?$/i);
  if (!match) {
    console.error(`[check-convex-deployment] ${critical ? "FAIL" : "WARN"}: ${name}="${value}" is not a convex.(cloud|site) URL.`);
    if (critical) failed = true;
    continue;
  }
  const slug = match[1].toLowerCase();
  if (slug !== EXPECTED_SLUG) {
    console.error(
      `[check-convex-deployment] ${critical ? "FAIL" : "WARN"}: ${name} points at deployment "${slug}" but prod is "${EXPECTED_SLUG}".\n` +
        `  Fix: update the Vercel env var ${name} to https://${EXPECTED_SLUG}.convex.${value.includes(".site") ? "site" : "cloud"},` +
        ` or rotate BUDGETBITCH_PROD_CONVEX_SLUG if the deployment changed intentionally.`,
    );
    if (critical) failed = true;
  }
}

if (failed) {
  console.error("[check-convex-deployment] Production build aborted: Convex deployment URL mismatch.");
  process.exit(1);
}

console.log(`[check-convex-deployment] OK: prod Convex deployment is "${EXPECTED_SLUG}".`);
process.exit(0);
