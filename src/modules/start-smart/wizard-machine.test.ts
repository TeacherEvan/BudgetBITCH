import { describe, expect, it } from "vitest";
import { nextWizardStep } from "./wizard-machine";

describe("nextWizardStep", () => {
  it("moves from template selection to region details", () => {
    expect(nextWizardStep("template")).toBe("region");
  });
});
