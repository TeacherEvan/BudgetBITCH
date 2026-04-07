import Link from "next/link";

export default function DashboardPage() {
    return (
        <main className="bb-page-shell text-white">
            <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.8fr)]">
                <div className="grid gap-6">
                    <article className="bb-panel bb-panel-strong p-8 md:p-10">
                        <p className="bb-kicker">Dashboard</p>
                        <h1 className="mt-4 text-5xl font-semibold">Treasure Map</h1>
                        <p className="bb-copy mt-4 max-w-3xl">
                            Your budget journey at a glance: what needs attention first, what can wait,
                            and where the next safe move lives.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/start-smart" className="bb-button-primary">
                                Start Smart
                            </Link>
                            <Link href="/learn" className="bb-button-secondary">
                                Open Learn
                            </Link>
                        </div>
                    </article>

                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="bb-panel p-6">
                            <p className="bb-kicker">Current signal</p>
                            <h2 className="mt-3 text-3xl font-semibold">Luck Meter</h2>
                            <p className="mt-3 text-sm text-(--text-muted)">
                                Visual risk signal for the current month, tuned to your cash-flow stress.
                            </p>
                        </article>

                        <article className="bb-panel p-6">
                            <p className="bb-kicker">Urgency queue</p>
                            <h2 className="mt-3 text-3xl font-semibold">Bills Due Soon</h2>
                            <p className="mt-3 text-sm text-(--text-muted)">
                                Upcoming due dates, reminder urgency, and the stuff most likely to bite first.
                            </p>
                        </article>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <article className="bb-panel bb-panel-muted p-6">
                            <p className="bb-kicker">Skill building</p>
                            <h2 className="mt-3 text-3xl font-semibold">Learn!</h2>
                            <p className="mt-3 text-sm text-(--text-muted)">
                                Absurd lessons tied to your blueprint so the next smart move actually sticks.
                            </p>
                            <Link href="/learn" className="bb-button-ghost mt-5">
                                Open Learn
                            </Link>
                        </article>

                        <article className="bb-panel bb-panel-muted p-6">
                            <p className="bb-kicker">Income routes</p>
                            <h2 className="mt-3 text-3xl font-semibold">Jobs</h2>
                            <p className="mt-3 text-sm text-(--text-muted)">
                                Blueprint-aware job paths that help stabilize income and schedule pressure.
                            </p>
                            <Link href="/jobs" className="bb-button-ghost mt-5">
                                Open Jobs
                            </Link>
                        </article>
                    </div>
                </div>

                <aside className="grid gap-4 self-start">
                    <article className="bb-panel bb-panel-accent p-6">
                        <p className="bb-kicker">Priority build</p>
                        <h2 className="mt-3 text-4xl font-semibold">Money Survival Blueprint</h2>
                        <p className="mt-3 text-sm text-(--text-2)">
                            Build a location-aware first-strike plan for cash flow, risk, and next moves.
                        </p>
                        <Link href="/start-smart" className="bb-button-primary mt-6">
                            Start Smart
                        </Link>
                    </article>

                    <article className="bb-panel p-6">
                        <p className="bb-kicker">Connections</p>
                        <h2 className="mt-3 text-3xl font-semibold">Connected Finance</h2>
                        <p className="mt-3 text-sm text-(--text-muted)">
                            Explore banking, payroll, tax, and finance-ops providers with guidance-first guardrails.
                        </p>
                        <Link href="/settings/integrations" className="bb-button-secondary mt-5">
                            Open Hub
                        </Link>
                    </article>
                </aside>
            </section>
        </main>
    );
}
