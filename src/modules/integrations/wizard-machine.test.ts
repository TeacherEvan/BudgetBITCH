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

  it("advances from credentials to verification after submitting credentials", () => {
    const state = createWizardState("openclaw");
    const afterDisclosure = advanceWizard(state, { type: "accept_disclosure" });

    expect(advanceWizard(afterDisclosure, { type: "submit_credentials" })).toMatchObject({
      provider: "openclaw",
      step: "verification",
      consentAccepted: true,
    });
  });

  it("advances from verification to complete after verification passes", () => {
    let state = createWizardState("openclaw");
    state = advanceWizard(state, { type: "accept_disclosure" });
    state = advanceWizard(state, { type: "submit_credentials" });

    expect(advanceWizard(state, { type: "verification_passed" })).toMatchObject({
      provider: "openclaw",
      step: "complete",
    });
  });

  it("guards against out-of-order events by returning current state unchanged", () => {
    const state = createWizardState("openclaw");
    // submit_credentials is not valid while still on disclosure step
    expect(advanceWizard(state, { type: "submit_credentials" })).toEqual(state);
  });
});
