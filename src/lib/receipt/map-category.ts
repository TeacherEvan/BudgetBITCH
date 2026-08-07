import type { ExpenseCategory } from '@/lib/types/budget';

/**
 * Client-side bridge from an arbitrary category string (backend VALID_CATEGORIES
 * set, which includes shopping/medical/personal/education/income) to the
 * canonical ExpenseCategory union used by the local expense store. Mirrors the
 * rule set in src/app/quick-add/page.tsx mapCategory — keep the two in sync.
 *
 * Backend-only values collapse: shopping/personal/education -> other,
 * medical -> healthcare, income stays as a non-expense signal (-> other).
 */
export function mapCategory(cat: string | undefined | null): ExpenseCategory {
  // Normalize to space-separated words so the rules below can use real word
  // boundaries. Substring matching was the old approach and it mis-bucketed
  // real receipt lines: 'movie rental' matched `includes('rent')` -> housing,
  // and 'card'/'carwash' matched `includes('car')` -> transport.
  const text = (cat ?? '')
    .toLowerCase()
    .replace(/[_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return 'other';

  // Order matters: the most specific rule wins. Entertainment and subscriptions
  // are tested BEFORE housing so 'movie rental' / 'game rental' don't get
  // swallowed by the housing `rent` rule.
  const RULES: ReadonlyArray<readonly [RegExp, ExpenseCategory]> = [
    [/\b(entertainment|movie|cinema|theatre|theater|game|gaming|arcade|bowling|concert)\b/, 'entertainment'],
    [/\b(subscription|subscriptions|netflix|spotify|showmax|disney|hbo|dstv)\b/, 'subscriptions'],
    [/\b(food|dining|restaurant|starbucks|mcdonald|bread|grocer|grocers|groceries|grocery|milk|cafe|bakery|supermarket|takeaway)\b/, 'food'],
    [/\b(transport|taxi|ride|fuel|petrol|diesel|car|cars|grab|bolt|uber|lyft|parking|toll)\b/, 'transport'],
    [/\b(utilities|utility|electricity|water|municipal|eskom)\b/, 'utilities'],
    [/\b(housing|rent|rental|mortgage|lease|landlord|levy)\b/, 'housing'],
    [/\b(phone|internet|telecom|mobile|airtime|wifi|fibre|fiber|broadband)\b/, 'phone_internet'],
    [/\b(health|healthcare|medical|medicine|doctor|dentist|hospital|clinic|pharm\w*)\b/, 'healthcare'],
    [/\b(insurance|assurance)\b/, 'insurance'],
    [/\b(debt|loan|credit card|repayment)\b/, 'debt'],
    [/\b(savings|save|invest|investment|investments)\b/, 'savings'],
  ];

  for (const [pattern, category] of RULES) {
    if (pattern.test(text)) return category;
  }

  return 'other';
}

/**
 * Guard against half-parsed receipts. OCR routinely drops or duplicates a line,
 * and a line-item set whose amounts don't add up to the receipt total would
 * misreport per-category spend on the Excel grid. Returns the items only when
 * they reconcile with the total; otherwise `undefined`, so the receipt is saved
 * as a single unsplit expense rather than a wrong breakdown.
 *
 * Tolerance: the larger of 0.02 absolute (rounding/VAT cents) or 1% of the
 * total. Mirrors `hasTrustworthyLineItems` in
 * src/modules/budgeting/line-item-rollup.ts — keep the two in sync.
 */
export function reconcileLineItems<T extends { amount: number }>(
  items: T[] | undefined | null,
  total: number,
): T[] | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  if (!Number.isFinite(total) || total <= 0) return undefined;

  const sum = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const tolerance = Math.max(0.02, Math.abs(total) * 0.01);

  return Math.abs(sum - total) <= tolerance ? items : undefined;
}
