import Link from "next/link";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import { ConvexPasswordAuthForm } from "@/components/auth/convex-password-auth-form";
import { getRequestMessages } from "@/i18n/server";
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

  if (await isAuthenticatedNextjs()) {
    redirect(forceRedirectUrl);
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
      <ConvexPasswordAuthForm
        flow="signIn"
        redirectTo={redirectTarget}
        submitLabel={messages.signIn.submit}
        emailLabel={messages.signIn.emailLabel}
        passwordLabel={messages.signIn.passwordLabel}
        helperText={messages.signIn.privacy}
      />
    </AuthEntryPanel>
  );
}