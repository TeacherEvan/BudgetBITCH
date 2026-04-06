import { describe, expect, it } from "vitest";
import { buildReminderJobPayload } from "./reminder-job";

describe("buildReminderJobPayload", () => {
  it("creates an Inngest-ready payload for reminder delivery", () => {
    expect(
      buildReminderJobPayload({
        workspaceId: "ws_1",
        reminderRuleId: "rule_1",
        billId: "bill_1",
        channels: ["in_app", "email"],
      }),
    ).toEqual({
      name: "reminders/deliver",
      data: {
        workspaceId: "ws_1",
        reminderRuleId: "rule_1",
        billId: "bill_1",
        channels: ["in_app", "email"],
      },
    });
  });
});
