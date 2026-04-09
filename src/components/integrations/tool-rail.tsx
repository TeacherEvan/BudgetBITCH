import Link from "next/link";
import type { ProviderAction } from "@/modules/integrations/integration-actions";

type ToolRailProps = {
  title: string;
  actions: ProviderAction[];
};

const actionStyles: Record<ProviderAction["kind"], string> = {
  primary: "border-emerald-200/30 bg-emerald-300/15 text-white",
  secondary: "border-white/10 bg-white/10 text-emerald-50",
  tertiary: "border-white/10 bg-black/20 text-emerald-100",
};

function ActionLink({ action }: { action: ProviderAction }) {
  const className = [
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-white/15",
    actionStyles[action.kind],
  ].join(" ");

  if (action.href.startsWith("/")) {
    return (
      <Link className={className} href={action.href}>
        {action.label}
      </Link>
    );
  }

  return (
    <a className={className} href={action.href}>
      {action.label}
    </a>
  );
}

export function ToolRail({ title, actions }: ToolRailProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <ActionLink key={`${action.kind}-${action.label}-${action.href}`} action={action} />
        ))}
      </div>
    </section>
  );
}
