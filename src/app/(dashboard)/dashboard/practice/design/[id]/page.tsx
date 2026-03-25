import {
  ArrowLeft,
  CheckSquare,
  Clock,
  Layers,
  MonitorPlay,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { serverClient } from "@/lib/orpc-server";
import { cn } from "@/lib/utils";
import {
  evaluationRubricSchema,
  storedSystemDesignSpecSchema,
} from "@/lib/validations/practice";
import { os_context } from "@/server/orpc";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const problem = await serverClient.practice.getProblem({ id });
    return {
      title: `${problem.title} | System Design`,
      description: problem.description,
    };
  } catch {
    return {
      title: "Problem Not Found",
    };
  }
}

const COMPLEXITY_MAP = {
  EASY: {
    label: "Easy",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  HARD: {
    label: "Hard",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
} as const;

function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ProblemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await os_context({ headers: await headers() });

  if (!context.user) {
    redirect("/sign-in?error=session");
  }

  const { id } = await params;
  let problem: Awaited<ReturnType<typeof serverClient.practice.getProblem>>;

  try {
    problem = await serverClient.practice.getProblem({ id });
  } catch {
    notFound();
  }

  const complexity =
    COMPLEXITY_MAP[problem.complexity as keyof typeof COMPLEXITY_MAP] ||
    COMPLEXITY_MAP.MEDIUM;
  const spec = storedSystemDesignSpecSchema.safeParse(problem.specJson);
  const rubric = evaluationRubricSchema.safeParse(problem.evaluationJson);
  const totalSpecs =
    problem.functionalReqs.length + problem.nonFunctionalReqs.length;

  return (
    <div className="flex h-full w-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur-xs">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard/practice/design">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link
            href="/dashboard/practice/design"
            className="hover:text-foreground transition-colors"
          >
            System Design
          </Link>
          <span>/</span>
          <span className="max-w-[300px] truncate text-foreground">
            {problem.title}
          </span>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:justify-between">
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("font-medium px-2.5 py-0.5", complexity.badge)}
              >
                <span
                  className={cn(
                    "mr-2 h-1.5 w-1.5 rounded-full",
                    complexity.dot,
                  )}
                />
                {complexity.label}
              </Badge>
              <Badge variant="secondary">{labelize(problem.domain)}</Badge>
              <Badge variant="secondary">
                {labelize(problem.interviewRole)}
              </Badge>
              <Badge variant="secondary">
                {problem.estimatedDurationMinutes} min
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {problem.title}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {problem.description}
              </p>
            </div>

            {spec.success ? (
              <div className="grid gap-4 md:grid-cols-2">
                <InfoPanel
                  title="Company Context"
                  body={spec.data.companyContext}
                />
                <InfoPanel title="Scenario" body={spec.data.scenario} />
              </div>
            ) : null}

            {problem.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <Card className="w-full shrink-0 border-primary/20 bg-primary/5 shadow-sm xl:w-[340px]">
            <CardContent className="flex h-full flex-col justify-center space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Stat
                  label="Time Limit"
                  value={`${problem.estimatedDurationMinutes} mins`}
                  icon={Clock}
                />
                <Stat
                  label="Requirements"
                  value={`${totalSpecs} specs`}
                  icon={Layers}
                />
                <Stat
                  label="Follow-Ups"
                  value={
                    spec.success
                      ? `${spec.data.followUps.length} twists`
                      : "N/A"
                  }
                  icon={Sparkles}
                />
                <Stat
                  label="Role"
                  value={labelize(problem.interviewRole)}
                  icon={Target}
                />
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="h-12 w-full font-medium shadow-md hover:shadow-lg"
                  asChild
                >
                  <Link href={`/dashboard/practice/design/${problem.id}/arena`}>
                    <MonitorPlay className="mr-2 h-5 w-5" />
                    Launch Arena
                  </Link>
                </Button>
                <p className="text-center text-[11px] font-medium text-muted-foreground">
                  Diagram progress autosaves while you work.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="grid gap-6 lg:grid-cols-2">
          <RequirementCard
            title="Functional Requirements"
            icon={CheckSquare}
            items={problem.functionalReqs}
          />
          <RequirementCard
            title="System Constraints"
            icon={ShieldAlert}
            items={problem.nonFunctionalReqs}
          />
        </div>

        {spec.success ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <ListCard title="In Scope" items={spec.data.inScope} />
              <ListCard title="Out Of Scope" items={spec.data.outOfScope} />
            </div>

            <Card className="shadow-sm border-border/60 bg-card overflow-hidden">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-lg">Scale Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                <ScaleStat
                  label="DAU"
                  value={spec.data.scaleProfile.dailyActiveUsers}
                />
                <ScaleStat
                  label="Peak RPS"
                  value={spec.data.scaleProfile.peakRequestsPerSecond}
                />
                <ScaleStat
                  label="Read / Write"
                  value={spec.data.scaleProfile.readWriteRatio}
                />
                <ScaleStat
                  label="Latency SLO"
                  value={spec.data.scaleProfile.latencySlo}
                />
                <ScaleStat
                  label="Availability"
                  value={spec.data.scaleProfile.availabilitySlo}
                />
                <ScaleStat
                  label="Consistency"
                  value={labelize(spec.data.scaleProfile.consistencyModel)}
                />
                <ScaleStat
                  label="Retention"
                  value={spec.data.scaleProfile.dataRetention}
                />
                <ScaleStat
                  label="Budget"
                  value={labelize(spec.data.scaleProfile.budget)}
                />
                <ScaleStat
                  label="Growth"
                  value={spec.data.scaleProfile.growthExpectation}
                />
              </CardContent>
              <CardContent className="border-t px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  {spec.data.scaleProfile.primaryRegions.map((region) => (
                    <Badge key={region} variant="outline">
                      {region}
                    </Badge>
                  ))}
                  {spec.data.scaleProfile.compliance.map((requirement) => (
                    <Badge key={requirement} variant="outline">
                      {requirement}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <ListCard
                title="Architecture Considerations"
                items={spec.data.architectureConsiderations}
              />
              <ListCard
                title="Follow-Up Scenarios"
                items={spec.data.followUps}
              />
            </div>
          </>
        ) : null}

        {rubric.success ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <ListCard
              title="Must-Have Components"
              items={rubric.data.mustHaveComponents}
            />
            <ListCard title="Bonus Signals" items={rubric.data.bonusPoints} />
            <ListCard title="Red Flags" items={rubric.data.redFlags} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1">
      <span className="flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </span>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RequirementCard({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b px-6 py-5 bg-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/50">
          {items.map((item, index) => (
            <li
              key={`${title}-${item}`}
              className="flex gap-4 px-6 py-4 transition-colors hover:bg-muted/10"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="mt-0.5 text-sm leading-relaxed text-foreground/90">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={`${title}-${item}`}
            className="rounded-2xl border bg-background/70 px-4 py-3 text-sm text-foreground/90"
          >
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card/60 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

function ScaleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/70 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
