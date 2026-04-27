import { ORPCError, os } from "@orpc/server";
import { tryCatch } from "@/hooks/try-catch";
import { auth } from "@/lib/auth";

export type Context = {
  user?: typeof auth.$Infer.Session.user;
  session?: typeof auth.$Infer.Session.session;
};
type AuthSession = typeof auth.$Infer.Session;

export const os_context = async (opts: {
  headers: Headers;
}): Promise<Context> => {
  const cookie = opts.headers.get("cookie") ?? "";

  const { data: session, error } = await tryCatch(
    auth.api.getSession({ headers: { cookie } }),
  );

  if (error || !session) {
    return {};
  }

  const authSession = session as AuthSession;

  return {
    user: authSession.user,
    session: authSession.session,
  };
};

export const t = os.$context<Context>();
export const publicProcedure = t;

export const protectedProcedure = t.use(async ({ context, next }) => {
  const authContext = context as Context;

  if (!authContext.user || !authContext.session) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      user: authContext.user,
      session: authContext.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    const authContext = context as Required<Context>;

    if (authContext.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "Requires admin privileges",
      });
    }

    return next({
      context: {
        user: authContext.user,
        session: authContext.session,
      },
    });
  },
);
