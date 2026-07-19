import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const codeParam = resolvedParams?.code;
  const emailParam = resolvedParams?.email;
  const code = typeof codeParam === "string" ? codeParam : "";
  const email = typeof emailParam === "string" ? emailParam : "";

  return <ResetPasswordForm code={code} email={email} />;
}
