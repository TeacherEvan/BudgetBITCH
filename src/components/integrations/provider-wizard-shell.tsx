import { type ProviderAction } from "@/modules/integrations/integration-actions";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ToolRail } from "./tool-rail";

type ProviderWizardShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions: ProviderAction[];
  children: React.ReactNode;
};

export function ProviderWizardShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: ProviderWizardShellProps) {
  const t = useTranslations("integrationsShared");

  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl rounded-4xl border border-white/10 bg-black/20 p-8 backdrop-blur">
        <Link
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-emerald-50 transition hover:bg-white/10"
          href="/settings/integrations"
        >
          {t("backToConnectionHub")}
        </Link>
        <p className="mt-5 text-sm uppercase tracking-[0.3em] text-yellow-200">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold">{title}</h1>
        <p className="mt-3 max-w-xl text-sm text-emerald-50/80 sm:text-base">{description}</p>
        <div className="mt-8">
          <ToolRail title={t("tools") as string} actions={actions} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">{children}</div>
      </section>
    </main>
  );
}
