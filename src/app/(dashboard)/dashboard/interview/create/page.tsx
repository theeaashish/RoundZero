"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  FileText,
  Loader2,
  PenTool,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ResumeUploader } from "@/components/file-uploader/Uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { orpcClient } from "@/lib/orpc-client";
import {
  type CreateInterviewSchemaType,
  createInterviewSchema,
  FIELD_LIMITS,
} from "@/lib/zodSchemas/createInterview";
import { FormStepper } from "./_components/FormStepper";
import { ResumeSelectionDialog } from "./_components/ResumeSelectionDialog";
import { StepCompanyContext } from "./_components/StepCompanyContext";

type CreateInterviewFormValues = typeof createInterviewSchema._input;

// Hoisted static data outside component (rendering-hoist-jsx, rerender-memo-with-default-value)
const interviewTypes = [
  {
    value: "TECHNICAL",
    title: "Technical",
    description: "DSA & Coding Challenges",
    icon: Code2,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    value: "SYSTEM_DESIGN",
    title: "System Design",
    description: "Architecture & Scalability",
    icon: PenTool,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
  },
  {
    value: "BEHAVIORAL",
    title: "Behavioral",
    description: "Soft Skills & Leadership",
    icon: Users,
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/10",
  },
] as const;

const experienceLevels = [
  { value: "junior", label: "Junior", description: "0-2 years", icon: "🌱" },
  { value: "mid", label: "Mid-Level", description: "2-5 years", icon: "🚀" },
  { value: "senior", label: "Senior", description: "5+ years", icon: "⭐" },
] as const;

const TOTAL_STEPS = 4;

export default function CreateInterviewPage() {
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const router = useRouter();

  const form = useForm<CreateInterviewFormValues>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: {
      jobTitle: "",
      resumeText: "",
      includeDSA: false as boolean,
      type: "TECHNICAL",
      experienceLevel: "mid",
      techStack: "",
      companyName: "",
      jobDescription: "",
    },
  });

  const { mutate: createInterview, isPending: isCreating } = useMutation({
    mutationFn: async (
      values: CreateInterviewSchemaType & {
        resumeKey?: string;
        resumeFilename?: string;
        resumeId?: string;
      },
    ) => {
      return await orpcClient.interview.create(values);
    },
    onSuccess: (data: { interviewId: string }) => {
      toast.success("Interview created successfully");
      form.reset();
      router.push(`/dashboard/interview/${data.interviewId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const { mutate: parseResume, isPending: isParsing } = useMutation({
    mutationFn: async (values: {
      resume: { filename: string; key: string };
    }) => {
      return await orpcClient.resume.parse(values);
    },
    onSuccess: (data: { text: string }) => {
      form.setValue("resumeText", data.text);
      toast.success("Resume parsed successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to parse resume: " + error.message);
      setResumeKey(null);
      setResumeFilename(null);
    },
  });

  function onSubmit(values: CreateInterviewFormValues) {
    const parsedValues = createInterviewSchema.parse(values);

    createInterview({
      ...parsedValues,
      resumeKey: resumeKey || undefined,
      resumeFilename: resumeFilename || undefined,
      resumeId: resumeId || undefined,
    });
  }

  // Use useCallback for event handlers to avoid re-creating on re-renders (rerender-functional-setstate)
  const onResumeUpload = useCallback(
    (key: string, file: File) => {
      setResumeKey(key);
      setResumeFilename(file.name);
      parseResume({ resume: { filename: file.name, key: key } });
    },
    [parseResume],
  );

  const onResumeRemove = useCallback(() => {
    setResumeKey(null);
    setResumeFilename(null);
    setResumeId(null);
    form.setValue("resumeText", "");
    toast.info("Resume removed");
  }, [form]);

  const onResumeSelect = useCallback(
    (selectedResumeId: string, content: string) => {
      setResumeId(selectedResumeId);
      setResumeKey(null);
      setResumeFilename(null);
      form.setValue("resumeText", content);
    },
    [form],
  );

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const [watchType, watchJobTitle, resumeText] = useWatch({
    control: form.control,
    name: ["type", "jobTitle", "resumeText"],
  });

  // Per-step validation: determines if user can proceed past the current step.
  const canProceedFromStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return true; // type always has a default value
        case 2: {
          const titleLen = (watchJobTitle ?? "").trim().length;
          return (
            titleLen >= FIELD_LIMITS.jobTitle.min &&
            titleLen <= FIELD_LIMITS.jobTitle.max
          );
        }
        case 3:
          return true; // company & JD are optional
        case 4:
          return (
            (resumeText ?? "").trim().length >= FIELD_LIMITS.resumeText.min
          );
        default:
          return true;
      }
    },
    [watchJobTitle, resumeText],
  );

  const goNext = useCallback(() => {
    if (!canProceedFromStep(currentStep)) {
      toast.error("Please fill in the required fields before proceeding");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, [canProceedFromStep, currentStep]);

  const handleStepClick = useCallback(
    (step: number) => {
      // Only allow going back freely; going forward requires validation of all intermediate steps
      if (step > currentStep) {
        for (let s = currentStep; s < step; s++) {
          if (!canProceedFromStep(s)) {
            toast.error("Please complete the current step first");
            return;
          }
        }
      }
      setCurrentStep(step);
    },
    [canProceedFromStep, currentStep],
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto py-8 px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                  Create Custom Interview
                </h1>
              </div>
              <p className="text-muted-foreground">
                Tailor your AI interview to a specific company and role
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden sm:flex gap-1.5 px-3 py-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>AI-Powered</span>
            </Badge>
          </div>
        </div>

        {/* Stepper */}
        <FormStepper currentStep={currentStep} onStepClick={handleStepClick} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Interview Type Selection */}
            {currentStep === 1 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Interview Type</CardTitle>
                      <CardDescription>
                        Choose the type of interview you want to practice
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            {interviewTypes.map((type) => (
                              <FormItem key={type.value}>
                                <FormControl>
                                  <RadioGroupItem
                                    value={type.value}
                                    className="peer sr-only"
                                  />
                                </FormControl>
                                <FormLabel
                                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-border/50 p-6 cursor-pointer transition-all duration-300 hover:border-border hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-linear-to-br ${type.bgGradient} h-full`}
                                >
                                  <div
                                    className={`h-14 w-14 rounded-2xl bg-linear-to-br ${type.gradient} flex items-center justify-center mb-4 shadow-lg`}
                                  >
                                    <type.icon className="h-7 w-7 text-white" />
                                  </div>
                                  <span className="font-semibold text-lg">
                                    {type.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground text-center mt-1">
                                    {type.description}
                                  </span>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchType === "TECHNICAL" && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <FormField
                        control={form.control}
                        name="includeDSA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">
                                Include DSA Problems
                              </FormLabel>
                              <FormDescription>
                                Add algorithmic coding challenges to your
                                interview
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-5 w-5"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Role Configuration */}
            {currentStep === 2 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Role Details</CardTitle>
                      <CardDescription>
                        Tell us about the position you're preparing for
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Role</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Senior Frontend Engineer"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="techStack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tech Stack / Focus Area</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. React, Node.js, AWS"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Experience Level */}
                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-3">
                            {experienceLevels.map((level) => (
                              <button
                                key={level.value}
                                type="button"
                                onClick={() => field.onChange(level.value)}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                                  field.value === level.value
                                    ? "border-primary bg-primary/5"
                                    : "border-border/50 hover:border-border hover:bg-accent/50"
                                }`}
                              >
                                <span className="text-2xl mb-1">
                                  {level.icon}
                                </span>
                                <span className="font-medium text-sm">
                                  {level.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {level.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Company & Job Description */}
            {currentStep === 3 && <StepCompanyContext form={form} />}

            {/* Step 4: Resume Upload */}
            {currentStep === 4 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Resume Context
                        </CardTitle>
                        <CardDescription>
                          Upload your resume for personalized questions
                        </CardDescription>
                      </div>
                    </div>
                    <ResumeSelectionDialog onSelect={onResumeSelect} />
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="resumeText"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <ResumeUploader
                              onUploadComplete={(key, file) => {
                                onResumeUpload(key, file);
                              }}
                              onRemove={onResumeRemove}
                            />

                            {isParsing && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div>
                                  <p className="text-sm font-medium">
                                    Analyzing your resume...
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    This may take a few seconds
                                  </p>
                                </div>
                              </div>
                            )}

                            {field.value && !isParsing && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Resume Analyzed Successfully
                                  </p>
                                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                                    AI will ask questions based on your
                                    experience
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              {currentStep === 1 ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={goBack}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 cursor-pointer"
                  onClick={goNext}
                  disabled={!canProceedFromStep(currentStep)}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2 cursor-pointer shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={isCreating || isParsing}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      Start Interview
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
