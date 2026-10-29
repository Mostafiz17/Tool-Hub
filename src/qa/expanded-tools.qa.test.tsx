import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EXPANDED_TOOL_COMPONENTS } from "@/components/tools-expanded";
import { calculate, CALCULATOR_SPECS, keywordDensity, sentenceSummary } from "@/lib/expanded-logic";
import { EXPANDED_TOOLS } from "@/lib/expanded-registry";
import { publishedTools } from "@/lib/registry";

const BLOCKED = [
  "ai-headshot-profile-picture-maker", "ai-image-background-remover", "gif-maker",
  "image-to-text-ocr", "merge-pdf", "pdf-to-word-converter",
];

describe("expanded inventory", () => {
  it("registers 90 new tools and maps every one to a component", () => {
    expect(EXPANDED_TOOLS).toHaveLength(90);
    expect(Object.keys(EXPANDED_TOOL_COMPONENTS).sort()).toEqual(EXPANDED_TOOLS.map((tool) => tool.slug).sort());
    expect(publishedTools).toHaveLength(121);
  });

  it("server-renders every expanded workspace without a placeholder", () => {
    for (const tool of EXPANDED_TOOLS) {
      const html = renderToStaticMarkup(React.createElement(EXPANDED_TOOL_COMPONENTS[tool.slug]));
      expect(html.length, tool.slug).toBeGreaterThan(40);
      expect(html, tool.slug).not.toContain("This tool is not available");
    }
  });

  it("reports the six dependency-bound workflows honestly", () => {
    for (const slug of BLOCKED) {
      const html = renderToStaticMarkup(React.createElement(EXPANDED_TOOL_COMPONENTS[slug]));
      expect(html).toContain("Integration required");
      expect(html).toContain("intentionally blocked");
    }
  });
});

describe("expanded calculator regression coverage", () => {
  it("has executable formula definitions for all 27 numeric calculators", () => {
    expect(Object.keys(CALCULATOR_SPECS)).toHaveLength(27);
    for (const spec of Object.values(CALCULATOR_SPECS)) {
      const raw = Object.fromEntries(spec.fields.map((field) => [field.key, String(field.defaultValue)]));
      expect(calculate(spec, raw).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("calculates representative business and consumer results", () => {
    expect(calculate(CALCULATOR_SPECS["discount-calculator"], { price: "100", discount: "20", tax: "10" }).at(-1)).toEqual({ label: "Final price", value: "$88.00" });
    expect(calculate(CALCULATOR_SPECS["cac-calculator"], { marketing: "300", sales: "200", customers: "10" })[0]).toEqual({ label: "CAC", value: "$50.00" });
    expect(calculate(CALCULATOR_SPECS["mrr-arr-calculator"], { customers: "10", arpu: "20", monthlyChurn: "5" })[1]).toEqual({ label: "ARR", value: "$2,400.00" });
  });

  it("rejects empty, negative, and invalid denominator inputs", () => {
    expect(() => calculate(CALCULATOR_SPECS["discount-calculator"], { price: "", discount: "20", tax: "0" })).toThrow(/valid number/i);
    expect(() => calculate(CALCULATOR_SPECS["discount-calculator"], { price: "-1", discount: "20", tax: "0" })).toThrow(/at least 0/i);
    expect(() => calculate(CALCULATOR_SPECS["cac-calculator"], { marketing: "10", sales: "10", customers: "0" })).toThrow(/at least 1/i);
  });
});

describe("expanded text analysis", () => {
  it("creates a bounded extractive summary", () => {
    const source = "Cats sleep often. Dogs enjoy walks. Cats also enjoy warm sunny windows. Fish swim.";
    const summary = sentenceSummary(source, 2);
    expect(summary.split(/[.!?]/).filter(Boolean)).toHaveLength(2);
    expect(summary).toContain("Cats");
  });

  it("counts keyword phrases and handles empty keywords", () => {
    expect(keywordDensity("Blue tools and blue skies", "blue")).toEqual({ count: 2, words: 5, density: 40 });
    expect(keywordDensity("one two", "")).toEqual({ count: 0, words: 2, density: 0 });
  });
});
