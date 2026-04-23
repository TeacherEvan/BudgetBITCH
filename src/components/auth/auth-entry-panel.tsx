import type { ReactNode } from "react";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";

type AuthEntryPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  authMethodVariant?: "sign-in" | "sign-up";
};

export function AuthEntryPanel({
  eyebrow,
  title,
  description,
  children,
  aside,
  footer,
  authMethodVariant = "sign-in",
}: AuthEntryPanelProps) {
  const isSignUpVariant = authMethodVariant === "sign-up";

  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <MobilePanelFrame>
        <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <article className="bb-panel bb-panel-strong p-7 md:p-9">
            <p className="bb-kicker">{eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">{title}</h1>
            <p className="bb-copy mt-4 max-w-2xl text-sm md:text-base">{description}</p>

            <div className="mt-6">{children}</div>

            {footer ? <div className="bb-mini-copy mt-5 text-sm">{footer}</div> : null}
          </article>

          <aside className="grid gap-4 self-start">
            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">
                {isSignUpVariant ? "Choose a sign-up method" : "Choose a sign-in method"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {isSignUpVariant ? "Start with an email-backed account" : "Use the method that fits this device"}
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-white/85">
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  Email and password via Clerk keeps account access explicit and easy to recover.
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  Continue with Google if you want one-tap access through your Google account.
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {isSignUpVariant
                    ? "Add a passkey after setup on supported devices for device-backed sign-in later."
                    : "Use a passkey on supported devices for the fastest sign-in flow with device-backed security."}
                </li>
              </ul>
              <p className="bb-mini-copy mt-4 text-sm">
                Fingerprint or face unlock comes from your device passkey provider. BudgetBITCH never stores raw biometric data.
              </p>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">Why this step exists</p>
              <h2 className="mt-2 text-2xl font-semibold">Local profile first</h2>
              <p className="bb-mini-copy mt-3 text-sm">
                BudgetBITCH keeps Clerk as the sign-in source, then creates your local profile,
                personal workspace, and default workspace preference once so the app can load the
                right data shape on the server.
              </p>
            </article>

            {aside ? aside : null}
          </aside>
        </section>
      </MobilePanelFrame>
    </main>
  );
}