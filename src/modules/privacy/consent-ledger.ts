import type { ProviderId } from "../integrations/provider-types";

export type BuildConsentReceiptInput = {
  workspaceId: string;
  provider: ProviderId;
  disclosureVersion: string;
  disclosures: string[];
};

export function buildConsentReceipt(input: BuildConsentReceiptInput) {
  return {
    workspaceId: input.workspaceId,
    provider: input.provider,
    disclosureVersion: input.disclosureVersion,
    disclosuresJson: {
      items: input.disclosures,
    },
    acceptedAt: new Date(),
  };
}
