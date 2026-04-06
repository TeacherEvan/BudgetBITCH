type ReminderJobPayloadInput = {
  workspaceId: string;
  reminderRuleId: string;
  billId: string;
  channels: Array<"in_app" | "email" | "push">;
};

export function buildReminderJobPayload(input: ReminderJobPayloadInput) {
  return {
    name: "reminders/deliver",
    data: {
      workspaceId: input.workspaceId,
      reminderRuleId: input.reminderRuleId,
      billId: input.billId,
      channels: input.channels,
    },
  };
}
