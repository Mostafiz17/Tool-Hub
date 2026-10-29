"use client";
import Link from "next/link";
import { Braces, ImageIcon, KeyRound, Text } from "lucide-react";
import { getTool } from "@/lib/registry";
import { SearchBox } from "./ui";

const POPULAR_SLUGS = ["image-resizer", "json-formatter", "password-generator", "qr-generator", "word-counter", "unit-converter"];

export function Hero() {
  const popular = POPULAR_SLUGS.map(getTool).filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[];
  const imageTool = getTool("image-resizer");
  const jsonTool = getTool("json-formatter");
  const wordTool = getTool("word-counter");
  const passwordTool = getTool("password-generator");

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-composition mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hero-float-layer" aria-hidden="true">
          {jsonTool && (
            <div className="hero-float-card hero-float-upper-left">
              <div className="hero-float-card-head">
                <span className="hero-float-icon"><Braces size={15} /></span>
                <span>{jsonTool.name}</span>
              </div>
              <div className="hero-code-preview">
                <span className="hero-code-brace">{"{"}</span>
                <span className="hero-code-line hero-code-line-short" />
                <span className="hero-code-line" />
                <span className="hero-code-line hero-code-line-mid" />
                <span className="hero-code-brace">{"}"}</span>
              </div>
            </div>
          )}

          {wordTool && (
            <div className="hero-float-card hero-float-lower-left">
              <div className="hero-float-card-head">
                <span className="hero-float-icon"><Text size={15} /></span>
                <span>{wordTool.name}</span>
              </div>
              <div className="hero-text-preview">
                <span /><span /><span className="is-short" />
              </div>
              <div className="hero-preview-labels">
                <span>Words</span><span>Characters</span><span>Reading time</span>
              </div>
            </div>
          )}

          {imageTool && (
            <div className="hero-float-card hero-float-upper-right">
              <div className="hero-float-card-head">
                <span className="hero-float-icon"><ImageIcon size={15} /></span>
                <span>{imageTool.name}</span>
              </div>
              <div className="hero-float-image">
                <span className="hero-float-sun" />
                <span className="hero-float-hill" />
                <span className="hero-float-hill is-front" />
              </div>
            </div>
          )}

          {passwordTool && (
            <div className="hero-float-card hero-float-lower-right">
              <div className="hero-float-card-head">
                <span className="hero-float-icon"><KeyRound size={15} /></span>
                <span>{passwordTool.name}</span>
              </div>
              <div className="hero-password-field">••••••••••••</div>
              <div className="hero-password-bars">
                <span /><span /><span /><span />
              </div>
              <p className="hero-preview-note">Created on your device</p>
            </div>
          )}
        </div>

        <div className="hero-center">
          <p className="hero-eyebrow">A toolbox for the small stuff.</p>

          <h1 id="hero-heading" className="hero-title">
            Small tasks.
            <span className="hero-accent-text block">Solved in seconds.</span>
          </h1>

          <p className="hero-copy">
            Need to resize a photo, clean up a bit of text, or check a calculation? Pick a tool, get it done, get on with your day. Your files stay on your device.
          </p>

          <div className="hero-search-wrap">
            <SearchBox hero placeholder="What are you working on?" />
          </div>

          {popular.length > 0 && (
            <div className="hero-start-links">
              <span className="muted-13">Or start with:</span>
              {popular.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="hero-text-link">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          <p className="hero-privacy-note">
            No account, no uploads, no fuss. Most tools work entirely in your browser.
          </p>
        </div>
      </div>
    </section>
  );
}
