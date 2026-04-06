import Link from "next/link";

export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] p-6 text-white">
            <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-7">
                <article className="rounded-4xl border border-emerald-200/20 bg-white/10 p-6 backdrop-blur">
                    <h1 className="text-3xl font-bold">Treasure Map</h1>
                    <p className="mt-2 text-sm text-emerald-50/80">
                        Your budget journey at a glance.
                    </p>
                </article>

                <article className="rounded-4xl border border-yellow-200/20 bg-yellow-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Luck Meter</h2>
                    <p className="mt-2 text-sm text-yellow-50/80">
                        Visual risk signal for the current month.
                    </p>
                </article>

                <article className="rounded-4xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Bills Due Soon</h2>
                    <p className="mt-2 text-sm text-cyan-50/80">
                        Upcoming due dates and reminder urgency.
                    </p>
                </article>

                <article className="rounded-4xl border border-rose-200/20 bg-rose-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Money Survival Blueprint</h2>
                    <p className="mt-2 text-sm text-rose-50/80">
                        Build a location-aware first-strike plan for cash flow, risk, and next moves.
                    </p>
                    <Link
                        href="/start-smart"
                        className="mt-5 inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                    >
                        Start Smart
                    </Link>
                </article>

                <article className="rounded-4xl border border-violet-200/20 bg-violet-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Learn!</h2>
                    <p className="mt-2 text-sm text-violet-50/80">
                        Absurd lessons tied to your blueprint so the next smart move actually sticks.
                    </p>
                    <Link
                        href="/learn"
                        className="mt-5 inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                    >
                        Open Learn
                    </Link>
                </article>

                <article className="rounded-4xl border border-sky-200/20 bg-sky-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Jobs</h2>
                    <p className="mt-2 text-sm text-sky-50/80">
                        Blueprint-aware job paths that help stabilize income and schedule pressure.
                    </p>
                    <Link
                        href="/jobs"
                        className="mt-5 inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                    >
                        Open Jobs
                    </Link>
                </article>

                <article className="rounded-4xl border border-amber-200/20 bg-amber-300/10 p-6 backdrop-blur">
                    <h2 className="text-2xl font-semibold">Connected Finance</h2>
                    <p className="mt-2 text-sm text-amber-50/80">
                        Explore banking, payroll, tax, and finance-ops providers with guidance-first guardrails.
                    </p>
                    <Link
                        href="/settings/integrations"
                        className="mt-5 inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                    >
                        Open Hub
                    </Link>
                </article>
            </section>
        </main>
    );
}
