import { isImageMimeType } from "@/modules/attachment/attachment.schema";

/**
 * Shrink a picked image in the browser before it is uploaded.
 *
 * Attachment bytes live in a Postgres column and that database is now managed, so every
 * upload crosses the network twice (browser -> app -> RDS) and every view crosses it
 * again on the way back. A phone photo is 3-5MB straight off the camera; at support-chat
 * sizes that detail is never looked at. Downscaling here is worth roughly 10x on both
 * the upload and the row.
 *
 * Deliberately conservative, because the most common support attachment is a screenshot
 * and unreadable text is worse than a slow upload:
 *  - images only, and only when the file is actually big enough to be worth re-encoding;
 *  - the long edge is capped rather than squeezed to a fixed size, so aspect is kept;
 *  - 1920px is high enough that screenshot text stays legible.
 *
 * Best-effort throughout: any failure returns the original file. A browser that cannot
 * decode the image still uploads exactly what it would have before.
 */

/** Longest edge, in CSS pixels, that we keep. */
const MAX_EDGE = 1920;

/** Below this, re-encoding costs more than it saves. */
const SKIP_BELOW_BYTES = 600 * 1024;

/** JPEG quality for photographic output. High enough to stay artefact-free on text. */
const JPEG_QUALITY = 0.85;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

/**
 * Whether any pixel is not fully opaque.
 *
 * Decides whether a PNG may be re-encoded as JPEG. Flattening a transparent PNG onto
 * an opaque background is visible and wrong, but a PNG *photo* re-encoded as PNG barely
 * shrinks — so the check is what makes the big win available without breaking logos and
 * cut-outs. Samples every 4th pixel: a transparent region large enough to matter can
 * never hide between samples.
 */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 255) return true;
  }
  return false;
}

export async function downscaleImage(file: File): Promise<File> {
  if (!isImageMimeType(file.type)) return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;
  // GIFs may be animated; a canvas round-trip would silently keep only frame one.
  if (file.type === "image/gif") return file;
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return file;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    // PNG stays PNG only when it needs to; otherwise JPEG, which is where the saving is.
    const keepAlpha = file.type === "image/png" && hasTransparency(ctx, width, height);
    const outType = keepAlpha ? "image/png" : "image/jpeg";

    const blob = await canvasToBlob(canvas, outType, outType === "image/jpeg" ? JPEG_QUALITY : undefined);
    // Re-encoding can *grow* a file that was already well compressed — keep the smaller.
    if (!blob || blob.size >= file.size) return file;

    const name = outType === "image/jpeg" ? file.name.replace(/\.(png|webp)$/i, ".jpg") : file.name;
    return new File([blob], name, { type: outType, lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
