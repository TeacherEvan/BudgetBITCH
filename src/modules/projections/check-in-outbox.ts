export type CheckInProjectionPayload = {
  headline: string;
  alertCount: number;
};

export function createCheckInProjectionOutboxJob(input: {
  workspaceId: string;
  checkInId: string;
  checkInDate: string;
  payload: CheckInProjectionPayload;
}) {
  return {
    workspaceId: input.workspaceId,
    topic: "daily_check_in" as const,
    sourceId: input.checkInId,
    dedupeKey: `daily_check_in:${input.workspaceId}:${input.checkInDate}`,
    payloadJson: {
      checkInDate: input.checkInDate,
      ...input.payload,
    },
    status: "pending" as const,
    attemptCount: 0,
    availableAt: new Date(),
  };
}
