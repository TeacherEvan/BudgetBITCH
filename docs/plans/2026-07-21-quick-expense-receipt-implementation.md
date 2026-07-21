# Implementation Plan: Quick Expense Widget & Gemini Camera Scraper

**Date:** July 21, 2026  
**Feature:** Standalone `/quick-add` PWA page, +/- toggle, camera capture, Gemini API OCR, and success toast logging.

---

## Task Breakdown

### Task 1: Backend - Receipts Convex Action
- **Goal:** Implement a Convex action `convex/receipts.parseReceipt` that takes a base64-encoded image of a receipt, calls Google's Gemini 2.5 Flash API with structured parsing instructions, and returns a JSON payload `{ amount: number, merchant: string, category: string }`.
- **Target File:** `[NEW] convex/receipts.ts`
- **TDD:** Ensure we validate inputs using `v.string()` (base64) and check the Convex environment variable `GEMINI_API_KEY`.

### Task 2: Backend - Receipts Unit Tests
- **Goal:** Write unit tests using `convex-test` and mock fetch behavior for the Gemini API call, verifying that the action parses correct amounts and categories under mock responses, and handles missing api keys gracefully.
- **Target File:** `[NEW] convex/receipts.test.ts`

### Task 3: Frontend - `/quick-add` Page Layout & UI
- **Goal:** Create the `/quick-add` route rendering the minimalist widget-like UI:
  - Large toggle button for `+/-` sign swap.
  - Large amount/description input text box.
  - Camera icon button next to the input.
  - Save icon button next to the input.
  - Styling matches Gen-Z dark gold theme (`theme-amber` / `theme-gold`).
- **Target File:** `[NEW] src/app/quick-add/page.tsx`

### Task 4: Frontend - Camera Capture & Gemini Integration
- **Goal:** Integrate HTML5 camera photo capture (`<input type="file" accept="image/*" capture="environment" />`).
- **Target File:** `[MODIFY] src/app/quick-add/page.tsx`
- **Details:** Convert captured image to base64, call `convex/receipts.parseReceipt`, and auto-fill the amount and toggle direction based on the response.

### Task 5: Frontend - Local DB Logging & Toast Notification
- **Goal:** Implement the "Save" handler that logs the transaction using `useAccounts` / local DB stores, triggers a toast notification saying "Successfully added!" or "Failed to add expense", and resets/closes.
- **Target File:** `[MODIFY] src/app/quick-add/page.tsx`

### Task 6: Frontend - Quick Add Unit Tests
- **Goal:** Write unit tests for the Quick Add page to check that the toggle swapper, input validation, camera handler, and save logging work correctly.
- **Target File:** `[NEW] src/app/quick-add/page.test.tsx`

### Task 7: PWA - Shortcuts Registration
- **Goal:** Add `/quick-add` shortcut metadata to `public/manifest.json` so users can pin or access it quickly.
- **Target File:** `[MODIFY] public/manifest.json`

### Task 8: Documentation - Readme & Architecture
- **Goal:** Document the Quick Add widget and Gemini receipt scraping flow in project manuals.
- **Target Files:**
  - `[MODIFY] README.md`
  - `[MODIFY] ARCHITECTURE.MD`
