import { expect, test, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makePng(width: number, height: number, variant = 0): Buffer {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    scanlines[row] = 0;
    for (let x = 0; x < width; x++) {
      const offset = row + 1 + x * 4;
      const isMark = variant === 2 && x >= width / 2 - 5 && x <= width / 2 + 5 && y >= height / 2 - 3 && y <= height / 2 + 3;
      const transparent = variant === 1 && x < width / 4 && y < height / 4;
      scanlines[offset] = isMark ? 0 : (70 + x * 3 + variant * 17) % 256;
      scanlines[offset + 1] = isMark ? 0 : (110 + y * 4 + variant * 11) % 256;
      scanlines[offset + 2] = isMark ? 0 : (160 + x + y) % 256;
      scanlines[offset + 3] = transparent ? 0 : 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const imageFile = (name: string, width: number, height: number, variant = 0) => ({
  name,
  mimeType: "image/png",
  buffer: makePng(width, height, variant),
});

const oversizedImage = { name: "oversized.png", mimeType: "image/png", buffer: Buffer.alloc(15 * 1024 * 1024 + 1) };

async function downloadBytes(download: Download): Promise<Buffer> {
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path!);
}

async function decodeImage(page: Page, bytes: Buffer, mime: string, x = 0, y = 0) {
  return page.evaluate(async ({ values, type, sampleX, sampleY }) => {
    const blob = new Blob([new Uint8Array(values)], { type });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas context unavailable");
    context.drawImage(bitmap, 0, 0);
    const pixel = [...context.getImageData(sampleX, sampleY, 1, 1).data];
    return { width: bitmap.width, height: bitmap.height, pixel };
  }, { values: [...bytes], type: mime, sampleX: x, sampleY: y });
}

function expectSignature(bytes: Buffer, type: "png" | "jpeg" | "webp") {
  if (type === "png") expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  if (type === "jpeg") expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  if (type === "webp") {
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  }
}

async function expectNoImageValidationBypass(page: Page, label: string) {
  await page.getByLabel(label).setInputFiles(oversizedImage);
  await expect(page.locator('p[role="alert"]')).toContainText("larger than 15 MB");
}

test.describe("Countdown Timer", () => {
  test("ticks to expiration in the real browser and handles an already-expired target", async ({ page }) => {
    await page.goto("/tools/countdown");
    await page.clock.install({ time: new Date("2026-10-27T10:00:00") });
    const input = page.locator('input[type="datetime-local"]');
    await input.fill("2026-10-27T10:00:30");
    await expect(page.getByText("Time's up!")).toBeHidden();
    await expect(page.getByText("Seconds")).toBeVisible();
    await page.clock.fastForward("00:00:31");
    await expect(page.getByText("Time's up!")).toBeVisible();
    await input.fill("2026-10-27T09:59");
    await expect(page.getByText("The target moment has passed.")).toBeVisible();
  });
});

test.describe("Image Compressor", () => {
  test("validates input, compresses in canvas, previews, and downloads real WebP output", async ({ page }) => {
    await page.goto("/tools/image-compressor");
    await expectNoImageValidationBypass(page, "Drop an image to compress");
    await page.getByLabel("Drop an image to compress").setInputFiles(imageFile("compress-source.png", 64, 48));
    await expect(page.getByAltText("Original upload preview")).toBeVisible();
    await page.locator("select").selectOption("image/webp");
    await page.getByLabel("Compression quality").fill("0.55");
    await page.getByRole("button", { name: "Compress image" }).click();
    await expect(page.getByAltText("Compressed result preview")).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download compressed image" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("compressed.webp");
    const bytes = await downloadBytes(download);
    expectSignature(bytes, "webp");
    expect(await decodeImage(page, bytes, "image/webp")).toMatchObject({ width: 64, height: 48 });
  });
});

test.describe("Image Resizer", () => {
  test("validates input, locks aspect ratio, resizes, previews, and downloads matching PNG output", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await expectNoImageValidationBypass(page, "Drop an image to resize");
    await page.getByLabel("Drop an image to resize").setInputFiles(imageFile("resize-source.png", 64, 48));
    await expect(page.getByText(/Original: 64 × 48px/)).toBeVisible();
    const dimensions = page.locator('input[type="number"]');
    await dimensions.nth(0).fill("32");
    await expect(dimensions.nth(1)).toHaveValue("24");
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await expect(page.getByAltText("Resized result")).toBeVisible();
    await expect(page.getByText(/32 × 24px/)).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download resized image" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("resized-32x24.png");
    const bytes = await downloadBytes(download);
    expectSignature(bytes, "png");
    expect(await decodeImage(page, bytes, "image/png")).toMatchObject({ width: 32, height: 24 });
  });

  test("supports unlocked dimensions and disables invalid zero-size processing", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await page.getByLabel("Drop an image to resize").setInputFiles(imageFile("resize-unlocked.png", 64, 48));
    await expect(page.getByText(/Original: 64 × 48px/)).toBeVisible();
    await page.getByText("Lock aspect ratio").click();
    const dimensions = page.locator('input[type="number"]');
    await dimensions.nth(0).fill("20");
    await dimensions.nth(1).fill("10");
    await expect(page.getByRole("button", { name: "Resize", exact: true })).toBeEnabled();
    await dimensions.nth(0).fill("0");
    await expect(page.getByRole("button", { name: "Resize", exact: true })).toBeDisabled();
  });
});

test.describe("Image Format Converter", () => {
  test("validates input and genuinely converts transparent PNG to PNG, JPEG, and WebP downloads", async ({ page }) => {
    await page.goto("/tools/image-converter");
    await expectNoImageValidationBypass(page, "Drop an image to convert");
    await page.getByLabel("Drop an image to convert").setInputFiles(imageFile("transparent-source.png", 64, 48, 1));
    await expect(page.getByAltText("Upload preview")).toBeVisible();
    const select = page.locator("select");

    for (const format of [
      { mime: "image/png", ext: "png", signature: "png" as const },
      { mime: "image/jpeg", ext: "jpg", signature: "jpeg" as const },
      { mime: "image/webp", ext: "webp", signature: "webp" as const },
    ]) {
      await select.selectOption(format.mime);
      const link = page.getByRole("link", { name: new RegExp(`Download \\.${format.ext}`) });
      const oldHref = await link.count() ? await link.getAttribute("href") : null;
      await page.getByRole("button", { name: "Convert", exact: true }).click();
      await expect(link).toBeVisible();
      if (oldHref) await expect.poll(() => link.getAttribute("href")).not.toBe(oldHref);
      const downloadEvent = page.waitForEvent("download");
      await link.click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toBe(`converted.${format.ext}`);
      const bytes = await downloadBytes(download);
      expectSignature(bytes, format.signature);
      const decoded = await decodeImage(page, bytes, format.mime);
      expect(decoded).toMatchObject({ width: 64, height: 48 });
      if (format.mime === "image/png") expect(decoded.pixel[3]).toBe(0);
      if (format.mime === "image/jpeg") expect(decoded.pixel.slice(0, 3).every((channel) => channel >= 248)).toBe(true);
    }
  });
});

test.describe("Images to PDF", () => {
  test("validates input, previews/reorders images, and downloads a valid two-page PDF", async ({ page }) => {
    await page.goto("/tools/images-to-pdf");
    await page.getByLabel("Add images for PDF").setInputFiles(oversizedImage);
    await expect(page.locator('p[role="alert"]')).toContainText("larger than 15 MB");
    await page.getByLabel("Add images for PDF").setInputFiles([
      imageFile("first.png", 64, 48, 0),
      imageFile("second.png", 32, 40, 1),
    ]);
    await expect(page.getByText("1. first.png")).toBeVisible();
    await expect(page.getByText("2. second.png")).toBeVisible();
    await page.getByRole("button", { name: "Move down" }).first().click();
    await expect(page.getByText("1. second.png")).toBeVisible();
    await expect(page.getByText("2. first.png")).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate PDF (2 pages)" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("toolhub-images.pdf");
    const bytes = await downloadBytes(download);
    expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(bytes.subarray(-20).toString("latin1")).toContain("%%EOF");
    expect((bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? [])).toHaveLength(2);
  });

  test("removes an uploaded page and updates the generated page count", async ({ page }) => {
    await page.goto("/tools/images-to-pdf");
    await page.getByLabel("Add images for PDF").setInputFiles([
      imageFile("keep.png", 20, 20),
      imageFile("remove.png", 20, 20, 1),
    ]);
    await page.getByRole("button", { name: "Remove remove.png" }).click();
    await expect(page.getByText("remove.png")).toBeHidden();
    await expect(page.getByRole("button", { name: "Generate PDF (1 page)" })).toBeVisible();
  });
});

test.describe("Watermark Remover", () => {
  test("validates upload, supports paint/erase and keyboard masks, processes pixels, restores, and exports PNG", async ({ page }) => {
    await page.goto("/tools/watermark-remover");
    await expectNoImageValidationBypass(page, "Choose an image with a mark to remove");
    await page.getByLabel("Choose an image with a mark to remove").setInputFiles(imageFile("marked.png", 64, 48, 2));
    const stage = page.getByRole("application");
    await expect(stage).toBeVisible();
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    await page.getByLabel("Brush size").fill("14");
    await stage.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
    await expect(page.getByRole("button", { name: "Clear selection" })).toBeEnabled();
    await page.getByRole("button", { name: "Erase" }).click();
    await stage.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
    await expect(page.getByRole("button", { name: "Clear selection" })).toBeDisabled();

    await page.getByRole("button", { name: "Paint" }).click();
    await stage.focus();
    await stage.press("Enter");
    await expect(page.getByRole("button", { name: "Remove selected mark" })).toBeEnabled();
    await page.getByRole("button", { name: "Remove selected mark" }).click();
    await expect(page.getByRole("button", { name: "Download edited image" })).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download edited image" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("marked-edited.png");
    const bytes = await downloadBytes(download);
    expectSignature(bytes, "png");
    const decoded = await decodeImage(page, bytes, "image/png", 32, 24);
    expect(decoded).toMatchObject({ width: 64, height: 48 });
    expect(decoded.pixel.slice(0, 3)).not.toEqual([0, 0, 0]);

    await page.getByRole("button", { name: "Restore original" }).click();
    await expect(page.getByRole("button", { name: "Download edited image" })).toBeHidden();
  });
});
