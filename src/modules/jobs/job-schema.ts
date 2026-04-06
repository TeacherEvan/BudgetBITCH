import { z } from "zod";

export const jobWorkplaceSchema = z.enum(["remote", "hybrid", "on_site"]);
export const jobTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "gig",
]);
export const jobIndustrySchema = z.enum([
  "support",
  "operations",
  "healthcare_admin",
  "finance",
  "bookkeeping",
  "logistics",
  "payroll",
]);
export const jobExperienceLevelSchema = z.enum([
  "entry",
  "mid",
  "senior",
]);
export const jobScheduleSchema = z.enum([
  "daytime",
  "evening",
  "night",
  "weekend",
  "flexible",
]);
export const jobBenefitSchema = z.enum([
  "healthcare",
  "pto",
  "retirement",
  "remote_stipend",
  "tuition_support",
]);
export const jobVisaStatusSchema = z.enum([
  "no_sponsorship_needed",
  "sponsorship_available",
  "unknown",
]);
export const jobFitGoalSchema = z.enum([
  "raise_income_fast",
  "stabilize_schedule",
  "build_new_career_path",
]);
export const jobFitSignalSchema = z.enum([
  "raise_income_fast",
  "stabilize_schedule",
  "build_new_career_path",
  "flexible_hours",
  "second_job_friendly",
  "no_degree_pathway",
  "caregiving_friendly",
]);

export const jobSearchFiltersSchema = z.object({
  title: z.string().trim().min(1).optional(),
  keyword: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  workplace: jobWorkplaceSchema.optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  jobType: jobTypeSchema.optional(),
  industry: jobIndustrySchema.optional(),
  experienceLevel: jobExperienceLevelSchema.optional(),
  schedule: jobScheduleSchema.optional(),
  benefits: z.array(jobBenefitSchema).default([]),
  visaStatus: jobVisaStatusSchema.optional(),
  postingAgeDays: z.number().int().min(0).optional(),
  fitGoals: z.array(jobFitGoalSchema).default([]),
});

export const jobListingSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().min(1),
  workplace: jobWorkplaceSchema,
  salaryMin: z.number().int().min(0),
  salaryMax: z.number().int().min(0),
  salaryLabel: z.string().trim().min(1),
  jobType: jobTypeSchema,
  industry: jobIndustrySchema,
  experienceLevel: jobExperienceLevelSchema,
  schedule: jobScheduleSchema,
  benefits: z.array(jobBenefitSchema).min(1),
  visaStatus: jobVisaStatusSchema,
  postingAgeDays: z.number().int().min(0),
  fitGoals: z.array(jobFitGoalSchema).min(1),
  fitSignals: z.array(jobFitSignalSchema).min(1),
  summary: z.string().trim().min(1),
});

export type JobSearchFilters = z.infer<typeof jobSearchFiltersSchema>;
export type JobListing = z.infer<typeof jobListingSchema>;
export type JobFitGoal = z.infer<typeof jobFitGoalSchema>;
export type JobFitSignal = z.infer<typeof jobFitSignalSchema>;
