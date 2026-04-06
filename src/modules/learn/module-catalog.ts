import {
  type LearnLesson,
  type LearnModuleKey,
  learnLessonSchema,
} from "./module-schema";

const rawLearnModules = [
  {
    slug: "budgeting-basics",
    key: "budgeting_basics",
    title: "Budgeting Basics",
    category: "budgeting",
    tone: "chaotic_comedy",
    summary: "Give every dollar a job before your money wanders off wearing sunglasses.",
    whyItMatters:
      "Budgeting is the base layer for essentials, optional spending, and emergency breathing room.",
    blueprintSignals: ["cover_essentials", "build_emergency_buffer"],
    scenes: [
      {
        id: "budgeting-basics-scene-1",
        absurdScenario:
          "A raccoon CFO keeps approving snack subscriptions because nobody made a real plan.",
        plainEnglish:
          "A budget is a decision made before the spending happens, not a post-chaos apology.",
        applyNow:
          "List fixed bills first, then assign the remaining money to savings, food, and flexible spending.",
      },
    ],
    takeaways: [
      "A budget is a plan, not a punishment.",
      "Essentials get funded before optional chaos.",
    ],
    nextActionLabel: "Review your essentials",
  },
  {
    slug: "income-variability",
    key: "income_variability",
    title: "Income Variability",
    category: "income",
    tone: "chaotic_comedy",
    summary: "When your paycheck behaves like weather, your budget needs umbrellas.",
    whyItMatters:
      "Variable income requires buffer planning, low-month survival rules, and realistic bill timing.",
    blueprintSignals: ["stabilize_cash_flow", "income_volatility_risk"],
    scenes: [
      {
        id: "income-variability-scene-1",
        absurdScenario:
          "Your paychecks arrive like mysterious festival pigeons: three at once, then none for a while.",
        plainEnglish:
          "Variable income works best with a baseline spending number based on your lower-earning months.",
        applyNow:
          "Choose a conservative monthly income floor and build your bills around that number.",
      },
    ],
    takeaways: [
      "Budget from the floor, not the best month.",
      "Buffers buy you time when income timing gets weird.",
    ],
    nextActionLabel: "Set a low-month income floor",
  },
  {
    slug: "debt-triage",
    key: "debt_triage",
    title: "Debt Triage",
    category: "debt",
    tone: "chaotic_comedy",
    summary: "Debt gets louder when ignored, so this lesson teaches orderly panic management.",
    whyItMatters:
      "When debt pressure is high, protecting essentials and minimums matters more than fantasy spreadsheets.",
    blueprintSignals: ["reduce_debt_damage", "high_debt_pressure"],
    scenes: [
      {
        id: "debt-triage-scene-1",
        absurdScenario:
          "Four bills show up wearing fake mustaches, all claiming to be the most urgent villain in town.",
        plainEnglish:
          "Debt triage means separating immediate damage control from longer-term payoff strategy.",
        applyNow:
          "List balances, minimums, due dates, and any account already at risk of fees or missed payments.",
      },
    ],
    takeaways: [
      "Damage control comes before optimization.",
      "One clean debt inventory reduces panic fast.",
    ],
    nextActionLabel: "Make a debt triage list",
  },
  {
    slug: "benefits-protection",
    key: "benefits_protection",
    title: "Benefits Protection",
    category: "benefits",
    tone: "chaotic_comedy",
    summary: "Keep support programs from disappearing because of accidental paperwork gymnastics.",
    whyItMatters:
      "Households with benefits dependence need planning that avoids preventable support disruptions.",
    blueprintSignals: ["protect_benefits", "benefits_dependency"],
    scenes: [
      {
        id: "benefits-protection-scene-1",
        absurdScenario:
          "A filing cabinet goblin keeps moving your documents right before renewal week.",
        plainEnglish:
          "Benefits often depend on timing, documentation, and reporting changes correctly.",
        applyNow:
          "Collect renewal dates, required documents, and the contact method for each program you rely on.",
      },
    ],
    takeaways: [
      "Track deadlines before they become emergencies.",
      "Document lists reduce last-minute mistakes.",
    ],
    nextActionLabel: "Audit benefits deadlines",
  },
  {
    slug: "investing-basics",
    key: "investing_basics",
    title: "Investing Basics",
    category: "investing",
    tone: "chaotic_comedy",
    summary: "How to stop confusing long-term investing with glittery guessing.",
    whyItMatters:
      "A stable investing habit works better when it sits on top of cash flow and emergency reserves.",
    blueprintSignals: ["build_investing_habit", "build_emergency_buffer"],
    scenes: [
      {
        id: "investing-basics-scene-1",
        absurdScenario:
          "A seagull in a tiny vest says your retirement plan should definitely be based on vibes.",
        plainEnglish:
          "Investing is buying assets for long-term growth, not making random bets for instant drama.",
        applyNow:
          "Confirm you can cover essentials and start with a small, repeatable contribution amount.",
      },
    ],
    takeaways: [
      "Consistency beats excitement.",
      "Invest after your cash-flow floor is protected.",
    ],
    nextActionLabel: "Set an investing starter amount",
  },
  {
    slug: "crypto-risk",
    key: "crypto_risk",
    title: "Crypto Risk",
    category: "speculation",
    tone: "chaotic_comedy",
    summary: "Volatility, hype, and the difference between curiosity and financial self-sabotage.",
    whyItMatters:
      "Speculative assets can magnify risk when essentials and buffers are not already secure.",
    blueprintSignals: ["build_emergency_buffer", "stabilize_cash_flow"],
    scenes: [
      {
        id: "crypto-risk-scene-1",
        absurdScenario:
          "A moon-obsessed toaster insists every coin is about to become a castle.",
        plainEnglish:
          "Crypto prices can swing hard, so money needed for bills should not be exposed to that volatility.",
        applyNow:
          "Decide what percentage of your money, if any, belongs in speculative assets after essentials are covered.",
      },
    ],
    takeaways: [
      "Speculation is not an emergency fund.",
      "Risk is easier to manage when the amount is capped in advance.",
    ],
    nextActionLabel: "Set a speculation limit",
  },
  {
    slug: "nft-speculation",
    key: "nft_speculation",
    title: "NFT Speculation",
    category: "speculation",
    tone: "chaotic_comedy",
    summary: "Scarcity stories are not the same thing as stable value.",
    whyItMatters:
      "Hype-driven assets can distract from boring but necessary financial priorities.",
    blueprintSignals: ["cover_essentials", "build_emergency_buffer"],
    scenes: [
      {
        id: "nft-speculation-scene-1",
        absurdScenario:
          "A jpeg in sunglasses keeps introducing itself as your future retirement yacht.",
        plainEnglish:
          "Speculative collectibles can lose demand fast, making them unreliable as core financial planning tools.",
        applyNow:
          "Separate entertainment spending from long-term saving so speculative purchases do not raid essentials.",
      },
    ],
    takeaways: [
      "Novelty is not a financial foundation.",
      "Protect your base plan before funding hype.",
    ],
    nextActionLabel: "Define your fun-money limit",
  },
  {
    slug: "gold-basics",
    key: "gold_basics",
    title: "Gold Basics",
    category: "commodities",
    tone: "chaotic_comedy",
    summary: "Shiny metal can play a role, but it is not a magical anti-chaos amulet.",
    whyItMatters:
      "Commodity exposure should be understood as one piece of a broader risk picture, not a universal answer.",
    blueprintSignals: ["build_investing_habit", "stability"],
    scenes: [
      {
        id: "gold-basics-scene-1",
        absurdScenario:
          "A pirate accountant keeps yelling that gold fixes everything, including your grocery budget.",
        plainEnglish:
          "Gold can behave differently from stocks or cash, but it does not replace income planning or emergency savings.",
        applyNow:
          "Write down what problem you expect gold to solve before buying any of it.",
      },
    ],
    takeaways: [
      "Know why you own an asset.",
      "Diversification is more useful than mythology.",
    ],
    nextActionLabel: "Define the purpose of the asset",
  },
  {
    slug: "oil-and-commodities",
    key: "oil_and_commodities",
    title: "Oil and Commodities",
    category: "commodities",
    tone: "chaotic_comedy",
    summary: "Commodity prices ripple into daily life even when you never trade them directly.",
    whyItMatters:
      "Understanding commodity swings helps explain cost spikes in transport, goods, and household budgets.",
    blueprintSignals: ["stabilize_cash_flow", "inflation_risk"],
    scenes: [
      {
        id: "oil-and-commodities-scene-1",
        absurdScenario:
          "A gallon of fuel starts acting like a celebrity with a chaotic pricing team.",
        plainEnglish:
          "Commodity costs can push up transport and goods prices, which changes how far your paycheck stretches.",
        applyNow:
          "Review the categories in your budget most sensitive to price spikes and add a small buffer.",
      },
    ],
    takeaways: [
      "Input costs can affect your household indirectly.",
      "Buffers matter when price swings hit essentials.",
    ],
    nextActionLabel: "Add a price-spike buffer",
  },
  {
    slug: "labor-income",
    key: "labor_income",
    title: "Labor Income",
    category: "labor",
    tone: "chaotic_comedy",
    summary: "Your paycheck is a financial engine, not just a line item that appears by wizardry.",
    whyItMatters:
      "Most financial plans are powered by labor income, so pay stability and growth deserve direct attention.",
    blueprintSignals: ["grow_income", "stabilize_cash_flow"],
    scenes: [
      {
        id: "labor-income-scene-1",
        absurdScenario:
          "Your timesheet tries to unionize against the coffee machine because nobody respects scheduling.",
        plainEnglish:
          "Income planning means understanding hours, pay rate, benefits, and what makes that income fragile or durable.",
        applyNow:
          "List the factors that most affect your take-home pay: hours, overtime, tips, commissions, or benefits.",
      },
    ],
    takeaways: [
      "Income stability is part of financial strategy.",
      "Knowing your pay drivers helps you plan faster.",
    ],
    nextActionLabel: "Map your pay drivers",
  },
  {
    slug: "taxes-basics",
    key: "taxes_basics",
    title: "Taxes Basics",
    category: "taxes",
    tone: "chaotic_comedy",
    summary: "Taxes are less mysterious when you stop treating every form like an ancient curse tablet.",
    whyItMatters:
      "Tax surprises can wreck cash flow if withholding, self-employment obligations, or due dates are ignored.",
    blueprintSignals: ["stabilize_cash_flow", "grow_income"],
    scenes: [
      {
        id: "taxes-basics-scene-1",
        absurdScenario:
          "A stack of forms begins whispering confusing prophecies every April.",
        plainEnglish:
          "Taxes affect what you actually keep, so planning around net income matters more than guessing from gross pay.",
        applyNow:
          "Compare your gross pay, take-home pay, and any separate tax obligations in one simple note.",
      },
    ],
    takeaways: [
      "Net income is the planning number that matters most.",
      "Deadlines are cheaper than penalties.",
    ],
    nextActionLabel: "Write down your tax basics",
  },
  {
    slug: "inflation-opportunity-cost",
    key: "inflation_opportunity_cost",
    title: "Inflation and Opportunity Cost",
    category: "behavior",
    tone: "chaotic_comedy",
    summary: "Why the price of waiting and the cost of drifting both matter.",
    whyItMatters:
      "Inflation erodes idle cash over time, while every dollar spent one way cannot do another job.",
    blueprintSignals: ["build_emergency_buffer", "cover_essentials"],
    scenes: [
      {
        id: "inflation-opportunity-cost-scene-1",
        absurdScenario:
          "Your grocery cart quietly adds a tiny tax called 'time keeps happening.'",
        plainEnglish:
          "Inflation reduces purchasing power, and opportunity cost means choosing one use of money means giving up another.",
        applyNow:
          "Pick one recurring expense and write what else that money could fund if reduced.",
      },
    ],
    takeaways: [
      "Time changes what money can buy.",
      "Every spending choice closes another option.",
    ],
    nextActionLabel: "Compare one tradeoff",
  },
  {
    slug: "money-behavior",
    key: "money_behavior",
    title: "Money Behavior",
    category: "behavior",
    tone: "chaotic_comedy",
    summary: "Your habits, defaults, and moods are secretly in the group chat with your bank account.",
    whyItMatters:
      "Financial progress depends on systems and behavior, not just knowledge.",
    blueprintSignals: ["cover_essentials", "stability"],
    scenes: [
      {
        id: "money-behavior-scene-1",
        absurdScenario:
          "Your brain keeps sending impulse purchases dressed as urgent life advice.",
        plainEnglish:
          "Behavior patterns shape money outcomes, so reducing friction for good habits is often more effective than relying on willpower.",
        applyNow:
          "Identify one spending trigger and add one barrier between the urge and the purchase.",
      },
    ],
    takeaways: [
      "Systems beat motivation spikes.",
      "Tiny friction can prevent expensive detours.",
    ],
    nextActionLabel: "Change one money trigger",
  },
] as const satisfies readonly LearnLesson[];

export const learnModules = rawLearnModules.map((module) =>
  learnLessonSchema.parse(module),
);

export function listLearnModules() {
  return [...learnModules];
}

export function getLearnModuleByKey(key: LearnModuleKey) {
  return learnModules.find((module) => module.key === key);
}

export function getLearnModuleBySlug(slug: string) {
  return learnModules.find((module) => module.slug === slug);
}
