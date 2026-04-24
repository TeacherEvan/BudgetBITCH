# Job Card Best Practices

This note captures the current contract for the jobs card surface in the root app.

## Purpose

`src/components/jobs/job-card.tsx` is a scan-first card for comparing practical job options quickly. It should help the user decide whether to open the full job detail route without forcing them to read dense copy first.

## Content Order

Keep the card structure in this order:

1. Headline identity: company first, then the role title.
2. Key facts: location, salary, schedule, and job type.
3. Timing cue: posting age.
4. Fit cue: one clear `Best for` summary.
5. Optional fit badges: only the top few signals.
6. Primary action: `Open job details`.

## Copy Rules

- Prefer explicit actions over generic CTAs. The primary link should stay `Open job details`.
- Keep summary copy short and practical.
- Preserve one obvious fit cue that explains why the job belongs in the current lane.
- Use readable labels instead of raw enum formatting where possible.

## Layout Rules

- Keep the card dense but readable.
- Preserve the current heading order. Do not introduce nested heading levels that break the page outline.
- Surface metadata users can compare quickly before they commit to the detail page.
- Avoid turning the card into a long narrative block.

## Job Lanes

- The jobs hub groups cards into three blueprint-aware lanes before any wildcard overflow: `Career pivot lane`, `Fast cash lane`, and `Steady routine lane`.
- The card-level `Best for` summary should explain why the job belongs in its current lane, not repeat the same generic promise across every listing.
- `fitSignals` are secondary context only. Keep them capped to the top few badges so the lane and `Best for` cue stay easy to scan.
- Lane definitions live in `src/app/(app)/jobs/page.tsx`, while the card stays responsible for compact comparison-ready presentation.

## Testing Contract

When changing the jobs card UI, update all of the following:

- `src/components/jobs/job-card.test.tsx`
- `src/app/(app)/jobs/page.test.tsx`
- The relevant Playwright flow under `tests/e2e/jobs.spec.ts`

## Related Files

- `src/components/jobs/job-card.tsx`
- `src/components/jobs/job-card.test.tsx`
- `src/app/(app)/jobs/page.tsx`
- `src/app/(app)/jobs/page.test.tsx`
- `tests/e2e/jobs.spec.ts`