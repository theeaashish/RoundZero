import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardContent from "./_components/dashboard-content";

export const metadata = {
  title: "Dashboard | RoundZero",
  description: "Your personal dashboard for interview preparation",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?error=session");
  }

  return <DashboardContent user={session.user} />;
}
