import { z } from "zod";

const amountSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        return value;
      }

      if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
        return Number.NaN;
      }

      return Number(trimmed);
    }

    return value;
  },
  z
    .number({ error: "Enter an amount using digits and up to two decimals." })
    .finite("Enter an amount using digits and up to two decimals.")
    .positive("Expense amount must be greater than zero."),
);

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );

export const expenseEntryInputSchema = z.object({
  workspaceId: z.string().trim().min(1),
  budgetCategoryId: optionalTrimmedString(64),
  accountId: optionalTrimmedString(64),
  merchantName: optionalTrimmedString(120),
  amount: amountSchema,
  occurredAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: optionalTrimmedString(280),
});

export const homeAreaInputSchema = z
  .object({
    city: z.string().trim().min(1).max(80),
    stateCode: z
      .string()
      .trim()
      .min(2)
      .max(3)
      .transform((value) => value.toUpperCase()),
    countryCode: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    consented: z.boolean(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .superRefine((value, context) => {
    if (value.latitude !== undefined || value.longitude !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Precise coordinates are not stored; save city/state/country only.",
        path: [value.latitude !== undefined ? "latitude" : "longitude"],
      });
    }
  })
  .transform((value) => ({
    city: value.city,
    stateCode: value.stateCode,
    countryCode: value.countryCode,
    consented: value.consented,
  }));

export type ExpenseEntryInput = z.infer<typeof expenseEntryInputSchema>;
export type HomeAreaInput = z.infer<typeof homeAreaInputSchema>;

export function normalizeExpenseEntryInput(input: unknown) {
  return expenseEntryInputSchema.parse(input);
}

export function normalizeHomeAreaInput(input: unknown) {
  return homeAreaInputSchema.parse(input);
}