"use client";

import { Check, Code2, Copy } from "lucide-react";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CodeSnippetProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
}

export const CodeSnippet = memo(function CodeSnippet({
  code,
  language,
  title,
  className,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/70 bg-muted/20 text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Code2 className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-xs font-medium text-foreground">
            {title || "Shared Solution"}
          </span>
          <span className="rounded border border-border/50 bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
            {language}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
              onClick={handleCopy}
              aria-label="Copy snippet"
            >
              {copied ? (
                <Check className="size-3 text-primary" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {copied ? "Copied!" : "Copy code"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="overflow-x-auto bg-muted/20 p-3">
        <pre className="font-mono text-xs leading-relaxed text-foreground/90">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
});
