"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Server,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useState,
  useTransition,
} from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { orpcClient } from "@/lib/orpc-client";
import {
  BUDGET_LEVELS,
  CONSISTENCY_MODELS,
  type GeneratedSystemDesignProblem,
  INTERVIEW_ROLES,
  PRODUCT_STAGES,
  problemGenerationInputSchema,
  SYSTEM_DESIGN_DOMAINS,
  systemDesignProblemSchema,
} from "@/lib/validations/practice";

const TOPIC_CHIPS = [
  { label: "Twitter", description: "Social feed and fanout" },
  { label: "WhatsApp", description: "Realtime delivery and presence" },
  { label: "Netflix", description: "Global media streaming" },
  { label: "Stripe Ledger", description: "Consistency and auditability" },
  { label: "Uber Dispatch", description: "Geo queries and matching" },
  { label: "Dropbox", description: "Blob storage and sync" },
] as const;

const defaultGenerationValues: z.infer<typeof problemGenerationInputSchema> = {
  topic: "",
  domain: "DATA",
  complexity: "MEDIUM",
  interviewRole: "SENIOR",
  estimatedDurationMinutes: 45,
  productStage: "GROWTH",
  scenario:
    "The product team expects a polished v1 that can survive rapid adoption without a full rewrite.",
  functionalFocus: [
    "Core user write path",
    "Read path and user retrieval experience",
  ],
  nonFunctionalFocus: [
    "Latency and availability targets",
    "Scalability and fault tolerance",
  ],
  dailyActiveUsers: "8M DAU",
  peakRequestsPerSecond: "35k RPS peak",
  readWriteRatio: "85:15",
  latencyTarget: "P95 < 250ms for user-facing reads",
  availabilityTarget: "99.95%",
  primaryRegions: ["us-east-1", "eu-west-1"],
  consistencyModel: "EVENTUAL",
  budget: "BALANCED",
  compliance: ["GDPR"],
};

const defaultProblemValues: z.infer<typeof systemDesignProblemSchema> = {
  title: "",
  description: "",
  functionalReqs: [],
  nonFunctionalReqs: [],
  complexity: "MEDIUM",
  domain: "DATA",
  interviewRole: "SENIOR",
  estimatedDurationMinutes: 45,
  companyContext: "",
  scenario: "",
  inScope: [],
  outOfScope: [],
  tags: [],
  architectureConsiderations: [],
  followUps: [],
  scaleProfile: {
    dailyActiveUsers: "",
    peakRequestsPerSecond: "",
    readWriteRatio: "",
    averagePayloadSize: "",
    latencySlo: "",
    availabilitySlo: "",
    dataRetention: "",
    primaryRegions: [],
    consistencyModel: "EVENTUAL",
    growthExpectation: "",
    budget: "BALANCED",
    compliance: [],
  },
  evaluationRubric: {
    mustHaveComponents: [],
    bonusPoints: [],
    redFlags: [],
  },
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function NewDesignProblemPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] =
    useState<GeneratedSystemDesignProblem | null>(null);

  const genForm = useForm<z.infer<typeof problemGenerationInputSchema>>({
    resolver: zodResolver(problemGenerationInputSchema),
    defaultValues: defaultGenerationValues,
  });

  const saveForm = useForm<z.infer<typeof systemDesignProblemSchema>>({
    resolver: zodResolver(systemDesignProblemSchema),
    defaultValues: defaultProblemValues,
  });

  const onGenerate = genForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await orpcClient.practice.generateProblem(values);
        setGenerated(result);
        saveForm.reset(result);
        toast.success("Production-ready challenge generated.");
      } catch {
        toast.error("Generation failed. Please try again.");
      }
    });
  });

  const onSave = saveForm.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await orpcClient.practice.createProblem(values);
      toast.success("Saved to problem library.");
      router.push("/dashboard/practice/design");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  });

  const reset = () => {
    setGenerated(null);
    genForm.reset(defaultGenerationValues);
    saveForm.reset(defaultProblemValues);
  };

  const totalRequirements =
    (saveForm.watch("functionalReqs")?.filter(Boolean).length ?? 0) +
    (saveForm.watch("nonFunctionalReqs")?.filter(Boolean).length ?? 0);
  const totalFollowUps =
    saveForm.watch("followUps")?.filter(Boolean).length ?? 0;
  const totalTags = saveForm.watch("tags")?.filter(Boolean).length ?? 0;

  return (
    <div className="space-y-8 p-6 md:p-8">
      {generated ? (
        <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Structured Review Mode
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Refine And Save The Challenge
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              The generated prompt is now editable across scope, scale,
              evaluation, and follow-up scenarios before it goes into the
              library.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button variant="outline" onClick={onGenerate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 h-4 w-4" />
              )}
              Regenerate
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save To Library
            </Button>
          </div>
        </div>
      ) : (
        <section className="rounded-[28px] border bg-gradient-to-br from-background via-background to-primary/5 p-8 shadow-sm">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Server className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Create A Real System Design Interview
              </h1>
              <p className="mx-auto max-w-3xl text-base text-muted-foreground">
                Configure the product domain, scale, constraints, and review
                expectations so the generated problem feels like a real
                production design discussion instead of a one-line prompt.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                icon={Target}
                label="Structured Inputs"
                value="Scope, scale, constraints"
              />
              <MetricCard
                icon={Scale}
                label="Realistic Specs"
                value="SLOs, regions, consistency"
              />
              <MetricCard
                icon={Clock3}
                label="Interview Framing"
                value="Role and duration aware"
              />
            </div>
          </div>
        </section>
      )}

      {!generated ? (
        <Form {...genForm}>
          <form className="space-y-8" onSubmit={onGenerate}>
            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Challenge Brief</h2>
                  <p className="text-sm text-muted-foreground">
                    Define what the candidate is designing and what kind of
                    interview this should feel like.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={genForm.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>System Topic</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Design a global collaborative document editor"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={genForm.control}
                    name="scenario"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Scenario</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Describe the product pressure, launch context, or business objective."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <SelectField
                    control={genForm.control}
                    name="domain"
                    label="Domain"
                    options={SYSTEM_DESIGN_DOMAINS}
                  />
                  <SelectField
                    control={genForm.control}
                    name="complexity"
                    label="Difficulty"
                    options={["EASY", "MEDIUM", "HARD"]}
                  />
                  <SelectField
                    control={genForm.control}
                    name="interviewRole"
                    label="Target Role"
                    options={INTERVIEW_ROLES}
                  />
                  <SelectField
                    control={genForm.control}
                    name="productStage"
                    label="Product Stage"
                    options={PRODUCT_STAGES}
                  />

                  <FormField
                    control={genForm.control}
                    name="estimatedDurationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Duration</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={30}
                            max={90}
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(Number(event.target.value || 45))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Popular challenge seeds</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {TOPIC_CHIPS.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() =>
                          genForm.setValue("topic", `Design ${chip.label}`)
                        }
                        className="rounded-2xl border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="text-sm font-medium">{chip.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {chip.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Scale And SLOs</h2>
                  <p className="text-sm text-muted-foreground">
                    Seed the traffic profile so AI has enough context to create
                    believable numbers and tradeoffs.
                  </p>
                </div>

                <FormField
                  control={genForm.control}
                  name="dailyActiveUsers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Active Users</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={genForm.control}
                  name="peakRequestsPerSecond"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peak Requests Per Second</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={genForm.control}
                  name="readWriteRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Read / Write Ratio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={genForm.control}
                  name="latencyTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latency Target</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={genForm.control}
                  name="availabilityTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Target</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SelectField
                  control={genForm.control}
                  name="consistencyModel"
                  label="Consistency Model"
                  options={CONSISTENCY_MODELS}
                />
                <SelectField
                  control={genForm.control}
                  name="budget"
                  label="Budget Posture"
                  options={BUDGET_LEVELS}
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <EditableStringList
                  label="Functional Focus"
                  description="Tell the generator which product capabilities must be central to the problem."
                  values={genForm.watch("functionalFocus")}
                  onChange={(values) =>
                    genForm.setValue("functionalFocus", values, {
                      shouldValidate: true,
                    })
                  }
                  addLabel="Add Functional Focus"
                  placeholder="e.g. Feed ranking, fanout, comment publishing"
                />
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <EditableStringList
                  label="Non-Functional Focus"
                  description="This becomes the review lens for the generated prompt."
                  values={genForm.watch("nonFunctionalFocus")}
                  onChange={(values) =>
                    genForm.setValue("nonFunctionalFocus", values, {
                      shouldValidate: true,
                    })
                  }
                  addLabel="Add Constraint"
                  placeholder="e.g. Multi-region failover, hot partition handling"
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <EditableStringList
                  label="Primary Regions"
                  description="Regions or countries the design should explicitly consider."
                  values={genForm.watch("primaryRegions")}
                  onChange={(values) =>
                    genForm.setValue("primaryRegions", values, {
                      shouldValidate: true,
                    })
                  }
                  addLabel="Add Region"
                  placeholder="e.g. ap-south-1"
                />
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <EditableStringList
                  label="Compliance"
                  description="Optional. Leave empty if the prompt should not stress regulatory constraints."
                  values={genForm.watch("compliance")}
                  onChange={(values) =>
                    genForm.setValue("compliance", values, {
                      shouldValidate: true,
                    })
                  }
                  addLabel="Add Compliance Requirement"
                  placeholder="e.g. PCI-DSS"
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Challenge
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...saveForm}>
          <form
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
            onSubmit={onSave}
          >
            <div className="space-y-6">
              <Tabs defaultValue="brief" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-muted/40 p-1">
                  <TabsTrigger value="brief">Brief</TabsTrigger>
                  <TabsTrigger value="scope">Scope</TabsTrigger>
                  <TabsTrigger value="scale">Scale</TabsTrigger>
                  <TabsTrigger value="rubric">Rubric</TabsTrigger>
                </TabsList>

                <TabsContent value="brief" className="space-y-6">
                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={saveForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Problem Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={saveForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={6} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={saveForm.control}
                        name="companyContext"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Context</FormLabel>
                            <FormControl>
                              <Textarea rows={5} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={saveForm.control}
                        name="scenario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scenario</FormLabel>
                            <FormControl>
                              <Textarea rows={5} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <SelectField
                        control={saveForm.control}
                        name="domain"
                        label="Domain"
                        options={SYSTEM_DESIGN_DOMAINS}
                      />
                      <SelectField
                        control={saveForm.control}
                        name="complexity"
                        label="Difficulty"
                        options={["EASY", "MEDIUM", "HARD"]}
                      />
                      <SelectField
                        control={saveForm.control}
                        name="interviewRole"
                        label="Target Role"
                        options={INTERVIEW_ROLES}
                      />

                      <FormField
                        control={saveForm.control}
                        name="estimatedDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={30}
                                max={90}
                                value={field.value}
                                onChange={(event) =>
                                  field.onChange(
                                    Number(event.target.value || 45),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <EditableStringList
                      label="Tags"
                      description="Short discoverable labels used for search and categorization."
                      values={saveForm.watch("tags")}
                      onChange={(values) =>
                        saveForm.setValue("tags", values, {
                          shouldValidate: true,
                        })
                      }
                      addLabel="Add Tag"
                      placeholder="e.g. sharding"
                    />
                  </section>
                </TabsContent>

                <TabsContent value="scope" className="space-y-6">
                  <TwoColumnLists
                    left={
                      <EditableStringList
                        label="Functional Requirements"
                        description="What the candidate must support."
                        values={saveForm.watch("functionalReqs")}
                        onChange={(values) =>
                          saveForm.setValue("functionalReqs", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Requirement"
                        placeholder="e.g. Users can publish content"
                      />
                    }
                    right={
                      <EditableStringList
                        label="Non-Functional Requirements"
                        description="Scale, latency, durability, and operational constraints."
                        values={saveForm.watch("nonFunctionalReqs")}
                        onChange={(values) =>
                          saveForm.setValue("nonFunctionalReqs", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Constraint"
                        placeholder="e.g. P99 read latency under 400ms"
                      />
                    }
                  />

                  <TwoColumnLists
                    left={
                      <EditableStringList
                        label="In Scope"
                        description="What the candidate should actively solve during the interview."
                        values={saveForm.watch("inScope")}
                        onChange={(values) =>
                          saveForm.setValue("inScope", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Scope Item"
                        placeholder="e.g. API design and data model"
                      />
                    }
                    right={
                      <EditableStringList
                        label="Out Of Scope"
                        description="Guardrails that keep the discussion interview-sized."
                        values={saveForm.watch("outOfScope")}
                        onChange={(values) =>
                          saveForm.setValue("outOfScope", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Exclusion"
                        placeholder="e.g. Billing system"
                      />
                    }
                  />

                  <TwoColumnLists
                    left={
                      <EditableStringList
                        label="Architecture Considerations"
                        description="Specific tradeoffs the reviewer should expect the candidate to address."
                        values={saveForm.watch("architectureConsiderations")}
                        onChange={(values) =>
                          saveForm.setValue(
                            "architectureConsiderations",
                            values,
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                        addLabel="Add Consideration"
                        placeholder="e.g. Cache invalidation strategy"
                      />
                    }
                    right={
                      <EditableStringList
                        label="Follow-Up Prompts"
                        description="Scenario twists for deeper interview rounds."
                        values={saveForm.watch("followUps")}
                        onChange={(values) =>
                          saveForm.setValue("followUps", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Follow-Up"
                        placeholder="e.g. Traffic spikes 10x during live events"
                      />
                    }
                  />
                </TabsContent>

                <TabsContent value="scale" className="space-y-6">
                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="grid gap-6 md:grid-cols-2">
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.dailyActiveUsers"
                        label="Daily Active Users"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.peakRequestsPerSecond"
                        label="Peak Requests Per Second"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.readWriteRatio"
                        label="Read / Write Ratio"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.averagePayloadSize"
                        label="Average Payload Size"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.latencySlo"
                        label="Latency SLO"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.availabilitySlo"
                        label="Availability SLO"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.dataRetention"
                        label="Data Retention"
                      />
                      <NestedTextField
                        control={saveForm.control}
                        name="scaleProfile.growthExpectation"
                        label="Growth Expectation"
                      />
                      <SelectField
                        control={saveForm.control}
                        name="scaleProfile.consistencyModel"
                        label="Consistency Model"
                        options={CONSISTENCY_MODELS}
                      />
                      <SelectField
                        control={saveForm.control}
                        name="scaleProfile.budget"
                        label="Budget"
                        options={BUDGET_LEVELS}
                      />
                    </div>
                  </section>

                  <TwoColumnLists
                    left={
                      <EditableStringList
                        label="Primary Regions"
                        description="Regions the design should explicitly support."
                        values={saveForm.watch("scaleProfile.primaryRegions")}
                        onChange={(values) =>
                          saveForm.setValue(
                            "scaleProfile.primaryRegions",
                            values,
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                        addLabel="Add Region"
                        placeholder="e.g. us-west-2"
                      />
                    }
                    right={
                      <EditableStringList
                        label="Compliance"
                        description="Regulatory or contractual requirements."
                        values={saveForm.watch("scaleProfile.compliance")}
                        onChange={(values) =>
                          saveForm.setValue("scaleProfile.compliance", values, {
                            shouldValidate: true,
                          })
                        }
                        addLabel="Add Compliance Requirement"
                        placeholder="e.g. SOC 2"
                      />
                    }
                  />
                </TabsContent>

                <TabsContent value="rubric" className="space-y-6">
                  <TwoColumnLists
                    left={
                      <EditableStringList
                        label="Must-Have Components"
                        description="Baseline expectations for a passing design."
                        values={saveForm.watch(
                          "evaluationRubric.mustHaveComponents",
                        )}
                        onChange={(values) =>
                          saveForm.setValue(
                            "evaluationRubric.mustHaveComponents",
                            values,
                            { shouldValidate: true },
                          )
                        }
                        addLabel="Add Must-Have"
                        placeholder="e.g. Read cache or CDN"
                      />
                    }
                    right={
                      <EditableStringList
                        label="Bonus Points"
                        description="Signals of a more mature or nuanced solution."
                        values={saveForm.watch("evaluationRubric.bonusPoints")}
                        onChange={(values) =>
                          saveForm.setValue(
                            "evaluationRubric.bonusPoints",
                            values,
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                        addLabel="Add Bonus Criterion"
                        placeholder="e.g. Clear hot key mitigation"
                      />
                    }
                  />

                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <EditableStringList
                      label="Red Flags"
                      description="Common mistakes the evaluator should call out strongly."
                      values={saveForm.watch("evaluationRubric.redFlags")}
                      onChange={(values) =>
                        saveForm.setValue("evaluationRubric.redFlags", values, {
                          shouldValidate: true,
                        })
                      }
                      addLabel="Add Red Flag"
                      placeholder="e.g. Single write-primary with no failover plan"
                    />
                  </section>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <div className="sticky top-6 rounded-3xl border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Launch Checklist</h2>
                  <div className="space-y-3 text-sm">
                    <SummaryRow
                      label="Requirements"
                      value={String(totalRequirements)}
                    />
                    <SummaryRow
                      label="Follow-Ups"
                      value={String(totalFollowUps)}
                    />
                    <SummaryRow label="Tags" value={String(totalTags)} />
                    <SummaryRow
                      label="Duration"
                      value={`${saveForm.watch("estimatedDurationMinutes")}m`}
                    />
                    <SummaryRow
                      label="Target Role"
                      value={formatLabel(saveForm.watch("interviewRole"))}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  This challenge now includes scope, scale profile, evaluation
                  rubric, and follow-up scenarios so the practice flow can feel
                  much closer to a real interview loop.
                </div>

                <div className="mt-6 space-y-3">
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save To Library
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onGenerate}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Regenerate From Brief
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card/70 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-4 text-sm font-medium">{label}</div>
      <div className="mt-1 text-sm text-muted-foreground">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background/60 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TwoColumnLists({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">{left}</div>
      <div className="rounded-3xl border bg-card p-6 shadow-sm">{right}</div>
    </section>
  );
}

function EditableStringList({
  label,
  description,
  values,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  description: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const occurrenceCounts = new Map<string, number>();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <Badge variant="secondary" className="font-mono">
            {values.filter(Boolean).length}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {values.map((value, index) => {
          const occurrence = (occurrenceCounts.get(value) ?? 0) + 1;
          occurrenceCounts.set(value, occurrence);
          const itemKey = `${label}-${value || "empty"}-${occurrence}`;

          return (
            <div key={itemKey} className="group relative">
              <Input
                value={value}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = event.target.value;
                  onChange(next);
                }}
                placeholder={placeholder}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() =>
                  onChange(values.filter((_, item) => item !== index))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="mr-2 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: readonly string[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NestedTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
