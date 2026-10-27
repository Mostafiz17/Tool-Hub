import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — ToolHub",
  description: "Learn how ToolHub protects your data with local-first, client-side tool processing.",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 w-full space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold muted hover:text-[var(--primary)] transition-colors">
        <ArrowLeft size={14} />
        <span>Back to tools</span>
      </Link>

      <div className="pb-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--primary)" }}>
          <ShieldCheck size={14} />
          <span>Security & Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs muted mt-1.5">
          Last revised: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6">
        {[
          ["1. The Local-First Principle", "ToolHub is designed so that almost all digital tasks run entirely inside your browser's WebAssembly and JavaScript environment. Image conversions, code formatting, text counting, cryptographic hashing, and mathematical calculations do not upload user documents, code, or images to remote servers."],
          ["2. What Data We Persist", "• Guest State: Favorite tool shortcuts and recently opened tools are saved exclusively in your browser's local storage (only tool slugs, never input text or files).\n• Account Holders: If you choose to create an account, we store your name, email address, a cryptographic scrypt hash of your password, pinned tool slugs, and theme settings to sync across devices.\n• Session Authentication: Authenticated sessions use an HttpOnly, SameSite=Lax session cookie."],
          ["3. External Network Requests", "The only tool that performs an outbound network request is the Currency Converter, which requests public exchange rates from open.er-api.com via an intermediary cache. This request sends only currency codes—no user identifiers or personal data."],
          ["4. What We Will Never Do", "• We never monetize or sell personal data.\n• We never inspect, analyze, or log user inputs.\n• We never transmit passwords typed into the Password Generator or Password Strength Estimator.\n• We do not embed third-party advertising tracking scripts."],
          ["5. Your Rights and Data Erasure", "You can delete your local favorites and history at any time through the platform interface. If you have an account, deleting your account permanently purges all linked favorites and preferences from our database."],
        ].map(([title, content]) => (
          <div key={title} className="card p-6 space-y-2">
            <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            <p className="text-xs sm:text-sm muted leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
