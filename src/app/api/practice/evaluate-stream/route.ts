import { auth } from "@/lib/auth";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import { logger } from "@/lib/logger";
import {
  architectureEvaluationService,
  DomainError,
} from "@/lib/services/architecture-evaluation-service";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";
    const session = await auth.api.getSession({ headers: { cookie } });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      await assertFeatureAccess(session.user.id, "canAccessSystemDesign");
    } catch (_accessErr) {
      return new Response("Forbidden: Requires Active Subscription", {
        status: 403,
      });
    }

    const body = await req.json();
    const { problemId, nodes, edges } = body ?? {};

    if (!problemId || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return new Response("Invalid request payload", { status: 400 });
    }

    return await architectureEvaluationService.streamEvaluation({
      userId: session.user.id,
      problemId,
      nodes,
      edges,
      abortSignal: req.signal,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      logger.warn("DOMAIN_ERROR_HANDLED", {
        errorName: error.name,
        errorMessage: error.message,
        statusCode: error.statusCode,
      });
      return new Response(error.message, { status: error.statusCode });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    logger.error("API_EVALUATE_STREAM_ERROR", { error: errorMessage });

    return new Response(errorMessage, { status: 500 });
  }
}
