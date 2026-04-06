import type { ProviderId } from "./provider-types";

export type WizardStep =
  | "disclosure"
  | "credentials"
  | "verification"
  | "complete";

export type WizardState = {
  provider: ProviderId;
  step: WizardStep;
  consentAccepted: boolean;
};

export type WizardEvent =
  | { type: "accept_disclosure" }
  | { type: "submit_credentials" }
  | { type: "verification_passed" };

export function createWizardState(provider: ProviderId): WizardState {
  return {
    provider,
    step: "disclosure",
    consentAccepted: false,
  };
}

export function advanceWizard(
  state: WizardState,
  event: WizardEvent,
): WizardState {
  if (state.step === "disclosure" && event.type === "accept_disclosure") {
    return {
      ...state,
      step: "credentials",
      consentAccepted: true,
    };
  }

  if (state.step === "credentials" && event.type === "submit_credentials") {
    return {
      ...state,
      step: "verification",
    };
  }

  if (state.step === "verification" && event.type === "verification_passed") {
    return {
      ...state,
      step: "complete",
    };
  }

  return state;
}
