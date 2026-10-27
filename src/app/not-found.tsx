import Link from "next/link";
import { SearchBox } from "@/components/ui";
import { LayoutGrid, Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center w-full space-y-6">
      <div className="grid place-items-center w-16 h-16 rounded-3xl mx-auto shadow-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
        <AlertCircle size={32} />
      </div>
      <div>
        <p className="text-5xl font-black tracking-tight" style={{ color: "var(--primary)" }}>404</p>
        <h1 className="text-2xl font-extrabold mt-2 tracking-tight">Tool or Page Not Found</h1>
        <p className="muted text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
          The link you opened might be broken or moved, but the tool you need is right in our library.
        </p>
      </div>

      <div className="text-left max-w-md mx-auto">
        <SearchBox placeholder="Find a tool..." />
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link href="/tools" className="btn-primary btn-sm inline-flex items-center gap-1.5">
          <LayoutGrid size={15} />
          <span>Browse All Tools</span>
        </Link>
        <Link href="/" className="btn-ghost btn-sm inline-flex items-center gap-1.5">
          <Home size={15} />
          <span>Return Home</span>
        </Link>
      </div>
    </main>
  );
}
