// Self-contained category types so this module can live under `convex/`
// without importing across the app boundary (convex/tsconfig has no `@/*`
// paths alias). Mirrors ExpenseCategory in src/lib/types/budget.
export type ExpenseCategory =
  | 'housing' | 'transport' | 'food' | 'utilities'
  | 'phone_internet' | 'subscriptions' | 'entertainment'
  | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

const VALID: ReadonlySet<string> = new Set<ExpenseCategory>([
  'housing', 'transport', 'food', 'utilities',
  'phone_internet', 'subscriptions', 'entertainment',
  'healthcare', 'insurance', 'debt', 'savings', 'other',
]);

export function normalizeCategory(raw: string | undefined | null): ExpenseCategory {
  if (!raw) return 'other';
  const cat = raw.toLowerCase().trim();
  return (VALID.has(cat) ? (cat as ExpenseCategory) : 'other');
}

// Keyword → category. Order matters: most specific first.
const KEYWORD_RULES: ReadonlyArray<readonly [RegExp, ExpenseCategory]> = [
  [/\b(grocer|supermarket|checkers|shoprite|pick\s*n\s*pay|pnp|woolworths|spar|makro|food\s*lo|hyper|fresh|market|cafe|bakery|deli|butcher|fruit|veg)\b/i, 'food'],
  [/\b(pet\s*shop|vet|vet\s*clinic|animal|pet\s*world|pet\s*value)\b/i, 'other'],
  [/\b(restaurant|kfc|mcdonald|burger|pizza|steers|debonairs|spur|wing|sushi|nando|taco|diner|takealot|takeaway|foodpanda|grab\s*food|swiggy|deliveroo|go\s*foody)\b/i, 'food'],
  [/\b(petrol|gas|fuel|engen|shell|bp|caltex|total|esso|sasol|garage|parking|toll|uber|bolt|grab|lyft|taxi|train|metro|bus|rail|flight|airline|ticket)\b/i, 'transport'],
  [/\b(med|clinic|pharm|dischem|clicks|health|cvs|hospital|doctor|dentist|dental|optom|therapist|chemist)\b/i, 'healthcare'],
  [/\b(vodacom|mtn|cell\s*c|telkom|airtel|true\s*move|ais|dtac|verizon|at&t|t-mobile|internet|wifi|fiber|fibre|broadband|youtube\s*premium|google\s*one|icloud)\b/i, 'phone_internet'],
  [/\b(electricity|water|lights|municipal|rates|sewer|gas\s*bill|power|eskom|city\s*power)\b/i, 'utilities'],
  [/\b(rent|lease|bond|mortgage|property|estate|landlord|hoa|levy)\b/i, 'housing'],
  [/\b(insur|assurance|policy|cover)\b/i, 'insurance'],
  [/\b(netflix|spotify|showmax|dstv|apple\s*music|prime|subscription|sub\s*plan|xbox\s*live|ps\s*plus|disney\+|hbo|paramount)\b/i, 'subscriptions'],
  [/\b(cinema|movies|movie|theatre|theater|game\s*store|ster\b|events|ticketpro|computicket|concert|arcade|bowling|golf|gym|fitness|sport)\b/i, 'entertainment'],
  [/\b(bank|loan|credit\s*card|debt|financ|wesbank|fnb|standard\s*bank|absa|capitec|investec)\b/i, 'debt'],
  [/\b(savings|stash|invest|growth|money\s*market|unit\s*trust)\b/i, 'savings'],
  [/\b(school|tuition|university|college|academy|course|edtech|education|books)\b/i, 'other'],
];

const MERCHANT_NOISE = /^(tax\s*invoice|vat\s*reg|tel|fax|www\.|http|welcome|thank\s*you|date|time|cashier|till)/i;

export function categorizeReceipt(merchant: string | undefined, rawCategory?: string | undefined): ExpenseCategory {
  const cat = normalizeCategory(rawCategory);
  if (cat !== 'other') return cat; // OCR/template explicit category wins if valid

  const m = (merchant || '').trim();
  if (!m || MERCHANT_NOISE.test(m)) return 'other';

  for (const [re, category] of KEYWORD_RULES) {
    if (re.test(m)) return category;
  }
  return 'other';
}
