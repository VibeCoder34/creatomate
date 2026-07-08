import type { NextRequest } from "next/server";
import { putEphemeralAudio } from "@/lib/ephemeralAudio";
import {
  elevenLabsTts,
  getElevenLabsConfig,
  parseTtsLanguage,
  resolveModelIdForLanguage,
  resolveVoiceIdForLanguage,
  type TtsLanguage,
} from "@/lib/elevenlabs";
import { getPublicBaseUrl, isPubliclyReachable } from "@/lib/publicBaseUrl";
import { estimateTextDuration, mp3DurationSeconds } from "@/lib/voiceoverTiming";

export type PreparedPhotoVoiceovers = {
  durations: number[];
  sources?: string[];
};

async function ttsForLine(text: string, language: TtsLanguage): Promise<{ buffer: Buffer; duration: number }> {
  const cfg = getElevenLabsConfig();
  const voiceId = resolveVoiceIdForLanguage(language, cfg);
  if (!voiceId) {
    throw new Error("ElevenLabs voice ID yapılandırılmamış.");
  }

  const { audio } = await elevenLabsTts({
    text,
    voiceId,
    modelId: resolveModelIdForLanguage(language, cfg),
    outputFormat: "mp3_44100_128",
  });

  const buffer = Buffer.from(audio);
  return {
    buffer,
    duration: mp3DurationSeconds(audio),
  };
}

export async function preparePhotoVoiceovers(
  request: NextRequest,
  texts: string[],
  languageRaw?: string,
): Promise<PreparedPhotoVoiceovers> {
  const cfg = getElevenLabsConfig();
  let language: TtsLanguage;
  try {
    language = languageRaw ? parseTtsLanguage(languageRaw) : cfg.defaultLanguage;
  } catch {
    language = "tr";
  }

  const publicBase = getPublicBaseUrl(request);
  const canHost = isPubliclyReachable(publicBase);

  const durations: number[] = [];
  const sources: string[] = [];

  for (const raw of texts) {
    const text = raw?.trim() ?? "";
    if (!text) {
      durations.push(0);
      sources.push("");
      continue;
    }

    try {
      const { buffer, duration } = await ttsForLine(text, language);
      durations.push(duration);
      if (canHost) {
        const id = putEphemeralAudio(buffer);
        sources.push(`${publicBase}/api/media/audio/${id}`);
      } else {
        sources.push("");
      }
    } catch {
      durations.push(estimateTextDuration(text));
      sources.push("");
    }
  }

  return {
    durations,
    ...(canHost && sources.some(Boolean) ? { sources } : {}),
  };
}
