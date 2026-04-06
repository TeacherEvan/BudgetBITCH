"use client";

import { useMemo, useState } from "react";
import { getStartSmartTemplate, listStartSmartTemplateCards, type StartSmartTemplateId } from "@/modules/start-smart/template-catalog";
import { nextWizardStep, type StartSmartWizardStep } from "@/modules/start-smart/wizard-machine";
import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";
import { ConfidenceBadge } from "./confidence-badge";
import { BlueprintPanel } from "./blueprint-panel";
import { ProfileForm } from "./profile-form";
import { TemplatePicker } from "./template-picker";

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

function mergeTemplateIntoProfile(templateId: StartSmartTemplateId): StartSmartProfileInput {
  const defaults = getStartSmartTemplate(templateId)?.defaults ?? {};

  return {
    ...fallbackProfile,
    ...defaults,
    countryCode: "",
    stateCode: "",
  };
}

export function StartSmartShell() {
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

  function handleTemplateSelect(templateId: StartSmartTemplateId) {
    setSelectedTemplateId(templateId);
    setValues(mergeTemplateIntoProfile(templateId));
    setResult(null);
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
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

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
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-8 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">
              Start Smart
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              Choose your chaos. Build your control.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-emerald-50/85">
              Pick a life path or start fully custom. BudgetBITCH turns your situation
              into a Money Survival Blueprint with location-aware assumptions and next
              moves that actually matter.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-emerald-100/80">
            Current step: {step}
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <TemplatePicker
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelect={handleTemplateSelect}
          />

          <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">
              Assumption quality
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ConfidenceBadge confidence="verified" />
              <ConfidenceBadge confidence="estimated" />
              <ConfidenceBadge confidence="user_entered" />
            </div>
            <p className="mt-4 text-sm text-emerald-50/75">
              Verified values come from the most trusted curated sources. Estimated values
              keep the wizard useful when local data is incomplete.
            </p>
          </div>
        </div>

        <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
          <ProfileForm values={values} onChange={handleFieldChange} />

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(nextWizardStep(step))}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10"
            >
              Advance step
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Building..." : "Build my survival blueprint"}
            </button>
          </div>

          {errorMessage ? (
            <p className="text-sm text-rose-200">{errorMessage}</p>
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
