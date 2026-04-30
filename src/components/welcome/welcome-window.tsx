"use client";

import { ArrowRight, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";

type WelcomeWindowProps = {
  signInHref: string;
  signUpHref: string;
};

export function WelcomeWindow({ signInHref, signUpHref }: WelcomeWindowProps) {
  const t = useTranslations("welcome");
  const quickReasons = [
    {
      title: t("quickReasons.signInFirst.title"),
      description: t("quickReasons.signInFirst.description"),
      icon: ShieldCheck,
    },
    {
      title: t("quickReasons.keepItShort.title"),
      description: t("quickReasons.keepItShort.description"),
      icon: Sparkles,
    },
    {
      title: t("quickReasons.moveWithoutSprawl.title"),
      description: t("quickReasons.moveWithoutSprawl.description"),
      icon: Waypoints,
    },
  ] as const;

  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <MobilePanelFrame>
        <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.9fr)]">
          <article className="bb-panel bb-panel-strong p-7 md:p-9">
            <div className="flex items-start justify-between gap-4">
              <p className="bb-kicker">{t("brand")}</p>
              <LocaleSwitcher />
            </div>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">
              {t("heading")}
            </h1>
            <p className="bb-copy mt-4 max-w-2xl text-sm md:text-base">
              {t("description")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={signInHref} className="bb-button-primary">
                {t("openSignIn")}
              </Link>
              <Link href={signUpHref} className="bb-button-secondary">
                {t("openSignUp")}
              </Link>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3" aria-label={t("quickReasonsAria")}>
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
              <p className="bb-kicker">{t("rootFlow")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{t("authFirstThenSetup")}</h2>
              <p className="bb-mini-copy mt-3 text-sm">
                {t("rootFlowDescription")}
              </p>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">{t("whatChangesNext")}</p>
              <ul className="mt-3 grid gap-3 text-sm text-white/85">
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {t("nextSteps.signIn")}
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {t("nextSteps.signUp")}
                </li>
                <li className="rounded-3xl border border-white/10 bg-black/15 px-4 py-3">
                  {t("nextSteps.finishWizard")}
                </li>
              </ul>
            </article>
          </aside>
        </section>
      </MobilePanelFrame>
    </main>
  );
}