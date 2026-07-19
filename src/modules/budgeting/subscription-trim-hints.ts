import {
  buildDailyCashSnapshot,
  type DailyCashSnapshotInput,
} from "./daily-cash-snapshot";

export type SubscriptionTrimHintId =
  | "trim_subscriptions"
  | "pause_extras"
  | "audit_subscriptions";

export type SubscriptionTrimHintPriority = "high" | "medium";

export type SubscriptionTrimHint = {
  id: SubscriptionTrimHintId;
  label: string;
  priority: SubscriptionTrimHintPriority;
  estimatedRelief: number;
};

export function buildSubscriptionTrimHints(
  input: DailyCashSnapshotInput,
): SubscriptionTrimHint[] {
  if (input.subscriptions <= 0) {
    return [];
  }

  const snapshot = buildDailyCashSnapshot(input);
  const statusGap =
    snapshot.status === "at_risk"
      ? Math.abs(snapshot.moneyLeft)
      : snapshot.status === "tight"
        ? 300 - snapshot.moneyLeft
        : 0;
  const canMateriallyCloseGap = statusGap > 0 && input.subscriptions >= statusGap * 0.5;

  if ((snapshot.status === "at_risk" || snapshot.status === "tight") && canMateriallyCloseGap) {
    return [
      {
        id: "trim_subscriptions",
        label: "Trim subscriptions first.",
        priority: "high",
        estimatedRelief: input.subscriptions,
      },
      {
        id: "pause_extras",
        label: "Pause extras until the next reset.",
        priority: "medium",
        estimatedRelief: Math.trunc(input.subscriptions / 2),
      },
    ];
  }

  if (snapshot.subscriptionPressure === "high") {
    return [
      {
        id: "audit_subscriptions",
        label: "Audit recurring extras before they sprawl.",
        priority: "medium",
        estimatedRelief: Math.trunc(input.subscriptions / 4),
      },
    ];
  }

  return [];
}