export type NumericField = { key: string; label: string; defaultValue: number; min?: number; step?: number; hint?: string };
export type CalculationResult = { label: string; value: string };
export type CalculatorSpec = { fields: NumericField[]; calculate: (values: Record<string, number>) => CalculationResult[]; note: string };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value: number, digits = 2) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
const percent = (value: number) => `${number(value)}%`;
const field = (key: string, label: string, defaultValue: number, min = 0, step = 1, hint?: string): NumericField => ({ key, label, defaultValue, min, step, hint });
const positive = (value: number, label: string) => { if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`); return value; };
const nonnegative = (value: number, label: string) => { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} cannot be negative.`); return value; };
const roi = (benefit: number, cost: number) => cost === 0 ? 0 : ((benefit - cost) / cost) * 100;

export const CALCULATOR_SPECS: Record<string, CalculatorSpec> = {
  "ai-automation-cost-calculator": {
    fields: [field("setup", "One-time setup cost", 8000), field("monthly", "Monthly automation cost", 500), field("hours", "Manual hours per month", 120), field("rate", "Hourly labor cost", 30), field("months", "Comparison period (months)", 12, 1)],
    calculate: (v) => { const manual = v.hours * v.rate * v.months; const automated = v.setup + v.monthly * v.months; return [{ label: "Manual cost", value: money(manual) }, { label: "Automation cost", value: money(automated) }, { label: "Estimated savings", value: money(manual - automated) }, { label: "ROI", value: percent(roi(manual, automated)) }]; },
    note: "Uses only the costs and work assumptions you provide; it does not predict implementation success.",
  },
  "ai-chatbot-roi-calculator": {
    fields: [field("conversations", "Monthly conversations", 3000), field("minutes", "Agent minutes per conversation", 8, 0, 0.5), field("rate", "Agent hourly cost", 25), field("automation", "Conversations automated (%)", 55, 0, 1), field("cost", "Monthly chatbot cost", 800)],
    calculate: (v) => { const gross = v.conversations * v.minutes / 60 * v.rate * v.automation / 100; return [{ label: "Labor value saved", value: money(gross) }, { label: "Net monthly benefit", value: money(gross - v.cost) }, { label: "Annual net benefit", value: money((gross - v.cost) * 12) }, { label: "Monthly ROI", value: percent(roi(gross, v.cost)) }]; },
    note: "Treats automated conversation time as avoided labor; adjust the automation rate conservatively.",
  },
  "ai-integration-cost-estimator": {
    fields: [field("hours", "Implementation hours", 240), field("rate", "Delivery rate per hour", 120), field("licenses", "Monthly licenses and APIs", 1200), field("months", "First-year months", 12, 1), field("contingency", "Contingency (%)", 15)],
    calculate: (v) => { const delivery = v.hours * v.rate; const recurring = v.licenses * v.months; const subtotal = delivery + recurring; const contingency = subtotal * v.contingency / 100; return [{ label: "Implementation", value: money(delivery) }, { label: "Recurring", value: money(recurring) }, { label: "Contingency", value: money(contingency) }, { label: "Estimated total", value: money(subtotal + contingency) }]; },
    note: "A planning estimate based on entered effort, rates, licenses and contingency.",
  },
  "ai-vs-human-cost-comparison": {
    fields: [field("tasks", "Tasks per month", 5000), field("minutes", "Human minutes per task", 4, 0, 0.1), field("rate", "Human hourly cost", 28), field("aiCost", "AI cost per task", 0.08, 0, 0.01), field("oversight", "AI oversight hours per month", 20)],
    calculate: (v) => { const human = v.tasks * v.minutes / 60 * v.rate; const ai = v.tasks * v.aiCost + v.oversight * v.rate; return [{ label: "Human workflow", value: money(human) }, { label: "AI-assisted workflow", value: money(ai) }, { label: "Monthly difference", value: money(human - ai) }, { label: "Cost reduction", value: percent(human ? (human - ai) / human * 100 : 0) }]; },
    note: "Compares cost only; quality, risk, review and exception handling still require evaluation.",
  },
  "api-cost-calculator": {
    fields: [field("requests", "Requests per month", 1000000), field("perThousand", "Cost per 1,000 requests", 0.4, 0, 0.01), field("egress", "Data transfer (GB)", 100), field("egressRate", "Cost per GB", 0.09, 0, 0.01), field("fixed", "Fixed monthly cost", 20)],
    calculate: (v) => { const requestCost = v.requests / 1000 * v.perThousand; const data = v.egress * v.egressRate; return [{ label: "Request cost", value: money(requestCost) }, { label: "Transfer cost", value: money(data) }, { label: "Monthly total", value: money(requestCost + data + v.fixed) }, { label: "Annual total", value: money((requestCost + data + v.fixed) * 12) }]; },
    note: "Enter the rates from your actual API or cloud provider; no rate is assumed to be current.",
  },
  "app-maintenance-cost-calculator": {
    fields: [field("build", "Original build cost", 80000), field("annual", "Annual maintenance (%)", 18), field("infra", "Monthly infrastructure", 600), field("support", "Monthly support tools", 250)],
    calculate: (v) => { const maintenance = v.build * v.annual / 100; const recurring = (v.infra + v.support) * 12; return [{ label: "Annual maintenance", value: money(maintenance) }, { label: "Annual infrastructure", value: money(recurring) }, { label: "Annual total", value: money(maintenance + recurring) }, { label: "Monthly average", value: money((maintenance + recurring) / 12) }]; },
    note: "Maintenance percentages vary by product maturity and service expectations.",
  },
  "app-mvp-feature-prioritizer": {
    fields: [field("reach", "Reach per quarter", 500), field("impact", "Impact score (0.25–3)", 2, 0.25, 0.25), field("confidence", "Confidence (%)", 80), field("effort", "Effort (person-months)", 2, 0.1, 0.1)],
    calculate: (v) => { positive(v.effort, "Effort"); const score = v.reach * v.impact * v.confidence / 100 / v.effort; return [{ label: "RICE score", value: number(score, 1) }, { label: "Reach × impact", value: number(v.reach * v.impact) }, { label: "Confidence", value: percent(v.confidence) }, { label: "Effort", value: `${number(v.effort)} person-months` }]; },
    note: "RICE = reach × impact × confidence ÷ effort. Compare features scored with the same assumptions.",
  },
  "automation-roi-calculator": {
    fields: [field("investment", "Initial investment", 12000), field("monthlyCost", "Monthly operating cost", 500), field("monthlySaving", "Monthly gross savings", 3500), field("months", "Analysis period (months)", 12, 1)],
    calculate: (v) => { const cost = v.investment + v.monthlyCost * v.months; const benefit = v.monthlySaving * v.months; return [{ label: "Total cost", value: money(cost) }, { label: "Gross benefit", value: money(benefit) }, { label: "Net benefit", value: money(benefit - cost) }, { label: "ROI", value: percent(roi(benefit, cost)) }]; },
    note: "ROI = (gross benefit − total cost) ÷ total cost.",
  },
  "churn-rate-calculator": {
    fields: [field("start", "Customers at period start", 1000, 1), field("lost", "Customers lost", 45), field("added", "New customers (context)", 70)],
    calculate: (v) => { positive(v.start, "Starting customers"); const churn = v.lost / v.start * 100; return [{ label: "Churn rate", value: percent(churn) }, { label: "Retention rate", value: percent(100 - churn) }, { label: "Ending customers", value: number(v.start - v.lost + v.added, 0) }, { label: "Net change", value: number(v.added - v.lost, 0) }]; },
    note: "Standard logo churn uses customers lost ÷ customers at the beginning of the period.",
  },
  "crm-roi-calculator": {
    fields: [field("revenue", "Annual incremental revenue", 120000), field("margin", "Gross margin (%)", 65), field("cost", "Annual CRM cost", 24000), field("implementation", "One-time implementation", 15000)],
    calculate: (v) => { const profit = v.revenue * v.margin / 100; const cost = v.cost + v.implementation; return [{ label: "Incremental gross profit", value: money(profit) }, { label: "Total first-year cost", value: money(cost) }, { label: "Net benefit", value: money(profit - cost) }, { label: "First-year ROI", value: percent(roi(profit, cost)) }]; },
    note: "Uses incremental revenue and gross margin rather than treating all revenue as benefit.",
  },
  "cac-calculator": {
    fields: [field("marketing", "Marketing spend", 30000), field("sales", "Sales spend", 20000), field("customers", "New customers", 250, 1)],
    calculate: (v) => { positive(v.customers, "New customers"); const total = v.marketing + v.sales; return [{ label: "CAC", value: money(total / v.customers) }, { label: "Total acquisition spend", value: money(total) }, { label: "Marketing share", value: percent(total ? v.marketing / total * 100 : 0) }, { label: "Customers", value: number(v.customers, 0) }]; },
    note: "CAC = total sales and marketing spend ÷ new customers acquired.",
  },
  "ltv-calculator": {
    fields: [field("arpu", "Monthly revenue per customer", 100), field("margin", "Gross margin (%)", 75), field("churn", "Monthly churn (%)", 3, 0.01, 0.1)],
    calculate: (v) => { positive(v.churn, "Churn rate"); const lifetime = 1 / (v.churn / 100); const ltv = v.arpu * v.margin / 100 * lifetime; return [{ label: "Estimated LTV", value: money(ltv) }, { label: "Implied lifetime", value: `${number(lifetime, 1)} months` }, { label: "Monthly gross profit", value: money(v.arpu * v.margin / 100) }, { label: "Annualized ARPU", value: money(v.arpu * 12) }]; },
    note: "Simple LTV = ARPU × gross margin ÷ monthly churn. It assumes stable churn.",
  },
  "discount-calculator": {
    fields: [field("price", "Original price", 100), field("discount", "Discount (%)", 20), field("tax", "Tax after discount (%)", 0)],
    calculate: (v) => { const saving = v.price * v.discount / 100; const discounted = v.price - saving; const tax = discounted * v.tax / 100; return [{ label: "Discount amount", value: money(saving) }, { label: "Price after discount", value: money(discounted) }, { label: "Tax", value: money(tax) }, { label: "Final price", value: money(discounted + tax) }]; },
    note: "Tax is applied after the discount.",
  },
  "employee-hours-saved-calculator": {
    fields: [field("employees", "Employees", 20, 1), field("tasks", "Tasks per employee/week", 15), field("minutes", "Minutes saved per task", 8), field("weeks", "Working weeks/year", 48), field("rate", "Loaded hourly cost", 35)],
    calculate: (v) => { const hours = v.employees * v.tasks * v.minutes / 60 * v.weeks; return [{ label: "Hours saved/year", value: number(hours, 1) }, { label: "Labor value/year", value: money(hours * v.rate) }, { label: "Hours saved/month", value: number(hours / 12, 1) }, { label: "Per employee/year", value: `${number(hours / Math.max(v.employees, 1), 1)} hours` }]; },
    note: "Shows capacity value, not guaranteed cash savings.",
  },
  "freelance-rate-calculator": {
    fields: [field("income", "Desired annual take-home", 70000), field("expenses", "Annual business expenses", 12000), field("tax", "Tax reserve (%)", 25), field("hours", "Billable hours/year", 1200, 1)],
    calculate: (v) => { positive(v.hours, "Billable hours"); const preTax = (v.income + v.expenses) / Math.max(1 - v.tax / 100, 0.01); return [{ label: "Minimum hourly rate", value: money(preTax / v.hours) }, { label: "Required annual revenue", value: money(preTax) }, { label: "Tax reserve", value: money(preTax * v.tax / 100) }, { label: "Monthly revenue target", value: money(preTax / 12) }]; },
    note: "Does not include profit buffer or unpaid scope changes; add those to your quoted rate.",
  },
  "llm-token-cost-calculator": {
    fields: [field("input", "Input tokens", 1000000), field("inputPrice", "Input price per 1M tokens", 2.5, 0, 0.01), field("output", "Output tokens", 250000), field("outputPrice", "Output price per 1M tokens", 10, 0, 0.01), field("runs", "Number of runs", 1, 1)],
    calculate: (v) => { const input = v.input / 1_000_000 * v.inputPrice * v.runs; const output = v.output / 1_000_000 * v.outputPrice * v.runs; return [{ label: "Input cost", value: money(input) }, { label: "Output cost", value: money(output) }, { label: "Total cost", value: money(input + output) }, { label: "Average per run", value: money((input + output) / Math.max(v.runs, 1)) }]; },
    note: "Enter pricing from your provider; ToolHub does not assume current model prices.",
  },
  "ltv-cac-ratio-calculator": {
    fields: [field("ltv", "Customer lifetime value", 1200), field("cac", "Customer acquisition cost", 350, 0.01)],
    calculate: (v) => { positive(v.cac, "CAC"); const ratio = v.ltv / v.cac; return [{ label: "LTV:CAC", value: `${number(ratio, 2)}:1` }, { label: "LTV", value: money(v.ltv) }, { label: "CAC", value: money(v.cac) }, { label: "Difference", value: money(v.ltv - v.cac) }]; },
    note: "Interpret the ratio with payback time, margin and retention—not as a standalone health score.",
  },
  "manual-vs-automated-costs": {
    fields: [field("hours", "Manual hours/month", 160), field("rate", "Hourly cost", 30), field("setup", "Automation setup", 10000), field("monthly", "Automation monthly cost", 600), field("months", "Comparison months", 12, 1)],
    calculate: (v) => { const manual = v.hours * v.rate * v.months; const automated = v.setup + v.monthly * v.months; return [{ label: "Manual total", value: money(manual) }, { label: "Automated total", value: money(automated) }, { label: "Difference", value: money(manual - automated) }, { label: "Break-even", value: v.hours * v.rate > v.monthly ? `${number(v.setup / (v.hours * v.rate - v.monthly), 1)} months` : "No break-even" }]; },
    note: "Break-even assumes monthly volumes and costs remain constant.",
  },
  "marketing-roi-calculator": {
    fields: [field("spend", "Campaign spend", 10000), field("revenue", "Attributed revenue", 32000), field("margin", "Gross margin (%)", 65)],
    calculate: (v) => { const profit = v.revenue * v.margin / 100; return [{ label: "ROAS", value: `${number(v.spend ? v.revenue / v.spend : 0, 2)}×` }, { label: "Gross profit", value: money(profit) }, { label: "Net return", value: money(profit - v.spend) }, { label: "Marketing ROI", value: percent(roi(profit, v.spend)) }]; },
    note: "Marketing ROI uses gross profit after margin, while ROAS uses attributed revenue.",
  },
  "mobile-app-cost-calculator": {
    fields: [field("features", "Feature count", 12, 1), field("hours", "Average hours per feature", 60), field("rate", "Delivery rate/hour", 100), field("design", "Design and discovery", 12000), field("contingency", "Contingency (%)", 15)],
    calculate: (v) => { const delivery = v.features * v.hours * v.rate + v.design; const contingency = delivery * v.contingency / 100; return [{ label: "Delivery estimate", value: money(delivery) }, { label: "Contingency", value: money(contingency) }, { label: "Estimated total", value: money(delivery + contingency) }, { label: "Estimated hours", value: number(v.features * v.hours, 0) }]; },
    note: "A scope-based estimate only; platform, integrations and nonfunctional requirements can materially change cost.",
  },
  "mrr-arr-calculator": {
    fields: [field("customers", "Paying customers", 500), field("arpu", "Monthly revenue per customer", 80), field("monthlyChurn", "Monthly churn (%)", 3)],
    calculate: (v) => { const mrr = v.customers * v.arpu; return [{ label: "MRR", value: money(mrr) }, { label: "ARR", value: money(mrr * 12) }, { label: "Monthly revenue at risk", value: money(mrr * v.monthlyChurn / 100) }, { label: "Customers", value: number(v.customers, 0) }]; },
    note: "ARR is MRR × 12 and excludes one-time revenue.",
  },
  "profit-margin-calculator": {
    fields: [field("revenue", "Revenue", 10000), field("cost", "Cost of goods/services", 6500)],
    calculate: (v) => { positive(v.revenue, "Revenue"); const profit = v.revenue - v.cost; return [{ label: "Gross profit", value: money(profit) }, { label: "Margin", value: percent(profit / v.revenue * 100) }, { label: "Markup", value: percent(v.cost ? profit / v.cost * 100 : 0) }, { label: "Cost", value: money(v.cost) }]; },
    note: "Margin is profit ÷ revenue; markup is profit ÷ cost.",
  },
  "repetitive-task-cost-estimator": {
    fields: [field("times", "Occurrences per week", 100), field("minutes", "Minutes per occurrence", 6), field("rate", "Hourly labor cost", 30), field("weeks", "Working weeks/year", 48)],
    calculate: (v) => { const hours = v.times * v.minutes / 60 * v.weeks; return [{ label: "Annual hours", value: number(hours, 1) }, { label: "Annual labor cost", value: money(hours * v.rate) }, { label: "Monthly average", value: money(hours * v.rate / 12) }, { label: "Weekly hours", value: number(v.times * v.minutes / 60, 1) }]; },
    note: "Values time consumed; it does not assume all capacity can be removed as cash cost.",
  },
  "rule-of-40-calculator": {
    fields: [field("growth", "Annual revenue growth (%)", 30, -100), field("margin", "Profit margin (%)", 12, -100)],
    calculate: (v) => { const score = v.growth + v.margin; return [{ label: "Rule of 40 score", value: percent(score) }, { label: "Growth", value: percent(v.growth) }, { label: "Profit margin", value: percent(v.margin) }, { label: "Distance from 40", value: `${number(score - 40)} points` }]; },
    note: "Rule of 40 = annual growth rate + profit margin. The appropriate profit metric should be chosen consistently.",
  },
  "saas-mvp-scope-cost-estimator": {
    fields: [field("features", "Core features", 8, 1), field("hours", "Hours per feature", 50), field("rate", "Delivery rate/hour", 110), field("foundation", "Foundation and launch work", 15000), field("contingency", "Contingency (%)", 20)],
    calculate: (v) => { const scope = v.features * v.hours * v.rate + v.foundation; const contingency = scope * v.contingency / 100; return [{ label: "Core scope", value: money(scope) }, { label: "Contingency", value: money(contingency) }, { label: "Estimated total", value: money(scope + contingency) }, { label: "Feature effort", value: `${number(v.features * v.hours, 0)} hours` }]; },
    note: "Use for early planning, then replace feature averages with estimated user stories.",
  },
  "startup-valuation-calculator": {
    fields: [field("arr", "Annual recurring revenue", 1000000), field("multiple", "Revenue multiple", 6, 0, 0.1), field("debt", "Debt", 0), field("cash", "Cash", 0)],
    calculate: (v) => { const enterprise = v.arr * v.multiple; return [{ label: "Enterprise value", value: money(enterprise) }, { label: "Equity value", value: money(enterprise - v.debt + v.cash) }, { label: "ARR multiple", value: `${number(v.multiple, 1)}×` }, { label: "Net debt", value: money(v.debt - v.cash) }]; },
    note: "A simple revenue-multiple scenario, not a professional valuation or investment recommendation.",
  },
  "website-cost-calculator": {
    fields: [field("pages", "Page templates", 8, 1), field("hours", "Hours per template", 12), field("rate", "Delivery rate/hour", 90), field("content", "Content and assets", 2500), field("annual", "Annual hosting and tools", 600)],
    calculate: (v) => { const build = v.pages * v.hours * v.rate + v.content; return [{ label: "Build estimate", value: money(build) }, { label: "First-year total", value: money(build + v.annual) }, { label: "Estimated hours", value: number(v.pages * v.hours, 0) }, { label: "Ongoing annual cost", value: money(v.annual) }]; },
    note: "Does not include unknown integrations, migrations, compliance or custom application behavior.",
  },
};

export function calculate(spec: CalculatorSpec, raw: Record<string, string>): CalculationResult[] {
  const values: Record<string, number> = {};
  for (const item of spec.fields) {
    if (raw[item.key] === undefined || raw[item.key].trim() === "") throw new Error(`${item.label} must be a valid number.`);
    const value = Number(raw[item.key]);
    if (!Number.isFinite(value)) throw new Error(`${item.label} must be a valid number.`);
    if (item.min !== undefined && value < item.min) throw new Error(`${item.label} must be at least ${item.min}.`);
    values[item.key] = value;
  }
  return spec.calculate(values);
}

export function sentenceSummary(text: string, limit = 3): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()) ?? [clean];
  const words = clean.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const frequency = new Map<string, number>();
  const stop = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "is", "are", "was", "were", "with", "that", "this", "it", "as", "at", "be", "by"]);
  for (const word of words) if (!stop.has(word) && word.length > 2) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  return sentences
    .map((sentence, index) => ({ sentence, index, score: (sentence.toLowerCase().match(/[a-z0-9']+/g) ?? []).reduce((sum, word) => sum + (frequency.get(word) ?? 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence)
    .join(" ");
}

export function keywordDensity(text: string, keyword: string) {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const phrase = keyword.trim().toLowerCase();
  if (!phrase) return { count: 0, words: words.length, density: 0 };
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = (text.toLowerCase().match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length;
  return { count, words: words.length, density: words.length ? count / words.length * 100 : 0 };
}
