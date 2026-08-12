import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = ["/dashboard"];

// unauthenticated users can access
const authPaths = ["/sign-in"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected or auth-only
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Skip middleware for non-relevant paths
  if (
    !isProtectedPath &&
    !isAuthPath &&
    !pathname.startsWith("/system-design/")
  ) {
    return NextResponse.next();
  }

  // Validate the signed, non-expired session and load the current user state.
  // This also prevents a stale cookie from treating a banned user as signed in.
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);
  const isBanned =
    session?.user.banned === true &&
    (!session.user.banExpires || session.user.banExpires > Date.now());
  const hasValidSession = Boolean(session?.user) && !isBanned;

  // Handle shared system-design links
  if (pathname.startsWith("/system-design/")) {
    const slug = pathname.split("/")[2];
    if (slug) {
      if (!hasValidSession) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
      } else {
        const destUrl = new URL(
          `/dashboard/practice/design/${slug}`,
          request.url,
        );
        destUrl.searchParams.delete("redirect");
        return NextResponse.redirect(destUrl);
      }
    }
  }

  // Redirect unauthenticated users from protected routes to sign-in
  if (isProtectedPath && !hasValidSession) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthPath && hasValidSession) {
    if (request.nextUrl.searchParams.get("error") === "session") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
