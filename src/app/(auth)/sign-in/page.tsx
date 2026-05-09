import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "../_components/LoginForm";

export const metadata = {
  title: "Sign In | Interview AI",
  description: "Sign in to your Interview AI account",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; callbackUrl?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const resolvedSearchParams = await searchParams;
  const redirectUrl =
    resolvedSearchParams?.redirect ||
    resolvedSearchParams?.callbackUrl ||
    "/dashboard";

  if (session) {
    redirect(redirectUrl as Route);
  }

  return (
    <div className="max-sm:px-5">
      <LoginForm redirectUrl={redirectUrl} />
    </div>
  );
}
