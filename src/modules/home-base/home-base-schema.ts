import { z } from "zod";

export const homeBaseFieldsSchema = z.object({
  city: z.string().trim().min(1),
  region: z.string().trim().min(1).max(64),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  source: z.enum(["manual", "geolocation"]),
});

export type HomeBaseFields = z.infer<typeof homeBaseFieldsSchema>;

export function formatHomeBaseLabel(input: HomeBaseFields) {
  return `${input.city}, ${input.region}, ${input.countryCode}`;
}

export const homeBaseSchema = homeBaseFieldsSchema.transform((value) => ({
  ...value,
  label: formatHomeBaseLabel(value),
}));

export type HomeBase = z.infer<typeof homeBaseSchema>;