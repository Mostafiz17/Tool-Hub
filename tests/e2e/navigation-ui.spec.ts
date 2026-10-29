import { expect, test } from "@playwright/test";

test.describe("ToolHub discovery and navigation", () => {
  test("searches from the homepage and opens a matching tool with the keyboard", async ({ page }) => {
    await page.goto("/");

    const search = page.getByRole("combobox", { name: "Search tools" }).first();
    await search.fill("JSON formatter");
    await expect(page.getByRole("option", { name: /JSON Formatter & Validator/i }).first()).toBeVisible();
    await search.press("ArrowDown");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/tools\/json-formatter$/);
    await expect(page.getByRole("heading", { level: 1, name: "JSON Formatter & Validator" })).toBeVisible();
  });

  test("filters the catalog and restores the complete result set", async ({ page }) => {
    await page.goto("/tools");

    await page.getByRole("button", { name: "Text Tools" }).click();
    await expect(page.getByText(/Showing 5 of 121 tools/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Word & Character Counter" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Basic Calculator" })).toHaveCount(0);

    await page.getByRole("button", { name: /Reset filters/i }).click();
    await expect(page.getByText(/Showing 121 of 121 tools/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Basic Calculator" })).toBeVisible();
  });

  test("pins and removes a favorite through the real UI", async ({ page }) => {
    await page.goto("/tools");

    await page.getByRole("button", { name: "Save Basic Calculator to favorites" }).click();
    await page.goto("/favorites");
    await expect(page.getByRole("heading", { name: "Basic Calculator" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Basic Calculator" })).toBeVisible();
    await page.getByRole("button", { name: "Remove Basic Calculator from favorites" }).click();
    await expect(page.getByRole("heading", { name: "No favorite tools yet" })).toBeVisible();
  });

  test("keeps primary routes free of horizontal overflow at target widths", async ({ page }) => {
    const cases = [
      { width: 1440, height: 900, path: "/" },
      { width: 1280, height: 800, path: "/tools" },
      { width: 768, height: 900, path: "/categories" },
      { width: 390, height: 844, path: "/tools/calculator" },
      { width: 320, height: 700, path: "/favorites" },
    ];

    for (const item of cases) {
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.goto(item.path);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `${item.path} at ${item.width}px`).toBeLessThanOrEqual(dimensions.viewport);
    }
  });

  test("exposes the full navigation menu on a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile Navigation" });
    await expect(mobileNav.getByRole("link", { name: "All Tools" })).toBeVisible();
    await mobileNav.getByRole("link", { name: "Categories" }).click();
    await expect(page).toHaveURL(/\/categories$/);
  });

  test("reveals tool cards once, responds to hover, and respects reduced motion", async ({ page }) => {
    await page.goto("/tools");
    const card = page.locator(".tool-card").first();
    await expect(card).toHaveClass(/is-revealed|is-visible/);
    await card.hover();
    await expect.poll(() => card.evaluate((node) => getComputedStyle(node).transform)).not.toBe("none");
    await expect.poll(() => card.locator(".tool-card-activity").evaluate((node) => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.locator(".hero").evaluate((node) => getComputedStyle(node, "::before").animationDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  });

  test("makes full tool and category card surfaces clickable without breaking independent actions", async ({ page }) => {
    const clickSurface = async (locator: import("@playwright/test").Locator) => {
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    };
    const openCalculatorCard = async () => {
      await page.goto("/tools");
      return page.locator(".tool-card").filter({ has: page.getByRole("heading", { name: "Basic Calculator" }) });
    };

    let card = await openCalculatorCard();
    await clickSurface(card.locator(".tool-card-icon"));
    await expect(page).toHaveURL(/\/tools\/calculator$/);

    card = await openCalculatorCard();
    await clickSurface(card.getByText(/Add, subtract, multiply/));
    await expect(page).toHaveURL(/\/tools\/calculator$/);

    card = await openCalculatorCard();
    await card.getByRole("link", { name: "Open Basic Calculator" }).click();
    await expect(page).toHaveURL(/\/tools\/calculator$/);

    card = await openCalculatorCard();
    await card.scrollIntoViewIfNeeded();
    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.click(bounds!.x + bounds!.width - 18, bounds!.y + bounds!.height - 18);
    await expect(page).toHaveURL(/\/tools\/calculator$/);

    card = await openCalculatorCard();
    await card.getByRole("button", { name: /Save Basic Calculator to favorites|Remove Basic Calculator from favorites/ }).click();
    await expect(page).toHaveURL(/\/tools$/);

    await page.goto("/");
    const dashboardCategory = page.locator(".dashboard-category-card").filter({ has: page.getByRole("heading", { name: "Calculators & Dates" }) });
    await clickSurface(dashboardCategory.getByText(/Everyday math/));
    await expect(page).toHaveURL(/\/categories\/calculators$/);

    await page.goto("/");
    await page.locator(".dashboard-category-card").filter({ has: page.getByRole("heading", { name: "Calculators & Dates" }) }).getByRole("link", { name: "View all Calculators & Dates tools" }).click();
    await expect(page).toHaveURL(/\/categories\/calculators$/);

    await page.goto("/");
    await page.locator(".dashboard-category-card").filter({ has: page.getByRole("heading", { name: "Calculators & Dates" }) }).getByRole("link", { name: "Basic Calculator" }).click();
    await expect(page).toHaveURL(/\/tools\/calculator$/);

    await page.goto("/");
    const categoryOverlay = page.locator(".dashboard-category-card").filter({ has: page.getByRole("heading", { name: "Calculators & Dates" }) }).getByRole("link", { name: "Open Calculators & Dates category" });
    await categoryOverlay.focus();
    await categoryOverlay.press("Enter");
    await expect(page).toHaveURL(/\/categories\/calculators$/);

    await page.goto("/categories");
    const directoryCard = page.locator(".category-card").filter({ has: page.getByRole("heading", { name: "Calculators & Dates" }) });
    await expect(directoryCard).toBeVisible();
    await clickSurface(directoryCard.getByText(/Everyday math/));
    await expect(page).toHaveURL(/\/categories\/calculators$/);
  });
});
