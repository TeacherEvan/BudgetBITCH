import { differenceInCalendarDays, parseISO } from "date-fns";

type EvaluateBillDueSoonInput = {
  today: string;
  dueDate: string;
  thresholdDays: number;
};

export function evaluateBillDueSoon(input: EvaluateBillDueSoonInput) {
  const daysUntilDue = differenceInCalendarDays(
    parseISO(input.dueDate),
    parseISO(input.today),
  );

  return {
    shouldTrigger: daysUntilDue >= 0 && daysUntilDue <= input.thresholdDays,
    reason: "bill_due_soon" as const,
    daysUntilDue,
  };
}
