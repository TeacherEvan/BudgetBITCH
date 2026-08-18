// convex/receipts.ts
// Thin compatibility barrel. The receipts domain was decomposed into
// convex/receipts/{constants,scanActions,draftCrud,scrapeBot,ingest,internal}.ts
// (see convex/receipts/index.ts for the full re-export map). This file exists
// so the generated `api.receipts.*` / `internal.receipts.*` bindings keep
// resolving against `../receipts.js` without a Convex codegen regeneration.
export * from "./receipts/index";
