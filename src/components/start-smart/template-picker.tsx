"use client";

import type { StartSmartTemplateId, StartSmartTemplateLane } from "@/modules/start-smart/template-catalog";
import { useMemo, useState } from "react";

type TemplateCard = {
  id: StartSmartTemplateId;
  label: string;
  lane: StartSmartTemplateLane;
  summary: string;
};

type TemplatePickerProps = {
  templates: TemplateCard[];
  selectedTemplateId: StartSmartTemplateId;
  onSelect: (id: StartSmartTemplateId) => void;
};

const laneMeta: Record<
  StartSmartTemplateLane,
  { label: string; summary: string }
> = {
  household: {
    label: "Household basics",
    summary: "Common starting setups for solo adults, couples, and families.",
  },
  solo_situation: {
    label: "Solo situations",
    summary: "Independent setups with career, caregiving, or life-stage twists.",
  },
  high_friction: {
    label: "High-friction starts",
    summary: "Templates built for urgent pressure, instability, or reset mode.",
  },
  custom_starter: {
    label: "Custom starter",
    summary: "Skip the pre-built story and start from your own baseline.",
  },
};

function formatLaneLabel(lane: StartSmartTemplateLane) {
  return lane.replaceAll("_", " ");
}

export function TemplatePicker({
  templates,
  selectedTemplateId,
  onSelect,
}: TemplatePickerProps) {
  const lanes = useMemo(
    () => Array.from(new Set(templates.map((template) => template.lane))),
    [templates],
  );
  const [activeLane, setActiveLane] = useState<StartSmartTemplateLane>(
    templates.find((template) => template.id === selectedTemplateId)?.lane ??
      templates[0]?.lane ??
      "household",
  );

  const visibleTemplates = templates.filter((template) => template.lane === activeLane);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Starting paths</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose a life lane first</h2>
        </div>
        <p className="max-w-2xl text-sm text-emerald-50/75">
          Pick the lane that looks most like your current pressure, then grab the closest template.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Template lanes">
        {lanes.map((lane) => {
          const isActive = lane === activeLane;

          return (
            <button
              key={lane}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveLane(lane)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-emerald-300/50 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-white/5 text-emerald-50/80 hover:bg-white/10"
              }`}
            >
              {laneMeta[lane].label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-yellow-200">
          {formatLaneLabel(activeLane)}
        </p>
        <p className="mt-2 text-sm text-emerald-50/75">{laneMeta[activeLane].summary}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => {
            const isActive = template.id === selectedTemplateId;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isActive
                    ? "border-emerald-300/50 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(110,231,183,0.2)]"
                    : "border-white/10 bg-black/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">
                      {laneMeta[template.lane].label}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-white">{template.label}</h3>
                  </div>
                  {isActive ? (
                    <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-emerald-50/80">{template.summary}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
