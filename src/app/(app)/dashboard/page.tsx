export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] p-6 text-white">
            <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
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
            </section>
        </main>
    );
}
