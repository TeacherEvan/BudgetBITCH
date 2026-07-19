export type DailyCashSnapshotInput = {
  monthlyIncome: number;
  fixedBills: number;
  essentials: number;
  subscriptions: number;
  daysLeftInCycle: number;
};

export type DailyCashSnapshotStatus = "stable" | "tight" | "at_risk";
export type SubscriptionPressure = "normal" | "high";

export type DailyCashSnapshotResult = {
  status: DailyCashSnapshotStatus;
  moneyLeft: number;
  dailyPace: number;
  totalCommitted: number;
  subscriptionPressure: SubscriptionPressure;
};

function getSubscriptionPressure(input: DailyCashSnapshotInput): SubscriptionPressure {
  if (input.subscriptions <= 0) {
    return "normal";
  }

  if (input.monthlyIncome <= 0) {
    return "high";
  }

  return input.subscriptions / input.monthlyIncome >= 0.1 ? "high" : "normal";
}

export function buildDailyCashSnapshot(
  input: DailyCashSnapshotInput,
): DailyCashSnapshotResult {
  const totalCommitted =
    input.fixedBills + input.essentials + input.subscriptions;
  const moneyLeft = input.monthlyIncome - totalCommitted;
  const dailyPace =
    input.daysLeftInCycle > 0
      ? Math.trunc(moneyLeft / input.daysLeftInCycle)
      : moneyLeft;

  return {
    status: moneyLeft < 0 ? "at_risk" : moneyLeft < 300 ? "tight" : "stable",
    moneyLeft,
    dailyPace,
    totalCommitted,
    subscriptionPressure: getSubscriptionPressure(input),
  };
}