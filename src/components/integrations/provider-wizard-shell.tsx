import Link from "next/link";

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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-4 py-6 text-white sm:px-6 sm:py-10">
            <section className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-black/20 p-5 backdrop-blur sm:p-8">
                <Link
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-white/10 sm:w-fit"
                    href="/settings/integrations"
                >
                    Back to connection hub
                </Link>
                <p className="mt-6 text-sm uppercase tracking-[0.3em] text-yellow-200">{eyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold">{title}</h1>
                <p className="mt-4 max-w-2xl text-base text-emerald-50/85">{description}</p>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">{children}</div>
            </section>
        </main>
    );
}
