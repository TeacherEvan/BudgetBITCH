// convex/feedback.test.ts
import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ADMIN_SUBJECT = "user_admin_1";

function withAdminEnv(t: ReturnType<typeof convexTest>) {
  // Feedback admin-ness is resolved server-side from FEEDBACK_ADMIN_EMAIL and
  // the caller's identity email. The test harness has no env, so we model the
  // admin as the email the handler defaults to when the env var is absent.
  return t.withIdentity({
    subject: ADMIN_SUBJECT,
    email: "ewiebotha@gmail.com",
  });
}

describe("feedback:getRecent authorization", () => {
  let t: ReturnType<typeof convexTest>;
  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("rejects an unauthenticated (anonymous) caller", async () => {
    await t.mutation(api.feedback.report, {
      type: "bug",
      message: "probe",
    });
    await expect(
      t.query(api.feedback.getRecent, {}),
    ).rejects.toThrow();
  });

  it("rejects an authenticated non-admin caller", async () => {
    await t.mutation(api.feedback.report, {
      type: "bug",
      message: "probe",
    });
    await expect(
      t
        .withIdentity({ subject: "user_stranger", email: "stranger@example.com" })
        .query(api.feedback.getRecent, {}),
    ).rejects.toThrow();
  });

  it("returns reports only for an authenticated admin caller", async () => {
    await t.mutation(api.feedback.report, {
      type: "bug",
      message: "probe",
    });
    const rows = await withAdminEnv(t).query(api.feedback.getRecent, {});
    expect(rows.length).toBe(1);
    expect(rows[0].message).toBe("probe");
  });
});

describe("feedback:delete", () => {
  let t: ReturnType<typeof convexTest>;
  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("lets an admin delete a report and removes it from getRecent", async () => {
    const { reportId } = await t.mutation(api.feedback.report, {
      type: "bug",
      message: "to-delete",
    });
    // Anonymous + non-admin cannot delete.
    await expect(
      t.mutation(api.feedback.deleteReport, { reportId: reportId as never }),
    ).rejects.toThrow();
    await expect(
      t
        .withIdentity({ subject: "user_stranger", email: "stranger@example.com" })
        .mutation(api.feedback.deleteReport, { reportId: reportId as never }),
    ).rejects.toThrow();

    // Admin can.
    await withAdminEnv(t).mutation(api.feedback.deleteReport, {
      reportId: reportId as never,
    });
    const rows = await withAdminEnv(t).query(api.feedback.getRecent, {});
    expect(rows.find((r) => r._id === reportId)).toBeUndefined();
  });
});
