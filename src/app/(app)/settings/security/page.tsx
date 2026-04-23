import { UserProfile } from "@clerk/nextjs";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";

export default function SecuritySettingsPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#111827_45%,#020617_100%)] px-6 py-10 text-white">
        <MobilePanelFrame>
          <section className="mx-auto max-w-3xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200">Security settings</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Security settings are not ready yet.</h1>
            <p className="mt-3 text-sm text-slate-100/80 sm:text-base">
              {clerkConfigurationErrorMessage}
            </p>
          </section>
        </MobilePanelFrame>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#111827_45%,#020617_100%)] px-6 py-10 text-white">
      <MobilePanelFrame>
        <section className="mx-auto max-w-6xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
          <header className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200">Security settings</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Open your account security controls.</h1>
            <p className="mt-3 text-sm text-slate-100/80 sm:text-base">
              Manage your password, Google connection, passkeys, and other Clerk security options here. Device biometrics stay with your passkey provider, and the app never stores raw fingerprint or face data.
            </p>
          </header>

          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-3 sm:p-4">
            <UserProfile path="/settings/security" routing="path" />
          </div>
        </section>
      </MobilePanelFrame>
    </main>
  );
}