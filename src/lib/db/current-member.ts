// lib/db/current-member.ts
//
// Holds the display name of the currently authenticated member so the data
// stores can stamp `createdBy` / `createdByName` on shared-account records.
// Populated once on app load (see AccountSyncMount) from the Convex identity.
// This is the missing write-side of the member-attribution feature: the
// dashboard already *reads* createdBy/createdByName, but nothing ever wrote it.

let currentMemberName: string | null = null;

export function setCurrentMember(name: string | null): void {
  currentMemberName = name && name.trim() ? name.trim() : null;
}

export function getCurrentMember(): string | null {
  return currentMemberName;
}
