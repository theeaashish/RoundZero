"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronUp,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PenTool,
  Plus,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-signout";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc-client";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Interviews",
    url: "/dashboard/interview",
    icon: MessageSquare,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    title: "Admin AI Gen",
    url: "/admin/design-problems/new",
    icon: Sparkles,
  },
];

const practiceItems = [
  // {
  //   title: "Coding",
  //   url: "/dashboard/practice/coding",
  //   icon: Code2,
  // },
  {
    title: "System Design",
    url: "/dashboard/practice/design",
    icon: PenTool,
  },
  // {
  //   title: "Behavioral",
  //   url: "/dashboard/practice/behavioral",
  //   icon: BookOpen,
  // },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const signOut = useSignOut();
  const { data: billingState } = useQuery({
    ...orpc.billing.getState.queryOptions({
      input: {},
      staleTime: 1000 * 30,
    }),
    enabled: !!session?.user,
  });

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === url;
    return pathname.startsWith(url);
  };

  const usageLabel = billingState?.usage.isUnlimited
    ? "Unlimited interviews"
    : `${billingState?.usage.used ?? 0}/${billingState?.usage.limit ?? 0} interviews`;
  const usagePercent =
    billingState?.usage.isUnlimited || !billingState?.usage.limit
      ? 100
      : Math.min(
          Math.round(
            (billingState.usage.used / billingState.usage.limit) * 100 || 0,
          ),
          100,
        );
  const isElite = billingState?.planId === "elite";

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-r border-sidebar-border/50 overflow-hidden"
    >
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/"
              className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Target className="h-4 w-4" />
              </div>
              <span className="font-bold text-base group-data-[collapsible=icon]:hidden">
                RoundZero
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {/* New Interview Button */}
        <div className="px-3 pt-4 group-data-[collapsible=icon]:px-2">
          <Button
            asChild
            size="sm"
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
          >
            <Link href="/dashboard/interview/create">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                New Interview
              </span>
            </Link>
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-3">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems
                .filter((item) => {
                  if (item.title === "Admin AI Gen") {
                    return session?.user?.role === "admin";
                  }
                  return true;
                })
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Practice Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-3">
            Practice
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {practiceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Upgrade Card - Only show when expanded */}
        <div className="mt-auto p-3 group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border border-sidebar-border/50 bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {billingState ? `${billingState.plan.name} plan` : "Plan usage"}
              </span>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{usageLabel}</span>
                <span>{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-1" />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-7 text-xs"
              asChild
            >
              <Link href="/dashboard/billing">
                <Sparkles className="h-3 w-3 mr-1" />
                {isElite ? "Manage billing" : "Upgrade"}
              </Link>
            </Button>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {session?.user?.name?.charAt(0) || (
                        <User2 className="h-3 w-3" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {session?.user?.name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {session?.user?.email || ""}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-56 rounded-lg"
                align="start"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session?.user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
