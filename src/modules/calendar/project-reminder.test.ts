import { describe, expect, it } from "vitest";
import { projectReminderToCalendarEvent } from "./project-reminder";

describe("projectReminderToCalendarEvent", () => {
  it("maps reminder data into a calendar event shape", () => {
    expect(
      projectReminderToCalendarEvent({
        title: "Pay rent",
        startAt: "2026-04-08T09:00:00.000Z",
        endAt: "2026-04-08T09:15:00.000Z",
      }),
    ).toEqual({
      title: "Pay rent",
      startsAt: "2026-04-08T09:00:00.000Z",
      endsAt: "2026-04-08T09:15:00.000Z",
    });
  });
});
