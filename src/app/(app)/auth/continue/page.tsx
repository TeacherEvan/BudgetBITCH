import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";
import { bootstrapUser } from "@/modules/auth/bootstrap-user";
import {
  getClerkUserDisplayName,
  getClerkUserEmail,
  missingClerkUserEmailErrorMessage,
} from "@/modules/auth/clerk-user";

async function completeBootstrapAction() {
  "use server";

  if (!isClerkConfigured()) {
    throw new Error(clerkConfigurationErrorMessage);
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = getClerkUserEmail(user);

  if (!email) {
    redirect("/auth/continue");
  }

  const result = await bootstrapUser({
    clerkUserId: userId,
    email,
    displayName: getClerkUserDisplayName(user),
  });

  redirect(`/dashboard?workspaceId=${encodeURIComponent(result.workspaceId)}`);
}

export default async function AuthContinuePage() {
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
    redirect("/sign-in");
  }

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