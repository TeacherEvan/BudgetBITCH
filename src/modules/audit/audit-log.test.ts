import { describe, expect, it } from "vitest";
import { buildAuditEvent } from "./audit-log";

describe("buildAuditEvent", () => {
  it("creates a normalized audit payload", () => {
    expect(
      buildAuditEvent({
        workspaceId: "ws_1",
        actorUserId: "user_1",
        action: "workspace_created",
        targetType: "workspace",
        targetId: "ws_1",
        metadata: { name: "Personal Vault" },
      }),
    ).toMatchObject({
      workspaceId: "ws_1",
      actorUserId: "user_1",
      action: "workspace_created",
      targetType: "workspace",
      targetId: "ws_1",
    });
  });
});
