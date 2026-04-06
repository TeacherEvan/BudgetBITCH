import { ProviderCard } from "@/components/integrations/provider-card";
import { providerRegistry } from "@/modules/integrations/provider-registry";

const categoryLabels = {
  ai: "AI copilots",
  banking: "Banking rails",
  investing: "Investing",
  payroll: "Payroll",
  tax: "Tax and accounting",
  finance_ops: "Finance operations",
} as const;

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
        } as Record<keyof typeof categoryLabels, Array<(typeof providerRegistry)[keyof typeof providerRegistry]>>,
    );

    return (
        <main className="min-h-screen px-6 py-10 text-white">
            <section className="mx-auto max-w-6xl">
                <div className="max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">
                        Connection Hub
                    </p>
                    <h1 className="mt-4 text-4xl font-bold">
                        Connect only the providers you explicitly trust.
                    </h1>
                    <p className="mt-4 text-base text-emerald-50/85">
                        Every wizard shows the official path, the privacy shield, and a clear
                        revoke route before anything can be enabled.
                    </p>
                </div>

                <div className="mt-8 grid gap-10">
                    {Object.entries(providersByCategory).map(([category, providers]) =>
                        providers.length > 0 ? (
                            <section key={category}>
                                <h2 className="text-2xl font-semibold text-white">
                                    {categoryLabels[category as keyof typeof categoryLabels]}
                                </h2>
                                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                                    {providers.map((provider) => (
                                        <ProviderCard key={provider.id} provider={provider} />
                                    ))}
                                </div>
                            </section>
                        ) : null,
                    )}
                </div>
            </section>
        </main>
    );
}
