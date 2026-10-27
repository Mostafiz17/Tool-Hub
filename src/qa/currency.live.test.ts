import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/currency/route";

describe("LIVE integration | Currency Converter", () => {
  it("retrieves a real USD/EUR rate through the production route", async () => {
    const response = await GET(new Request("http://localhost/api/currency?from=USD&to=EUR&amount=10"));
    const body = await response.json();
    expect(response.status, body.error).toBe(200);
    expect(body).toMatchObject({ from: "USD", to: "EUR", amount: 10 });
    expect(body.rate).toBeGreaterThan(0);
    expect(body.result).toBeCloseTo(body.rate * 10, 10);
    expect(body.source).toContain("open.er-api.com");
    expect(Number.isNaN(new Date(body.updated).getTime())).toBe(false);
  }, 15_000);
});
