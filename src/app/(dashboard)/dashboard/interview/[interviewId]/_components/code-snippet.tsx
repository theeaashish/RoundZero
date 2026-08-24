"use client";

import { Check, Code2, Copy, Maximize2 } from "lucide-react";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
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
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="py-2 px-4 bg-muted/50 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          {title || "Code Snippet"}
          <span className="text-muted-foreground font-normal">
            • {language}
          </span>
        </CardTitle>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy code"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="p-4 text-sm overflow-x-auto bg-slate-950 text-slate-50">
          <code className="font-mono text-xs leading-relaxed">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
});
