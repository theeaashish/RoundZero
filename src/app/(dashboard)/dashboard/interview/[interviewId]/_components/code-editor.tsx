"use client";

import Editor from "@monaco-editor/react";
import {
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useState } from "react";
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
  TooltipProvider,
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
}

export const CodeEditor = memo(function CodeEditor({
  className,
  isExpanded = false,
  onToggleExpand,
  onSubmit,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRun = async () => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        setOutput("Submitting code to AI...");
        await onSubmit(code, language);
        setOutput("Submitted successfully.");
      } catch (_error) {
        setOutput("Submission failed.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setOutput("Running code...\n\n> Output will appear here");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-[#1e1e1e] h-full overflow-hidden border-l border-border/50 shadow-2xl",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        {/* ... (Existing select and undo/copy) ... */}
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 h-8 text-xs bg-[#3c3c3c] border-[#3c3c3c] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            {/* Buttons... */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-[#3c3c3c]"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-[#3c3c3c]"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy code"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-[#3c3c3c]"
                  onClick={onToggleExpand}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? "Minimize" : "Expand"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            className="h-7 ml-2 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleRun}
            disabled={isSubmitting}
          >
            <Play className="h-3 w-3" />
            {isSubmitting ? "Sending..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs-dark"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
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

      {/* Output panel */}
      {output && (
        <div className="border-t border-[#3c3c3c] bg-[#1e1e1e]">
          <div className="px-3 py-1.5 bg-[#252526] text-xs text-slate-400 font-medium">
            Output
          </div>
          <pre className="p-3 text-xs text-slate-300 font-mono max-h-24 overflow-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
});
