export const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: '#f59e0b',
  transport: '#3b82f6',
  entertainment: '#8b5cf6',
  utilities: '#06b6d4',
  healthcare: '#ef4444',
  phone_internet: '#ec4899',
  shopping: '#f97316',
  other: '#6b7280',
};

export const CATEGORY_COLORS = Object.values(CATEGORY_COLOR_MAP);

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_MAP[category] || '#6b7280';
}

export function getCategoryColors(categories: string[]): string[] {
  return categories.map(getCategoryColor);
}