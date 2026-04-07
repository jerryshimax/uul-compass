"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Compass, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { signUpAction } from "@/lib/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "This email is not on the invite list. Contact admin@uulglobal.com.",
  already_registered: "Account already exists. Please sign in instead.",
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await signUpAction(email, password);
    if (result?.error) {
      setError(ERROR_MESSAGES[result.error] ?? result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[oklch(0.22_0.06_250)] via-[oklch(0.18_0.04_250)] to-[oklch(0.15_0.03_260)]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[oklch(0.65_0.15_195)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[oklch(0.55_0.12_250)]/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-sm border-border/20 shadow-2xl shadow-black/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <Compass className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Set Up Your Account</h1>
            <p className="text-xs text-muted-foreground mt-1.5">Create a password for your invite</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 pl-10 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pl-10 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-11 pl-10 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-medium gap-2"
            >
              {loading ? "Creating account…" : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
