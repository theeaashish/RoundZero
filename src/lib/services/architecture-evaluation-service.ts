import type { Prisma } from "@prisma/client";
import { streamObject } from "ai";
import { architectureEvaluationSchema } from "@/lib/architecture-evaluation";
import {
  formatArchitectureForLLM,
  serializeArchitecture,
  summarizeArchitectureHeuristics,
} from "@/lib/architecture-serializer";
import { architectureCanvasSchema } from "@/lib/architecture-types";
import { model } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import db from "@/lib/prisma";
import { buildArchitectureEvaluationPrompts } from "@/lib/prompts/architecture-evaluation-prompt";
import {
  evaluationRubricSchema,
  storedSystemDesignSpecSchema,
} from "@/lib/validations/practice";

export class DomainError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Validation failed") {
    super(message, 400);
  }
}

export class PayloadTooLargeError extends DomainError {
  constructor(message = "Payload size limit exceeded") {
    super(message, 400);
  }
}

export const ARCHITECTURE_LIMITS = {
  MAX_NODES: 50,
  MAX_EDGES: 100,
  MAX_SERIALIZED_BYTES: 64 * 1024, // 64 KB
  MAX_PROMPT_BYTES: 128 * 1024, // 128 KB
} as const;

export interface StreamEvaluationOptions {
  userId: string;
  problemId: string;
  nodes: unknown;
  edges: unknown;
  abortSignal?: AbortSignal;
}

export class ArchitectureEvaluationService {
  async streamEvaluation(options: StreamEvaluationOptions) {
    const { userId, problemId, nodes, edges, abortSignal } = options;
    const startTime = Date.now();
    const correlationId = `eval_${crypto.randomUUID()}`;

    logger.info("EVALUATION_STREAM_STARTED", {
      correlationId,
      userId,
      problemId,
    });

    // 1. Hard limits & canvas validation
    const parsedCanvas = architectureCanvasSchema.safeParse({ nodes, edges });
    if (!parsedCanvas.success) {
      logger.warn("EVALUATION_VALIDATION_FAILED", {
        correlationId,
        userId,
        problemId,
      });
      throw new ValidationError("Invalid architecture diagram payload.");
    }

    const canvas = parsedCanvas.data;
    if (canvas.nodes.length > ARCHITECTURE_LIMITS.MAX_NODES) {
      throw new PayloadTooLargeError(
        `Architecture limit exceeded: Maximum ${ARCHITECTURE_LIMITS.MAX_NODES} nodes allowed.`,
      );
    }
    if (canvas.edges.length > ARCHITECTURE_LIMITS.MAX_EDGES) {
      throw new PayloadTooLargeError(
        `Architecture limit exceeded: Maximum ${ARCHITECTURE_LIMITS.MAX_EDGES} connections allowed.`,
      );
    }

    // 2. Problem Spec Lookup
    const problem = await db.systemDesignProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new NotFoundError("Target system design problem not found.");
    }

    // 3. Serialization & Heuristics
    const serialization = serializeArchitecture(canvas.nodes, canvas.edges);
    const architectureText = formatArchitectureForLLM(serialization);

    if (
      Buffer.byteLength(architectureText, "utf-8") >
      ARCHITECTURE_LIMITS.MAX_SERIALIZED_BYTES
    ) {
      throw new PayloadTooLargeError(
        "Architecture representation exceeds maximum size limit.",
      );
    }

    const { warnings: heuristicWarnings } = summarizeArchitectureHeuristics(
      serialization,
      problem.complexity,
    );

    const spec = storedSystemDesignSpecSchema.safeParse(problem.specJson);
    const evaluationRubric = evaluationRubricSchema.safeParse(
      problem.evaluationJson,
    );

    // 4. Build Prompt
    const { systemPrompt, userPrompt } = buildArchitectureEvaluationPrompts({
      problem: {
        title: problem.title,
        description: problem.description,
        functionalReqs: problem.functionalReqs,
        nonFunctionalReqs: problem.nonFunctionalReqs,
        complexity: problem.complexity,
        domain: problem.domain,
        interviewRole: problem.interviewRole,
      },
      specData: spec.success ? spec.data : undefined,
      evaluationRubricData: evaluationRubric.success
        ? evaluationRubric.data
        : undefined,
      heuristicWarnings,
      architectureText,
    });

    // Enforce prompt size validation against ARCHITECTURE_LIMITS.MAX_PROMPT_BYTES
    const totalPromptBytes = Buffer.byteLength(
      systemPrompt + userPrompt,
      "utf-8",
    );
    if (totalPromptBytes > ARCHITECTURE_LIMITS.MAX_PROMPT_BYTES) {
      throw new PayloadTooLargeError(
        "Combined evaluation prompt exceeds maximum size limit.",
      );
    }

    const architecturePayload = canvas as unknown as Prisma.InputJsonValue;

    // 5. Invoke streamObject with AI SDK Retries & AbortSignal
    const streamResult = streamObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: architectureEvaluationSchema,
      temperature: 0.2,
      maxRetries: 3,
      abortSignal,
      async onFinish({ object, error }) {
        const latencyMs = Date.now() - startTime;

        if (
          abortSignal?.aborted ||
          (error && (error as Error).name === "AbortError")
        ) {
          logger.info("EVALUATION_STREAM_ABORTED", {
            correlationId,
            userId,
            problemId,
            latencyMs,
          });
          return;
        }

        if (error) {
          const errObj =
            error instanceof Error
              ? error
              : new Error(
                  String((error as { message?: string }).message ?? error),
                );
          logger.error("EVALUATION_STREAM_ERROR", {
            correlationId,
            userId,
            problemId,
            latencyMs,
            errorName: errObj.name,
            errorMessage: errObj.message,
          });
          return;
        }

        logger.info("EVALUATION_STREAM_COMPLETED", {
          correlationId,
          userId,
          problemId,
          latencyMs,
          nodeCount: canvas.nodes.length,
          edgeCount: canvas.edges.length,
        });

        // Debug log snapshot for streamed payload keys
        logger.debug("STREAM_OBJECT_SNAPSHOT", {
          correlationId,
          objectKeys: object ? Object.keys(object) : [],
          hasSummary: Boolean(object?.summary),
          strengthsCount: object?.strengths?.length ?? 0,
        });

        // 6. Asynchronous Non-Blocking Database Persistence
        if (object) {
          try {
            await db.systemDesignAttempt.create({
              data: {
                problemId,
                userId,
                architectureJson: architecturePayload,
                aiFeedback: object,
                score: object.overallScore ?? 0,
              },
            });

            logger.info("EVALUATION_PERSISTENCE_SUCCESS", {
              correlationId,
              userId,
              problemId,
            });
          } catch (persistenceErr) {
            logger.error("EVALUATION_PERSISTENCE_FAILED", {
              correlationId,
              userId,
              problemId,
              error:
                persistenceErr instanceof Error
                  ? persistenceErr.message
                  : String(persistenceErr),
            });
          }
        }
      },
    });

    return streamResult.toTextStreamResponse();
  }
}

export const architectureEvaluationService =
  new ArchitectureEvaluationService();
