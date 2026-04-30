import { redirect } from "next/navigation";
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
  const redirectTarget = getSafePostAuthRedirect(getRedirectToCandidate(resolvedSearchParams));

  if (redirectTarget === "/auth/continue") {
    redirect("/sign-in");
  }

  redirect(`/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
}