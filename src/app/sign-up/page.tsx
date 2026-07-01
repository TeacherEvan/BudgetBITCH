import { CleanAuthCard } from "@/components/auth/clean-auth-card";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const redirectToParam = resolvedParams?.redirectTo;
  const redirectTo = typeof redirectToParam === "string" ? redirectToParam : "/dashboard";

  return <CleanAuthCard initialFlow="signUp" redirectTo={redirectTo} />;
}
