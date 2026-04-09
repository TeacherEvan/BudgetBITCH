import { describe, expect, it } from "vitest";
import {
  canManageIntegrations,
  canManageWorkspaceMembers,
  canViewAuditLog,
} from "./permissions";

describe("workspace permissions", () => {
  it("allows only owners to manage members", () => {
    expect(canManageWorkspaceMembers("owner")).toBe(true);
    expect(canManageWorkspaceMembers("editor")).toBe(false);
    expect(canManageWorkspaceMembers("approver")).toBe(false);
    expect(canManageWorkspaceMembers("read_only")).toBe(false);
  });

  it("allows only owners to manage integrations", () => {
    expect(canManageIntegrations("owner")).toBe(true);
    expect(canManageIntegrations("editor")).toBe(false);
    expect(canManageIntegrations("approver")).toBe(false);
    expect(canManageIntegrations("read_only")).toBe(false);
  });

  it("allows owners and read-only auditors to view audit log", () => {
    expect(canViewAuditLog("owner")).toBe(true);
    expect(canViewAuditLog("read_only")).toBe(true);
    expect(canViewAuditLog("editor")).toBe(false);
  });
});
