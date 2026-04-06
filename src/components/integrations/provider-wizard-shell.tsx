type ProviderWizardShellProps = {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
};

export function ProviderWizardShell({
    eyebrow,
    title,
    description,
    children,
}: ProviderWizardShellProps) {
    return (
        <main className="min-h-screen px-6 py-10 text-white">
            <section className="mx-auto max-w-4xl rounded-4xl border border-white/10 bg-black/20 p-8 backdrop-blur">
                <a
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-emerald-50 transition hover:bg-white/10"
                    href="/settings/integrations"
                >
                    Back to connection hub
                </a>
                <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">{eyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold">{title}</h1>
                <p className="mt-4 max-w-2xl text-base text-emerald-50/85">{description}</p>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">{children}</div>
            </section>
        </main>
    );
}
