export const startSmartWizardSteps = [
  "lane",
  "homeBase",
  "moneySnapshot",
  "survivalPlan",
] as const;

export type StartSmartWizardStep = (typeof startSmartWizardSteps)[number];

export function nextWizardStep(
  currentStep: StartSmartWizardStep,
): StartSmartWizardStep {
  const currentIndex = startSmartWizardSteps.indexOf(currentStep);

  if (
    currentIndex === -1 ||
    currentIndex === startSmartWizardSteps.length - 1
  ) {
    return currentStep;
  }

  return startSmartWizardSteps[currentIndex + 1];
}

export function previousWizardStep(
  currentStep: StartSmartWizardStep,
): StartSmartWizardStep {
  const currentIndex = startSmartWizardSteps.indexOf(currentStep);

  if (currentIndex <= 0) {
    return startSmartWizardSteps[0];
  }

  return startSmartWizardSteps[currentIndex - 1];
}
