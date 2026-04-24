import { ArrowRight, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import Link from "next/link";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";

type WelcomeWindowProps = {
  signInHref: string;
  signUpHref: string;
};

const quickReasons = [
  {
    title: "Sign in first",
    description: "Open your account before the app decides whether you need setup or your landing board.",
    icon: ShieldCheck,
  },
  {
    title: "Keep the first step short",
    description: "The setup wizard only appears after sign-in and only when your launch profile is still incomplete.",
    icon: Sparkles,
  },
  {
    title: "Move without the sprawl",
    description: "BudgetBITCH keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
    icon: Waypoints,
  },
] as const;

export function WelcomeWindow({ signInHref, signUpHref }: WelcomeWindowProps) {
  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <MobilePanelFrame>
        <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.9fr)]">
          <article className="bb-panel bb-panel-strong p-7 md:p-9">
            <p className="bb-kicker">BudgetBITCH</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">
              Open your BudgetBITCH board
            </h1>
            <p className="bb-copy mt-4 max-w-2xl text-sm md:text-base">
              Sign in to unlock your root flow. After that, BudgetBITCH can send you into the
              setup wizard or straight to the landing board based on your saved launch profile.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={signInHref} className="bb-button-primary">
                Open sign in
              </Link>
              <Link href={signUpHref} className="bb-button-secondary">
                Open sign-up
              </Link>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3" aria-label="Welcome quick reasons">
              {quickReasons.map(({ title, description, icon: Icon }) => (
                <article key={title} className="bb-compact-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="bb-icon-badge" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-(--accent-strong)" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
                  <p className="bb-mini-copy mt-2">{description}</p>
                </article>
              ))}
            </div>
          </article>

          <aside className="grid gap-4 self-start">
            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">Root flow</p>
              <h2 className="mt-2 text-2xl font-semibold">Auth first, then setup</h2>
              <p className="bb-mini-copy mt-3 text-sm">
                Signed-out visitors stay on this welcome window. Signed-in visitors move into the
                wizard only when the launch profile still needs to be completed.
              </p>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">What changes next</p>
              <ul className="mt-3 grid gap-3 text-sm text-white/85">
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  Sign in when you already have an account.
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  Sign up when you need a fresh account before setup begins.
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  Finish the launch wizard once, then return to the landing board on future visits.
                </li>
              </ul>
            </article>
          </aside>
        </section>
      </MobilePanelFrame>
    </main>
  );
}