"use client";

import type { FormEvent } from "react";
import {
  startSmartProfileSchema,
  type StartSmartProfileInput,
} from "@/modules/start-smart/profile-schema";
import {
  getStartSmartTemplate,
  listStartSmartTemplateCards,
  type StartSmartTemplateId,
} from "@/modules/start-smart/template-catalog";
import {
  nextWizardStep,
  previousWizardStep,
  startSmartWizardSteps,
  type StartSmartWizardStep,
} from "@/modules/start-smart/wizard-machine";
import { parseHomeLocation, type HomeLocation } from "@/modules/home-location/home-location";
import { useHomeLocation } from "@/modules/home-location/use-home-location";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BlueprintPanel } from "./blueprint-panel";
import { ConfidenceBadge } from "./confidence-badge";
import { ProfileForm, type ProfileFormField } from "./profile-form";
import { TemplatePicker } from "./template-picker";

type StartSmartFieldErrors = Partial<Record<keyof StartSmartProfileInput, string>>;

type BlueprintResponse = {
  blueprint: {
    priorityStack: string[];
    riskWarnings: string[];
    next7Days: string[];
    next30Days: string[];
    learnModuleKeys: string[];
    recommendedIntegrations: string[];
  };
  regional: {
    housing?: { confidence: "verified" | "estimated" | "user_entered" };
  };
};

const fallbackProfile: StartSmartProfileInput = {
  countryCode: "",
  stateCode: "",
  ageBand: "adult",
  housing: "renting",
  adults: 1,
  dependents: 0,
  pets: 0,
  incomePattern: "steady",
  debtLoad: "low",
  goals: ["emergency_fund"],
  benefitsSupport: ["none"],
  preferredIntegrations: [],
};

const wizardStepMeta: Record<
  StartSmartWizardStep,
  { label: string; cue: string; icon: LucideIcon }
> = {
  lane: {
    label: "Lane",
    cue: "Choose the starting route that matches the current pressure.",
    icon: Sparkles,
  },
  homeBase: {
    label: "Home Base",
    cue: "Set the sticky region once for Start Smart, dashboard, and jobs.",
    icon: MapPin,
  },
  moneySnapshot: {
    label: "Money Snapshot",
    cue: "Keep only the fields needed for a first survival answer.",
    icon: Wallet,
  },
  survivalPlan: {
    label: "Survival Plan",
    cue: "Read the seven-day answer and the next move.",
    icon: CheckCircle2,
  },
};

const stepFields: Partial<Record<StartSmartWizardStep, ProfileFormField[]>> = {
  homeBase: ["countryCode", "stateCode"],
  moneySnapshot: ["housing", "incomePattern", "dependents", "pets"],
};

function mergeTemplateIntoProfile(
  templateId: StartSmartTemplateId,
  homeLocation?: HomeLocation | null,
): StartSmartProfileInput {
  const defaults = getStartSmartTemplate(templateId)?.defaults ?? {};

  return {
    ...fallbackProfile,
    ...defaults,
    countryCode: homeLocation?.countryCode ?? "",
    stateCode: homeLocation?.stateCode ?? "",
  };
}

function getProfileHomeLocation(values: StartSmartProfileInput) {
  return parseHomeLocation({
    countryCode: values.countryCode,
    stateCode: values.stateCode,
  });
}

function validateProfile(values: StartSmartProfileInput): StartSmartFieldErrors {
  const validationResult = startSmartProfileSchema.safeParse(values);

  if (validationResult.success) {
    return {};
  }

  return Object.entries(validationResult.error.flatten().fieldErrors).reduce(
    (errors, [field, messages]) => {
      if (messages?.[0]) {
        errors[field as keyof StartSmartProfileInput] = messages[0];
      }

      return errors;
    },
    {} as StartSmartFieldErrors,
  );
}

function formatStepLabel(step: StartSmartWizardStep) {
  return wizardStepMeta[step].label;
}

function formatLaneLabel(value: string) {
  return value.replaceAll("_", " ");
}

function pickFieldErrors(
  errors: StartSmartFieldErrors,
  fields: readonly (keyof StartSmartProfileInput)[],
) {
  return fields.reduce((nextErrors, field) => {
    if (errors[field]) {
      nextErrors[field] = errors[field];
    }

    return nextErrors;
  }, {} as StartSmartFieldErrors);
}

export function StartSmartShell() {
  const templates = useMemo(() => listStartSmartTemplateCards(), []);
  const { homeLocation, homeLocationLabel, saveHomeLocation } = useHomeLocation();
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<StartSmartTemplateId>("single_teen");
  const [step, setStep] = useState<StartSmartWizardStep>("lane");
  const [values, setValues] = useState<StartSmartProfileInput>(() =>
    mergeTemplateIntoProfile("single_teen"),
  );
  const [result, setResult] = useState<BlueprintResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<StartSmartFieldErrors>({});

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const currentStepIndex = startSmartWizardSteps.indexOf(step);

  useEffect(() => {
    if (!homeLocation) {
      return;
    }

    setValues((current) => {
      if (
        current.countryCode === homeLocation.countryCode &&
        current.stateCode === homeLocation.stateCode
      ) {
        return current;
      }

      return {
        ...current,
        countryCode: homeLocation.countryCode,
        stateCode: homeLocation.stateCode,
      };
    });
  }, [homeLocation]);

  useEffect(() => {
    const nextHomeLocation = getProfileHomeLocation(values);

    if (!nextHomeLocation) {
      return;
    }

    if (
      homeLocation?.countryCode === nextHomeLocation.countryCode &&
      homeLocation?.stateCode === nextHomeLocation.stateCode
    ) {
      return;
    }

    saveHomeLocation(nextHomeLocation);
  }, [homeLocation, saveHomeLocation, values]);

  function handleTemplateSelect(templateId: StartSmartTemplateId) {
    const nextHomeLocation = getProfileHomeLocation(values) ?? homeLocation;

    setSelectedTemplateId(templateId);
    setValues(mergeTemplateIntoProfile(templateId, nextHomeLocation));
    setResult(null);
    setFieldErrors({});
    setErrorMessage(null);
    setStep("homeBase");
  }

  function handleFieldChange<K extends keyof StartSmartProfileInput>(
    field: K,
    value: StartSmartProfileInput[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });

    setErrorMessage(null);
  }

  function handleAdvanceStep() {
    if (step === "lane") {
      setStep(nextWizardStep(step));
      return;
    }

    if (step === "homeBase") {
      const nextErrors = pickFieldErrors(validateProfile(values), ["countryCode", "stateCode"]);

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...nextErrors }));
        setErrorMessage("Fix the highlighted fields to continue.");
        return;
      }

      setStep(nextWizardStep(step));
      return;
    }

    if (step === "survivalPlan") {
      setStep("moneySnapshot");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (step !== "moneySnapshot") {
      return;
    }

    const validationErrors = validateProfile(values);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrorMessage("Fix the highlighted fields to continue.");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/start-smart/blueprint", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "demo_workspace",
          templateId: selectedTemplateId,
          answers: values,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to build blueprint right now.");
      }

      const payload = (await response.json()) as BlueprintResponse;
      setResult(payload);
      setStep("survivalPlan");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to build blueprint right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentPanelMeta = wizardStepMeta[step];
  const isSubmitStep = step === "moneySnapshot";

  function renderRouteSummary() {
    return (
      <aside className="grid gap-3 self-start">
        <article className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Current route</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{selectedTemplate?.label}</h2>
          <p className="mt-2 text-sm text-emerald-50/75">{selectedTemplate?.summary}</p>

          <div className="mt-4 grid gap-3 text-sm text-emerald-50/80">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">Lane</p>
              <p className="mt-1 font-medium text-white">
                {selectedTemplate ? formatLaneLabel(selectedTemplate.lane) : "household"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">
                Home base
              </p>
              <p className="mt-1 font-medium text-white">{homeLocationLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">
                Household snapshot
              </p>
              <p className="mt-1 font-medium text-white">
                {values.adults} adult{values.adults === 1 ? "" : "s"} · {values.dependents} dependent
                {values.dependents === 1 ? "" : "s"} · {values.pets} pet{values.pets === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-black/20 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Assumption quality</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConfidenceBadge confidence="verified" />
            <ConfidenceBadge confidence="estimated" />
            <ConfidenceBadge confidence="user_entered" />
          </div>
        </article>
      </aside>
    );
  }

  function renderActivePanel() {
    if (step === "lane") {
      return (
        <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <TemplatePicker
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelect={handleTemplateSelect}
          />
          {renderRouteSummary()}
        </div>
      );
    }

    if (step === "homeBase") {
      return (
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileForm
            values={values}
            onChange={handleFieldChange}
            errors={fieldErrors}
            fields={stepFields.homeBase}
            kicker="Home base"
            title="Set one sticky region"
            description="Choose the country and region once. Start Smart, dashboard, and jobs will keep reusing this home base instead of asking again."
          />
          {renderRouteSummary()}
        </div>
      );
    }

    if (step === "moneySnapshot") {
      return (
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileForm
            values={values}
            onChange={handleFieldChange}
            errors={fieldErrors}
            fields={stepFields.moneySnapshot}
            kicker="Money snapshot"
            title="Only the minimum survival inputs"
            description="Keep this panel tight: housing, income pattern, dependents, and pets are enough to produce the first survival answer without another tall setup page."
          />
          {renderRouteSummary()}
        </div>
      );
    }

    return result ? (
      <BlueprintPanel
        blueprint={result.blueprint}
        assumptions={
          result.regional.housing
            ? [
                {
                  label: "Housing",
                  confidence: result.regional.housing.confidence,
                },
              ]
            : []
        }
      />
    ) : (
      <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Survival plan</p>
        <h2 className="mt-2 text-3xl font-semibold">Build the answer first</h2>
        <p className="mt-3 max-w-2xl text-sm text-emerald-50/80">
          Finish the money snapshot panel to generate the seven-day survival plan and the next action.
        </p>
      </section>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden px-4 py-4 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/10 bg-black/20 p-5 backdrop-blur md:p-6">
        <header className="grid gap-5 border-b border-white/10 pb-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Start Smart</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Build a fixed-screen survival answer in four compact panels.
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-emerald-50/85 sm:text-base">
              Lane first, home base once, money snapshot second, and the survival plan last. The
              page never needs to turn back into a tall setup wizard.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Selected template
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedTemplate?.label ?? "Single teen"}
                </p>
                <p className="mt-1 text-sm text-emerald-50/75">
                  {selectedTemplate?.summary ?? "First money habits with low household control."}
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Active panel
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{formatStepLabel(step)}</p>
                <p className="mt-1 text-sm text-emerald-50/75">{currentPanelMeta.cue}</p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Shared home base
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{homeLocationLabel}</p>
                <p className="mt-1 text-sm text-emerald-50/75">
                  Dashboard and jobs now reuse this same region context.
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Household snapshot
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {values.adults} adult{values.adults === 1 ? "" : "s"} · {values.dependents} dependent
                  {values.dependents === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-emerald-50/75">
                  {values.housing.replaceAll("_", " ")} · {values.incomePattern.replaceAll("_", " ")}
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Panel deck</p>
            <ol className="mt-4 grid gap-3">
              {startSmartWizardSteps.map((wizardStep, index) => {
                const { icon: Icon, label, cue } = wizardStepMeta[wizardStep];
                const isCurrent = wizardStep === step;
                const isComplete = index < currentStepIndex;

                return (
                  <li
                    key={wizardStep}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isCurrent
                        ? "border-emerald-300/50 bg-emerald-400/10"
                        : isComplete
                          ? "border-white/10 bg-black/20"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`rounded-xl p-2 ${
                          isCurrent
                            ? "bg-emerald-300/15 text-emerald-100"
                            : isComplete
                              ? "bg-white/10 text-white"
                              : "bg-black/20 text-emerald-50/70"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="mt-1 text-sm text-emerald-50/75">{cue}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </aside>
        </header>

        <form className="mt-5 flex min-h-0 flex-1 flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-4 md:p-5">
            {renderActivePanel()}
          </div>

          {errorMessage ? (
            <p aria-live="assertive" className="text-sm text-rose-200" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/20 p-3">
            <button
              type="button"
              onClick={() => setStep(previousWizardStep(step))}
              disabled={step === "lane" || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back panel
            </button>

            <p className="text-sm text-emerald-50/75">{currentPanelMeta.cue}</p>

            <button
              type={isSubmitStep ? "submit" : "button"}
              onClick={isSubmitStep ? undefined : handleAdvanceStep}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {step === "lane"
                ? "Set home base"
                : step === "homeBase"
                  ? "Open money snapshot"
                  : step === "moneySnapshot"
                    ? isSubmitting
                      ? "Building..."
                      : "Build my survival blueprint"
                    : "Tighten money snapshot"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
