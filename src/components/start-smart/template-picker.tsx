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
          <p className="bb-start-smart-eyebrow">Starting paths</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose a life lane first</h2>
        </div>
        <p className="bb-start-smart-copy-soft max-w-2xl text-sm">
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
              className="bb-start-smart-tab rounded-full px-4 py-2 text-sm font-semibold"
              data-active={isActive}
              data-tone={lane}
            >
              {laneMeta[lane].label}
            </button>
          );
        })}
      </div>

      <div className="bb-start-smart-panel mt-4 p-4 md:p-5" data-tone={activeLane}>
        <p className="bb-start-smart-eyebrow text-[0.68rem] tracking-[0.22em]">
          {formatLaneLabel(activeLane)}
        </p>
        <p className="bb-start-smart-copy-soft mt-2 text-sm">{laneMeta[activeLane].summary}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => {
            const isActive = template.id === selectedTemplateId;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                className="bb-start-smart-template-card rounded-[24px] p-4 text-left"
                data-active={isActive}
                data-tone={template.lane}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="bb-start-smart-eyebrow text-[0.66rem] tracking-[0.2em]">
                      {laneMeta[template.lane].label}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-white">{template.label}</h3>
                  </div>
                  {isActive ? (
                    <span className="rounded-full border border-yellow-200/20 bg-yellow-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-100">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="bb-start-smart-copy-soft mt-2 text-sm">{template.summary}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
