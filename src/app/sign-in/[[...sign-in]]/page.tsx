import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthEntryPanel } from "@/components/auth/auth-entry-panel";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "@/lib/auth/clerk-config";

export default async function SignInPage() {
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
    redirect("/auth/continue");
  }

  return (
    <AuthEntryPanel
      eyebrow="Sign in"
      title="Open your budget board"
      description="Choose email and password, Google, or a supported passkey with Clerk, then finish local workspace setup before the app opens your dashboard."
      authMethodVariant="sign-in"
      footer={
        <span>
          Need an account? <Link href="/sign-up">Open sign-up</Link>.
        </span>
      }
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/auth/continue"
      />
    </AuthEntryPanel>
  );
}