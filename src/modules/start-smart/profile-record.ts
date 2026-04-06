type JsonInput =
  | string
  | number
  | boolean
  | { [key: string]: JsonInput | null }
  | (JsonInput | null)[];

type StartSmartProfileInput = {
  workspaceId: string;
  templateId?: string;
  regionKey: string;
  householdKind: string;
  profile: JsonInput;
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
