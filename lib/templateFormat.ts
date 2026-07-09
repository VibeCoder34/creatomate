import type { CarVideoFormData, VideoFormat } from "@/app/lib/template";
import { videoTemplateStrings } from "@/lib/videoTemplateI18n";

export type LayoutProfile = "reels" | "youtube" | "square";

export function layoutProfile(format: VideoFormat): LayoutProfile {
  if (format === "youtube") return "youtube";
  if (format === "square") return "square";
  return "reels";
}

export function formatDimensions(format: VideoFormat): { width: number; height: number } {
  switch (format) {
    case "youtube":
      return { width: 1920, height: 1080 };
    case "square":
      return { width: 1080, height: 1080 };
    default:
      return { width: 1080, height: 1920 };
  }
}

export function aspectRatioForFormat(format: VideoFormat): string {
  switch (format) {
    case "youtube":
      return "16:9";
    case "square":
      return "1:1";
    default:
      return "9:16";
  }
}

export type SpecLine = {
  icon: string;
  label: string;
  value: string;
};

export function truncateLabel(text: string, max = 28): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function truncateTitle(text: string, format: VideoFormat): string {
  const max = format === "youtube" ? 48 : format === "square" ? 40 : 36;
  return truncateLabel(text, max);
}

export function truncateSubtitle(text: string, format: VideoFormat): string {
  const max = format === "youtube" ? 56 : format === "square" ? 48 : 42;
  return truncateLabel(text, max);
}

export const INTRO_TYPO = {
  youtube: {
    dealerY: "40%",
    titleY: "48%",
    subtitleY: "58%",
    priceY: "68%",
    accentY: "53%",
    dealerSize: "6.2 vmin",
    titleSize: "4 vmin",
    subtitleSize: "2.3 vmin",
    priceSize: "3.6 vmin",
    textWidth: "85%",
  },
  square: {
    dealerY: "42%",
    titleY: "50%",
    subtitleY: "60%",
    priceY: "72%",
    accentY: "55%",
    dealerSize: "7 vmin",
    titleSize: "4.8 vmin",
    subtitleSize: "2.5 vmin",
    priceSize: "4 vmin",
    textWidth: "88%",
  },
  reels: {
    dealerY: "44%",
    titleY: "50%",
    subtitleY: "62%",
    priceY: "74%",
    accentY: "56%",
    dealerSize: "8 vmin",
    titleSize: "5.5 vmin",
    subtitleSize: "2.8 vmin",
    priceSize: "4.5 vmin",
    textWidth: "90%",
  },
} as const;

export const HERO_TYPO = {
  youtube: {
    priceSize: "4 vmin",
    titleSize: "4.8 vmin",
    subtitleSize: "2.4 vmin",
    titleY: "74%",
    subtitleY: "86%",
    textWidth: "70%",
  },
  square: {
    priceSize: "4.5 vmin",
    titleSize: "5.2 vmin",
    subtitleSize: "2.6 vmin",
    titleY: "72%",
    subtitleY: "84%",
    textWidth: "78%",
  },
  reels: {
    priceSize: "5 vmin",
    titleSize: "6 vmin",
    subtitleSize: "2.8 vmin",
    titleY: "72%",
    subtitleY: "84%",
    textWidth: "80%",
  },
} as const;

export const OUTRO_TYPO = {
  youtube: {
    ctaY: "36%",
    phoneY: "52%",
    addressY: "64%",
    ctaSize: "6.5 vmin",
    phoneSize: "4.2 vmin",
    addressSize: "2.3 vmin",
  },
  square: {
    ctaY: "37%",
    phoneY: "53%",
    addressY: "65%",
    ctaSize: "7 vmin",
    phoneSize: "4.6 vmin",
    addressSize: "2.4 vmin",
  },
  reels: {
    ctaY: "38%",
    phoneY: "54%",
    addressY: "66%",
    ctaSize: "8 vmin",
    phoneSize: "5 vmin",
    addressSize: "2.6 vmin",
  },
} as const;

export function introTypography(format: VideoFormat) {
  return INTRO_TYPO[layoutProfile(format)];
}

export function heroTypography(format: VideoFormat) {
  return HERO_TYPO[layoutProfile(format)];
}

export function outroTypography(format: VideoFormat) {
  return OUTRO_TYPO[layoutProfile(format)];
}

export function collectSpecLines(data: CarVideoFormData): SpecLine[] {
  const t = videoTemplateStrings(data.videoLanguage);
  const lines: SpecLine[] = [
    { icon: "⏱", label: t.specKm, value: data.specKm },
    { icon: "⛽", label: t.specFuel, value: data.specFuel },
    { icon: "⚙", label: t.specGear, value: data.specGear },
    { icon: "📅", label: t.specYear, value: data.specYear },
    { icon: "🔧", label: t.specMotor, value: data.specMotor ?? "" },
    { icon: "🎨", label: t.specColor, value: data.specColor ?? "" },
    { icon: "🚗", label: t.specBody, value: data.specBody ?? "" },
    { icon: "📋", label: t.specSeries, value: data.specSeries ?? "" },
    { icon: "⚡", label: t.specPower, value: data.specEnginePower ?? "" },
    { icon: "📐", label: t.specVolume, value: data.specEngineVolume ?? "" },
    { icon: "🛞", label: t.specDrivetrain, value: data.specDrivetrain ?? "" },
    { icon: "✓", label: t.specCondition, value: data.specCondition ?? "" },
    { icon: "🛡", label: t.specWarranty, value: data.specWarranty ?? "" },
    { icon: "📌", label: t.specDamage, value: data.specDamage ?? "" },
  ];

  return lines
    .map((line) => ({ ...line, value: truncateLabel(line.value, 32) }))
    .filter((line) => line.value.trim());
}

/** Boş spec alanlarında bile okunabilir içerik üretir */
export function collectDisplaySpecLines(data: CarVideoFormData): SpecLine[] {
  const t = videoTemplateStrings(data.videoLanguage);
  const lines = collectSpecLines(data);
  if (lines.length > 0) return lines;

  const fallback: SpecLine[] = [];
  if (data.carTitle?.trim()) {
    fallback.push({ icon: "🚗", label: t.specCar, value: truncateLabel(data.carTitle, 32) });
  }
  if (data.specYear?.trim()) {
    fallback.push({ icon: "📅", label: t.specYear, value: truncateLabel(data.specYear, 32) });
  }
  if (data.priceTag?.trim()) {
    fallback.push({ icon: "💰", label: t.specPrice, value: truncateLabel(data.priceTag, 24) });
  }
  if (data.specFuel?.trim()) {
    fallback.push({ icon: "⛽", label: t.specFuel, value: truncateLabel(data.specFuel, 32) });
  }
  return fallback;
}

/** Tek sahnede gösterilecek maksimum spec satırı */
export const MAX_SPECS_PER_SCENE = 4;

/** Maksimum ayrı spec sahnesi (hero sonrası) */
export const MAX_SPEC_SCENES = 4;

export type SpecChunk = {
  id: string;
  heading: string;
  lines: SpecLine[];
};

/** Araç bilgilerini okunabilir gruplara böler — her grup ayrı sahne */
export function collectSpecChunks(data: CarVideoFormData): SpecChunk[] {
  const t = videoTemplateStrings(data.videoLanguage);
  const lines = collectSpecLines(data);

  const groups: { id: string; heading: string; labels: string[] }[] = [
    {
      id: "usage",
      heading: t.techDetailsHeading,
      labels: [t.specKm, t.specFuel, t.specGear, t.specYear],
    },
    {
      id: "engine",
      heading: t.specsHeading,
      labels: [t.specMotor, t.specPower, t.specVolume, t.specDrivetrain],
    },
    {
      id: "exterior",
      heading: t.carInfoHeading,
      labels: [t.specColor, t.specBody, t.specSeries, t.specCondition],
    },
    {
      id: "history",
      heading: t.summaryHeading,
      labels: [t.specWarranty, t.specDamage],
    },
  ];

  const chunks: SpecChunk[] = [];
  for (const group of groups) {
    const groupLines = lines.filter((line) => group.labels.includes(line.label));
    if (groupLines.length) {
      chunks.push({
        id: group.id,
        heading: group.heading,
        lines: groupLines.slice(0, MAX_SPECS_PER_SCENE),
      });
    }
  }

  if (chunks.length) return chunks;

  const fallback = collectDisplaySpecLines(data);
  if (!fallback.length) return [];

  const parts: SpecChunk[] = [];
  for (let i = 0; i < fallback.length; i += MAX_SPECS_PER_SCENE) {
    parts.push({
      id: `part-${parts.length}`,
      heading: t.specsHeading,
      lines: fallback.slice(i, i + MAX_SPECS_PER_SCENE),
    });
  }
  return parts.slice(0, MAX_SPEC_SCENES);
}

export const SPLIT_LAYOUT = {
  youtube: {
    panel: { x: "0%", y: "0%", width: "40%", height: "100%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    panelText: { x: "4%", width: "32%" },
    photoZone: { x: "40%", y: "0%", width: "60%", height: "100%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    dividerX: "40%",
    duo: {
      photos: [
        { x: "58%", y: "52%", width: "22%", height: "40%" },
        { x: "82%", y: "52%", width: "22%", height: "40%" },
      ],
    },
    trio: {
      hero: { x: "56%", y: "52%", width: "24%", height: "42%" },
      stack: [
        { x: "82%", y: "32%", width: "20%", height: "19%" },
        { x: "82%", y: "68%", width: "20%", height: "19%" },
      ],
    },
  },
  reels: {
    panel: { x: "0%", y: "56%", width: "100%", height: "44%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    panelText: { x: "5%", width: "90%" },
    photoZone: { x: "0%", y: "0%", width: "100%", height: "56%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    photoZoneEnd: "56%",
    duo: {
      photos: [
        { x: "27%", y: "22%", width: "42%", height: "30%" },
        { x: "73%", y: "22%", width: "42%", height: "30%" },
      ],
    },
    trio: {
      photos: [
        { x: "17%", y: "20%", width: "26%", height: "28%" },
        { x: "50%", y: "20%", width: "26%", height: "28%" },
        { x: "83%", y: "20%", width: "26%", height: "28%" },
      ],
    },
  },
  square: {
    panel: { x: "0%", y: "60%", width: "100%", height: "40%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    panelText: { x: "5%", width: "90%" },
    photoZone: { x: "0%", y: "0%", width: "100%", height: "60%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    photoZoneEnd: "60%",
    duo: {
      photos: [
        { x: "28%", y: "20%", width: "36%", height: "32%" },
        { x: "72%", y: "20%", width: "36%", height: "32%" },
      ],
    },
    trio: {
      photos: [
        { x: "20%", y: "18%", width: "24%", height: "28%" },
        { x: "50%", y: "18%", width: "24%", height: "28%" },
        { x: "80%", y: "18%", width: "24%", height: "28%" },
      ],
    },
  },
} as const;

export function splitLayoutFor(format: VideoFormat) {
  return SPLIT_LAYOUT[layoutProfile(format)];
}
