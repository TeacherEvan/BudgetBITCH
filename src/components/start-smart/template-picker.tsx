import type { StartSmartTemplateId, StartSmartTemplateLane } from "@/modules/start-smart/template-catalog";

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

function formatLaneLabel(lane: StartSmartTemplateLane) {
  return lane.replaceAll("_", " ");
}

export function TemplatePicker({
  templates,
  selectedTemplateId,
  onSelect,
}: TemplatePickerProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">
            Starting paths
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Pick a template or build from scratch
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isActive = template.id === selectedTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`rounded-[28px] border p-5 text-left transition ${
                isActive
                  ? "border-emerald-300/50 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(110,231,183,0.2)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-100/70">
                {formatLaneLabel(template.lane)}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {template.label}
              </h3>
              <p className="mt-2 text-sm text-emerald-50/80">{template.summary}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}