// src/lib/data/pro-tips.ts
export interface ProTip {
  id: string;
  category: 'budgeting' | 'savings' | 'offline' | 'sharing' | 'ai';
  title: string;
  teaser: string;
  summary: string;
  steps: string[];
  illustrationType: 'chart' | 'gauge' | 'steps' | 'shield' | 'camera' | 'shortcuts' | 'globe';
}

export const PRO_TIPS: ProTip[] = [
  {
    id: '50-30-20',
    category: 'budgeting',
    title: 'The 50/30/20 Wealth Formula',
    teaser: 'Structure your income into Needs, Wants, and Wealth automatically.',
    summary: 'Divide your net income into three distinct buckets to secure your financial future without feeling restricted:',
    steps: [
      '50% Needs: Housing, groceries, bills, utilities, and debt payments.',
      '30% Wants: Dining out, hobbies, travel, entertainment, and shopping.',
      '20% Wealth: Savings, investments, and build emergency buffers.'
    ],
    illustrationType: 'chart',
  },
  {
    id: 'daily-disposable',
    category: 'budgeting',
    title: 'Daily Disposable Ceiling',
    teaser: 'Stop end-of-month panic with a daily spending buffer.',
    summary: 'A daily disposable ceiling takes your monthly free income and divides it by remaining days. This simple number helps you prevent overspending today.',
    steps: [
      'Calculate: Free Income = Monthly Income - Fixed Costs - Savings Goals.',
      'Divide by days: Daily disposable = Free Income / Days left in month.',
      'Track: Log purchases in real-time to adjust tomorrow\'s ceiling.'
    ],
    illustrationType: 'gauge',
  },
  {
    id: 'cut-one-subscription',
    category: 'savings',
    title: 'The Cut-One Audit Rule',
    teaser: 'Trim just one unused recurring subscription each month.',
    summary: 'Small recurring subscriptions slip under the radar but add up to thousands yearly. Perform a monthly subscription audit and cancel one item.',
    steps: [
      'Check: Review your active Subscriptions list on the dashboard.',
      'Identify: Find one service you haven\'t used in the past 30 days.',
      'Cancel: Unsubscribe immediately. Log the saved amount to Savings Goals.'
    ],
    illustrationType: 'steps',
  },
  {
    id: 'offline-first',
    category: 'offline',
    title: 'Zero-Signal Offline Logging',
    teaser: 'Log cash or store payments instantly without waiting for signal.',
    summary: 'Budget-BOSS stores all logged transactions instantly in your device\'s local secure storage, syncing automatically to the cloud when online.',
    steps: [
      'Open: Open the PWA widget or app even with zero internet signal.',
      'Log: Record your transaction instantly. We cache it locally.',
      'Sync: As soon as network returns, background workers sync it safely.'
    ],
    illustrationType: 'shield',
  },
  {
    id: 'shared-family-boards',
    category: 'sharing',
    title: 'Shared Family & Partner Boards',
    teaser: 'Coordinate joint household expenses with instant sync.',
    summary: 'Avoid duplicate checks or missed bills. Set up a Shared Board to sync joint accounts, family grocery costs, and collective goals.',
    steps: [
      'Create: Go to Accounts Panel and create a Shared Board.',
      'Invite: Generate a gold invitation link or QR code for members.',
      'Co-Budget: Both track shared expenses and watch balances sync instantly.'
    ],
    illustrationType: 'globe',
  },
  {
    id: 'smart-receipt-ai',
    category: 'ai',
    title: 'AI Smart Receipt Scanner',
    teaser: 'Snap receipt photos to parse merchant, total, and categories.',
    summary: 'Let AI parse receipt paperwork for you. Capture receipt photos directly with your phone camera to populate details.',
    steps: [
      'Capture: Tap the Camera icon on the expense quick-add form.',
      'Scan: Take a clear photo of the physical receipt.',
      'Verify: Watch AI parse merchant, amount, category, and hit save.'
    ],
    illustrationType: 'camera',
  },
  {
    id: 'pwa-shortcuts',
    category: 'offline',
    title: '1-Tap Home Screen Quick Add',
    teaser: 'Instant expense logging shortcut from your phone\'s home screen.',
    summary: 'Configure PWA shortcuts on your phone home screen to launch directly into the transaction input screen within a second.',
    steps: [
      'Install: Tap the install prompt banner to add Budget-BOSS to Home Screen.',
      'Shortcut: Long-press the app icon to view "Quick Add" shortcut.',
      'Add: Drag the shortcut to your screen for 1-tap logging.'
    ],
    illustrationType: 'shortcuts',
  },
  {
    id: 'currency-travel-lock',
    category: 'budgeting',
    title: 'Multi-Currency Travel Lock',
    teaser: 'Lock your budget in local currency to eliminate FX rate math.',
    summary: 'Travel without conversion math. Derive your currency symbols automatically from your device location or lock your primary currency choice.',
    steps: [
      'Select: Choose your primary currency (THB, USD, EUR, etc.) in settings.',
      'Convert: Input expenses in local travel currency.',
      'Anchor: Let the app auto-convert to your main budget base value.'
    ],
    illustrationType: 'globe',
  },
  {
    id: 'emergency-cushion',
    category: 'savings',
    title: '3-Month Panic-Free Emergency Buffer',
    teaser: 'Build a solid cash cushion before aggressive investing.',
    summary: 'Before allocating cash to high-growth stocks or crypto, establish a stable liquid cash buffer for peace of mind.',
    steps: [
      'Define: Target = 3 months of basic Needs (fixed costs).',
      'Allocate: Transfer 20% of income directly into the cushion fund.',
      'Protect: Keep this fund in a liquid high-yield account.'
    ],
    illustrationType: 'shield',
  },
  {
    id: 'lossless-snapshots',
    category: 'offline',
    title: 'Lossless Snapshot Backups',
    teaser: 'Automated local encryption & cloud snapshot backup.',
    summary: 'Your database snapshots are preserved locally first. The app syncs daily snapshots securely to Convex, ensuring no data is ever lost.',
    steps: [
      'Record: All account configurations are stored locally in IndexedDB.',
      'Snapshot: The app compiles a daily budget snapshot.',
      'Upload: The background Service Worker uploads snapshots to cloud vaults.'
    ],
    illustrationType: 'shield',
  },
];

export function getRandomProTip(): ProTip {
  const index = Math.floor(Math.random() * PRO_TIPS.length);
  return PRO_TIPS[index];
}
