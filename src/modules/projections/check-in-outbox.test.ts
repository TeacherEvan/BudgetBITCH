import { describe, expect, it } from "vitest";
import { createCheckInProjectionOutboxJob } from "./check-in-outbox";

describe("createCheckInProjectionOutboxJob", () => {
  it("creates an idempotent pending projection job", () => {
    expect(
      createCheckInProjectionOutboxJob({
        workspaceId: "ws_1",
        checkInId: "ci_1",
        checkInDate: "2026-04-09",
        payload: {
          headline: "Today needs a tighter plan.",
          alertCount: 2,
        },
      }),
    ).toMatchObject({
      workspaceId: "ws_1",
      topic: "daily_check_in",
      sourceId: "ci_1",
      dedupeKey: "daily_check_in:ws_1:2026-04-09",
      status: "pending",
      attemptCount: 0,
      payloadJson: {
        checkInDate: "2026-04-09",
        headline: "Today needs a tighter plan.",
        alertCount: 2,
      },
    });
  });
});
