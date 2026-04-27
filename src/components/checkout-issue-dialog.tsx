"use client";

import { AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CheckoutIssueDialogState {
  title: string;
  description: string;
  detail?: string;
}

interface CheckoutIssueDialogProps {
  issue: CheckoutIssueDialogState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutIssueDialog({
  issue,
  open,
  onOpenChange,
}: CheckoutIssueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{issue?.title ?? "Checkout issue"}</DialogTitle>
          <DialogDescription>{issue?.description}</DialogDescription>
        </DialogHeader>

        {issue?.detail ? (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
            {issue.detail}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href="/dashboard/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Open billing
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
