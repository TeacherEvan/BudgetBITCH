# Cumulative Project Recommendations — Budget Boss (`BudgetBITCH`)

This document maintains the cumulative prioritized feature, architectural, and security recommendations produced by Surgical-Investigation.

---

## 1. Request & Interactive Feature Recommendations

### REC-001: Bulk Expense Export & Categorized Tax Deduction Endpoint
- **Priority:** High
- **Type:** Request Feature (API / Route Handler)
- **Technical Specification:**
  - Endpoint: `POST /api/v1/export/tax-summary`
  - Method: `POST`
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Request Payload:
    ```json
    {
      "accountId": "personal",
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "categories": ["healthcare", "transport", "phone_internet"],
      "format": "csv"
    }
    ```
  - Response: `200 OK` with `Content-Type: text/csv` or `application/json`
- **Acceptance Criteria:**
  - Given a date range, queries active account expenses via IndexedDB/Convex.
  - Groups deductible items with receipt image links and VAT breakdowns.
  - Reviewer proves compliance with test suite verifying dates outside range are excluded.
- **Success Metric:** Reduces annual tax prep retrieval latency from 15 minutes to < 2 seconds.

### REC-002: Real-time Multi-Board Presence & Live Sync Banner
- **Priority:** Medium
- **Type:** Interactive Feature (UI Widget & Convex Component)
- **Technical Specification:**
  - Component: Mount `@convex-dev/presence` in `convex/convex.config.ts`.
  - UI Control: `<BoardPresenceBadge boardId={activeBoardId} />` in `HeaderBar`.
  - Visual Indicators: Shows avatar bubbles of active editors currently viewing the shared couple board.
  - Conflict Prevention: Highlights rows currently being modified by another member with a 3-second live outline.
- **Acceptance Criteria:**
  - When User A focuses an expense row, User B's screen renders a subtle amber indicator on that row within 200ms.
- **Success Metric:** Zero OCC conflict rollbacks on concurrent couple-board spending updates.

### REC-003: Client-Side OCR Preprocessing & Adaptive Compression Pipeline
- **Priority:** High
- **Type:** Interactive & Performance Feature
- **Technical Specification:**
  - Module: `src/lib/receipt/preprocess.ts`
  - Execution: Intercepts camera image before base64 encoding; scales maximum dimension to 1600px with 82% quality WebP/JPEG compression.
- **Acceptance Criteria:**
  - 10MB raw camera photos are compressed to < 1.2MB before initiating `proxyReceiptScan` or Tesseract WASM processing.
- **Success Metric:** Cuts mobile upload time by 75% on 4G/3G connections and eliminates payload size rejections.

---

## 2. Security & Operational Recommendations

### REC-004: Hardened CI Security Audit & Automated Dependency Bot
- **Priority:** High
- **Acceptance Criteria:**
  - `.github/workflows/ci.yml` fails build when `npm audit --audit-level=high` reports vulnerabilities (no swallowing via `sleep 10`).
  - Pin transitive `minimatch` via `overrides` to `^11.0.1` eliminating moderate advisory `GHSA-g3hv-75wg-m249`.
