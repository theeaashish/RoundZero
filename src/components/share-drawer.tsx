"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { type ShareConfig, share } from "@/lib/share";

interface ShareDrawerProps {
  children: React.ReactNode;
  config: ShareConfig;
}

export function ShareDrawer({ children, config }: ShareDrawerProps) {
  const [url, setUrl] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    // Dynamically build the URL only on the client
    if (typeof window !== "undefined") {
      let sharePath = "";
      if (config.type === "system-design") {
        sharePath = `/system-design/${config.slug}`;
      } else {
        sharePath = `/${config.type}/${config.slug}`;
      }
      setUrl(`${window.location.origin}${sharePath}`);
    }
  }, [config.slug, config.type]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setHasCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const onShare = async () => {
    await share(config);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="sm:max-w-md mx-auto">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <DrawerTitle className="text-xl font-bold tracking-tight">
              Share this {config.type.replace("-", " ")}
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm">
              <span className="font-medium text-foreground">
                {config.title}
              </span>
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <label htmlFor="link" className="sr-only">
                    Link
                  </label>
                  <Input
                    id="link"
                    defaultValue={url}
                    readOnly
                    className="h-10 truncate bg-secondary/30 text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 px-3 transition-all duration-200"
                  onClick={onCopy}
                >
                  <span className="sr-only">Copy</span>
                  {hasCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-semibold">
                    Or
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full h-11 bg-secondary/50 hover:bg-secondary transition-colors"
                onClick={onShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share via system
              </Button>
            </div>
          </div>

          <DrawerFooter className="pt-6">
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full text-muted-foreground">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
