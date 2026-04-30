import { describe, expect, it } from "vitest";
import { nextWizardStep } from "./wizard-machine";

describe("nextWizardStep", () => {
  it("moves from lane selection to home-base details", () => {
    expect(nextWizardStep("lane")).toBe("homeBase");
  });
});
