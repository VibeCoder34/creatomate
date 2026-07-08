/** Ardışık seslendirmeler arası boşluk (saniye) */
export const VO_GAP_SEC = 0.25;

/** Sahne sonunda ek nefes payı */
export const VO_TAIL_SEC = 0.4;

export const MAX_VIDEO_SECONDS = 55;
export const MIN_VIDEO_SECONDS = 28;

/** mp3_44100_128 — sabit bit hızından süre tahmini */
export function mp3DurationSeconds(audio: ArrayBuffer, bitrateKbps = 128): number {
  return Math.max(0.45, audio.byteLength / (bitrateKbps * 125));
}

/** TTS yokken metin uzunluğundan yaklaşık konuşma süresi */
export function estimateTextDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1.1, words * 0.42);
}

export function voiceBlockDuration(
  photoIndices: number[],
  voiceovers?: string[],
  durations?: number[],
): number {
  if (!voiceovers?.length) return 0;

  let total = 0;
  let count = 0;

  for (const idx of photoIndices) {
    const text = voiceovers[idx]?.trim();
    if (!text) continue;
    count += 1;
    const d = durations?.[idx] && durations[idx]! > 0
      ? durations[idx]!
      : estimateTextDuration(text);
    total += d + VO_GAP_SEC;
  }

  if (count === 0) return 0;
  return total - VO_GAP_SEC + VO_TAIL_SEC;
}

export function scaleMiddleDurations(
  durations: number[],
  maxTotal: number,
  fixedTotal: number,
): number[] {
  const middleSum = durations.reduce((a, b) => a + b, 0);
  const budget = maxTotal - fixedTotal;
  if (middleSum <= budget || middleSum <= 0) return durations;

  const scale = budget / middleSum;
  return durations.map((d) => Math.max(2.5, d * scale));
}
