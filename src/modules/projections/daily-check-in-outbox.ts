import {
  ProjectionOutboxStatus,
  ProjectionTopic,
  type Prisma,
  type ProjectionOutbox,
} from "@prisma/client";

export type BuildDailyCheckInProjectionOutboxInput = {
  workspaceId: string;
  checkInId: string;
  checkInDate: Date | string;
  checkInJson: Prisma.JsonValue;
};

export type DailyCheckInProjectionPayload = {
  workspaceId: string;
  checkInId: string;
  checkInDate: string;
  checkInJson: Prisma.JsonValue;
};

export type DailyCheckInProjectionOutboxRecord = Pick<
  ProjectionOutbox,
  "topic" | "sourceId" | "dedupeKey" | "payloadJson" | "status"
>;

export function buildDailyCheckInProjectionOutbox(
  input: BuildDailyCheckInProjectionOutboxInput,
): DailyCheckInProjectionOutboxRecord {
  const normalizedCheckInDate = normalizeCheckInDate(input.checkInDate);

  return {
    topic: ProjectionTopic.daily_check_in,
    sourceId: input.checkInId,
    dedupeKey: `${ProjectionTopic.daily_check_in}:${input.checkInId}`,
    payloadJson: {
      workspaceId: input.workspaceId,
      checkInId: input.checkInId,
      checkInDate: normalizedCheckInDate,
      checkInJson: input.checkInJson,
    } satisfies DailyCheckInProjectionPayload,
    status: ProjectionOutboxStatus.pending,
  };
}

function normalizeCheckInDate(checkInDate: Date | string) {
  const parsedDate =
    checkInDate instanceof Date ? checkInDate : parseCheckInDate(checkInDate);

  if (Number.isNaN(parsedDate.valueOf())) {
    throw new Error("checkInDate must be a valid date or ISO string");
  }

  return parsedDate.toISOString().slice(0, 10);
}

function parseCheckInDate(checkInDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
    return new Date(`${checkInDate}T00:00:00.000Z`);
  }

  return new Date(checkInDate);
}
