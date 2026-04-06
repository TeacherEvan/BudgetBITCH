import type { StartSmartProfileInput } from "./profile-schema";

export type StartSmartTemplateLane =
  | "household"
  | "solo_situation"
  | "high_friction"
  | "custom_starter";

export type StartSmartTemplateId =
  | "single_teen"
  | "young_adult"
  | "new_couple"
  | "couple_with_pets"
  | "family"
  | "family_with_pets"
  | "entrepreneur"
  | "freelancer"
  | "student"
  | "widow_widower"
  | "investor"
  | "philanthropist"
  | "caregiver"
  | "job_seeker"
  | "retiree"
  | "recent_graduate"
  | "single_parent"
  | "rebuilding_after_divorce"
  | "housing_insecure"
  | "debt_overload"
  | "irregular_income_worker"
  | "immigrant_new_arrival"
  | "disability_limited_income"
  | "starting_over_after_crisis"
  | "build_from_scratch";

export type StartSmartTemplate = {
  id: StartSmartTemplateId;
  label: string;
  lane: StartSmartTemplateLane;
  summary: string;
  defaults: Partial<StartSmartProfileInput>;
};

export const startSmartTemplates: Record<
  StartSmartTemplateId,
  StartSmartTemplate
> = {
  single_teen: {
    id: "single_teen",
    label: "Single teen",
    lane: "household",
    summary: "First money habits with low control over household bills.",
    defaults: {
      ageBand: "single_teen",
      housing: "living_with_family",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "none",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  young_adult: {
    id: "young_adult",
    label: "Young adult",
    lane: "household",
    summary:
      "Independent setup with rent pressure and first real recurring bills.",
    defaults: {
      ageBand: "young_adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "low",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  new_couple: {
    id: "new_couple",
    label: "New couple",
    lane: "household",
    summary:
      "Two adults blending bills, goals, and awkward subscription archaeology.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 2,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  couple_with_pets: {
    id: "couple_with_pets",
    label: "Couple with pets",
    lane: "household",
    summary: "Shared costs with furry chaos and surprise vet math.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 2,
      dependents: 0,
      pets: 2,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  family: {
    id: "family",
    label: "Family",
    lane: "household",
    summary: "Multi-person household with child-related cost pressure.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 2,
      dependents: 2,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  family_with_pets: {
    id: "family_with_pets",
    label: "Family with pets",
    lane: "household",
    summary: "Family budgeting with both dependent and pet-cost drag.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 2,
      dependents: 2,
      pets: 1,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  entrepreneur: {
    id: "entrepreneur",
    label: "Entrepreneur",
    lane: "solo_situation",
    summary:
      "Income swings, optimism, and a dangerous friendship with cash flow.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "moderate",
      goals: ["grow_income", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["openai"],
    },
  },
  freelancer: {
    id: "freelancer",
    label: "Freelancer",
    lane: "solo_situation",
    summary: "Project-based income with feast-or-famine budgeting needs.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "low",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["openai"],
    },
  },
  student: {
    id: "student",
    label: "Student",
    lane: "solo_situation",
    summary: "Low income, education costs, and short-term survival planning.",
    defaults: {
      ageBand: "young_adult",
      housing: "living_with_family",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "low",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  widow_widower: {
    id: "widow_widower",
    label: "Widow / widower",
    lane: "solo_situation",
    summary:
      "Rebuilding one-person finances after major loss and household change.",
    defaults: {
      ageBand: "adult",
      housing: "owning",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  investor: {
    id: "investor",
    label: "Investor",
    lane: "solo_situation",
    summary: "Growth-minded setup that still needs a boring stable base layer.",
    defaults: {
      ageBand: "adult",
      housing: "owning",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "low",
      goals: ["build_investing_habit", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["openai", "claude"],
    },
  },
  philanthropist: {
    id: "philanthropist",
    label: "Philanthropist",
    lane: "solo_situation",
    summary:
      "Generous giving priorities that still need guardrails and sustainability.",
    defaults: {
      ageBand: "adult",
      housing: "owning",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "none",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["claude"],
    },
  },
  caregiver: {
    id: "caregiver",
    label: "Caregiver",
    lane: "solo_situation",
    summary:
      "Time-constrained planning with support obligations and burnout risk.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 1,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  job_seeker: {
    id: "job_seeker",
    label: "Job seeker",
    lane: "solo_situation",
    summary: "Reduced income visibility and a strong need for runway planning.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "none",
      debtLoad: "moderate",
      goals: ["grow_income", "stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  retiree: {
    id: "retiree",
    label: "Retiree",
    lane: "solo_situation",
    summary: "Fixed-income planning with healthcare and drawdown awareness.",
    defaults: {
      ageBand: "retiree",
      housing: "owning",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "low",
      goals: ["protect_benefits", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  recent_graduate: {
    id: "recent_graduate",
    label: "Recent graduate",
    lane: "solo_situation",
    summary: "Early-career budgeting with debt and transition costs.",
    defaults: {
      ageBand: "young_adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["debt_relief", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  single_parent: {
    id: "single_parent",
    label: "Single parent",
    lane: "high_friction",
    summary: "One primary income with high schedule and dependent pressure.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 2,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "high",
      goals: ["stabilize_cash_flow", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  rebuilding_after_divorce: {
    id: "rebuilding_after_divorce",
    label: "Rebuilding after divorce",
    lane: "high_friction",
    summary: "New bill structure, legal drag, and lifestyle reset planning.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 1,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "high",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  housing_insecure: {
    id: "housing_insecure",
    label: "Housing insecure",
    lane: "high_friction",
    summary:
      "Immediate shelter stability and emergency cash preservation first.",
    defaults: {
      ageBand: "adult",
      housing: "housing_insecure",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  debt_overload: {
    id: "debt_overload",
    label: "Debt overload",
    lane: "high_friction",
    summary:
      "Debt pressure is already loud, so triage and minimums come first.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "high",
      goals: ["debt_relief", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  irregular_income_worker: {
    id: "irregular_income_worker",
    label: "Irregular-income worker",
    lane: "high_friction",
    summary: "Shift changes and income swings demand strong buffer planning.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "moderate",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  immigrant_new_arrival: {
    id: "immigrant_new_arrival",
    label: "Immigrant / new arrival",
    lane: "high_friction",
    summary: "New local systems, documentation pressure, and setup costs.",
    defaults: {
      ageBand: "adult",
      housing: "temporary",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "variable",
      debtLoad: "low",
      goals: ["stabilize_cash_flow"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  disability_limited_income: {
    id: "disability_limited_income",
    label: "Disability-limited income",
    lane: "high_friction",
    summary: "Benefits-aware planning with stability and support preservation.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "moderate",
      goals: ["protect_benefits", "emergency_fund"],
      benefitsSupport: ["disability_support"],
      preferredIntegrations: [],
    },
  },
  starting_over_after_crisis: {
    id: "starting_over_after_crisis",
    label: "Starting over after crisis",
    lane: "high_friction",
    summary:
      "Reset mode: protect essentials, reduce chaos, rebuild one step at a time.",
    defaults: {
      ageBand: "adult",
      housing: "temporary",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "none",
      debtLoad: "high",
      goals: ["stabilize_cash_flow", "emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
  build_from_scratch: {
    id: "build_from_scratch",
    label: "Build from scratch",
    lane: "custom_starter",
    summary: "Skip the template and start with a blank, fully custom plan.",
    defaults: {
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "low",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    },
  },
};

export function getStartSmartTemplate(id: StartSmartTemplateId) {
  return startSmartTemplates[id];
}

export function listStartSmartTemplateCards() {
  return Object.values(startSmartTemplates).map((template) => ({
    id: template.id,
    label: template.label,
    lane: template.lane,
    summary: template.summary,
  }));
}
