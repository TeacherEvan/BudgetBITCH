import { redirect } from "next/navigation";
import { AuthAccountRecoveryButton } from "@/components/auth/auth-account-recovery-button";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import { getRequestMessages } from "@/i18n/server";
import {
  authBootstrapErrorCodes,
  getConvexAuthenticatedIdentity,
  isAuthBootstrapError,
  isAuthBootstrapErrorCode,
  syncConvexLocalProfile,
} from "@/lib/auth/convex-session";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";
import { getSafePostAuthRedirect } from "@/modules/auth/post-auth-redirect";

type AuthContinuePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getPostBootstrapRedirect(redirectTarget: string, workspaceId: string) {
  if (redirectTarget === "/") {
    return "/";
  }

  if (!redirectTarget.startsWith("/dashboard")) {
    return `/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`;
  }

  const dashboardUrl = new URL(redirectTarget, "https://budgetbitch.local");
  dashboardUrl.searchParams.set("workspaceId", workspaceId);

  return `${dashboardUrl.pathname}?${dashboardUrl.searchParams.toString()}`;
}

function getAuthContinueUrl(redirectTarget: string, errorCode: string) {
  const authContinueUrl = new URL("/auth/continue", "https://budgetbitch.local");
  authContinueUrl.searchParams.set("error", errorCode);

  if (redirectTarget !== "/auth/continue") {
    authContinueUrl.searchParams.set("redirectTo", redirectTarget);
  }

  return `${authContinueUrl.pathname}?${authContinueUrl.searchParams.toString()}`;
}

export default async function AuthContinuePage({ searchParams }: AuthContinuePageProps = {}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const messages = await getRequestMessages();
  const redirectTarget = getSafePostAuthRedirect(getSearchParam(resolvedSearchParams, "redirectTo"));
  const errorCode = getSearchParam(resolvedSearchParams, "error");
  const bootstrapErrorCode = isAuthBootstrapErrorCode(errorCode) ? errorCode : null;

  let identity;

  try {
    identity = await getConvexAuthenticatedIdentity();
  } catch (error) {
    if (isAuthBootstrapError(error)) {
      return (
        <AuthEntryPanel
          eyebrow={messages.authContinue.eyebrow}
          title={messages.authContinue.bootstrapIssueTitle}
          description={messages.authContinue.bootstrapIssueDescription}
          copy={messages.authPanel}
        >
          <p className="bb-mini-copy text-sm" role="alert">
            {messages.authContinue.bootstrapIssueHelp}
          </p>
        </AuthEntryPanel>
      );
    }

    throw error;
  }

  if (!identity) {
    redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  const authenticatedUserId = identity.tokenIdentifier;
  const email = identity.email?.trim().toLowerCase() ?? "";
  const displayName = identity.name;

  if (!email) {
    return (
      <AuthEntryPanel
        eyebrow={messages.authContinue.eyebrow}
        title={messages.authContinue.missingEmailTitle}
        description={messages.authContinue.missingEmailDescription}
        copy={messages.authPanel}
      >
        <p className="bb-mini-copy text-sm">{messages.authContinue.missingEmailHelp}</p>
      </AuthEntryPanel>
    );
  }

  async function completeBootstrapAction() {
    "use server";

    try {
      const result = await bootstrapUser({
        clerkUserId: authenticatedUserId,
        email,
        displayName,
      });

      await syncConvexLocalProfile({
        profileId: result.userId,
        displayName,
      });

      redirect(getPostBootstrapRedirect(redirectTarget, result.workspaceId));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === bootstrapUserLinkConflictErrorMessage
      ) {
        redirect(getAuthContinueUrl(redirectTarget, "relink-conflict"));
      }

      if (isAuthBootstrapError(error)) {
        if (error.code === authBootstrapErrorCodes.authenticationRequired) {
          redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
        }

        redirect(getAuthContinueUrl(redirectTarget, error.code));
      }

      throw error;
    }
  }

  return (
    <AuthEntryPanel
      eyebrow={messages.authContinue.eyebrow}
      title={messages.authContinue.title}
      description={messages.authContinue.description}
      copy={messages.authPanel}
      aside={
        <article className="bb-panel bb-panel-muted p-5">
          <p className="bb-kicker">{messages.authContinue.whatHappensNext}</p>
          <h2 className="mt-2 text-2xl font-semibold">{messages.authContinue.oneSafeBootstrap}</h2>
          <p className="bb-mini-copy mt-3 text-sm">{messages.authContinue.oneSafeBootstrapDescription}</p>
        </article>
      }
    >
      {errorCode === "relink-conflict" ? (
        <div className="mb-4 flex flex-col gap-3">
          <p className="text-sm text-rose-200" role="alert">
            {messages.authContinue.relinkConflict}
          </p>
          <AuthAccountRecoveryButton redirectTo={redirectTarget} />
        </div>
      ) : null}
      {bootstrapErrorCode ? (
        <p className="mb-4 text-sm text-amber-100" role="alert">
          {messages.authContinue.bootstrapIssueHelp}
        </p>
      ) : null}
      <form action={completeBootstrapAction} className="flex flex-col gap-3">
        <button type="submit" className="bb-button-primary w-full justify-center md:w-auto">
          {messages.authContinue.continueToDashboard}
        </button>
        <p className="bb-mini-copy text-sm">{messages.authContinue.rerunSafe}</p>
      </form>
    </AuthEntryPanel>
  );
}