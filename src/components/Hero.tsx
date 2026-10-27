"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTool } from "@/lib/registry";
import { SearchBox } from "./ui";

const POPULAR_SLUGS = ["image-resizer", "json-formatter", "password-generator", "qr-generator", "word-counter", "unit-converter"];
const HERO_PHOTO = "/images/toolhub-hero-workspace.jpg";

function QuickTool({ href, name, note, children }: { href: string; name: string; note: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hero-quick-tool group">
      <span className="hero-quick-preview" aria-hidden="true">{children}</span>
      <span className="min-w-0">
        <span className="hero-quick-name">{name}</span>
        <span className="hero-quick-note">{note}</span>
      </span>
      <ArrowUpRight size={15} className="hero-quick-arrow" aria-hidden="true" />
    </Link>
  );
}

export function Hero() {
  const popular = POPULAR_SLUGS.map(getTool).filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[];
  const imageTool = getTool("image-resizer");
  const jsonTool = getTool("json-formatter");
  const wordTool = getTool("word-counter");
  const passwordTool = getTool("password-generator");

  return (
    <section className="hero py-12 sm:py-16 lg:py-18" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 items-center">
        {/* A human voice and one obvious action. */}
        <div className="max-w-2xl">
          <p className="hero-eyebrow">A toolbox for the small stuff.</p>

          <h1 id="hero-heading" className="hero-title mt-3 text-4xl sm:text-5xl lg:text-[3.35rem]">
            Small tasks.
            <span className="hero-accent-text block sm:inline"> Solved in seconds.</span>
          </h1>

          <p className="hero-copy mt-4 sm:mt-5 max-w-xl">
            Need to resize a photo, clean up a bit of text, or check a calculation? Pick a tool, get it done, get on with your day. Your files stay on your device.
          </p>

          <div className="mt-7 max-w-xl">
            <SearchBox hero placeholder="What are you working on?" />
          </div>

          {popular.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="muted-13">Or start with:</span>
              {popular.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="hero-text-link">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          <p className="mt-7 text-xs muted leading-relaxed max-w-md">
            No account, no uploads, no fuss. Most tools work entirely in your browser.
          </p>
        </div>

        {/* A real person, doing the kind of small task ToolHub helps with. */}
        <div className="hero-showcase" aria-label="A real-life example of using a ToolHub image tool">
          {imageTool && (
            <div className="hero-photo-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_PHOTO}
                alt="A woman working on her laptop at a bright home workspace"
                className="hero-photo"
                fetchPriority="high"
              />
              <div className="hero-photo-caption">
                <p className="hero-photo-kicker">A familiar little problem</p>
                <h2 className="hero-photo-title">Photo too big to send?</h2>
                <p className="hero-photo-copy">Make it smaller in a few clicks. It never leaves your device.</p>
                <Link href={`/tools/${imageTool.slug}`} className="hero-photo-action">
                  Resize a photo <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          <div className="hero-quick-heading">
            <span>While you&apos;re here</span>
            <span className="muted-11">A few useful shortcuts</span>
          </div>

          <div className="hero-quick-grid">
            {jsonTool && (
              <QuickTool href={`/tools/${jsonTool.slug}`} name="JSON Formatter" note="Make messy data readable">
                <span className="mono">{"{ }"}</span>
              </QuickTool>
            )}
            {wordTool && (
              <QuickTool href={`/tools/${wordTool.slug}`} name="Word Counter" note="Keep an eye on length">
                <span className="hero-count-preview"><b>248</b><small>words</small></span>
              </QuickTool>
            )}
            {passwordTool && (
              <QuickTool href={`/tools/${passwordTool.slug}`} name="Password Generator" note="Create one on your device">
                <span className="hero-password-preview" aria-hidden="true">••••••••</span>
              </QuickTool>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
