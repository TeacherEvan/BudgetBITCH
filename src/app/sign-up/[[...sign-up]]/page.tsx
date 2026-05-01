import Link from "next/link";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import { ConvexPasswordAuthForm } from "@/components/auth/convex-password-auth-form";
import { getRequestMessages } from "@/i18n/server";
import { getSafePostAuthRedirect } from "@/modules/auth/post-auth-redirect";

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRedirectToCandidate(searchParams?: Record<string, string | string[] | undefined>) {
  const redirectTo = searchParams?.redirectTo;

  if (Array.isArray(redirectTo)) {
    return redirectTo[0];
  }

  return redirectTo;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps = {}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const messages = await getRequestMessages();
  const redirectTarget = getSafePostAuthRedirect(getRedirectToCandidate(resolvedSearchParams));

  if (await isAuthenticatedNextjs()) {
    redirect(redirectTarget === "/auth/continue" ? "/auth/continue" : `/auth/continue?redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  const signInUrl = redirectTarget === "/auth/continue"
    ? "/sign-in"
    : `/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`;

  return (
    <AuthEntryPanel
      eyebrow={messages.signUp.eyebrow}
      title={messages.signUp.title}
      description={messages.signUp.description}
      copy={messages.authPanel}
      authMethodVariant="sign-up"
      footer={
        <span>
          {messages.signUp.haveAccount} <Link href={signInUrl}>{messages.signUp.openSignIn}</Link>.
        </span>
      }
    >
      <ConvexPasswordAuthForm
        flow="signUp"
        redirectTo={redirectTarget}
        submitLabel={messages.signUp.submit}
        emailLabel={messages.signUp.emailLabel}
        passwordLabel={messages.signUp.passwordLabel}
        helperText={messages.signUp.privacy}
      />
    </AuthEntryPanel>
  );
}