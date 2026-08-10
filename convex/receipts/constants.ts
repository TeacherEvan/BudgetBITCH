// Shared receipt validation helpers + canonical category set.
// Imported by ./scanActions, ./ingest, and convex/line.ts (via the receipts barrel).

const VALID_CATEGORIES = [
  "food", "transport", "utilities", "entertainment",
  "housing", "phone_internet", "subscriptions", "healthcare",
  "insurance", "debt", "savings", "other"
] as const;

export function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim();
  return VALID_CATEGORIES.includes(normalized as typeof VALID_CATEGORIES[number])
    ? normalized
    : "other";
}

export function validateAmount(amount: unknown): number {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || "0"));
  if (!Number.isFinite(num) || num < 0) return 0;
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

export function validateDate(date: unknown): string | null {
  if (!date || typeof date !== "string") return null;
  // Validate YYYY-MM-DD format
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  // Don't accept future dates > 1 day from now (allow for timezone)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d > tomorrow) return null;
  return date;
}

export function validateMerchant(merchant: unknown): string {
  const str = String(merchant || "Unknown Merchant").trim();
  return str.length > 0 ? str.slice(0, 200) : "Unknown Merchant";
}
