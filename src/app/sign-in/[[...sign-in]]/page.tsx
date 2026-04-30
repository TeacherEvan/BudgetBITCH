import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import { getRequestMessages } from "@/i18n/server";
import { isGoogleOAuthConfigured } from "@/lib/auth/oauth-config";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getSafePostAuthRedirect } from "@/modules/auth/post-auth-redirect";

const fallbackAuthSwitchRedirect = "/auth/continue";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRedirectToCandidate(searchParams?: Record<string, string | string[] | undefined>) {
  const redirectTo = searchParams?.redirectTo;

  if (Array.isArray(redirectTo)) {
    return redirectTo[0];
  }

  return redirectTo;
}

function getForceRedirectUrl(redirectTarget: string) {
  if (redirectTarget === "/" || redirectTarget.startsWith("/dashboard")) {
    return `/auth/continue?redirectTo=${encodeURIComponent(redirectTarget)}`;
  }

  return redirectTarget;
}

function getAuthSwitchUrl(pathname: string, redirectTarget: string) {
  if (redirectTarget === fallbackAuthSwitchRedirect) {
    return pathname;
  }

  return `${pathname}?redirectTo=${encodeURIComponent(redirectTarget)}`;
}

export default async function SignInPage({ searchParams }: SignInPageProps = {}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const messages = await getRequestMessages();
  const redirectTarget = getSafePostAuthRedirect(getRedirectToCandidate(resolvedSearchParams));
  const forceRedirectUrl = getForceRedirectUrl(redirectTarget);
  const signUpUrl = getAuthSwitchUrl("/sign-up", redirectTarget);
  const googleOAuthConfigured = isGoogleOAuthConfigured();

  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (userId) {
    redirect(forceRedirectUrl);
  }

  async function startGoogleSignIn() {
    "use server";

    await signIn("google", { redirectTo: forceRedirectUrl });
  }

  return (
    <AuthEntryPanel
      eyebrow={messages.signIn.eyebrow}
      title={messages.signIn.title}
      description={messages.signIn.description}
      copy={messages.authPanel}
      authMethodVariant="sign-in"
      footer={
        <span>
          {messages.signIn.needAccount} <Link href={signUpUrl}>{messages.signIn.openSignUp}</Link>.
        </span>
      }
    >
      {googleOAuthConfigured ? (
        <form action={startGoogleSignIn} className="flex flex-col gap-3">
          <button type="submit" className="bb-button-primary w-full justify-center md:w-auto">
            {messages.signIn.continueWithGoogle}
          </button>
          <p className="bb-mini-copy text-sm">{messages.signIn.privacy}</p>
        </form>
      ) : (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4" role="status">
          <p className="font-semibold text-amber-100">{messages.signIn.setupRequiredTitle}</p>
          <p className="bb-mini-copy mt-2 text-sm">{messages.signIn.setupRequiredDescription}</p>
        </div>
      )}
    </AuthEntryPanel>
  );
}