"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Brush, Eraser, RotateCcw, Download } from "lucide-react";
import { formatBytes, validateImageFile } from "@/lib/logic";
import { inpaintMaskedPixels } from "@/lib/inpaint";
import { DownloadButton, ErrorBox, Field } from "./ui";

function useImageFile() {
  const [file, setFile] = useState<File | null>(null); const [url, setUrl] = useState(""); const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const load = (f: File | undefined | null) => {
    if (!f) return; const e = validateImageFile(f); if (e) { setErr(e); return; }
    setErr(""); setFile(f); setUrl(URL.createObjectURL(f));
  };
  return { file, url, err, setErr, load, drag, setDrag };
}
function Drop({ onFile, drag, setDrag, label }: { onFile: (f: File | undefined) => void; drag: boolean; setDrag: (b: boolean) => void; label: string }) {
  return (
    <label className={`drop block ${drag ? "drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}>
      <ImagePlus className="mx-auto mb-2" size={30} style={{ color: "var(--primary)" }} />
      <span className="font-semibold text-sm">{label}</span>
      <span className="block hint">Click to browse, or drag & drop. Max 15 MB. Processed locally — never uploaded.</span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0] ?? undefined); e.currentTarget.value = ""; }} aria-label={label} />
    </label>
  );
}
function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src; }); }
async function renderToBlob(url: string, w: number, h: number, type: string, quality: number): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (type === "image/jpeg") { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Browser could not encode this format")), type, quality));
}
const ext = (type: string) => type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

export function ImageCompressorTool() {
  const f = useImageFile(); const [quality, setQuality] = useState(0.8); const [type, setType] = useState("image/jpeg");
  const [out, setOut] = useState<{ url: string; size: number } | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  const run = async () => {
    if (!f.url || !f.file) return; setBusy(true);
    try { const img = await loadImage(f.url); const blob = await renderToBlob(f.url, img.naturalWidth, img.naturalHeight, type, quality); setOut({ url: URL.createObjectURL(blob), size: blob.size }); }
    catch { f.setErr("Compression failed — try a different format."); } finally { setBusy(false); }
  };
  return (
    <div>
      <ErrorBox msg={f.err} />
      {!f.file ? <Drop onFile={f.load} drag={f.drag} setDrag={f.setDrag} label="Drop an image to compress" /> : (
        <div>
          <div className="grid md:grid-cols-2 gap-5">
            <figure><img src={f.url} alt="Original upload preview" className="rounded-xl border max-h-72 w-full object-contain" style={{ borderColor: "var(--border)" }} /><figcaption className="text-sm muted mt-2">Original · {formatBytes(f.file.size)} · {f.file.name}</figcaption></figure>
            {out ? <figure><img src={out.url} alt="Compressed result preview" className="rounded-xl border max-h-72 w-full object-contain" style={{ borderColor: "var(--border)" }} />
              <figcaption className="text-sm mt-2">Compressed · <b>{formatBytes(out.size)}</b> · <span style={{ color: out.size < f.file.size ? "var(--success)" : "var(--warning)" }}>{out.size < f.file.size ? `${Math.round((1 - out.size / f.file.size) * 100)}% smaller` : "not smaller — try lower quality or WebP"}</span></figcaption></figure>
              : <div className="output-box grid place-items-center text-sm muted min-h-40">Compressed preview appears here</div>}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-5 items-end">
            <Field label={`Quality: ${Math.round(quality * 100)}%`}><input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" aria-label="Compression quality" /></Field>
            <Field label="Output format"><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="image/jpeg">JPEG (smallest for photos)</option><option value="image/webp">WebP (modern)</option><option value="image/png">PNG (no quality effect)</option></select></Field>
            <button className="btn-primary" onClick={run} disabled={busy}>{busy ? "Compressing…" : "Compress image"}</button>
          </div>
          {out && <div className="mt-4"><DownloadButton href={out.url} filename={`compressed.${ext(type)}`} label="Download compressed image" /></div>}
          <p className="hint mt-2">Note: PNG ignores quality (it is lossless) — choose JPEG/WebP for real size savings.</p>
        </div>
      )}
    </div>
  );
}

export function ImageResizerTool() {
  const f = useImageFile(); const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [w, setW] = useState(0); const [h, setH] = useState(0); const [lock, setLock] = useState(true);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  const onImg = (e: React.SyntheticEvent<HTMLImageElement>) => { const { naturalWidth, naturalHeight } = e.currentTarget; setDims({ w: naturalWidth, h: naturalHeight }); setW(naturalWidth); setH(naturalHeight); };
  const changeW = (v: number) => { setW(v); if (lock && dims) setH(Math.max(1, Math.round(v * dims.h / dims.w))); };
  const changeH = (v: number) => { setH(v); if (lock && dims) setW(Math.max(1, Math.round(v * dims.w / dims.h))); };
  const outputType = f.file?.type === "image/png" ? "image/png" : "image/jpeg";
  const run = async () => { if (!f.url) return; setBusy(true); try { const blob = await renderToBlob(f.url, w, h, outputType, 0.92); setOut({ url: URL.createObjectURL(blob), size: blob.size }); } catch { f.setErr("Resize failed."); } finally { setBusy(false); } };
  return (
    <div>
      <ErrorBox msg={f.err} />
      {!f.file ? <Drop onFile={f.load} drag={f.drag} setDrag={f.setDrag} label="Drop an image to resize" /> : (
        <div>
          <img src={f.url} onLoad={onImg} alt="Upload preview" className="rounded-xl border max-h-64 object-contain" style={{ borderColor: "var(--border)" }} />
          {dims && <p className="text-sm muted mt-2">Original: {dims.w} × {dims.h}px · {formatBytes(f.file.size)}</p>}
          <div className="grid sm:grid-cols-4 gap-4 mt-4 items-end max-w-2xl">
            <Field label="Width (px)"><input className="input" type="number" min={1} max={12000} value={w} onChange={(e) => changeW(Number(e.target.value))} /></Field>
            <Field label="Height (px)"><input className="input" type="number" min={1} max={12000} value={h} onChange={(e) => changeH(Number(e.target.value))} /></Field>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer min-h-[44px]"><input type="checkbox" checked={lock} onChange={() => setLock(!lock)} /> Lock aspect ratio</label>
            <button className="btn-primary" onClick={run} disabled={busy || w < 1 || h < 1}>{busy ? "Resizing…" : "Resize"}</button>
          </div>
          <div className="flex gap-2 mt-3">{[25, 50, 75].map((p) => dims && <button key={p} className="chip" onClick={() => { changeW(Math.round(dims.w * p / 100)); }}>{p}% size</button>)}</div>
          {out && <div className="mt-5"><img src={out.url} alt="Resized result" className="rounded-xl border max-h-64 object-contain" style={{ borderColor: "var(--border)" }} /><p className="text-sm muted mt-2">{w} × {h}px · {formatBytes(out.size)}</p><div className="mt-2"><DownloadButton href={out.url} filename={`resized-${w}x${h}.${ext(outputType)}`} label="Download resized image" /></div></div>}
        </div>
      )}
    </div>
  );
}

export function ImageConverterTool() {
  const f = useImageFile(); const [type, setType] = useState("image/webp"); const [out, setOut] = useState<{ url: string; size: number } | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  const run = async () => {
    if (!f.url) return; setBusy(true);
    try { const img = await loadImage(f.url); const blob = await renderToBlob(f.url, img.naturalWidth, img.naturalHeight, type, 0.92); setOut({ url: URL.createObjectURL(blob), size: blob.size }); }
    catch { f.setErr("Conversion failed — this browser may not support that output format."); } finally { setBusy(false); }
  };
  return (
    <div>
      <ErrorBox msg={f.err} />
      {!f.file ? <Drop onFile={f.load} drag={f.drag} setDrag={f.setDrag} label="Drop an image to convert" /> : (
        <div>
          <img src={f.url} alt="Upload preview" className="rounded-xl border max-h-64 object-contain" style={{ borderColor: "var(--border)" }} />
          <p className="text-sm muted mt-2">{f.file.name} · {f.file.type || "unknown type"} · {formatBytes(f.file.size)}</p>
          <div className="flex flex-wrap items-end gap-3 mt-4">
            <div className="w-56"><Field label="Convert to"><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="image/png">PNG (keeps transparency)</option><option value="image/jpeg">JPEG (white background)</option><option value="image/webp">WebP (modern, small)</option></select></Field></div>
            <button className="btn-primary" onClick={run} disabled={busy}>{busy ? "Converting…" : "Convert"}</button>
            {out && <DownloadButton href={out.url} filename={`converted.${ext(type)}`} label={`Download .${ext(type)}`} />}
          </div>
          {out && <p className="text-sm mt-3">Result: {formatBytes(out.size)}</p>}
          <p className="hint mt-2">JPEG has no transparency — transparent pixels are flattened onto white. GIF/BMP/SVG decoding depends on your browser; PNG, JPEG and WebP are universally supported.</p>
        </div>
      )}
    </div>
  );
}

type PdfItem = { id: number; file: File; url: string };
export function ImagesToPdfTool() {
  const [items, setItems] = useState<PdfItem[]>([]); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const counter = useRef(0);
  useEffect(() => () => { items.forEach((i) => URL.revokeObjectURL(i.url)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const add = (files: FileList | null) => {
    if (!files) return; const next: PdfItem[] = [];
    for (const file of Array.from(files)) { const e = validateImageFile(file); if (e) { setErr(e); continue; } next.push({ id: ++counter.current, file, url: URL.createObjectURL(file) }); }
    if (next.length) { setErr(""); setItems((p) => [...p, ...next].slice(0, 30)); }
  };
  const move = (idx: number, dir: number) => setItems((p) => { const n = [...p]; const j = idx + dir; if (j < 0 || j >= n.length) return p; [n[idx], n[j]] = [n[j], n[idx]]; return n; });
  const remove = (id: number) => setItems((p) => { const it = p.find((x) => x.id === id); if (it) URL.revokeObjectURL(it.url); return p.filter((x) => x.id !== id); });
  const build = async () => {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt" });
      for (let i = 0; i < items.length; i++) {
        const it = items[i]; const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(it.file); });
        const img = await loadImage(dataUrl);
        const isJpeg = it.file.type === "image/jpeg";
        const data = isJpeg ? dataUrl : await (async () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d")!.drawImage(img, 0, 0); return c.toDataURL("image/jpeg", 0.92); })();
        const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
        const scale = Math.min((pw - 48) / img.naturalWidth, (ph - 48) / img.naturalHeight, 1);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        if (i > 0) pdf.addPage();
        pdf.addImage(data, "JPEG", (pw - w) / 2, (ph - h) / 2, w, h);
      }
      pdf.save("toolhub-images.pdf");
    } catch { setErr("PDF generation failed. Try fewer or smaller images."); } finally { setBusy(false); }
  };
  return (
    <div>
      <label className="drop block">
        <ImagePlus className="mx-auto mb-2" size={30} style={{ color: "var(--primary)" }} />
        <span className="font-semibold text-sm">Add images (up to 30)</span><span className="block hint">Click to browse or drag & drop multiple images. All processing is local.</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ""; }} aria-label="Add images for PDF" />
      </label>
      <div className="mt-3"><ErrorBox msg={err} /></div>
      {items.length === 0 ? <p className="hint mt-4">No images yet — add some above, then reorder them into page order.</p> : <>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {items.map((it, i) => (
            <li key={it.id} className="card overflow-hidden">
              <img src={it.url} alt={`Page ${i + 1}: ${it.file.name}`} className="h-32 w-full object-cover" />
              <div className="p-2.5"><p className="text-xs font-semibold truncate">{i + 1}. {it.file.name}</p>
                <div className="flex gap-1 mt-2">
                  <button className="btn-ghost btn-sm !px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={15} /></button>
                  <button className="btn-ghost btn-sm !px-2" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown size={15} /></button>
                  <button className="btn-ghost btn-sm !px-2" onClick={() => remove(it.id)} aria-label={`Remove ${it.file.name}`}><Trash2 size={15} /></button>
                </div></div>
            </li>
          ))}
        </ul>
        <button className="btn-primary mt-5" onClick={build} disabled={busy}>{busy ? "Building PDF…" : `Generate PDF (${items.length} page${items.length === 1 ? "" : "s"})`}</button>
      </>}
    </div>
  );
}

/**
 * Watermark Remover: the user paints the mark; a local, boundary-guided
 * inpainting pass reconstructs pixels from the surrounding image. This is
 * deliberately not presented as generative AI and works best on small marks
 * over simple/repeating backgrounds.
 */
export function WatermarkRemoverTool() {
  const f = useImageFile();
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const originalPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const workingPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const maskCountRef = useRef(0);
  const drawingRef = useRef(false);
  const previousPointRef = useRef<{ x: number; y: number } | null>(null);
  const [readyUrl, setReadyUrl] = useState("");
  const [dimensions, setDimensions] = useState<{ width: number; height: number; scaled: boolean } | null>(null);
  const [brushSize, setBrushSize] = useState(36);
  const [mode, setMode] = useState<"paint" | "erase">("paint");
  const [hasSelection, setHasSelection] = useState(false);
  const [keyboardPoint, setKeyboardPoint] = useState<{ x: number; y: number } | null>(null);
  const [showKeyboardCursor, setShowKeyboardCursor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(false);
  const [toolError, setToolError] = useState("");

  useEffect(() => {
    if (!f.url) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const maxPixels = 8_000_000;
      const sourcePixels = image.naturalWidth * image.naturalHeight;
      const scale = sourcePixels > maxPixels ? Math.sqrt(maxPixels / sourcePixels) : 1;
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      const maskContext = maskCanvas?.getContext("2d");
      if (!canvas || !maskCanvas || !context || !maskContext) {
        setToolError("Your browser could not prepare this image for editing.");
        return;
      }
      canvas.width = width;
      canvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      originalPixelsRef.current = new Uint8ClampedArray(pixels);
      workingPixelsRef.current = new Uint8ClampedArray(pixels);
      maskRef.current = new Uint8Array(width * height);
      maskCountRef.current = 0;
      maskContext.clearRect(0, 0, width, height);
      setDimensions({ width, height, scaled: scale < 1 });
      setReadyUrl(f.url);
      setHasSelection(false);
      setKeyboardPoint(null);
      setShowKeyboardCursor(false);
      setProcessed(false);
      setToolError("");
    };
    image.onerror = () => {
      if (!cancelled) setToolError("This image could not be decoded. Try a PNG, JPEG, or WebP file.");
    };
    image.src = f.url;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [f.url]);

  const clearSelection = () => {
    maskRef.current?.fill(0);
    maskCountRef.current = 0;
    const canvas = maskCanvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSelection(false);
  };

  const imagePoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!dimensions || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: Math.max(0, Math.min(dimensions.width - 1, (event.clientX - rect.left) * dimensions.width / rect.width)),
      y: Math.max(0, Math.min(dimensions.height - 1, (event.clientY - rect.top) * dimensions.height / rect.height)),
      scale: dimensions.width / rect.width,
    };
  };

  const paintSegment = (from: { x: number; y: number }, to: { x: number; y: number }, scale: number) => {
    const mask = maskRef.current;
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!mask || !canvas || !context || !dimensions) return;

    const radius = Math.max(1, brushSize * scale / 2);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.4)));
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const cx = from.x + (to.x - from.x) * t;
      const cy = from.y + (to.y - from.y) * t;
      const left = Math.max(0, Math.floor(cx - radius));
      const right = Math.min(dimensions.width - 1, Math.ceil(cx + radius));
      const top = Math.max(0, Math.floor(cy - radius));
      const bottom = Math.min(dimensions.height - 1, Math.ceil(cy + radius));
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
          const index = y * dimensions.width + x;
          if (mode === "erase") {
            if (mask[index]) { mask[index] = 0; maskCountRef.current--; }
          } else if (!mask[index]) {
            mask[index] = 1;
            maskCountRef.current++;
          }
        }
      }
    }

    context.save();
    context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = "rgba(37, 99, 235, 0.48)";
    context.fillStyle = "rgba(37, 99, 235, 0.48)";
    context.lineWidth = Math.max(2, brushSize * scale);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    if (distance < 1) {
      context.beginPath();
      context.arc(to.x, to.y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
    setHasSelection(maskCountRef.current > 0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (busy || !readyUrl) return;
    const point = imagePoint(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    previousPointRef.current = point;
    setKeyboardPoint({ x: point.x, y: point.y });
    setShowKeyboardCursor(false);
    paintSegment(point, point, point.scale);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current || busy) return;
    const point = imagePoint(event);
    const previous = previousPointRef.current;
    if (!point || !previous) return;
    setShowKeyboardCursor(false);
    paintSegment(previous, point, point.scale);
    previousPointRef.current = point;
  };

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!dimensions || busy) return;
    if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      setShowKeyboardCursor(false);
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const current = keyboardPoint ?? { x: dimensions.width / 2, y: dimensions.height / 2 };
      const step = event.shiftKey ? 30 : 8;
      const next = {
        x: Math.max(0, Math.min(dimensions.width - 1, current.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
        y: Math.max(0, Math.min(dimensions.height - 1, current.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0))),
      };
      setKeyboardPoint(next);
      setShowKeyboardCursor(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const point = keyboardPoint ?? { x: dimensions.width / 2, y: dimensions.height / 2 };
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width > 0) {
        paintSegment(point, point, dimensions.width / rect.width);
        setKeyboardPoint(point);
        setShowKeyboardCursor(true);
      }
    }
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    previousPointRef.current = null;
  };

  const restoreOriginal = () => {
    if (!dimensions || !originalPixelsRef.current) return;
    const canvas = imageCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    const imageData = context.createImageData(dimensions.width, dimensions.height);
    imageData.data.set(originalPixelsRef.current);
    context.putImageData(imageData, 0, 0);
    workingPixelsRef.current = new Uint8ClampedArray(originalPixelsRef.current);
    clearSelection();
    setProcessed(false);
    setToolError("");
  };

  const removeMark = async () => {
    if (!dimensions || !workingPixelsRef.current || !maskRef.current || !maskCountRef.current) return;
    setBusy(true);
    setProgress(0);
    setToolError("");
    let lastReported = 0;
    try {
      // Give React a frame to show the busy state before local pixel work begins.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const result = await inpaintMaskedPixels(
        dimensions.width,
        dimensions.height,
        workingPixelsRef.current,
        new Uint8Array(maskRef.current),
        4,
        (done, total) => {
          const percent = Math.floor(done / total * 100);
          if (percent >= lastReported + 5) {
            lastReported = percent;
            setProgress(percent);
          }
        },
      );
      const canvas = imageCanvasRef.current;
      const context = canvas?.getContext("2d");
      if (!context) throw new Error("The image canvas is unavailable.");
      const imageData = context.createImageData(dimensions.width, dimensions.height);
      imageData.data.set(result);
      context.putImageData(imageData, 0, 0);
      workingPixelsRef.current = result;
      clearSelection();
      setProcessed(true);
      setProgress(100);
    } catch (error) {
      setToolError(error instanceof Error ? error.message : "The selected area could not be healed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadResult = async () => {
    const canvas = imageCanvasRef.current;
    if (!canvas || !f.file) return;
    const outputType = ["image/png", "image/jpeg", "image/webp"].includes(f.file.type) ? f.file.type : "image/png";
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Your browser could not export this image.")), outputType, 0.94);
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const baseName = f.file.name.replace(/\.[^.]+$/, "") || "image";
      const extension = outputType === "image/jpeg" ? "jpg" : outputType === "image/webp" ? "webp" : "png";
      anchor.href = url;
      anchor.download = `${baseName}-edited.${extension}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      setToolError(error instanceof Error ? error.message : "Download failed.");
    }
  };

  const isReady = Boolean(f.url && readyUrl === f.url && dimensions);

  return (
    <div className="space-y-5">
      {!f.file ? (
        <div className="space-y-3">
          <ErrorBox msg={f.err} />
          <Drop onFile={f.load} drag={f.drag} setDrag={f.setDrag} label="Choose an image with a mark to remove" />
          <p className="text-xs muted text-center leading-relaxed">
            Works locally in your browser. Use only on images you own or have permission to edit.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Paint over the mark</h2>
              <p className="text-xs muted mt-1 leading-relaxed max-w-2xl">
                Brush across the watermark, then choose Remove. Nearby pixels are blended into the selection on this device; this works best on small marks over simple backgrounds.
              </p>
            </div>
            {dimensions && (
              <span className="muted-11 shrink-0">
                {dimensions.width.toLocaleString()} × {dimensions.height.toLocaleString()} · {formatBytes(f.file.size)}
              </span>
            )}
          </div>

          <div className="wm-toolbar flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-elevated)" }} role="group" aria-label="Selection tool">
              <button type="button" className={`chip !rounded-lg !min-h-[36px] !border-0 !shadow-none ${mode === "paint" ? "chip-active" : ""}`} aria-pressed={mode === "paint"} onClick={() => setMode("paint")} disabled={!isReady || busy}>
                <Brush size={14} /> Paint
              </button>
              <button type="button" className={`chip !rounded-lg !min-h-[36px] !border-0 !shadow-none ${mode === "erase" ? "chip-active" : ""}`} aria-pressed={mode === "erase"} onClick={() => setMode("erase")} disabled={!isReady || busy}>
                <Eraser size={14} /> Erase
              </button>
            </div>

            <label className="wm-brush-control flex items-center gap-2 px-3 min-h-[42px] rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <span className="text-xs font-semibold">Brush</span>
              <input type="range" min={14} max={72} step={2} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} aria-label="Brush size" disabled={!isReady || busy} />
              <span className="mono text-[11px] muted w-8 text-right">{brushSize}px</span>
            </label>

            <button type="button" className="btn-ghost btn-sm" onClick={clearSelection} disabled={!hasSelection || busy}>
              Clear selection
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={restoreOriginal} disabled={!processed || busy}>
              <RotateCcw size={14} /> Restore original
            </button>
          </div>

          {f.err && <ErrorBox msg={f.err} />}
          {toolError && <ErrorBox msg={toolError} />}

          {!isReady && !f.err && !toolError && (
            <div className="card p-10 text-center text-sm muted" aria-live="polite">Preparing your image locally…</div>
          )}

          <div className="wm-canvas-shell" hidden={!isReady}>
            <div
              className={`wm-canvas-stage ${mode === "erase" ? "is-erasing" : ""}`}
              style={dimensions ? { aspectRatio: `${dimensions.width} / ${dimensions.height}` } : undefined}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onLostPointerCapture={stopDrawing}
              onKeyDown={handleCanvasKeyDown}
              role="application"
              tabIndex={isReady && !busy ? 0 : -1}
              aria-label="Image editing canvas. Use arrow keys to move the brush, Enter to paint, and Escape to clear the selection. Pointer and touch painting are also supported."
            >
              <canvas ref={imageCanvasRef} className="wm-image-canvas" aria-label="Current image preview" />
              <canvas ref={maskCanvasRef} className="wm-mask-canvas" aria-hidden="true" />
              {showKeyboardCursor && keyboardPoint && dimensions && (
                <span
                  className="wm-keyboard-cursor"
                  aria-hidden="true"
                  style={{ left: `${keyboardPoint.x / dimensions.width * 100}%`, top: `${keyboardPoint.y / dimensions.height * 100}%`, width: `${brushSize}px`, height: `${brushSize}px` }}
                />
              )}
            </div>
          </div>

          {dimensions?.scaled && (
            <p className="text-xs muted">This large image is scaled to 8 megapixels for responsive local editing.</p>
          )}

          {busy && (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Healing selected pixels locally…</span>
                <span>{progress}%</span>
              </div>
              <div className="wm-progress-track"><span style={{ width: `${Math.max(5, progress)}%` }} /></div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={removeMark} disabled={!isReady || !hasSelection || busy}>
              {busy ? "Removing…" : "Remove selected mark"}
            </button>
            {processed && (
              <button type="button" className="btn-ghost" onClick={downloadResult} disabled={busy}>
                <Download size={15} /> Download edited image
              </button>
            )}
          </div>

          <p className="text-xs muted leading-relaxed">
            This uses local pixel healing, not generative AI. It can leave artifacts on detailed backgrounds or large marks. For best results, paint a little beyond the mark and keep the selection small.
          </p>
        </>
      )}
    </div>
  );
}
