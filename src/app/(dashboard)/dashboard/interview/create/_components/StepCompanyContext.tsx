"use client";

import { Building2, FileText } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type createInterviewSchema,
  FIELD_LIMITS,
} from "@/lib/zodSchemas/createInterview";

// RHF uses the Zod *input* type (pre-transform/defaults), not the output type.
type CreateInterviewInput = z.input<typeof createInterviewSchema>;

interface StepCompanyContextProps {
  form: UseFormReturn<CreateInterviewInput>;
}

export function StepCompanyContext({ form }: StepCompanyContextProps) {
  // Subscribe only to the values needed for char counters — avoids broad re-renders
  const [jobDescValue, companyNameValue] = useWatch({
    control: form.control,
    name: ["jobDescription", "companyName"],
  });

  const jobDescLen = (jobDescValue ?? "").length;
  const companyNameLen = (companyNameValue ?? "").length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <CardTitle className="text-lg">
              Company &amp; Job Description
            </CardTitle>
            <CardDescription>
              Paste the job description for a highly tailored interview
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Company Name</FormLabel>
                <span
                  className={`text-xs tabular-nums ${
                    companyNameLen > FIELD_LIMITS.companyName.max
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {companyNameLen}/{FIELD_LIMITS.companyName.max}
                </span>
              </div>
              <FormControl>
                <Input
                  placeholder="e.g. Google, Stripe, Vercel"
                  className="h-11"
                  maxLength={FIELD_LIMITS.companyName.max}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The AI interviewer will role-play as an interviewer from this
                company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Job Description
                </FormLabel>
                <span
                  className={`text-xs tabular-nums ${
                    jobDescLen > FIELD_LIMITS.jobDescription.max
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {jobDescLen.toLocaleString()}/
                  {FIELD_LIMITS.jobDescription.max.toLocaleString()}
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for a Senior Software Engineer to join our Platform team. You will be responsible for...`}
                  className="min-h-[200px] max-h-[400px] overflow-y-auto resize-y"
                  maxLength={FIELD_LIMITS.jobDescription.max}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Questions will be tailored to match the specific requirements
                and qualifications listed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
