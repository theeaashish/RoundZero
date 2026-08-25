"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModeToggleProps extends React.ComponentPropsWithoutRef<typeof Button> {}

export function ModeToggle({ className, ...props }: ModeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = React.useCallback(() => {
    // If next-themes hasn't resolved yet on client, fall back to checking the DOM class
    const isDark = mounted
      ? resolvedTheme === "dark"
      : document.documentElement.classList.contains("dark");

    setTheme(isDark ? "light" : "dark");
  }, [mounted, resolvedTheme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative size-8 rounded-full text-muted-foreground hover:text-foreground",
        "transition-transform duration-200 active:scale-90",
        className
      )}
      {...props}
    >
      {/* Sun Icon (Visible in Light Mode) */}
      <Sun className="size-4 rotate-0 scale-100 transition-all duration-300 ease-in-out dark:-rotate-90 dark:scale-0" />
      
      {/* Moon Icon (Visible in Dark Mode) */}
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all duration-300 ease-in-out dark:rotate-0 dark:scale-100" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}