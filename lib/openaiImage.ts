import sharp from "sharp";

/** OpenAI vision desteklediği formatlar */
const OPENAI_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export type OpenAIImageInput = {
  url?: string;
  base64?: string;
};

function guessMimeFromExtension(urlOrPath: string): string {
  const ext = urlOrPath.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "application/octet-stream";
  }
}

function toDataUrl(mime: string, buffer: Buffer): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function normalizeBase64Input(b64: string): string {
  const trimmed = b64.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:image/jpeg;base64,${trimmed}`;
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mime: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CarStudioReels/1.0)",
      Accept: "image/*,*/*",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Görsel indirilemedi (${res.status}): ${url}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const headerMime = (res.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const mime =
    headerMime.startsWith("image/") ? headerMime : guessMimeFromExtension(url);

  return { buffer, mime };
}

async function ensureOpenAICompatible(buffer: Buffer, mime: string): Promise<string> {
  if (OPENAI_MIMES.has(mime)) {
    return toDataUrl(mime, buffer);
  }

  const jpeg = await sharp(buffer).rotate().jpeg({ quality: 88 }).toBuffer();
  return toDataUrl("image/jpeg", jpeg);
}

/**
 * URL veya base64 girdisini OpenAI vision API'nin kabul ettiği data URL'e çevirir.
 * AVIF/HEIC gibi desteklenmeyen formatlar sunucuda JPEG'e dönüştürülür.
 */
export async function resolveImageForOpenAI(
  input: OpenAIImageInput,
): Promise<string | null> {
  if (input.base64?.trim()) {
    const dataUrl = normalizeBase64Input(input.base64);
    if (dataUrl.startsWith("data:image/avif") || dataUrl.startsWith("data:image/heic")) {
      const b64 = dataUrl.split(",")[1] ?? "";
      const buf = Buffer.from(b64, "base64");
      return ensureOpenAICompatible(buf, "image/avif");
    }
    return dataUrl;
  }

  const url = input.url?.trim();
  if (!url) return null;

  const { buffer, mime } = await fetchImageBuffer(url);
  return ensureOpenAICompatible(buffer, mime);
}

export async function resolveImagesForOpenAI(
  inputs: OpenAIImageInput[],
): Promise<string[]> {
  const results = await Promise.all(inputs.map((input) => resolveImageForOpenAI(input)));
  return results.filter((u): u is string => Boolean(u));
}
