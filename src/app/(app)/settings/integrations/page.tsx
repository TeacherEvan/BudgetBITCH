import { ProviderCard } from "@/components/integrations/provider-card";
import { providerRegistry } from "@/modules/integrations/provider-registry";

export default function IntegrationsPage() {
    const providers = Object.values(providerRegistry);

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

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    {providers.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} />
                    ))}
                </div>
            </section>
        </main>
    );
}
