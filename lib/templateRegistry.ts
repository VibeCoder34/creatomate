/**
 * Template Registry — tüm video template'lerinin metadata ve renk paletlerini merkezi olarak yönetir.
 *
 * Frontend bu modülü kullanarak template kart galerisi oluşturur.
 * Backend (template.ts) bu modülü kullanarak doğru paleti seçer.
 */

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type TemplateId =
  | "classic-pro"
  | "elegance"
  | "sport"
  | "urban"
  | "minimal"
  | "special";

export type TemplatePalette = {
  bg: string;
  panel: string;
  panelLight: string;
  accent: string;
  accentAlt: string;
  text: string;
  textMuted: string;
  textDim: string;
  textSoft: string;
};

export type TemplateMetadata = {
  id: TemplateId;
  /** Kullanıcıya gösterilen ad */
  name: string;
  /** Kısa açıklama */
  description: string;
  /** Renk paleti */
  palette: TemplatePalette;
  /** Intro stili hint'i */
  introStyle: "photo-bg" | "logo-center" | "flash" | "neon" | "fade";
  /** Geçiş animasyonu hint'i */
  transitionHint: "fade" | "slide" | "wipe" | "glitch" | "circular-wipe";
  /** Önizleme renkleri (frontend kart gradient'i) */
  previewGradient: [string, string];
  /** Emoji icon (kart için) */
  icon: string;
  /** GIF preview url */
  gifUrl: string;
};

// ─── Paletler ──────────────────────────────────────────────────────────────────

export const PALETTE_CLASSIC_PRO: TemplatePalette = {
  bg: "#0a0a0a",
  panel: "#141414",
  panelLight: "#1f1f1f",
  accent: "#e63946",
  accentAlt: "#ff6b6b",
  text: "#ffffff",
  textMuted: "#b0b0b0",
  textDim: "#808080",
  textSoft: "#d8d8d8",
};

export const PALETTE_ELEGANCE: TemplatePalette = {
  bg: "#0c0c0c",
  panel: "#1a1510",
  panelLight: "#2a2318",
  accent: "#c9a84c",
  accentAlt: "#e8cc6e",
  text: "#ffffff",
  textMuted: "#c4b898",
  textDim: "#8a7d65",
  textSoft: "#efe6d0",
};

export const PALETTE_SPORT: TemplatePalette = {
  bg: "#0a0a0a",
  panel: "#1a0a0a",
  panelLight: "#2a1212",
  accent: "#ff1744",
  accentAlt: "#ff5252",
  text: "#ffffff",
  textMuted: "#cca0a0",
  textDim: "#994444",
  textSoft: "#ffd6d6",
};

export const PALETTE_URBAN: TemplatePalette = {
  bg: "#0a0e14",
  panel: "#0d1520",
  panelLight: "#142030",
  accent: "#00e676",
  accentAlt: "#69f0ae",
  text: "#ffffff",
  textMuted: "#90b4ce",
  textDim: "#5a7a93",
  textSoft: "#d0ecff",
};

export const PALETTE_MINIMAL: TemplatePalette = {
  bg: "#f5f5f5",
  panel: "#ffffff",
  panelLight: "#fafafa",
  accent: "#1a1a1a",
  accentAlt: "#444444",
  text: "#1a1a1a",
  textMuted: "#666666",
  textDim: "#999999",
  textSoft: "#333333",
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: readonly TemplateMetadata[] = [
  {
    id: "classic-pro",
    name: "Classic Pro",
    description: "Koyu tema · kırmızı vurgu · rafine detaylar",
    palette: PALETTE_CLASSIC_PRO,
    introStyle: "photo-bg",
    transitionHint: "fade",
    previewGradient: ["#0a0a0a", "#e63946"],
    icon: "🏛️",
    gifUrl: "/gifs/classic-pro.gif",
  },
  {
    id: "elegance",
    name: "Elegance",
    description: "Altın tonları · lüks hissiyat · serif tipografi",
    palette: PALETTE_ELEGANCE,
    introStyle: "logo-center",
    transitionHint: "fade",
    previewGradient: ["#0c0c0c", "#c9a84c"],
    icon: "✨",
    gifUrl: "/gifs/elegance.gif",
  },
  {
    id: "sport",
    name: "Sport",
    description: "Agresif kırmızı · hızlı kesimler · bold stili",
    palette: PALETTE_SPORT,
    introStyle: "flash",
    transitionHint: "glitch",
    previewGradient: ["#0a0a0a", "#ff1744"],
    icon: "🏎️",
    gifUrl: "/gifs/sport.gif",
  },
  {
    id: "urban",
    name: "Urban",
    description: "Gece mavisi · neon yeşil · modern gradientler",
    palette: PALETTE_URBAN,
    introStyle: "neon",
    transitionHint: "slide",
    previewGradient: ["#0a0e14", "#00e676"],
    icon: "🌃",
    gifUrl: "/gifs/urban.gif",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Beyaz tema · temiz layout · ince tipografi",
    palette: PALETTE_MINIMAL,
    introStyle: "fade",
    transitionHint: "fade",
    previewGradient: ["#f5f5f5", "#1a1a1a"],
    icon: "◻️",
    gifUrl: "/gifs/minimal.gif",
  },
  {
    id: "special",
    name: "Special Style",
    description: "Eski klasik animasyonlar · AE kalitesi",
    palette: PALETTE_CLASSIC_PRO,
    introStyle: "photo-bg",
    transitionHint: "fade",
    previewGradient: ["#000000", "#ff2d2d"],
    icon: "💎",
    gifUrl: "/gifs/classic-pro.gif",
  },
] as const;

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

export function getTemplate(id: TemplateId): TemplateMetadata {
  return TEMPLATE_REGISTRY.find((t) => t.id === id) ?? TEMPLATE_REGISTRY[0]!;
}

export function getTemplatePalette(id: TemplateId): TemplatePalette {
  return getTemplate(id).palette;
}

/**
 * Eski TemplateStyle ("classic" | "dynamic") → yeni TemplateId dönüşümü.
 * Geriye dönük uyumluluk için.
 */
export function migrateTemplateStyle(
  style: string,
): TemplateId {
  switch (style) {
    case "classic":
      return "classic-pro";
    case "dynamic":
      return "urban";
    default:
      return (TEMPLATE_REGISTRY.find((t) => t.id === style)?.id) ?? "classic-pro";
  }
}

/** Template font ailesi: Elegance → serif, diğerleri → sans-serif */
export function templateTitleFont(id: TemplateId): string {
  if (id === "elegance") return "Playfair Display";
  return "Montserrat";
}

/** Template title font weight */
export function templateTitleWeight(id: TemplateId): string {
  if (id === "elegance") return "700";
  if (id === "sport") return "900";
  return "800";
}

/** Template accent bar height */
export function templateAccentBarHeight(id: TemplateId): string {
  if (id === "sport") return "0.8 vmin";
  if (id === "minimal") return "0.4 vmin";
  return "0.6 vmin";
}

/** Geçiş animasyon tipleri — template'e özel */
export function templateTransitions(id: TemplateId): readonly string[] {
  const meta = getTemplate(id);
  switch (meta.transitionHint) {
    case "glitch":
      return ["wipe", "slide", "fade", "wipe"];
    case "slide":
      return ["slide", "circular-wipe", "slide", "fade"];
    case "wipe":
      return ["wipe", "fade", "circular-wipe", "slide"];
    case "circular-wipe":
      return ["circular-wipe", "wipe", "fade", "slide"];
    default:
      return ["fade", "fade", "fade", "fade"];
  }
}

/** Intro süresi — Sport daha kısa (hızlı), Elegance daha uzun (zarif) */
export function templateIntroDuration(id: TemplateId): number {
  if (id === "sport") return 2.0;
  if (id === "elegance") return 3.5;
  return 3.0;
}

/** Outro süresi */
export function templateOutroDuration(id: TemplateId): number {
  if (id === "sport") return 2.5;
  if (id === "elegance") return 3.5;
  return 3.0;
}
