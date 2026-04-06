import { z } from "zod";

export const learnModuleKeySchema = z.enum([
  "budgeting_basics",
  "income_variability",
  "debt_triage",
  "benefits_protection",
  "investing_basics",
  "crypto_risk",
  "nft_speculation",
  "gold_basics",
  "oil_and_commodities",
  "labor_income",
  "taxes_basics",
  "inflation_opportunity_cost",
  "money_behavior",
]);

export const learnLessonCategorySchema = z.enum([
  "budgeting",
  "income",
  "debt",
  "benefits",
  "investing",
  "speculation",
  "commodities",
  "labor",
  "taxes",
  "behavior",
]);

export const learnLessonToneSchema = z.enum(["chaotic_comedy"]);

export const learnLessonSceneSchema = z.object({
  id: z.string().trim().min(1),
  absurdScenario: z.string().trim().min(1),
  plainEnglish: z.string().trim().min(1),
  applyNow: z.string().trim().min(1),
});

export const learnLessonSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  key: learnModuleKeySchema,
  title: z.string().trim().min(1),
  category: learnLessonCategorySchema,
  tone: learnLessonToneSchema,
  summary: z.string().trim().min(1),
  whyItMatters: z.string().trim().min(1),
  blueprintSignals: z.array(z.string().trim().min(1)).min(1),
  scenes: z.array(learnLessonSceneSchema).min(1),
  takeaways: z.array(z.string().trim().min(1)).min(1),
  nextActionLabel: z.string().trim().min(1),
});

export type LearnModuleKey = z.infer<typeof learnModuleKeySchema>;
export type LearnLessonCategory = z.infer<typeof learnLessonCategorySchema>;
export type LearnLessonTone = z.infer<typeof learnLessonToneSchema>;
export type LearnLessonScene = z.infer<typeof learnLessonSceneSchema>;
export type LearnLesson = z.infer<typeof learnLessonSchema>;
