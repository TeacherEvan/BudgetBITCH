import { ProviderCard } from "@/components/integrations/provider-card";
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { Briefcase, Landmark, Receipt, Sparkles, Wallet, type LucideIcon } from "lucide-react";

type ProviderCategory = "ai" | "banking" | "investing" | "payroll" | "tax" | "finance_ops";

const categoryMeta: Record<
  ProviderCategory,
  { label: string; summary: string; icon: LucideIcon }
> = {
  ai: {
    label: "AI copilots",
    summary: "Model-powered helpers, planning copilots, and prompt-heavy workflow tools.",
    icon: Sparkles,
  },
  banking: {
    label: "Banking rails",
    summary: "Account verification and banking connections that should feel official, not sneaky.",
    icon: Landmark,
  },
  investing: {
    label: "Investing",
    summary: "Brokerage and portfolio tools that belong behind clear permissions and revoke paths.",
    icon: Sparkles,
  },
  payroll: {
    label: "Payroll",
    summary: "Income, pay runs, and worker details that need low-friction but careful setup.",
    icon: Wallet,
  },
  tax: {
    label: "Tax and accounting",
    summary: "Documents, filings, and ledger access where trust cues must be obvious.",
    icon: Receipt,
  },
  finance_ops: {
    label: "Finance operations",
    summary: "Expense, card, and ops tooling for the parts of money management that stay boring on purpose.",
    icon: Briefcase,
  },
};

export default function IntegrationsPage() {
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
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
        <header className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Connection Hub</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Connect only the providers you can scan and trust fast.
          </h1>
          <p className="mt-3 text-sm text-emerald-50/85 sm:text-base">
            Every group below leads with the official route, the risk level, and the easiest next
            action so you can move without reading a giant safety essay first.
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            "Official routes first",
            "No silent sharing",
            "Revoke path stays obvious",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-emerald-50/80"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6">
          {Object.entries(providersByCategory).map(([category, providers]) => {
            if (providers.length === 0) {
              return null;
            }

            const meta = categoryMeta[category as ProviderCategory];
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
                      <p className="text-sm uppercase tracking-[0.22em] text-yellow-200">Grouped scan</p>
                      <h2 id={`${category}-heading`} className="mt-2 text-2xl font-semibold text-white">
                        {meta.label}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm text-emerald-50/75">{meta.summary}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    {providers.length} providers
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
    </main>
  );
}
