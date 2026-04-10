import { ProjectionOutboxStatus, ProjectionTopic } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildDailyCheckInProjectionOutbox } from "./daily-check-in-outbox";

describe("buildDailyCheckInProjectionOutbox", () => {
  it("builds a pending daily check-in projection outbox record", () => {
    expect(
      buildDailyCheckInProjectionOutbox({
        workspaceId: "ws_123",
        checkInId: "checkin_123",
        checkInDate: new Date("2026-04-08T17:45:00.000Z"),
        checkInJson: {
          mood: "steady",
          wins: ["Packed lunch", "Skipped takeout"],
        },
      }),
    ).toEqual({
      topic: ProjectionTopic.daily_check_in,
      sourceId: "checkin_123",
      dedupeKey: "daily_check_in:checkin_123",
      payloadJson: {
        workspaceId: "ws_123",
        checkInId: "checkin_123",
        checkInDate: "2026-04-08",
        checkInJson: {
          mood: "steady",
          wins: ["Packed lunch", "Skipped takeout"],
        },
      },
      status: ProjectionOutboxStatus.pending,
    });
  });

  it("normalizes equivalent date inputs into the same payload", () => {
    const fromDate = buildDailyCheckInProjectionOutbox({
      workspaceId: "ws_123",
      checkInId: "checkin_123",
      checkInDate: new Date("2026-04-08T00:00:00.000Z"),
      checkInJson: { complete: true },
    });

    const fromIsoString = buildDailyCheckInProjectionOutbox({
      workspaceId: "ws_123",
      checkInId: "checkin_123",
      checkInDate: "2026-04-08",
      checkInJson: { complete: true },
    });

    expect(fromIsoString).toEqual(fromDate);
  });

  it("rejects invalid check-in dates", () => {
    expect(() =>
      buildDailyCheckInProjectionOutbox({
        workspaceId: "ws_123",
        checkInId: "checkin_123",
        checkInDate: "not-a-date",
        checkInJson: { complete: true },
      }),
    ).toThrow("checkInDate must be a valid date or ISO string");
  });
});
