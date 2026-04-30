import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthAccountRecoveryButton } from "@/components/auth/auth-account-recovery-button";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import { getRequestMessages } from "@/i18n/server";
import {
  getAuthenticatedUserDisplayName,
  getAuthenticatedUserEmail,
  getAuthenticatedUserId,
} from "@/lib/auth/session";
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

export default async function AuthContinuePage({ searchParams }: AuthContinuePageProps = {}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const messages = await getRequestMessages();
  const redirectTarget = getSafePostAuthRedirect(getSearchParam(resolvedSearchParams, "redirectTo"));
  const errorCode = getSearchParam(resolvedSearchParams, "error");

  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  const authenticatedUserId = userId;
  const email = getAuthenticatedUserEmail(session);

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
        displayName: getAuthenticatedUserDisplayName(session),
      });

      redirect(getPostBootstrapRedirect(redirectTarget, result.workspaceId));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === bootstrapUserLinkConflictErrorMessage
      ) {
        const relinkConflictUrl = new URL("/auth/continue", "https://budgetbitch.local");
        relinkConflictUrl.searchParams.set("error", "relink-conflict");

        if (redirectTarget !== "/auth/continue") {
          relinkConflictUrl.searchParams.set("redirectTo", redirectTarget);
        }

        redirect(
          `${relinkConflictUrl.pathname}?${relinkConflictUrl.searchParams.toString()}`,
        );
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
      <form action={completeBootstrapAction} className="flex flex-col gap-3">
        <button type="submit" className="bb-button-primary w-full justify-center md:w-auto">
          {messages.authContinue.continueToDashboard}
        </button>
        <p className="bb-mini-copy text-sm">{messages.authContinue.rerunSafe}</p>
      </form>
    </AuthEntryPanel>
  );
}