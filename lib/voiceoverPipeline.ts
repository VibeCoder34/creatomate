import type { StoryboardShot } from "@/lib/storyboard";
import { getAudioDurationSecondsFromUrl } from "@/lib/audioDuration";
import { ELEVENLABS_PAID_PLAN_HINT } from "@/lib/elevenlabs";
import type { LanguageCode } from "@/lib/languages";

const FPS = 30;
const MIN_FRAMES = 90;

export type VoiceoverItem = {
  durationFrames?: number;
  audioSrc?: string;
  voiceoverText?: string;
};

export type AttachVoiceoverResult = {
  items: VoiceoverItem[];
  ttsError?: string;
  ttsPartialFailure?: boolean;
  /** Birleşik seslendirme metni (Creatomate tek parça TTS için) */
  combinedScript?: string;
};

async function readTtsErrorBody(res: Response): Promise<{
  code?: string;
  details?: string;
}> {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { code?: string; details?: string; error?: string };
    return {
      code: j.code,
      details: j.details ?? j.error ?? text,
    };
  } catch {
    return { details: text || String(res.status) };
  }
}

export async function attachVoiceoverAudioToItems(
  items: VoiceoverItem[],
  shots: StoryboardShot[],
  language: LanguageCode,
): Promise<AttachVoiceoverResult> {
  const out: VoiceoverItem[] = [];
  let ttsError: string | undefined;
  let ttsPartialFailure = false;
  let skipRemainingTts = false;
  const scriptParts: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const text = (shots[i]?.voiceover_text ?? "").trim();
    const prev = items[i];
    if (!text) {
      out.push({ ...prev });
      continue;
    }

    scriptParts.push(text);

    if (skipRemainingTts) {
      out.push({ ...prev });
      continue;
    }

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language,
        outputFormat: "mp3_44100_128",
      }),
    });

    if (!res.ok) {
      const errBody = await readTtsErrorBody(res);
      if (res.status === 402 && errBody.code === "paid_plan_required") {
        ttsError = errBody.details ?? ELEVENLABS_PAID_PLAN_HINT;
        skipRemainingTts = true;
      } else {
        ttsPartialFailure = true;
      }
      out.push({ ...prev });
      continue;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    let sec: number;
    try {
      sec = await getAudioDurationSecondsFromUrl(url);
    } catch {
      URL.revokeObjectURL(url);
      ttsPartialFailure = true;
      out.push({ ...prev });
      continue;
    }

    const audioFrames = Math.max(1, Math.ceil(sec * FPS));
    const visualFrames = prev.durationFrames ?? MIN_FRAMES;
    const durationFrames = Math.max(visualFrames, audioFrames, MIN_FRAMES);

    out.push({
      ...prev,
      durationFrames,
      audioSrc: url,
      voiceoverText: text,
    });
  }

  return {
    items: out,
    ttsError,
    ttsPartialFailure,
    combinedScript: scriptParts.join(" "),
  };
}

export function revokeVoiceoverObjectUrls(items: VoiceoverItem[]): void {
  for (const m of items) {
    const u = m.audioSrc;
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  }
}

/** Blob URL'leri render API'sine göndermek için base64 data URL'e çevirir */
export async function generateCombinedVoiceover(
  shots: StoryboardShot[],
  language: LanguageCode,
): Promise<{ dataUrl?: string; error?: string }> {
  const script = shots
    .map((s) => (s.voiceover_text ?? "").trim())
    .filter(Boolean)
    .join(" ");

  if (!script) return {};

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: script,
      language,
      outputFormat: "mp3_44100_128",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text) as { details?: string; error?: string };
      return { error: j.details ?? j.error ?? text };
    } catch {
      return { error: text || "TTS başarısız" };
    }
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  try {
    const dataUrl = await blobUrlToDataUrl(blobUrl);
    return { dataUrl };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
/** Blob URL'leri render API'sine göndermek için base64 data URL'e çevirir */
export async function blobUrlToDataUrl(url: string): Promise<string> {
  if (!url.startsWith("blob:")) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
