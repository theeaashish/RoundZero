"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, History, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { orpc } from "@/lib/orpc-client";
import { cn } from "@/lib/utils";

interface ResumeSelectionDialogProps {
  onSelect: (resumeId: string, content: string) => void;
}

export function ResumeSelectionDialog({
  onSelect,
}: ResumeSelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: resumes,
    isLoading,
    isError,
  } = useQuery(
    orpc.resume.list.queryOptions({
      input: {},
      enabled: isOpen,
    }),
  );

  const handleSelect = (resumeId: string, content: string) => {
    onSelect(resumeId, content);
    setIsOpen(false);
    toast.success("Resume selected successfully");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Choose from Library
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Resume</DialogTitle>
          <DialogDescription>
            Choose a resume you've uploaded previously.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading resumes...</p>
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-destructive text-sm">
              Failed to load resumes. Please try again.
            </div>
          ) : resumes?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No resumes found. Upload a new one to get started.
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {resumes?.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleSelect(resume.id, resume.content)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border border-border/50 text-left transition-all hover:bg-accent hover:border-border group",
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {resume.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded{" "}
                        {format(new Date(resume.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
