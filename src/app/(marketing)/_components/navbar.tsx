"use client";

import { LayoutDashboard, LogOut, Menu, Settings, Target } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useSignOut } from "@/hooks/use-signout";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const signOut = useSignOut();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary via-primary to-violet-600 text-primary-foreground shadow-lg shadow-primary/20">
              <Target className="h-5 w-5" />
            </div>
            <span className="tracking-tight">RoundZero</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {[
              { href: "#features", label: "Features" },
              { href: "/pricing", label: "Pricing" },
              { href: "#demo", label: "Demo" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    variant: "default",
                    className: "shadow-lg shadow-primary/20",
                  })}
                >
                  Start a mock now
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={session.user.image || ""}
                          alt={session.user.name || ""}
                        />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    variant: "ghost",
                    className: "text-muted-foreground hover:text-foreground",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    variant: "default",
                    className: "shadow-lg shadow-primary/20",
                  })}
                >
                  Start a mock now
                </Link>
              </>
            )}
            <ModeToggle />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border">
              <div className="flex flex-col gap-4 mt-8 px-2">
                <Link
                  href="#features"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="#demo"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Live Demo
                </Link>
                <div className="h-px bg-border my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Theme</span>
                  <ModeToggle />
                </div>
                {session ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {session.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {session.user.email}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Button
                      variant="ghost"
                      className="justify-start px-0 text-lg font-medium hover:bg-transparent hover:text-primary transition-colors"
                      onClick={signOut}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      Sign In
                    </Link>
                    <Button className="w-full mt-2" asChild>
                      <Link href="/dashboard">Start Practice - Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
