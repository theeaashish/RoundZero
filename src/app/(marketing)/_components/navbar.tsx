"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useSignOut } from "@/hooks/use-signout";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "#demo", label: "Demo" },
] as const;

/* Same curve as the hero entrance so nav + hero land as one motion system. */
const EASE = [0.23, 1, 0.32, 1] as const;

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const signOut = useSignOut();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Track window scroll state with passive listener
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll(); // Check initial scroll position on mount
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    /* Entrance runs on this wrapper; no Tailwind transition-* here — it would
       fight framer-motion's per-frame updates. The inner <nav> keeps its own
       transition for the scroll state. */
    <motion.header
      initial={{ opacity: 0, y: reduceMotion ? 0 : -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.3 : 0.5,
        ease: EASE,
        opacity: { duration: reduceMotion ? 0.3 : 0.4 },
      }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
    >
      <nav
        aria-label="Main Navigation"
        className={cn(
          "flex w-full items-center justify-between transition-all duration-300 ease-out",
          "h-14 rounded-full px-3.5 sm:px-4",
          isScrolled
            ? "max-w-4xl border border-border/50 bg-background/80 shadow-md shadow-black/3 backdrop-blur-xl dark:shadow-black/20"
            : "max-w-6xl border border-transparent bg-transparent shadow-none backdrop-blur-none",
        )}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="size-4 stroke-[2.25]" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            RoundZero
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />

          {session ? (
            <div className="flex items-center gap-1.5">
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard">Start practicing</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="size-4.5" />
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-80 flex-col p-6">
            <SheetHeader className="p-0 text-left">
              <SheetTitle className="flex items-center gap-2.5 text-sm font-semibold">
                RoundZero
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navigation links
              </SheetDescription>
            </SheetHeader>

            <nav className="mt-8 flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4 border-t border-border/60 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Theme
                </span>
                <ModeToggle />
              </div>

              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5">
                    <Avatar className="size-9">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="text-xs uppercase">
                        {session.user.name?.slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {session.user.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center text-xs"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="mr-1.5 size-3.5" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/dashboard">Start practicing</Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  );
}
