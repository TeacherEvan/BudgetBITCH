import type { Prisma } from "@prisma/client";

type StartSmartProfileInput = {
  workspaceId: string;
  templateId?: string;
  regionKey: string;
  householdKind: string;
  profile: Prisma.InputJsonValue;
};

export function buildProfileRecord(input: StartSmartProfileInput) {
  return {
    workspaceId: input.workspaceId,
    templateId: input.templateId ?? null,
    regionKey: input.regionKey,
    householdKind: input.householdKind,
    status: "draft" as const,
    profileJson: input.profile,
  };
}
