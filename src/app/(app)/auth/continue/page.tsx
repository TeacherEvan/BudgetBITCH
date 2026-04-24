import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthAccountRecoveryButton } from "@/components/auth/auth-account-recovery-button";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";
import {
  bootstrapUser,
  bootstrapUserLinkConflictErrorMessage,
} from "@/modules/auth/bootstrap-user";
import {
  getClerkUserDisplayName,
  getClerkUserEmail,
  missingClerkUserEmailErrorMessage,
} from "@/modules/auth/clerk-user";
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
  const redirectTarget = getSafePostAuthRedirect(getSearchParam(resolvedSearchParams, "redirectTo"));
  const errorCode = getSearchParam(resolvedSearchParams, "error");

  if (!isClerkConfigured()) {
    return (
      <AuthEntryPanel
        eyebrow="Continue"
        title="Auth continue is not ready yet"
        description={clerkConfigurationErrorMessage}
      >
        <p className="bb-mini-copy text-sm">Add valid Clerk keys to finish post-auth setup.</p>
      </AuthEntryPanel>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
  }

  const authenticatedUserId = userId;

  const user = await currentUser();
  const email = getClerkUserEmail(user);

  if (!email) {
    return (
      <AuthEntryPanel
        eyebrow="Continue"
        title="Add an email to finish setup"
        description={missingClerkUserEmailErrorMessage}
      >
        <p className="bb-mini-copy text-sm">
          Use an email-based Clerk sign-in method, or add an email to this account, then return here.
        </p>
      </AuthEntryPanel>
    );
  }

  async function completeBootstrapAction() {
    "use server";

    try {
      const result = await bootstrapUser({
        clerkUserId: authenticatedUserId,
        email,
        displayName: getClerkUserDisplayName(user),
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
      eyebrow="Continue"
      title="Finish your local setup"
      description="BudgetBITCH needs one local profile and one personal workspace before the dashboard can load server-side data for this account."
      aside={
        <article className="bb-panel bb-panel-muted p-5">
          <p className="bb-kicker">What happens next</p>
          <h2 className="mt-2 text-2xl font-semibold">One safe bootstrap</h2>
          <p className="bb-mini-copy mt-3 text-sm">
            The continue action creates any missing records once, reuses them on later sign-ins,
            and then opens your dashboard with the resulting workspace selected.
          </p>
        </article>
      }
    >
      {errorCode === "relink-conflict" ? (
        <div className="mb-4 flex flex-col gap-3">
          <p className="text-sm text-rose-200" role="alert">
            This email is already linked to a different Clerk account. Sign out here, switch to the original sign-in method, or contact support before continuing.
          </p>
          <AuthAccountRecoveryButton redirectTo={redirectTarget} />
        </div>
      ) : null}
      <form action={completeBootstrapAction} className="flex flex-col gap-3">
        <button type="submit" className="bb-button-primary w-full justify-center md:w-auto">
          Continue to dashboard
        </button>
        <p className="bb-mini-copy text-sm">
          This is safe to run again if your session already created the local records.
        </p>
      </form>
    </AuthEntryPanel>
  );
}