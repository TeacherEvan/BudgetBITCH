# Code Review Checklist

## 1. Safety & Security
- [ ] No hardcoded secrets, API tokens, or credentials.
- [ ] Proper permissions & authorization checks on API routes and server actions.
- [ ] Input parameters validated with type guards or schemas.

## 2. Code Quality & Reliability
- [ ] No implicit `any` or dangerous type assertions (`as unknown as T`).
- [ ] Resource cleanup implemented (event listeners removed, timers cleared, streams closed).
- [ ] Exception boundaries present around external API calls.

## 3. Testing & Verification
- [ ] Critical business logic has matching unit test coverage.
- [ ] Edge cases tested (empty arrays, missing options, network latency/failure).
