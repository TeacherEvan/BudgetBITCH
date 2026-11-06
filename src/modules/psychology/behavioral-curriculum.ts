// src/modules/psychology/behavioral-curriculum.ts
//
// Pure domain logic for psychological financial literacy, micro-courses,
// and actionable behavioral triggers.
//
// Rooted in behavioral economics:
// - Kahneman & Tversky (Loss Aversion, Framing)
// - Richard Thaler (Mental Accounting, Nudge)
// - Clark Hull & Albert Bandura (Goal-Gradient Effect & Self-Efficacy)
// - Peter Gollwitzer (Implementation Intentions)

export interface BehavioralLesson {
  id: string;
  category: 'foundations' | 'debt_relief' | 'habit_loops' | 'macro_wealth';
  title: string;
  tagline: string;
  psychologicalPrinciple: string;
  readingMinutes: number;
  iconName: string;
  badgeLabel: string;
  conceptSummary: string[];
  cognitiveTrap: string;
  behavioralSolution: string;
  actionTrigger: {
    label: string;
    targetTab?: 'standard' | 'variance' | 'cashflow' | 'pivot' | 'perspective';
    targetPanel?: string;
    href?: string;
  };
}

export const BEHAVIORAL_LESSONS: readonly BehavioralLesson[] = [
  {
    id: 'runway-over-salary',
    category: 'macro_wealth',
    title: 'Runway Over Salary: The Freedom Metric',
    tagline: 'Why financial independence is measured in months, not dollars.',
    psychologicalPrinciple: 'Hyperbolic Discounting & Status Bias',
    readingMinutes: 2,
    iconName: 'Compass',
    badgeLabel: 'CORE PERSPECTIVE',
    conceptSummary: [
      'Society trains us to evaluate wealth by our monthly salary or gross income. But a high earner spending 98% of their income is just 3 weeks away from insolvency.',
      'Your true wealth is Financial Runway: how many months you can survive with zero income while maintaining your baseline living expenses.',
      'Extending your runway from 1 month to 6 months fundamentally alters your psychological leverage at work and removes constant fight-or-flight cortisol.',
    ],
    cognitiveTrap: 'Focusing exclusively on earning more while allowing lifestyle inflation to keep your runway stuck at under 30 days.',
    behavioralSolution: 'Shift your primary benchmark from "How much do I make?" to "How many months of freedom do I own?"',
    actionTrigger: {
      label: 'Explore Your Runway Horizon',
      targetTab: 'perspective',
    },
  },
  {
    id: 'mental-accounting-buckets',
    category: 'foundations',
    title: 'Taming Mental Accounting',
    tagline: 'How our brains trick us into treating dollars differently.',
    psychologicalPrinciple: 'Mental Accounting (Richard Thaler)',
    readingMinutes: 3,
    iconName: 'PieChart',
    badgeLabel: 'BEHAVIORAL ECONOMICS',
    conceptSummary: [
      'Money is strictly fungible—every dollar has the exact same value. Yet humans naturally create emotional compartments: a $50 tax refund feels like "free play money", while $50 from a salary feels sacrosanct.',
      'Retailers exploit this by bundling purchases, giving "cashback", or offering gift cards.',
      'By consciously designing 3 clear macro buckets (50% Essentials, 30% Flexibility, 20% Future Self), you eliminate decision fatigue without feeling deprived.',
    ],
    cognitiveTrap: 'Splurging unexpected cash or tax refunds because it feels like "bonus" money rather than real capital.',
    behavioralSolution: 'Pre-commit incoming windfalls: allocate 50% immediately to debt/emergency buffer and 50% to guilt-free enjoyment.',
    actionTrigger: {
      label: 'Review Your 50/30/20 Matrix',
      targetTab: 'pivot',
    },
  },
  {
    id: 'debt-snowball-psychology',
    category: 'debt_relief',
    title: 'Snowball vs. Avalanche: The Dopamine Equation',
    tagline: 'Why emotional momentum often beats pure mathematical optimization.',
    psychologicalPrinciple: 'Goal-Gradient Effect & Self-Efficacy',
    readingMinutes: 3,
    iconName: 'Flame',
    badgeLabel: 'DEBT ELIMINATION',
    conceptSummary: [
      'Mathematically, paying the highest APR debt first (The Avalanche) saves the most interest. But personal finance is 20% math and 80% behavior.',
      'The Debt Snowball (paying the smallest balance first) delivers fast psychological victories. Completely eliminating a $300 card triggers a hit of dopamine and proves you can win.',
      'Research consistently shows that borrowers who use the Snowball method are significantly more likely to stick with the plan until 100% debt-free.',
    ],
    cognitiveTrap: 'Attempting a mathematically optimal plan that feels overwhelming, leading to discouragement and giving up.',
    behavioralSolution: 'Pick Avalanche if you are strictly analytical; pick Snowball if you need quick, tangible emotional wins to stay motivated.',
    actionTrigger: {
      label: 'Compare Strategies in Debt Payoff',
      targetTab: 'standard',
      targetPanel: 'debt',
    },
  },
  {
    id: 'phantom-recurring-drain',
    category: 'habit_loops',
    title: 'Hunting Phantom Drain: The Rule of 752',
    tagline: 'How unnoticed recurring charges quietly drain years of wealth.',
    psychologicalPrinciple: 'Status Quo Bias & Subscription Inertia',
    readingMinutes: 2,
    iconName: 'ZapOff',
    badgeLabel: 'HABIT LOOP',
    conceptSummary: [
      'Companies design recurring subscriptions because they capitalize on status quo inertia: once started, canceling requires effort and facing mild loss.',
      'The "Rule of 752": multiply any recurring weekly expense by 752 to see its 10-year future value if invested at 7%. A $15/week unused gym or streaming tier is over $11,200 of lost future capital.',
      'Conducting a "Cut-One Audit" each month reclaims hundreds in annual cash flow with zero loss in real life quality.',
    ],
    cognitiveTrap: 'Believing that small $9.99 charges do not move the needle.',
    behavioralSolution: 'Audit your active subscriptions once every 30 days and cancel just one service you have not used in the past two weeks.',
    actionTrigger: {
      label: 'Audit Active Subscriptions',
      targetTab: 'standard',
      targetPanel: 'subscriptions',
    },
  },
  {
    id: 'the-daily-ceiling-calm',
    category: 'foundations',
    title: 'The Daily Ceiling: Banishing End-of-Month Panic',
    tagline: 'How dividing remaining cash into days stops the binge-and-starve cycle.',
    psychologicalPrinciple: 'Cognitive Load Reduction & Anchoring',
    readingMinutes: 2,
    iconName: 'CalendarCheck',
    badgeLabel: 'DAILY MINDFULNESS',
    conceptSummary: [
      'Looking at a monthly bank balance of $1,400 triggers an illusion of wealth in week 1, leading to overspending and stressful panic by week 4.',
      'Budget Boss transforms this with the Daily Disposable Ceiling: Free Cash divided by the exact days left in the month.',
      'If you spend less today, tomorrow\'s ceiling automatically expands. If you treat a friend today, tomorrow simply asks for modest pacing.',
    ],
    cognitiveTrap: 'Treating a lump-sum bank balance as spendable money without subtracting upcoming fixed bills.',
    behavioralSolution: 'Check your Daily Disposable ceiling once in the morning to anchor your day\'s discretionary spending.',
    actionTrigger: {
      label: 'View Today\'s Disposable Hero',
      targetTab: 'standard',
      targetPanel: 'daily_budget',
    },
  },
] as const;

export interface LessonProgress {
  completedLessonIds: string[];
  lastCompletedAt: number | null;
}

export function isLessonCompleted(progress: LessonProgress, lessonId: string): boolean {
  return progress.completedLessonIds.includes(lessonId);
}

export function toggleLessonCompletion(progress: LessonProgress, lessonId: string): LessonProgress {
  const exists = progress.completedLessonIds.includes(lessonId);
  const updatedIds = exists
    ? progress.completedLessonIds.filter((id) => id !== lessonId)
    : [...progress.completedLessonIds, lessonId];

  return {
    completedLessonIds: updatedIds,
    lastCompletedAt: Date.now(),
  };
}
