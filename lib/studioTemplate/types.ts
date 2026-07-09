import type { VideoFormat } from "@/app/lib/template";
import type { SpecChunk } from "@/lib/templateFormat";

export type StudioLayout =
  | "cinematic-hero"
  | "spec-panel"
  | "duo-split"
  | "duo-feature"
  | "trio-mosaic"
  | "trio-filmstrip"
  | "single-focus"
  | "price-spotlight";

export type StudioSceneRole = "hero" | "specs" | "gallery" | "price" | "climax";

export type StudioSceneBlueprint = {
  layout: StudioLayout;
  /** Bu sahnede kaç fotoğraf kullanılır */
  photoCount: 1 | 2 | 3;
  role?: StudioSceneRole;
  /** Hangi spec grubu gösterilsin (varsa) */
  specChunkIndex?: number;
};

export type StudioScenePlan = {
  id: string;
  layout: StudioLayout;
  role?: StudioSceneRole;
  photoIndices: number[];
  photoUrls: string[];
  specChunk?: SpecChunk;
  duration: number;
  startTime: number;
};

export type StudioPlan = {
  photoCount: number;
  format: VideoFormat;
  scenes: StudioScenePlan[];
};

export type StudioPalette = {
  bg: string;
  panel: string;
  panelLight: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  textDim: string;
  gradientTop: string;
  gradientBottom: string;
};
