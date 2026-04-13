import { ProviderCard } from "@/components/integrations/provider-card";
import { IntegrationCategoryNav } from "@/components/integrations/integration-category-nav";
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

const categoryOrder: ProviderCategory[] = ["ai", "banking", "investing", "payroll", "tax", "finance_ops"];

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

  const categories = categoryOrder
    .map((category) => {
      const providers = providersByCategory[category];

      return {
        category,
        id: `category-${category}`,
        label: categoryMeta[category].label,
        summary: categoryMeta[category].summary,
        count: providers.length,
        providers,
      };
    })
    .filter((category) => category.count > 0);

  const totalProviders = categories.reduce((sum, category) => sum + category.count, 0);
  const setupWizardCount = Object.values(providerRegistry).filter((provider) => provider.setupPath)
    .length;

  return (
    <main className="min-w-0 min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto min-w-0 max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-5 backdrop-blur sm:p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <header className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Settings hub</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Integrations</h1>
            <p className="mt-3 text-sm text-emerald-50/85 sm:text-base">
              Pick a category, jump to the provider group, and keep every setup path close to the
              official login or documentation route.
            </p>

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
          </header>

          <aside className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-yellow-200">At a glance</p>
            <p className="mt-3 max-w-md text-sm text-emerald-50/75">
              This page is a quick settings surface for the integrations you actually use. Start
              with the category map, then open the provider group you need.
            </p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Providers", value: totalProviders.toString() },
                { label: "Categories", value: categories.length.toString() },
                { label: "Setup wizards", value: setupWizardCount.toString() },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.22em] text-yellow-200/80">{item.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <div className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-yellow-200">Category navigator</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Jump straight to the group you need</h2>
              <p className="mt-2 max-w-3xl text-sm text-emerald-50/75">
                The links below keep the page readable on smaller screens while making every
                provider category one tap away.
              </p>
            </div>
          </div>

          <IntegrationCategoryNav categories={categories} />
        </div>

        <div className="mt-8 grid gap-6">
          {categories.map((category) => {
            const Icon = categoryMeta[category.category].icon;

            return (
              <section
                key={category.id}
                id={category.id}
                aria-labelledby={`${category.id}-heading`}
                className="scroll-mt-24 rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-3 text-emerald-100">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-yellow-200">Grouped scan</p>
                      <h2 id={`${category.id}-heading`} className="mt-2 text-2xl font-semibold text-white">
                        {category.label}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm text-emerald-50/75">{category.summary}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    {category.count} providers
                  </span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {category.providers.map((provider) => (
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
