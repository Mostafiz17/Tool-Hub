import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use — ToolHub",
  description: "Terms and conditions for utilizing ToolHub online utilities.",
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
          <FileText size={14} />
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Terms of Use
        </h1>
        <p className="text-xs muted mt-1.5">
          Last revised: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6">
        {[
          ["1. Acceptance of Terms", "By accessing ToolHub, you agree to these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."],
          ["2. Service Description", "ToolHub provides browser-based utilities including calculators, converters, developer tools, design helpers, image editors, and financial estimators for personal and commercial use."],
          ["3. Accuracy and Disclaimer", "While all mathematical and algorithmic calculations follow standard mathematical and computational specifications, tools are provided on an 'as is' basis. Financial calculations (such as loan EMIs and currency estimates) are for informational purposes only."],
          ["4. Acceptable Use", "You agree not to use ToolHub to perform unlawful activities, attempt unauthorized database access, or interfere with service operation. Rate limiting is enforced to ensure fair shared server availability."],
          ["5. Intellectual Property & User Content", "Your inputs, images, files, and generated outputs remain 100% your own property. ToolHub claims no ownership or rights over content you process using our client-side tools."],
        ].map(([title, content]) => (
          <div key={title} className="card p-6 space-y-2">
            <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            <p className="text-xs sm:text-sm muted leading-relaxed">
              {content}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
