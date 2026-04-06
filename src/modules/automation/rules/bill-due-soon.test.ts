import { describe, expect, it } from "vitest";
import { evaluateBillDueSoon } from "./bill-due-soon";

describe("evaluateBillDueSoon", () => {
  it("triggers when a bill is due within three days", () => {
    expect(
      evaluateBillDueSoon({
        today: "2026-04-06",
        dueDate: "2026-04-08",
        thresholdDays: 3,
      }),
    ).toEqual({
      shouldTrigger: true,
      reason: "bill_due_soon",
      daysUntilDue: 2,
    });
  });
});
