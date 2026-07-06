import type { NextRequest } from "next/server";
import { putEphemeralAudio } from "@/lib/ephemeralAudio";
import {
  getPublicBaseUrl,
  isPubliclyReachable,
  VOICEOVER_PUBLIC_URL_HINT,
} from "@/lib/publicBaseUrl";

function parseDataAudioUrl(dataUrl: string): Buffer | null {
  const match = /^data:audio\/[^;]+;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match?.[1]) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

function hostBuffer(request: NextRequest, buffer: Buffer): string {
  const base = getPublicBaseUrl(request);
  if (!isPubliclyReachable(base)) {
    throw new Error(VOICEOVER_PUBLIC_URL_HINT);
  }
  const id = putEphemeralAudio(buffer);
  return `${base}/api/media/audio/${id}`;
}

export async function resolveVoiceoverSourceForCreatomate(
  request: NextRequest,
  opts: {
    voiceoverAudioSource?: string;
  },
): Promise<string | undefined> {
  const rawSource = opts.voiceoverAudioSource?.trim();
  if (!rawSource) return undefined;

  if (rawSource.startsWith("data:audio")) {
    const buffer = parseDataAudioUrl(rawSource);
    if (!buffer?.length) {
      throw new Error("Seslendirme verisi geçersiz (base64).");
    }
    return hostBuffer(request, buffer);
  }

  if (rawSource.startsWith("http://") || rawSource.startsWith("https://")) {
    return rawSource;
  }

  throw new Error("Seslendirme kaynağı geçersiz. HTTP(S) URL veya metin gerekli.");
}
