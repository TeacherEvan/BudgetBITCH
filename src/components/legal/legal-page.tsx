"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { shortLocale, type LegalLocale } from "@/lib/legal/versions";
import {
  termsContent,
  privacyContent,
  cookieContent,
  LEGAL_EFFECTIVE_DATE,
} from "@/lib/legal/content";

type DocKey = "terms" | "privacy" | "cookie";

const DOC_MAP: Record<DocKey, Record<LegalLocale, { title: string; intro: string; sections: { heading: string; body: string[] }[] }>> = {
  terms: termsContent,
  privacy: privacyContent,
  cookie: cookieContent,
};

type LegalPageProps = {
  doc: DocKey;
  version: string;
};

export function LegalPage({ doc, version }: LegalPageProps) {
  const localeRaw = useLocale();
  const locale = shortLocale(localeRaw);
  const content = DOC_MAP[doc][locale];

  return (
    <main className="bb-page-shell px-4 py-8 text-white md:px-5 md:py-10">
      <article className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="bb-button-ghost px-3 py-1.5 text-sm font-semibold"
          >
            {locale === "th" ? "← กลับ" : "← Back"}
          </Link>
          <span className="text-xs text-(--text-muted)">
            {locale === "th" ? "เวอร์ชัน" : "Version"} {version}
          </span>
        </div>

        <h1 className="text-3xl font-semibold md:text-4xl">{content.title}</h1>
        <p className="bb-mini-copy mt-2 text-sm text-(--text-muted)">
          {locale === "th" ? "มีผลบังคับใช้" : "Effective"} {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="bb-copy mt-4 text-sm md:text-base">{content.intro}</p>

        <div className="mt-8 space-y-6">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-(--accent-strong)">
                {section.heading}
              </h2>
              <div className="mt-2 space-y-2">
                {section.body.map((para, i) => (
                  <p
                    key={i}
                    className="bb-mini-copy text-sm leading-relaxed text-white/80"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <nav className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm">
          <Link href="/terms" className="text-amber-400 hover:underline">
            {termsContent[locale].title}
          </Link>
          <Link href="/privacy" className="text-amber-400 hover:underline">
            {privacyContent[locale].title}
          </Link>
          <Link href="/cookie-policy" className="text-amber-400 hover:underline">
            {cookieContent[locale].title}
          </Link>
        </nav>
      </article>
    </main>
  );
}
