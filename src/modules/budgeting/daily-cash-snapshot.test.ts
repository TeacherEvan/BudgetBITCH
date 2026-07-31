import { describe, expect, it } from "vitest";
import { buildDailyCashSnapshot } from "./daily-cash-snapshot";

describe("buildDailyCashSnapshot", () => {
  it("returns a stable result with money left and pacing guidance", () => {
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 3200,
        fixedBills: 1400,
        essentials: 500,
        subscriptions: 90,
        daysLeftInCycle: 12,
      }),
    ).toMatchObject({
      status: "stable",
      moneyLeft: 1210,
      dailyPace: 100,
    });
  });

  it("marks the user tight when little flex remains", () => {
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 2100,
        fixedBills: 1200,
        essentials: 450,
        subscriptions: 160,
        daysLeftInCycle: 8,
      }),
    ).toMatchObject({
      status: "tight",
      moneyLeft: 290,
      dailyPace: 36,
    });
  });

  it("marks the user at risk when obligations outrun income", () => {
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 1700,
        fixedBills: 1300,
        essentials: 500,
        subscriptions: 60,
        daysLeftInCycle: 10,
      }),
    ).toMatchObject({
      status: "at_risk",
      moneyLeft: -160,
      dailyPace: -16,
    });
  });

  it("flags heavy subscription load when recurring extras eat too much income", () => {
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 2400,
        fixedBills: 900,
        essentials: 520,
        subscriptions: 320,
        daysLeftInCycle: 15,
      }),
    ).toMatchObject({
      status: "stable",
      moneyLeft: 660,
      subscriptionPressure: "high",
    });
  });

  it("handles exact threshold boundaries (moneyLeft 0 and 300)", () => {
    // Exactly 0 money left -> tight
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 1000,
        fixedBills: 500,
        essentials: 500,
        subscriptions: 0,
        daysLeftInCycle: 10,
      }),
    ).toMatchObject({
      status: "tight",
      moneyLeft: 0,
      dailyPace: 0,
    });

    // Exactly 300 money left -> stable
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 1300,
        fixedBills: 500,
        essentials: 500,
        subscriptions: 0,
        daysLeftInCycle: 10,
      }),
    ).toMatchObject({
      status: "stable",
      moneyLeft: 300,
      dailyPace: 30,
    });
  });

  it("handles zero or negative income edge cases", () => {
    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 0,
        fixedBills: 100,
        essentials: 100,
        subscriptions: 50,
        daysLeftInCycle: 10,
      }),
    ).toMatchObject({
      status: "at_risk",
      moneyLeft: -250,
      subscriptionPressure: "high",
    });

    expect(
      buildDailyCashSnapshot({
        monthlyIncome: 0,
        fixedBills: 0,
        essentials: 0,
        subscriptions: 0,
        daysLeftInCycle: 10,
      }),
    ).toMatchObject({
      status: "tight",
      moneyLeft: 0,
      subscriptionPressure: "normal",
    });
  });
});