import { describe, expect, it } from "vitest";
import { advanceWizard, createWizardState } from "./wizard-machine";

describe("integration wizard machine", () => {
  it("starts on disclosure and requires consent before credentials", () => {
    expect(createWizardState("claude")).toEqual({
      provider: "claude",
      step: "disclosure",
      consentAccepted: false,
    });
  });

  it("moves to credentials after the privacy shield is accepted", () => {
    const state = createWizardState("openai");

    expect(advanceWizard(state, { type: "accept_disclosure" })).toEqual({
      provider: "openai",
      step: "credentials",
      consentAccepted: true,
    });
  });
});
