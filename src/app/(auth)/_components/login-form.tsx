"use client";

import { Loader } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function LoginForm({
  redirectUrl = "/dashboard",
}: {
  redirectUrl?: string;
}) {
  type AuthErrorContext = {
    error?: {
      message?: string;
    };
  };

  const [githubPending, startGithubTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();

  async function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: redirectUrl,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with GitHub, redirecting to dashboard...");
          },
          onError: (ctx: AuthErrorContext) => {
            toast.error(ctx.error?.message || "Failed to sign in with GitHub");
          },
        },
      });
    });
  }

  async function signInWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with Google, redirecting to dashboard...");
          },
          onError: (ctx: AuthErrorContext) => {
            toast.error(ctx.error?.message || "Failed to sign in with Google");
          },
        },
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-center">Welcome back!</CardTitle>
        <CardDescription className="text-center">
          Login with your GitHub or Google Account
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={signInWithGithub}
          disabled={githubPending}
          className="w-full cursor-pointer"
          variant="outline"
        >
          {githubPending ? (
            <>
              <Loader className="size-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <GitHubIcon className="size-5" />
              Sign in with GitHub
            </>
          )}
        </Button>
        <Button
          onClick={signInWithGoogle}
          disabled={googlePending}
          className="w-full cursor-pointer"
          variant="outline"
        >
          {googlePending ? (
            <>
              <Loader className="size-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <GoogleIcon className="size-5" />
              Sign in with Google
            </>
          )}
        </Button>

        {/* <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2
            after:z-0 after:flex after:items-center after:border-t after:border-border"
        >
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div> */}
      </CardContent>
    </Card>
  );
}
