"use client";

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
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BlueprintPanel } from "./blueprint-panel";
import { ConfidenceBadge } from "./confidence-badge";
import { ProfileForm } from "./profile-form";
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
  template: {
    label: "Template",
    cue: "Pick the closest life lane.",
    icon: Sparkles,
  },
  region: {
    label: "Region",
    cue: "Lock in local assumptions.",
    icon: MapPin,
  },
  household: {
    label: "Household",
    cue: "Size up dependents and housing.",
    icon: Users,
  },
  money: {
    label: "Money",
    cue: "Capture cash-flow texture fast.",
    icon: Wallet,
  },
  review: {
    label: "Review",
    cue: "Sanity check the profile.",
    icon: ClipboardList,
  },
  blueprint: {
    label: "Blueprint",
    cue: "Read the survival plan.",
    icon: CheckCircle2,
  },
};

function mergeTemplateIntoProfile(templateId: StartSmartTemplateId): StartSmartProfileInput {
  const defaults = getStartSmartTemplate(templateId)?.defaults ?? {};

  return {
    ...fallbackProfile,
    ...defaults,
    countryCode: "",
    stateCode: "",
  };
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

type StartSmartShellProps = {
  workspaceId: string | null;
};

export function StartSmartShell({ workspaceId }: StartSmartShellProps) {
  const templates = useMemo(() => listStartSmartTemplateCards(), []);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<StartSmartTemplateId>("single_teen");
  const [step, setStep] = useState<StartSmartWizardStep>("template");
  const [values, setValues] = useState<StartSmartProfileInput>(() =>
    mergeTemplateIntoProfile("single_teen"),
  );
  const [result, setResult] = useState<BlueprintResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<StartSmartFieldErrors>({});
  const hasAccessibleWorkspace = workspaceId !== null;

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const currentStepIndex = startSmartWizardSteps.indexOf(step);

  function handleTemplateSelect(templateId: StartSmartTemplateId) {
    setSelectedTemplateId(templateId);
    setValues(mergeTemplateIntoProfile(templateId));
    setResult(null);
    setFieldErrors({});
    setErrorMessage(null);
    setStep("region");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!hasAccessibleWorkspace) {
      setErrorMessage("You need workspace access before building a blueprint.");
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
          workspaceId,
          templateId: selectedTemplateId,
          answers: values,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to build blueprint right now.");
      }

      const payload = (await response.json()) as BlueprintResponse;
      setResult(payload);
      setStep("blueprint");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to build blueprint right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Start Smart</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Build your survival blueprint in one quick pass.
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-emerald-50/85 sm:text-base">
              Pick a life lane, confirm the location + household details, and read the next-step
              plan without drowning in setup copy.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <article className="rounded-[24px] border border-white/10 bg-white/6 p-4">
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
              <article className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Current step
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{formatStepLabel(step)}</p>
                <p className="mt-1 text-sm text-emerald-50/75">{wizardStepMeta[step].cue}</p>
              </article>
              <article className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  Assumption quality
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ConfidenceBadge confidence="verified" />
                  <ConfidenceBadge confidence="estimated" />
                  <ConfidenceBadge confidence="user_entered" />
                </div>
              </article>
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Step map</p>
            <ol className="mt-4 grid gap-3">
              {startSmartWizardSteps.map((wizardStep, index) => {
                const { icon: Icon, label, cue } = wizardStepMeta[wizardStep];
                const isCurrent = wizardStep === step;
                const isComplete =
                  index < currentStepIndex || (wizardStep === "template" && step !== "template");

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

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <TemplatePicker
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelect={handleTemplateSelect}
          />

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-5">
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
                  Default income pattern
                </p>
                <p className="mt-1 font-medium text-white">{formatLaneLabel(values.incomePattern)}</p>
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
          </aside>
        </div>

        <form className="mt-8 grid gap-6" noValidate onSubmit={handleSubmit}>
          <ProfileForm values={values} onChange={handleFieldChange} errors={fieldErrors} />

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(previousWizardStep(step))}
              disabled={step === "template"}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back step
            </button>
            <button
              type="button"
              onClick={() => setStep(nextWizardStep(step))}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Advance step
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasAccessibleWorkspace}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Building..." : "Build my survival blueprint"}
            </button>
          </div>

          {errorMessage ? (
            <p aria-live="assertive" className="text-sm text-rose-200" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {result ? (
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
          ) : null}
        </form>
      </section>
    </main>
  );
}
