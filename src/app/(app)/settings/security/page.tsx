import { AuthAccountRecoveryButton } from "@/components/auth/auth-account-recovery-button";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { getRequestMessages } from "@/i18n/server";

export default async function SecuritySettingsPage() {
  const messages = await getRequestMessages();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#111827_45%,#020617_100%)] px-6 py-10 text-white">
      <MobilePanelFrame>
        <section className="mx-auto max-w-6xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
          <header className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200">{messages.securitySettings.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{messages.securitySettings.title}</h1>
            <p className="mt-3 text-sm text-slate-100/80 sm:text-base">
              {messages.securitySettings.description}
            </p>
          </header>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-200">{messages.securitySettings.googleAccountEyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold">{messages.securitySettings.googleAccountTitle}</h2>
              <p className="mt-3 text-sm text-slate-100/80 sm:text-base">
                {messages.securitySettings.googleAccountDescription}
              </p>

              <ul className="mt-5 grid gap-3 text-sm text-slate-100/85">
                <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                  {messages.securitySettings.openGoogleSecurity}
                </li>
                <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                  {messages.securitySettings.openGooglePermissions}
                </li>
              </ul>
            </section>

            <aside className="grid gap-4 self-start">
              <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-200">{messages.securitySettings.sessionAccessEyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold">{messages.securitySettings.sessionAccessTitle}</h2>
                <p className="mt-3 text-sm text-slate-100/80 sm:text-base">
                  {messages.securitySettings.sessionAccessDescription}
                </p>
                <div className="mt-5">
                  <AuthAccountRecoveryButton redirectTo="/" />
                </div>
              </section>

              <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-200">{messages.securitySettings.privacyEyebrow}</p>
                <ul className="mt-3 grid gap-3 text-sm text-slate-100/85">
                  <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                    {messages.securitySettings.privacyItems.signInOnly}
                  </li>
                  <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                    {messages.securitySettings.privacyItems.minimalData}
                  </li>
                  <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                    {messages.securitySettings.privacyItems.noMarketingData}
                  </li>
                  <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                    {messages.securitySettings.privacyItems.personalizationUserOnly}
                  </li>
                  <li className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                    {messages.securitySettings.privacyItems.gmailPrivacy}
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </section>
      </MobilePanelFrame>
    </main>
  );
}