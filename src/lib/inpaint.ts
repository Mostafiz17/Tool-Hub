/**
 * Browser-side masked image healing.
 * Propagates colour from the unmasked boundary into a painted region, using
 * inverse-distance weighted neighbouring pixels (a small-radius diffusion
 * inpainting technique). It is deliberately honest: it cannot invent detail,
 * and works best for small marks over smooth/repeating backgrounds.
 */
export type InpaintProgress = (filledPixels: number, selectedPixels: number) => void;

export async function inpaintMaskedPixels(
  width: number,
  height: number,
  source: Uint8ClampedArray,
  mask: Uint8Array,
  sampleRadius = 4,
  onProgress?: InpaintProgress,
): Promise<Uint8ClampedArray> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error("Image dimensions must be positive integers.");
  }
  const pixelCount = width * height;
  if (source.length !== pixelCount * 4 || mask.length !== pixelCount) {
    throw new Error("Image data and selection mask dimensions do not match.");
  }

  const output = new Uint8ClampedArray(source);
  const filled = new Uint8Array(pixelCount);
  const queued = new Uint8Array(pixelCount);
  const radius = Math.max(1, Math.min(8, Math.round(sampleRadius)));
  let selectedPixels = 0;
  let frontier: number[] = [];

  // Known pixels form the initial context; count the painted selection.
  for (let i = 0; i < pixelCount; i++) {
    if (mask[i]) selectedPixels++;
    else filled[i] = 1;
  }
  if (selectedPixels === 0) return output;
  if (selectedPixels > 1_500_000) {
    throw new Error("That selection is too large to heal safely in the browser. Clear it and select just the watermark.");
  }

  // Start at the selection edge, then work inward in small, synchronous bands.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!mask[index]) continue;
      let touchesKnown = false;
      for (let dy = -1; dy <= 1 && !touchesKnown; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && filled[ny * width + nx]) {
            touchesKnown = true;
            break;
          }
        }
      }
      if (touchesKnown) {
        frontier.push(index);
        queued[index] = 1;
      }
    }
  }

  if (frontier.length === 0) {
    throw new Error("Leave some unpainted image around the selection so it can be reconstructed.");
  }

  let completed = 0;
  let passes = 0;
  while (frontier.length > 0) {
    const next: number[] = [];
    const updates: { index: number; r: number; g: number; b: number; a: number }[] = [];

    // Bound each main-thread chunk so large selections do not block the page.
    for (let start = 0; start < frontier.length; start += 4096) {
      const end = Math.min(start + 4096, frontier.length);
      for (let fi = start; fi < end; fi++) {
        const index = frontier[fi];
        const x = index % width;
        const y = Math.floor(index / width);
        let total = 0, red = 0, green = 0, blue = 0, alpha = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const neighbour = ny * width + nx;
            if (!filled[neighbour]) continue;

            const distanceSquared = dx * dx + dy * dy;
            const weight = 1 / Math.pow(distanceSquared, 1.25);
            const rgba = neighbour * 4;
            total += weight;
            red += output[rgba] * weight;
            green += output[rgba + 1] * weight;
            blue += output[rgba + 2] * weight;
            alpha += output[rgba + 3] * weight;
          }
        }

        if (total > 0) {
          updates.push({ index, r: red / total, g: green / total, b: blue / total, a: alpha / total });
        }
      }
      // Yield between chunks to keep input and browser painting responsive.
      if (end < frontier.length) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    // Apply the whole band together to avoid scan-direction bias.
    for (const update of updates) {
      const rgba = update.index * 4;
      output[rgba] = update.r;
      output[rgba + 1] = update.g;
      output[rgba + 2] = update.b;
      output[rgba + 3] = update.a;
      filled[update.index] = 1;
      completed++;
    }

    // The next band is adjacent to this one; each selected pixel is queued once.
    for (const update of updates) {
      const x = update.index % width;
      const y = Math.floor(update.index / width);
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const neighbour = ny * width + nx;
          if (mask[neighbour] && !queued[neighbour]) {
            queued[neighbour] = 1;
            next.push(neighbour);
          }
        }
      }
    }

    frontier = next;
    passes++;
    onProgress?.(completed, selectedPixels);
    // Let the browser paint progress updates and handle input on large repairs.
    if (passes % 4 === 0 && frontier.length > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  if (completed !== selectedPixels) {
    throw new Error("Some selected pixels could not be reconstructed. Try a smaller selection away from the image edge.");
  }
  return output;
}
