import { expect, test } from "@playwright/test";

test.describe("expanded tool workflows", () => {
  test("calculates a discounted price and validates negative values", async ({ page }) => {
    await page.goto("/tools/discount-calculator");
    await expect(page.getByRole("heading", { level: 1, name: "Discount Calculator" })).toBeVisible();
    const fields = page.locator('input[type="number"]');
    await fields.nth(0).fill("100");
    await fields.nth(1).fill("20");
    await fields.nth(2).fill("10");
    await expect(page.getByText("$88.00")).toBeVisible();
    await fields.nth(0).fill("-1");
    await expect(page.getByRole("region", { name: "Discount Calculator workspace" }).getByRole("alert")).toContainText("at least 0");
  });

  test("generates valid FAQ schema from supplied pairs", async ({ page }) => {
    await page.goto("/tools/faq-schema-generator");
    await page.locator("textarea").first().fill("What is ToolHub?|A local collection of tools.\nIs it useful?|Yes.");
    await expect(page.locator("pre")).toContainText('"@type": "FAQPage"');
    await expect(page.locator("pre")).toContainText("What is ToolHub?");
  });

  test("labels deterministic writing and unavailable engine workflows accurately", async ({ page }) => {
    await page.goto("/tools/ai-cold-email-generator");
    await expect(page.getByText(/Rule-based local generator/)).toBeVisible();
    await page.locator("textarea").first().fill("Bookkeeping service");
    await page.locator("textarea").nth(1).fill("Small retailers");
    await page.getByRole("button", { name: "Generate locally" }).click();
    await expect(page.locator("pre")).toContainText("AI Cold Email Generator");

    await page.goto("/tools/image-to-text-ocr");
    await expect(page.getByText("Integration required")).toBeVisible();
    await expect(page.getByText(/intentionally blocked/)).toBeVisible();
  });
});
