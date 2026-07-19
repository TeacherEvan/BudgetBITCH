import { describe, expect, it } from "vitest";
import { buildSubscriptionTrimHints } from "./subscription-trim-hints";

describe("buildSubscriptionTrimHints", () => {
  it("prioritizes subscription cuts when recurring extras could close most of the gap", () => {
    expect(
      buildSubscriptionTrimHints({
        monthlyIncome: 1800,
        fixedBills: 1200,
        essentials: 420,
        subscriptions: 140,
        daysLeftInCycle: 9,
      }),
    ).toEqual([
      {
        id: "trim_subscriptions",
        label: "Trim subscriptions first.",
        priority: "high",
        estimatedRelief: 140,
      },
      {
        id: "pause_extras",
        label: "Pause extras until the next reset.",
        priority: "medium",
        estimatedRelief: 70,
      },
    ]);
  });

  it("keeps one lower-pressure subscription audit hint when the budget is stable but subscription-heavy", () => {
    expect(
      buildSubscriptionTrimHints({
        monthlyIncome: 2400,
        fixedBills: 900,
        essentials: 520,
        subscriptions: 320,
        daysLeftInCycle: 15,
      }),
    ).toEqual([
      {
        id: "audit_subscriptions",
        label: "Audit recurring extras before they sprawl.",
        priority: "medium",
        estimatedRelief: 80,
      },
    ]);
  });

  it("does not overstate subscription cuts when they cannot materially close the gap", () => {
    expect(
      buildSubscriptionTrimHints({
        monthlyIncome: 1500,
        fixedBills: 1100,
        essentials: 520,
        subscriptions: 20,
        daysLeftInCycle: 8,
      }),
    ).toEqual([]);
  });

  it("returns no trim hints when subscription spend is already light", () => {
    expect(
      buildSubscriptionTrimHints({
        monthlyIncome: 3200,
        fixedBills: 1400,
        essentials: 500,
        subscriptions: 40,
        daysLeftInCycle: 12,
      }),
    ).toEqual([]);
  });
});