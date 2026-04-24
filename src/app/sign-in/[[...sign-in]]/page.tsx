import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";
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
  const redirectTarget = getSafePostAuthRedirect(getRedirectToCandidate(resolvedSearchParams));
  const forceRedirectUrl = getForceRedirectUrl(redirectTarget);
  const signUpUrl = getAuthSwitchUrl("/sign-up", redirectTarget);

  if (!isClerkConfigured()) {
    return (
      <AuthEntryPanel
        eyebrow="Sign in"
        title="Sign in is not ready yet"
        description={clerkConfigurationErrorMessage}
      >
        <p className="bb-mini-copy text-sm">Add valid Clerk keys to enable app sign-in.</p>
      </AuthEntryPanel>
    );
  }

  const { userId } = await auth();

  if (userId) {
    redirect(forceRedirectUrl);
  }

  return (
    <AuthEntryPanel
      eyebrow="Sign in"
      title="Open your budget board"
      description="Choose email and password, Google, or a supported passkey with Clerk, then finish local workspace setup before the app opens your dashboard."
      authMethodVariant="sign-in"
      footer={
        <span>
          Need an account? <Link href={signUpUrl}>Open sign-up</Link>.
        </span>
      }
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
        forceRedirectUrl={forceRedirectUrl}
      />
    </AuthEntryPanel>
  );
}