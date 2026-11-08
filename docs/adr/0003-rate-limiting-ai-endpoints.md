# 0003: Rate Limiting and Resilience for Paid External AI Endpoints

- **Status:** Proposed
- **Date:** 2026-11-08
- **Context:**
  `convex/receipts/scanActions.ts` and `convex/line.ts` make outbound HTTP requests to Google Gemini 2.5 Flash Vision, Hugging Face Spaces (`TeacherBOY`), and LINE Messaging APIs. None of these requests configured `AbortSignal.timeout()`, and actions lacked per-user rate limiting or payload length boundaries. A hanging upstream service stalls the Convex action cluster, and a client loop exhausts paid API token quotas.
- **Decision:**
  1. Enforce `AbortSignal.timeout(25_000)` on all external AI `fetch()` invocations.
  2. Enforce strict input size caps (`MAX_IMAGE_BASE64_LENGTH = 8_000_000`, `MAX_MESSAGE_LENGTH = 4000`).
  3. Prepare mounting of `@convex-dev/rate-limiter` for token-bucket protection on user endpoints.
- **Consequences:**
  - Positive: Guarantees action completion within 25 seconds; prevents unbounded memory consumption and quota exhaustion.
- **Alternatives Considered:**
  - Unbounded client retry: Rejected due to cold-start cascading failures on Hugging Face Spaces.
