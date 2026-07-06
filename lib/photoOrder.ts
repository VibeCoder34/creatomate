import type { StoryboardShot } from "@/lib/storyboard";

/**
 * Creatomate şablonu photos[0]=hero, photos[1]=specs bekler.
 * Storyboard'daki ilk geçiş sırasına göre benzersiz URL listesi üretir.
 */
export function orderPhotosFromStoryboard(
  photoUrls: string[],
  storyboard: StoryboardShot[],
): string[] {
  if (!photoUrls.length) return [];

  const seen = new Set<number>();
  const ordered: string[] = [];

  for (const shot of storyboard) {
    const idx = Math.min(photoUrls.length - 1, Math.max(0, shot.source_index));
    if (seen.has(idx)) continue;
    seen.add(idx);
    const url = photoUrls[idx];
    if (url) ordered.push(url);
  }

  for (let i = 0; i < photoUrls.length; i++) {
    if (!seen.has(i) && photoUrls[i]) ordered.push(photoUrls[i]!);
  }

  return ordered;
}

export function buildVoiceoverScript(storyboard: StoryboardShot[]): string {
  return storyboard
    .map((shot) => (shot.voiceover_text ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
