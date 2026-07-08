import type { StoryboardShot } from "@/lib/storyboard";

export type OrderedPhotoWithVoiceover = {
  url: string;
  voiceoverText: string;
};

/**
 * Creatomate şablonu photos[0]=hero, photos[1]=specs bekler.
 * Storyboard'daki ilk geçiş sırasına göre benzersiz URL listesi üretir.
 */
export function orderPhotosFromStoryboard(
  photoUrls: string[],
  storyboard: StoryboardShot[],
): string[] {
  return orderPhotosWithVoiceover(photoUrls, storyboard).map((item) => item.url);
}

/**
 * Fotoğraf sırası + her fotoğrafın kendi seslendirme metni (storyboard shot ile eşleşir).
 */
export function orderPhotosWithVoiceover(
  photoUrls: string[],
  storyboard: StoryboardShot[],
): OrderedPhotoWithVoiceover[] {
  if (!photoUrls.length) return [];

  const seen = new Set<number>();
  const ordered: OrderedPhotoWithVoiceover[] = [];

  for (const shot of storyboard) {
    const idx = Math.min(photoUrls.length - 1, Math.max(0, shot.source_index));
    if (seen.has(idx)) continue;
    seen.add(idx);
    const url = photoUrls[idx];
    if (url) {
      ordered.push({
        url,
        voiceoverText: (shot.voiceover_text ?? "").trim(),
      });
    }
  }

  for (let i = 0; i < photoUrls.length; i++) {
    if (!seen.has(i) && photoUrls[i]) {
      ordered.push({ url: photoUrls[i]!, voiceoverText: "" });
    }
  }

  return ordered;
}

export function buildVoiceoverScript(storyboard: StoryboardShot[]): string {
  return storyboard
    .map((shot) => (shot.voiceover_text ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
