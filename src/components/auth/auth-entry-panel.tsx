import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import type { LocaleMessages } from "@/i18n/messages";

type AuthEntryPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  copy: LocaleMessages["authPanel"];
  aside?: ReactNode;
  footer?: ReactNode;
  authMethodVariant?: "sign-in" | "sign-up";
};

export function AuthEntryPanel({
  eyebrow,
  title,
  description,
  children,
  copy,
  aside,
  footer,
  authMethodVariant = "sign-in",
}: AuthEntryPanelProps) {
  const isSignUpVariant = authMethodVariant === "sign-up";
  const authHeading = isSignUpVariant ? copy.useGoogleToStart : copy.useGoogleToContinue;

  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <MobilePanelFrame>
        <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <article className="bb-panel bb-panel-strong p-7 md:p-9">
            <div className="flex items-start justify-between gap-4">
              <p className="bb-kicker">{eyebrow}</p>
              <LocaleSwitcher />
            </div>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">{title}</h1>
            <p className="bb-copy mt-4 max-w-2xl text-sm md:text-base">{description}</p>

            <div className="mt-6">{children}</div>

            {footer ? <div className="bb-mini-copy mt-5 text-sm">{footer}</div> : null}
          </article>

          <aside className="grid gap-4 self-start">
            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">{copy.secureAccess}</p>
              <h2 className="mt-2 text-2xl font-semibold">{authHeading}</h2>
              <ul className="mt-4 grid gap-3 text-sm text-white/85">
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {copy.googleOnly}
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {copy.secureSignIn}
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {copy.gmailPrivacy}
                </li>
              </ul>
              <p className="bb-mini-copy mt-4 text-sm">{copy.minimalData}</p>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">{copy.whyThisStepExists}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy.localProfileFirst}</h2>
              <p className="bb-mini-copy mt-3 text-sm">{copy.localProfileDescription}</p>
            </article>

            {aside ? aside : null}
          </aside>
        </section>
      </MobilePanelFrame>
    </main>
  );
}