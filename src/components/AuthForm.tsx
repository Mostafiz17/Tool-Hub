"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { ErrorBox, Field } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
      login(d.user);
      router.push("/favorites");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md w-full px-4 py-16">
      <div className="card p-7 sm:p-9 glass-panel space-y-6">
        <div className="text-center space-y-1.5">
          <div className="grid place-items-center w-12 h-12 rounded-2xl mx-auto shadow-sm" style={{ background: "var(--primary)", color: "#FFFFFF" }}>
            {mode === "register" ? <UserPlus size={22} /> : <LogIn size={22} />}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-xs muted leading-relaxed">
            {mode === "register"
              ? "Sign up to sync your pinned tools and preferences across devices. Every tool remains free without an account."
              : "Log in to synchronize your favorites and platform preferences."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate={false}>
          {mode === "register" && (
            <Field label="Full name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
                placeholder="Alex Morgan"
              />
            </Field>
          )}

          <Field label="Email address">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>

          <Field
            label="Password"
            hint={mode === "register" ? "Minimum 8 characters. Stored securely using salted scrypt hashing." : undefined}
          >
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
          </Field>

          <ErrorBox msg={err} />

          {err.includes("not configured") && (
            <p className="hint text-xs text-amber-600 dark:text-amber-400">
              The database connection (MONGODB_URI) is currently being initialized. Guest tools and local device storage work immediately without an account.
            </p>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "register" ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="pt-4 border-t text-center text-xs muted space-y-2" style={{ borderColor: "var(--border)" }}>
          <p>
            {mode === "register" ? (
              <>
                Already have an account?{" "}
                <Link className="font-bold underline hover:text-[var(--primary)] transition-colors" style={{ color: "var(--primary)" }} href="/login">
                  Log in here
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account yet?{" "}
                <Link className="font-bold underline hover:text-[var(--primary)] transition-colors" style={{ color: "var(--primary)" }} href="/register">
                  Sign up free
                </Link>
              </>
            )}
          </p>

          <p className="flex items-center justify-center gap-1.5 text-[11px]">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Zero spam. Passwords never transmitted in plaintext.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
