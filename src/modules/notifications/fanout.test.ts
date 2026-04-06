import { describe, expect, it } from "vitest";
import { buildNotificationFanout } from "./fanout";

describe("buildNotificationFanout", () => {
  it("selects in_app and email channels when enabled", () => {
    expect(
      buildNotificationFanout({
        inApp: true,
        email: true,
        push: false,
      }),
    ).toEqual(["in_app", "email"]);
  });
});
