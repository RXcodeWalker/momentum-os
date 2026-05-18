import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { ScreenHeader, Card } from "@/components/ui-bits";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const signIn = useApp((s) => s.signIn);
  const signUp = useApp((s) => s.signUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUp(email, password);
        navigate({ to: "/onboarding" });
      } else {
        await signIn(email, password);
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 relative h-16 w-16 rounded-2xl bg-gradient-accent shadow-glow flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-background" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl text-foreground">
            {isSignUp ? "Get started" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp ? "Start your behavioral evolution." : "Continue your behavioral evolution."}
          </p>
        </div>

        <Card className="p-8 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button type="button" className="text-xs text-accent hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger text-center rounded-xl bg-danger/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all font-semibold"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? "Create account" : "Sign In"} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-accent font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className="text-accent font-medium hover:underline"
              >
                Start for free
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

// Suppress unused import warning — ScreenHeader is part of the design system
void ScreenHeader;
