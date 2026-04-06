export type WorkspaceRole = "owner" | "editor" | "approver" | "read_only";

export function canManageWorkspaceMembers(role: WorkspaceRole) {
  return role === "owner";
}

export function canViewAuditLog(role: WorkspaceRole) {
  return role === "owner" || role === "read_only";
}
