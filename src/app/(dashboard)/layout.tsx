import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Dashboard | Interview AI",
  description: "Manage your interviews and track your progress",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in?error=session");
  }

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="bg-background min-h-0 overflow-hidden">
        <DashboardHeader />

        {/* Main Content */}
        <main className="flex-1 min-h-0 flex flex-col overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
