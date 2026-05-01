import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { ProviderCard } from "@/components/integrations/provider-card";
import { getRequestMessages } from "@/i18n/server";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import {
  Briefcase,
  Landmark,
  Receipt,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type ProviderCategory = "ai" | "banking" | "investing" | "payroll" | "tax" | "finance_ops";

const categoryMeta: Record<ProviderCategory, { icon: LucideIcon }> = {
  ai: {
    icon: Sparkles,
  },
  banking: {
    icon: Landmark,
  },
  investing: {
    icon: Sparkles,
  },
  payroll: {
    icon: Wallet,
  },
  tax: {
    icon: Receipt,
  },
  finance_ops: {
    icon: Briefcase,
  },
};

type GuardrailMessage =
  | string
  | {
      label: string;
      title?: string;
    };

function normalizeGuardrail(item: GuardrailMessage) {
  return typeof item === "string" ? { label: item } : item;
}

export default async function IntegrationsPage() {
  const messages = await getRequestMessages();
  const providersByCategory = Object.values(providerRegistry).reduce(
    (groups, provider) => {
      groups[provider.category].push(provider);
      return groups;
    },
    {
      ai: [],
      banking: [],
      investing: [],
      payroll: [],
      tax: [],
      finance_ops: [],
    } as Record<ProviderCategory, Array<(typeof providerRegistry)[keyof typeof providerRegistry]>>,
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <MobilePanelFrame>
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
        <header className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">{messages.integrationsHub.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {messages.integrationsHub.title}
          </h1>
          <p className="mt-3 text-sm text-emerald-50/85 sm:text-base">
            {messages.integrationsHub.description}
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            messages.integrationsHub.guardrails.officialRoutesFirst,
            messages.integrationsHub.guardrails.noSilentSharing,
            messages.integrationsHub.guardrails.revokePathStaysObvious,
          ].map((item) => {
            const guardrail = normalizeGuardrail(item);

            return (
            <div
              key={guardrail.label}
              title={guardrail.title}
              className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-emerald-50/80"
            >
              {guardrail.label}
            </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6">
          {Object.entries(providersByCategory).map(([category, providers]) => {
            if (providers.length === 0) {
              return null;
            }

            const meta = categoryMeta[category as ProviderCategory];
            const categoryMessages = messages.integrationsHub.categories[category as ProviderCategory];
            const Icon = meta.icon;

            return (
              <section
                key={category}
                aria-labelledby={`${category}-heading`}
                className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-3 text-emerald-100">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-yellow-200">{messages.integrationsHub.groupedScan}</p>
                      <h2 id={`${category}-heading`} className="mt-2 text-2xl font-semibold text-white">
                        {categoryMessages.label}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm text-emerald-50/75">{categoryMessages.summary}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    {messages.integrationsHub.providerCount.replace("{count}", String(providers.length))}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {providers.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
      </MobilePanelFrame>
    </main>
  );
}
