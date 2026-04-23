import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";

export default async function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <AuthEntryPanel
        eyebrow="Sign up"
        title="Sign up is not ready yet"
        description={clerkConfigurationErrorMessage}
      >
        <p className="bb-mini-copy text-sm">Add valid Clerk keys to enable app sign-up.</p>
      </AuthEntryPanel>
    );
  }

  const { userId } = await auth();

  if (userId) {
    redirect("/auth/continue");
  }

  return (
    <AuthEntryPanel
      eyebrow="Sign up"
      title="Create your budget login"
      description="Create your Clerk account with email and password or Google, then let the app create the local workspace records it needs on first entry."
      authMethodVariant="sign-up"
      footer={
        <span>
          Already have an account? <Link href="/sign-in">Open sign-in</Link>.
        </span>
      }
    >
      <p className="bb-mini-copy mb-4 text-sm">
        Use an email-backed sign-up method here. After setup, you can add a supported passkey from security settings.
      </p>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/auth/continue"
      />
    </AuthEntryPanel>
  );
}