import type { StudioSceneBlueprint } from "@/lib/studioTemplate/types";

/**
 * Fotoğraf sayısına göre önceden tasarlanmış sahne dizilimi.
 * Her fotoğraf tam olarak bir kez kullanılır — sonda "kalan" foto yok.
 */
export const STUDIO_PHOTO_RECIPES: Record<number, StudioSceneBlueprint[]> = {
  8: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "single-focus", photoCount: 1, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "climax" },
    { layout: "price-spotlight", photoCount: 1, role: "price" },
  ],
  9: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "gallery" },
    { layout: "trio-filmstrip", photoCount: 3, role: "climax" },
  ],
  10: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "single-focus", photoCount: 1, role: "gallery" },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "price" },
  ],
  11: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 1 },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "climax" },
    { layout: "single-focus", photoCount: 1, role: "price" },
  ],
  12: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "gallery" },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "trio-filmstrip", photoCount: 3, role: "climax" },
  ],
  13: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "single-focus", photoCount: 1, role: "gallery" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 1 },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "climax" },
    { layout: "single-focus", photoCount: 1, role: "price" },
  ],
  14: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "gallery" },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 2 },
    { layout: "trio-filmstrip", photoCount: 3, role: "climax" },
    { layout: "duo-split", photoCount: 2, role: "price" },
  ],
  15: [
    { layout: "cinematic-hero", photoCount: 1, role: "hero" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 0 },
    { layout: "duo-split", photoCount: 2, role: "gallery" },
    { layout: "single-focus", photoCount: 1, role: "gallery" },
    { layout: "duo-feature", photoCount: 2, role: "gallery" },
    { layout: "trio-mosaic", photoCount: 3, role: "gallery" },
    { layout: "spec-panel", photoCount: 1, role: "specs", specChunkIndex: 1 },
    { layout: "trio-filmstrip", photoCount: 3, role: "climax" },
    { layout: "duo-split", photoCount: 2, role: "price" },
  ],
};

export const STUDIO_BASE_DURATION = {
  intro: 3,
  outro: 3.5,
  hero: 4.8,
  specs: 5.2,
  duo: 4.2,
  trio: 5,
  single: 3.8,
  price: 4.5,
} as const;

export function baseDurationForLayout(layout: StudioSceneBlueprint["layout"]): number {
  switch (layout) {
    case "cinematic-hero":
      return STUDIO_BASE_DURATION.hero;
    case "spec-panel":
      return STUDIO_BASE_DURATION.specs;
    case "duo-split":
    case "duo-feature":
      return STUDIO_BASE_DURATION.duo;
    case "trio-mosaic":
    case "trio-filmstrip":
      return STUDIO_BASE_DURATION.trio;
    case "single-focus":
      return STUDIO_BASE_DURATION.single;
    case "price-spotlight":
      return STUDIO_BASE_DURATION.price;
    default:
      return STUDIO_BASE_DURATION.single;
  }
}

export function recipeForPhotoCount(photoCount: number): StudioSceneBlueprint[] {
  const clamped = Math.min(15, Math.max(8, photoCount));
  return STUDIO_PHOTO_RECIPES[clamped] ?? STUDIO_PHOTO_RECIPES[8]!;
}

export function totalPhotosInRecipe(recipe: StudioSceneBlueprint[]): number {
  return recipe.reduce((sum, scene) => sum + scene.photoCount, 0);
}
