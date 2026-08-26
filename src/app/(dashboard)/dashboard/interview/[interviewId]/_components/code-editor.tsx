"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import {
  Check,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Terminal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// Write your solution here
function solution(input) {
  // Your code here
  
  return result;
}

// Example usage:
// console.log(solution([1, 2, 3]));
`,
  typescript: `// Write your solution here
function solution(input: number[]): number {
  // Your code here
  
  return 0;
}

// Example usage:
// console.log(solution([1, 2, 3]));
`,
  python: `# Write your solution here
def solution(input):
    # Your code here
    
    return result

# Example usage:
# print(solution([1, 2, 3]))
`,
  java: `// Write your solution here
class Solution {
    public int solution(int[] input) {
        // Your code here
        
        return 0;
    }
}
`,
  cpp: `// Write your solution here
#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& input) {
        // Your code here
        
        return 0;
    }
};
`,
  go: `// Write your solution here
package main

func solution(input []int) int {
    // Your code here
    
    return 0
}
`,
  rust: `// Write your solution here
fn solution(input: Vec<i32>) -> i32 {
    // Your code here
    
    0
}
`,
};

interface CodeEditorProps {
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSubmit?: (code: string, language: string) => Promise<void>;
  disabled?: boolean;
}

export const CodeEditor = memo(function CodeEditor({
  className,
  isExpanded = false,
  onToggleExpand,
  onSubmit,
  disabled = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleRunRef = useRef<() => Promise<void>>(async () => {});

  const monacoTheme = resolvedTheme === "light" ? "light" : "vs-dark";

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang] || "");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE[language] || "");
    setOutput(null);
  };

  const handleRun = useCallback(async () => {
    if (disabled || isSubmitting) return;

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        setOutput("Submitting code to AI interviewer for review...");
        await onSubmit(code, language);
        setOutput(
          "Code submitted successfully. AI is analyzing your approach.",
        );
      } catch (error) {
        setOutput(
          error instanceof Error
            ? error.message
            : "Submission failed. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setOutput("Running code...\n\n> Output will appear here");
    }
  }, [code, language, onSubmit, disabled, isSubmitting]);

  handleRunRef.current = handleRun;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void handleRunRef.current();
    });
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      {/* Editor toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3">
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-28 border-border/80 bg-background font-mono text-[11px] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground">
              {LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                  className="font-mono text-xs focus:bg-accent focus:text-accent-foreground"
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground transition-transform hover:bg-muted hover:text-foreground active:scale-95"
                onClick={handleReset}
                aria-label="Reset code"
              >
                <RotateCcw className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Reset code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground transition-transform hover:bg-muted hover:text-foreground active:scale-95"
                onClick={handleCopy}
                aria-label="Copy code"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden size-6 text-muted-foreground transition-transform hover:bg-muted hover:text-foreground active:scale-95 lg:inline-flex"
                onClick={onToggleExpand}
                aria-label={isExpanded ? "Collapse editor" : "Expand editor"}
              >
                {isExpanded ? (
                  <Minimize2 className="size-3" />
                ) : (
                  <Maximize2 className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {isExpanded ? "Collapse editor" : "Expand editor"}
            </TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            className="ml-1.5 h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all active:scale-95"
            onClick={handleRun}
            disabled={isSubmitting || disabled}
          >
            <Send className="size-3" />
            <span>{isSubmitting ? "Sending..." : "Submit"}</span>
            <kbd className="ml-0.5 hidden rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider sm:inline-block">
              ⌘↵
            </kbd>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorMount}
          theme={monacoTheme}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            fontLigatures: true,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Output terminal drawer */}
      {output && (
        <div className="shrink-0 border-t border-border/60 bg-muted/30">
          <div className="flex items-center gap-1.5 border-b border-border/40 px-3 py-1 text-[10px] font-medium tracking-wider text-muted-foreground">
            <Terminal className="size-3" />
            <span className="font-mono uppercase">Console Output</span>
          </div>
          <pre className="max-h-20 overflow-auto p-2.5 font-mono text-xs text-foreground/90">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
});
