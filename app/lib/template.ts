// Creatomate RenderScript — araba tanıtım videosu (örnek şablona göre)

import {
  buildCreatomateElevenLabsProvider,
  parseTtsLanguage,
  type TtsLanguage,
} from "@/lib/elevenlabs";

export const COLORS = {
  bg: "#0a0a0a",
  panel: "#141414",
  panelLight: "#1f1f1f",
  accent: "#ff2d2d",
  text: "#ffffff",
  textMuted: "#aaaaaa",
  textDim: "#888888",
  textSoft: "#d0d0d0",
} as const;

const MUSIC_SOURCE = "https://cdn.creatomate.com/demo/music3.mp3";
const MIN_VIDEO_DURATION = 30;

const BASE_DURATION = {
  intro: 2.5,
  hero: 4,
  specs: 4.5,
  showcase: 3,
  split: 4,
  outro: 3,
} as const;

const SCENE_FADE = {
  time: 0,
  duration: 0.4,
  easing: "quadratic-out",
  type: "fade",
};

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type VideoFormat = "reels" | "youtube";
export type TemplateStyle = "classic" | "dynamic";

export type CarVideoFormData = {
  dealerName: string;
  introSubtitle: string;
  carTitle: string;
  carSubtitle: string;
  priceTag: string;
  specKm: string;
  specFuel: string;
  specGear: string;
  specYear: string;
  ctaMain: string;
  phone: string;
  address: string;
  photos: string[];
  format: VideoFormat;
  templateStyle: TemplateStyle;
  /** Özel müzik URL (yoksa varsayılan Creatomate demo müziği) */
  musicSource?: string;
  /** Harici ses dosyası URL (yedek yol) */
  voiceoverAudioSource?: string;
  /** Creatomate içinde ElevenLabs ile üretilecek seslendirme metni */
  voiceoverText?: string;
  voiceoverLanguage?: string;
  /** Arka plan müziği seviyesi 0–1 */
  musicVolume?: number;
};

export type RenderScript = {
  output_format: "mp4";
  width: number;
  height: number;
  frame_rate: number;
  elements: RenderElement[];
};

type RenderElement = Record<string, unknown>;

type MiddleScene =
  | {
      kind: "showcase";
      url: string;
      photoNumber: number;
      totalPhotos: number;
    }
  | {
      kind: "split-duo";
      urls: [string, string];
      photoNumbers: [number, number];
      totalPhotos: number;
      infoVariant: number;
    }
  | {
      kind: "split-trio";
      urls: [string, string, string];
      photoNumbers: [number, number, number];
      totalPhotos: number;
      infoVariant: number;
    };

type ScenePlan = {
  name: string;
  duration: number;
  build: (time: number) => RenderElement;
};

// ─── Fotoğraf planlama ────────────────────────────────────────────────────────

/**
 * Foto 1 → hero, foto 2 → specs.
 * Kalan fotoğraflar: önce 3'lü/2'li split sahneler, tek kalan → showcase.
 */
export function planMiddleScenes(photos: string[]): MiddleScene[] {
  const total = photos.length;
  const rest = photos.slice(2);
  const scenes: MiddleScene[] = [];
  let i = 0;
  let infoVariant = 0;
  let pattern = 0;

  while (i < rest.length) {
    const left = rest.length - i;
    const baseNum = i + 3;

    if (left >= 3 && pattern % 2 === 0) {
      scenes.push({
        kind: "split-trio",
        urls: [rest[i], rest[i + 1], rest[i + 2]],
        photoNumbers: [baseNum, baseNum + 1, baseNum + 2],
        totalPhotos: total,
        infoVariant: infoVariant % 3,
      });
      i += 3;
    } else if (left >= 2) {
      scenes.push({
        kind: "split-duo",
        urls: [rest[i], rest[i + 1]],
        photoNumbers: [baseNum, baseNum + 1],
        totalPhotos: total,
        infoVariant: infoVariant % 3,
      });
      i += 2;
    } else {
      scenes.push({
        kind: "showcase",
        url: rest[i],
        photoNumber: baseNum,
        totalPhotos: total,
      });
      i += 1;
    }

    pattern += 1;
    infoVariant += 1;
  }

  return scenes;
}

/** @deprecated planMiddleScenes kullanın */
export function planShowcaseScenes(photos: string[]): MiddleScene[] {
  return planMiddleScenes(photos);
}

function calcMiddleSceneDuration(sceneCount: number): number {
  const fixed =
    BASE_DURATION.intro +
    BASE_DURATION.hero +
    BASE_DURATION.specs +
    BASE_DURATION.outro;

  if (sceneCount === 0) {
    return BASE_DURATION.showcase;
  }

  const needed = MIN_VIDEO_DURATION - fixed;
  return Math.max(3, needed / sceneCount);
}

function formatDimensions(format: VideoFormat): { width: number; height: number } {
  return format === "reels"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

function rectPath(): string {
  return "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z";
}

const DYNAMIC_TRANSITIONS = [
  "circular-wipe",
  "wipe",
  "slide",
  "fade",
] as const;

function sceneEnter(style: TemplateStyle, sceneIndex = 0): RenderElement {
  if (style === "classic") {
    return SCENE_FADE;
  }

  const type = DYNAMIC_TRANSITIONS[sceneIndex % DYNAMIC_TRANSITIONS.length];
  const base: RenderElement = {
    time: 0,
    duration: 0.4,
    easing: "quadratic-out",
    type,
    transition: true,
  };

  if (type === "slide") {
    return {
      ...base,
      direction: sceneIndex % 2 === 0 ? "90°" : "270°",
      distance: "18%",
    };
  }

  return base;
}

function flashAccent(): RenderElement {
  return {
    name: "Flash-Accent",
    type: "shape",
    track: 8,
    time: 0,
    duration: 0.15,
    width: "100%",
    height: "0.7 vmin",
    y: "0%",
    y_anchor: "0%",
    path: rectPath(),
    fill_color: COLORS.accent,
    animations: [
      { time: 0, duration: 0.15, easing: "quadratic-out", type: "fade" },
    ],
  };
}

function quickFade(delay = 0): RenderElement {
  return {
    time: delay,
    duration: 0.35,
    easing: "quadratic-out",
    type: "fade",
  };
}

function popIn(delay = 0): RenderElement {
  return {
    time: delay,
    duration: 0.55,
    easing: "back-out",
    type: "scale",
    end_scale: "100%",
    start_scale: "45%",
  };
}

function textSlideUp(delay = 0, split: "word" | "letter" = "word"): RenderElement {
  return {
    time: delay,
    duration: 0.65,
    easing: "quadratic-out",
    type: "text-slide",
    scope: "split-clip",
    split,
    overlap: "85%",
    direction: "up",
  };
}

function slideIn(
  direction: "90°" | "270°" | "0°" | "180°",
  delay = 0,
): RenderElement {
  return {
    time: delay,
    duration: 0.5,
    easing: "quadratic-out",
    type: "slide",
    distance: "12%",
    direction,
  };
}

/** Tam ekran sahneler — araç tam görünsün */
function buildCarPhoto(
  name: string,
  source: string,
  duration: number,
  track: number,
  layout: Record<string, unknown>,
  extraAnimations: RenderElement[] = [],
): RenderElement {
  return {
    name,
    type: "image",
    track,
    time: 0,
    duration,
    source,
    fit: "contain",
    clip: true,
    ...layout,
    animations: extraAnimations,
  };
}

/** Galeri hücresi — kırpılmış, dolu, gri bant yok */
function buildGalleryPhoto(
  name: string,
  source: string,
  duration: number,
  track: number,
  layout: { x: string; y: string; width: string; height: string },
  style: TemplateStyle,
  animDelay: number,
  slideDir: "90°" | "270°" | "0°" | "180°",
): RenderElement {
  const dynamic = style === "dynamic";

  return {
    name,
    type: "composition",
    track,
    time: 0,
    duration,
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    x_anchor: "50%",
    y_anchor: "50%",
    fill_color: COLORS.bg,
    clip: true,
    animations: dynamic
      ? [slideIn(slideDir, animDelay), quickFade(animDelay)]
      : [quickFade(animDelay)],
    elements: [
      {
        name: `${name}-Img`,
        type: "image",
        track: 1,
        time: 0,
        duration,
        source,
        width: "100%",
        height: "100%",
        fit: "cover",
        x_alignment: "50%",
        y_alignment: "50%",
      },
    ],
  };
}

function hasVoiceover(data: CarVideoFormData): boolean {
  return Boolean(data.voiceoverText?.trim() || data.voiceoverAudioSource?.trim());
}

function buildMusicElement(data: CarVideoFormData): RenderElement {
  const volume = data.musicVolume ?? (hasVoiceover(data) ? 0.25 : 0.8);
  return {
    name: "BG-Music",
    type: "audio",
    track: 1,
    time: 0,
    duration: null,
    source: data.musicSource?.trim() || MUSIC_SOURCE,
    loop: true,
    audio_fade_out: 1.5,
    volume: `${Math.round(volume * 100)}%`,
  };
}

function buildVoiceoverElement(data: CarVideoFormData): RenderElement | null {
  const text = data.voiceoverText?.trim();
  if (text) {
    let lang: TtsLanguage = "tr";
    try {
      lang = parseTtsLanguage(data.voiceoverLanguage);
    } catch {
      lang = "tr";
    }
    return {
      name: "Voiceover",
      type: "audio",
      track: 10,
      time: 0,
      duration: "media",
      source: text,
      provider: buildCreatomateElevenLabsProvider(lang),
      volume: "100%",
      audio_fade_in: 0.2,
    };
  }

  const url = data.voiceoverAudioSource?.trim();
  if (!url) return null;

  return {
    name: "Voiceover",
    type: "audio",
    track: 10,
    time: 0,
    duration: "media",
    source: url,
    volume: "100%",
    audio_fade_in: 0.2,
  };
}

// ─── Intro ───────────────────────────────────────────────────────────────────

function buildIntroScene(
  data: CarVideoFormData,
  duration: number,
  style: TemplateStyle,
): RenderElement {
  const dynamic = style === "dynamic";
  return {
    name: "Intro",
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [SCENE_FADE],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      {
        type: "shape",
        track: 1,
        time: 0,
        duration,
        width: "100%",
        height: "100%",
        path: rectPath(),
        fill_color: [
          { offset: "0%", color: COLORS.panel },
          { offset: "100%", color: COLORS.panelLight },
        ],
      },
      {
        name: "Accent-Bar",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        y: "62%",
        width: "18%",
        height: "0.6 vmin",
        x_anchor: "50%",
        y_anchor: "50%",
        path: rectPath(),
        fill_color: COLORS.accent,
        animations: [
          {
            time: 0.4,
            duration: 0.5,
            easing: "quadratic-out",
            type: "scale",
            fade: false,
            x_anchor: "50%",
            end_scale: "100% 100%",
            start_scale: "0% 100%",
          },
        ],
      },
      {
        name: "Dealer-Name",
        type: "text",
        track: 3,
        time: 0,
        duration,
        y: "44%",
        width: "90%",
        x_alignment: "50%",
        y_alignment: "100%",
        text: data.dealerName,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "8 vmin",
        letter_spacing: "6%",
        fill_color: COLORS.text,
        animations: dynamic
          ? [textSlideUp(0.05, "letter")]
          : [
              {
                time: 0.1,
                duration: 0.7,
                easing: "quadratic-out",
                type: "text-slide",
                scope: "split-clip",
                split: "letter",
                overlap: "93%",
                direction: "up",
              },
            ],
      },
      {
        name: "Intro-Car-Title",
        type: "text",
        track: 5,
        time: 0,
        duration,
        y: "50%",
        width: "90%",
        x_alignment: "50%",
        y_alignment: "50%",
        text: data.carTitle,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "5.5 vmin",
        fill_color: COLORS.text,
        animations: dynamic ? [textSlideUp(0.25)] : [quickFade(0.2)],
      },
      {
        name: "Intro-Subtitle",
        type: "text",
        track: 4,
        time: 0,
        duration,
        y: "62%",
        width: "90%",
        x_alignment: "50%",
        text: data.introSubtitle,
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: "2.8 vmin",
        letter_spacing: "14%",
        fill_color: COLORS.accent,
        animations: dynamic ? [slideIn("0°", 0.35)] : [quickFade(0.35)],
      },
      {
        name: "Intro-Price",
        type: "text",
        track: 6,
        time: 0,
        duration,
        y: "74%",
        width: "90%",
        x_alignment: "50%",
        text: data.priceTag,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "4.5 vmin",
        fill_color: COLORS.accent,
        animations: dynamic ? [popIn(0.45), quickFade(0.45)] : [quickFade(0.45)],
      },
    ],
  };
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function buildHeroScene(
  photoUrl: string,
  data: CarVideoFormData,
  duration: number,
  style: TemplateStyle,
  transitionIndex: number,
  name = "Hero",
): RenderElement {
  const dynamic = style === "dynamic";
  return {
    name,
    type: "composition",
    track: 2,
    duration,
    fill_color: "#000000",
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      buildCarPhoto("Photo-1", photoUrl, duration, 1, {
        width: "100%",
        height: "100%",
      }, dynamic ? [slideIn("90°", 0)] : []),
      {
        name: "Hero-Gradient",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        y: "100%",
        width: "100%",
        height: "60%",
        y_anchor: "100%",
        path: rectPath(),
        fill_color: [
          { offset: "0%", color: "rgba(0,0,0,0)" },
          { offset: "100%", color: "rgba(0,0,0,0.9)" },
        ],
      },
      {
        name: "Price-Tag",
        type: "text",
        track: 3,
        time: 0,
        duration,
        x: "4%",
        y: "8%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.priceTag,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "5 vmin",
        background_color: COLORS.accent,
        background_x_padding: "55%",
        background_y_padding: "40%",
        background_border_radius: "16%",
        fill_color: COLORS.text,
        animations: dynamic ? [popIn(0), quickFade(0)] : [quickFade(0)],
      },
      {
        name: "Side-Accent",
        type: "shape",
        track: 4,
        time: 0,
        duration,
        x: "4%",
        y: "72%",
        width: "0.55 vmin",
        height: "12%",
        x_anchor: "0%",
        y_anchor: "0%",
        path: rectPath(),
        fill_color: COLORS.accent,
        ...(dynamic
          ? {
              animations: [
                {
                  time: 0,
                  duration: 0.4,
                  easing: "quadratic-out",
                  type: "scale",
                  fade: false,
                  y_anchor: "0%",
                  end_scale: "100% 100%",
                  start_scale: "100% 0%",
                },
              ],
            }
          : {}),
      },
      {
        name: "Car-Title",
        type: "text",
        track: 5,
        time: 0,
        duration,
        x: "7%",
        y: "72%",
        width: "80%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.carTitle,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "6 vmin",
        fill_color: COLORS.text,
        stroke_color: "rgba(0,0,0,0.6)",
        stroke_width: "0.12 vmin",
        animations: dynamic ? [textSlideUp(0.1)] : [quickFade(0.05)],
      },
      {
        name: "Car-Subtitle",
        type: "text",
        track: 6,
        time: 0,
        duration,
        x: "7%",
        y: "84%",
        width: "85%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.carSubtitle,
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: "2.8 vmin",
        letter_spacing: "3%",
        fill_color: COLORS.textSoft,
        stroke_color: "rgba(0,0,0,0.5)",
        stroke_width: "0.1 vmin",
        animations: dynamic
          ? [slideIn("0°", 0.2), quickFade(0.2)]
          : [quickFade(0.1)],
      },
    ],
  };
}

// ─── Specs ───────────────────────────────────────────────────────────────────

function buildSpecRow(
  icon: string,
  label: string,
  value: string,
  yPercent: number,
  duration: number,
  startTime: number,
  trackBase: number,
  style: TemplateStyle,
): RenderElement[] {
  const rowDuration = duration - startTime;
  const y = `${yPercent}%`;
  const dynamic = style === "dynamic";

  return [
    {
      name: `${label}-Icon`,
      type: "text",
      track: trackBase,
      time: startTime,
      duration: rowDuration,
      x: "5%",
      y,
      x_anchor: "0%",
      y_anchor: "0%",
      text: icon,
      font_size: "4 vmin",
      fill_color: COLORS.text,
      animations: [
        dynamic
          ? { time: 0, duration: 0.5, easing: "elastic-out", type: "scale", end_scale: "100%", start_scale: "0%" }
          : { time: 0, duration: 0.45, easing: "back-out", type: "scale", end_scale: "100%", start_scale: "0%" },
      ],
    },
    {
      name: `${label}-Label`,
      type: "text",
      track: trackBase + 1,
      time: startTime + 0.1,
      duration: rowDuration - 0.1,
      x: "13%",
      y,
      width: "26%",
      x_anchor: "0%",
      y_anchor: "0%",
      text: label,
      font_family: "Roboto Condensed",
      font_size: "1.9 vmin",
      letter_spacing: "6%",
      fill_color: COLORS.textDim,
      animations: dynamic
        ? [slideIn("90°", 0.05)]
        : [
            {
              time: 0,
              duration: 0.4,
              easing: "quadratic-out",
              type: "slide",
              distance: "4%",
              direction: "90°",
            },
          ],
    },
    {
      name: `${label}-Value`,
      type: "text",
      track: trackBase + 2,
      time: startTime + 0.15,
      duration: rowDuration - 0.15,
      x: "13%",
      y: `${yPercent + 4}%`,
      width: "26%",
      x_anchor: "0%",
      y_anchor: "0%",
      text: value,
      font_family: "Montserrat",
      font_weight: "700",
      font_size: "2.8 vmin",
      fill_color: COLORS.text,
      animations: dynamic ? [textSlideUp(0.1)] : [quickFade(0.1)],
    },
  ];
}

function buildSpecsScene(
  photoUrl: string,
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const isReels = format === "reels";

  const photoLayout = isReels
    ? { x: "50%", y: "72%", width: "100%" }
    : { x: "62%", width: "76%" };

  const panelLayout = isReels
    ? { x: "0%", y: "0%", width: "100%", height: "48%", x_anchor: "0%", y_anchor: "0%" }
    : { x: "0%", width: "42%", height: "100%", x_anchor: "0%" };

  const dynamic = style === "dynamic";
  const specStarts = dynamic ? [0.2, 0.45, 0.7, 0.95] : [0, 0, 0, 0];

  const specRows = [
    ...buildSpecRow("⏱", "KİLOMETRE", data.specKm, 22, duration, specStarts[0], 4, style),
    ...buildSpecRow("⛽", "YAKIT", data.specFuel, 36, duration, specStarts[1], 7, style),
    ...buildSpecRow("⚙", "VİTES", data.specGear, 50, duration, specStarts[2], 10, style),
    ...buildSpecRow("📅", "MODEL YILI", data.specYear, 64, duration, specStarts[3], 13, style),
  ];

  if (isReels) {
    for (const el of specRows) {
      if (el.y === "22%") el.y = "8%";
      if (el.y === "26%") el.y = "12%";
      if (el.y === "36%") el.y = "18%";
      if (el.y === "40%") el.y = "22%";
      if (el.y === "50%") el.y = "28%";
      if (el.y === "54%") el.y = "32%";
      if (el.y === "64%") el.y = "38%";
      if (el.y === "68%") el.y = "42%";
    }
  }

  return {
    name: "Specs",
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      buildCarPhoto("Photo-2", photoUrl, duration, 1, {
        ...photoLayout,
        height: isReels ? "56%" : "100%",
      }, dynamic ? [slideIn(isReels ? "180°" : "270°", 0)] : []),
      {
        name: "Specs-Panel",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        ...panelLayout,
        path: rectPath(),
        fill_color: [
          { offset: "0%", color: COLORS.panel },
          { offset: "100%", color: COLORS.bg },
        ],
        animations: [
          {
            time: 0,
            duration: 0.5,
            easing: "quadratic-out",
            type: "slide",
            distance: "8%",
            direction: isReels ? "180°" : "90°",
          },
        ],
      },
      {
        name: "Specs-Heading",
        type: "text",
        track: 3,
        time: 0.4,
        duration: duration - 0.4,
        x: "4%",
        y: isReels ? "4%" : "14%",
        width: isReels ? "90%" : "34%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: "TEKNİK ÖZELLİKLER",
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "3 vmin",
        letter_spacing: "5%",
        fill_color: COLORS.accent,
        animations: [
          {
            time: 0,
            duration: 0.5,
            easing: "quadratic-out",
            type: "fade",
          },
        ],
      },
      ...specRows,
    ],
  };
}

// ─── Multi-image sahneler ────────────────────────────────────────────────────
// YouTube: Specs ile aynı grid — sol panel %42, sağ galeri %58

const PANEL_W_YT = 42;

const SPLIT_LAYOUT = {
  youtube: {
    panel: { x: "0%", width: `${PANEL_W_YT}%`, height: "100%", x_anchor: "0%" as const },
    panelText: { x: "4%", width: "34%" },
    photoZone: { x: `${PANEL_W_YT}%`, width: `${100 - PANEL_W_YT}%`, height: "100%", x_anchor: "0%" as const },
    dividerX: `${PANEL_W_YT}%`,
    duo: {
      photos: [
        { x: "56%", y: "54%", width: "26%", height: "42%" },
        { x: "86%", y: "54%", width: "26%", height: "42%" },
      ],
    },
    trio: {
      hero: { x: "58%", y: "54%", width: "28%", height: "46%" },
      stack: [
        { x: "87%", y: "34%", width: "22%", height: "21%" },
        { x: "87%", y: "70%", width: "22%", height: "21%" },
      ],
    },
  },
  reels: {
    panel: { x: "0%", y: "100%", width: "100%", height: "46%", x_anchor: "0%" as const, y_anchor: "100%" as const },
    panelText: { x: "5%", width: "90%" },
    photoZone: { x: "0%", y: "0%", width: "100%", height: "54%", x_anchor: "0%" as const, y_anchor: "0%" as const },
    photoZoneEnd: "54%",
    duo: {
      photos: [
        { x: "27%", y: "24%", width: "44%", height: "32%" },
        { x: "73%", y: "24%", width: "44%", height: "32%" },
      ],
    },
    trio: {
      photos: [
        { x: "17%", y: "24%", width: "28%", height: "30%" },
        { x: "50%", y: "24%", width: "28%", height: "30%" },
        { x: "83%", y: "24%", width: "28%", height: "30%" },
      ],
    },
  },
} as const;

function buildPanelSpecRows(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  trackStart: number,
  style: TemplateStyle,
): RenderElement[] {
  const isReels = format === "reels";

  if (isReels) {
    const items = [
      { label: "KİLOMETRE", value: data.specKm, y: 64 },
      { label: "YAKIT", value: data.specFuel, y: 72 },
      { label: "VİTES", value: data.specGear, y: 80 },
      { label: "MODEL", value: data.specYear, y: 88 },
    ];
    const dynamic = style === "dynamic";
    return items.flatMap((item, i) => [
      {
        name: `Panel-Spec-${item.label}`,
        type: "text",
        track: trackStart + i * 2,
        time: 0.2 + i * 0.08,
        duration: duration - 0.2 - i * 0.08,
        x: "5%",
        y: `${item.y}%`,
        width: "28%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: item.label,
        font_family: "Roboto Condensed",
        font_size: "1.7 vmin",
        letter_spacing: "5%",
        fill_color: COLORS.textDim,
        animations: dynamic ? [slideIn("90°", 0)] : [quickFade(0)],
      },
      {
        name: `Panel-Spec-${item.label}-Val`,
        type: "text",
        track: trackStart + i * 2 + 1,
        time: 0.28 + i * 0.08,
        duration: duration - 0.28 - i * 0.08,
        x: "36%",
        y: `${item.y}%`,
        width: "58%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: item.value,
        font_family: "Montserrat",
        font_weight: "700",
        font_size: "2.4 vmin",
        fill_color: COLORS.text,
        animations: dynamic ? [textSlideUp(0.05)] : [quickFade(0.05)],
      },
    ]);
  }

  return [
    ...buildSpecRow("⏱", "KİLOMETRE", data.specKm, 30, duration, 0.2, trackStart, style),
    ...buildSpecRow("⛽", "YAKIT", data.specFuel, 44, duration, 0.35, trackStart + 3, style),
    ...buildSpecRow("⚙", "VİTES", data.specGear, 58, duration, 0.5, trackStart + 6, style),
    ...buildSpecRow("📅", "MODEL", data.specYear, 72, duration, 0.65, trackStart + 9, style),
  ];
}

function buildSplitInfoContent(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  infoVariant: number,
  trackStart: number,
): RenderElement[] {
  const isReels = format === "reels";
  const dynamic = style === "dynamic";
  const { panelText } = SPLIT_LAYOUT[isReels ? "reels" : "youtube"];
  const { x: textX, width: textW } = panelText;

  const contentTop = isReels ? 58 : 12;
  const heading =
    infoVariant === 0
      ? "ARAÇ BİLGİLERİ"
      : infoVariant === 1
        ? "TEKNİK DETAYLAR"
        : "ÖZET";

  const accentBar: RenderElement = {
    name: "Split-Accent-Bar",
    type: "shape",
    track: trackStart,
    time: 0,
    duration,
    x: textX,
    y: `${contentTop}%`,
    width: "14%",
    height: "0.45 vmin",
    x_anchor: "0%",
    y_anchor: "0%",
    path: rectPath(),
    fill_color: COLORS.accent,
    animations: [
      {
        time: 0.1,
        duration: 0.4,
        easing: "quadratic-out",
        type: "scale",
        fade: false,
        x_anchor: "0%",
        end_scale: "100% 100%",
        start_scale: "0% 100%",
      },
    ],
  };

  const headingEl: RenderElement = {
    name: "Split-Info-Heading",
    type: "text",
    track: trackStart + 1,
    time: 0.15,
    duration: duration - 0.15,
    x: textX,
    y: `${contentTop + 3}%`,
    width: textW,
    x_anchor: "0%",
    y_anchor: "0%",
    text: heading,
    font_family: "Montserrat",
    font_weight: "800",
    font_size: isReels ? "2.8 vmin" : "2.4 vmin",
    letter_spacing: "6%",
    fill_color: COLORS.accent,
    animations: dynamic ? [textSlideUp(0)] : [quickFade(0)],
  };

  if (infoVariant === 0) {
    return [
      accentBar,
      headingEl,
      {
        name: "Split-Car-Title",
        type: "text",
        track: trackStart + 2,
        time: 0.25,
        duration: duration - 0.25,
        x: textX,
        y: `${contentTop + 10}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.carTitle,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: isReels ? "4 vmin" : "3.2 vmin",
        fill_color: COLORS.text,
        animations: dynamic ? [textSlideUp(0.08)] : [quickFade(0.08)],
      },
      {
        name: "Split-Car-Subtitle",
        type: "text",
        track: trackStart + 3,
        time: 0.35,
        duration: duration - 0.35,
        x: textX,
        y: `${contentTop + (isReels ? 18 : 22)}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.carSubtitle,
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: isReels ? "2.4 vmin" : "2 vmin",
        letter_spacing: "2%",
        fill_color: COLORS.textSoft,
        animations: dynamic ? [slideIn("0°", 0.1)] : [quickFade(0.1)],
      },
      {
        name: "Split-Price",
        type: "text",
        track: trackStart + 4,
        time: 0.45,
        duration: duration - 0.45,
        x: textX,
        y: `${contentTop + (isReels ? 27 : 34)}%`,
        x_anchor: "0%",
        y_anchor: "0%",
        text: data.priceTag,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: isReels ? "4.5 vmin" : "3.8 vmin",
        fill_color: COLORS.accent,
        animations: dynamic ? [popIn(0.12)] : [quickFade(0.12)],
      },
    ];
  }

  if (infoVariant === 1) {
    return [
      accentBar,
      headingEl,
      ...buildPanelSpecRows(data, duration, format, trackStart + 2, style),
    ];
  }

  return [
    accentBar,
    headingEl,
    {
      name: "Split-Dealer",
      type: "text",
      track: trackStart + 2,
      time: 0.25,
      duration: duration - 0.25,
      x: textX,
      y: `${contentTop + 10}%`,
      width: textW,
      x_anchor: "0%",
      y_anchor: "0%",
      text: data.dealerName,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: isReels ? "3.8 vmin" : "3.2 vmin",
      letter_spacing: "4%",
      fill_color: COLORS.text,
      animations: dynamic ? [textSlideUp(0.05)] : [quickFade(0.05)],
    },
    {
      name: "Split-Summary-Title",
      type: "text",
      track: trackStart + 3,
      time: 0.35,
      duration: duration - 0.35,
      x: textX,
      y: `${contentTop + (isReels ? 16 : 20)}%`,
      width: textW,
      x_anchor: "0%",
      y_anchor: "0%",
      text: data.carTitle,
      font_family: "Montserrat",
      font_weight: "700",
      font_size: isReels ? "3 vmin" : "2.6 vmin",
      fill_color: COLORS.textSoft,
      animations: dynamic ? [slideIn("0°", 0.08)] : [quickFade(0.08)],
    },
    {
      name: "Split-Summary-Price",
      type: "text",
      track: trackStart + 4,
      time: 0.45,
      duration: duration - 0.45,
      x: textX,
      y: `${contentTop + (isReels ? 25 : 32)}%`,
      x_anchor: "0%",
      y_anchor: "0%",
      text: data.priceTag,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: isReels ? "4.8 vmin" : "4.2 vmin",
      fill_color: COLORS.accent,
      animations: dynamic ? [popIn(0.1)] : [quickFade(0.1)],
    },
    {
      name: "Split-Phone",
      type: "text",
      track: trackStart + 5,
      time: 0.55,
      duration: duration - 0.55,
      x: textX,
      y: `${contentTop + (isReels ? 34 : 46)}%`,
      width: textW,
      x_anchor: "0%",
      y_anchor: "0%",
      text: data.phone,
      font_family: "Roboto Condensed",
      font_weight: "700",
      font_size: isReels ? "2.6 vmin" : "2.3 vmin",
      letter_spacing: "4%",
      fill_color: COLORS.textMuted,
      animations: dynamic ? [textSlideUp(0.1)] : [quickFade(0.1)],
    },
  ];
}

function buildMultiImageBase(
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
): { isReels: boolean; layout: typeof SPLIT_LAYOUT.youtube | typeof SPLIT_LAYOUT.reels; elements: RenderElement[] } {
  const isReels = format === "reels";
  const layout = SPLIT_LAYOUT[isReels ? "reels" : "youtube"];
  const dynamic = style === "dynamic";

  const elements: RenderElement[] = [
    ...(dynamic ? [flashAccent()] : []),
    {
      name: "Info-Panel-Bg",
      type: "shape",
      track: 1,
      time: 0,
      duration,
      path: rectPath(),
      fill_color: [
        { offset: "0%", color: COLORS.panel },
        { offset: "100%", color: COLORS.bg },
      ],
      ...layout.panel,
      animations: [
        {
          time: 0,
          duration: 0.5,
          easing: "quadratic-out",
          type: "slide",
          distance: "6%",
          direction: isReels ? "180°" : "90°",
        },
      ],
    },
    {
      name: "Photo-Zone-Bg",
      type: "shape",
      track: 2,
      time: 0,
      duration,
      path: rectPath(),
      fill_color: COLORS.bg,
      ...layout.photoZone,
    },
  ];

  if (isReels) {
    elements.push({
      name: "Photo-Zone-Gradient",
      type: "shape",
      track: 3,
      time: 0,
      duration,
      x: "0%",
      y: SPLIT_LAYOUT.reels.photoZoneEnd,
      width: "100%",
      height: "10%",
      y_anchor: "50%",
      path: rectPath(),
      fill_color: [
        { offset: "0%", color: "rgba(10,10,10,0)" },
        { offset: "100%", color: COLORS.panel },
      ],
    });
  } else {
    elements.push({
      name: "Photo-Zone-Divider",
      type: "shape",
      track: 3,
      time: 0,
      duration,
      x: SPLIT_LAYOUT.youtube.dividerX,
      y: "50%",
      width: "0.3 vmin",
      height: "90%",
      x_anchor: "50%",
      y_anchor: "50%",
      path: rectPath(),
      fill_color: COLORS.accent,
      animations: dynamic
        ? [
            {
              time: 0.1,
              duration: 0.4,
              easing: "quadratic-out",
              type: "scale",
              fade: false,
              y_anchor: "50%",
              end_scale: "100% 100%",
              start_scale: "0% 100%",
            },
          ]
        : [],
    });
  }

  return { isReels, layout, elements };
}

function buildGalleryHeader(
  counter: string,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  track: number,
): RenderElement[] {
  const isReels = format === "reels";
  const dynamic = style === "dynamic";
  const zoneLeft = isReels ? "5%" : `${PANEL_W_YT + 3}%`;

  return [
    {
      name: "Gallery-Label",
      type: "text",
      track,
      time: 0,
      duration,
      x: zoneLeft,
      y: isReels ? "4%" : "5%",
      x_anchor: "0%",
      y_anchor: "0%",
      text: "GALERİ",
      font_family: "Montserrat",
      font_weight: "800",
      font_size: isReels ? "2.4 vmin" : "2.1 vmin",
      letter_spacing: "12%",
      fill_color: COLORS.accent,
      animations: dynamic ? [slideIn("90°", 0.05)] : [quickFade(0.05)],
    },
    {
      name: "Photo-Counter",
      type: "text",
      track: track + 1,
      time: 0,
      duration,
      x: isReels ? "95%" : "97%",
      y: isReels ? "4%" : "5%",
      x_anchor: "100%",
      y_anchor: "0%",
      text: counter,
      font_family: "Roboto Condensed",
      font_weight: "700",
      font_size: "1.9 vmin",
      letter_spacing: "5%",
      fill_color: COLORS.textMuted,
      animations: dynamic ? [quickFade(0.1)] : [quickFade(0)],
    },
  ];
}

function buildSplitDuoScene(
  scene: Extract<MiddleScene, { kind: "split-duo" }>,
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const isReels = format === "reels";
  const { elements } = buildMultiImageBase(duration, format, style);
  const photoLayouts = isReels
    ? SPLIT_LAYOUT.reels.duo.photos
    : SPLIT_LAYOUT.youtube.duo.photos;
  const slideDirs: ("90°" | "270°")[] = ["90°", "270°"];

  const photoElements = scene.urls.map((url, idx) =>
    buildGalleryPhoto(
      `Photo-${scene.photoNumbers[idx]}`,
      url,
      duration,
      5 + idx,
      photoLayouts[idx],
      style,
      idx * 0.1,
      slideDirs[idx],
    ),
  );

  return {
    name: `Split-Duo-${scene.photoNumbers[0]}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...elements,
      ...photoElements,
      ...buildGalleryHeader(
        `${scene.photoNumbers[0]}–${scene.photoNumbers[1]} / ${scene.totalPhotos}`,
        duration,
        format,
        style,
        10,
      ),
      ...buildSplitInfoContent(data, duration, format, style, scene.infoVariant, 12),
    ],
  };
}

function buildSplitTrioScene(
  scene: Extract<MiddleScene, { kind: "split-trio" }>,
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const isReels = format === "reels";
  const { elements } = buildMultiImageBase(duration, format, style);

  let photoElements: RenderElement[];

  if (isReels) {
    const slideDirs: ("90°" | "270°" | "0°")[] = ["90°", "0°", "270°"];
    const reelPhotos = SPLIT_LAYOUT.reels.trio.photos;
    photoElements = scene.urls.map((url, idx) =>
      buildGalleryPhoto(
        `Photo-${scene.photoNumbers[idx]}`,
        url,
        duration,
        5 + idx,
        reelPhotos[idx],
        style,
        idx * 0.08,
        slideDirs[idx],
      ),
    );
  } else {
    const ytTrio = SPLIT_LAYOUT.youtube.trio;
    photoElements = [
      buildGalleryPhoto(
        `Photo-${scene.photoNumbers[0]}`,
        scene.urls[0],
        duration,
        5,
        ytTrio.hero,
        style,
        0,
        "90°",
      ),
      buildGalleryPhoto(
        `Photo-${scene.photoNumbers[1]}`,
        scene.urls[1],
        duration,
        6,
        ytTrio.stack[0],
        style,
        0.1,
        "0°",
      ),
      buildGalleryPhoto(
        `Photo-${scene.photoNumbers[2]}`,
        scene.urls[2],
        duration,
        7,
        ytTrio.stack[1],
        style,
        0.18,
        "180°",
      ),
    ];
  }

  return {
    name: `Split-Trio-${scene.photoNumbers[0]}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...elements,
      ...photoElements,
      ...buildGalleryHeader(
        `${scene.photoNumbers[0]}–${scene.photoNumbers[2]} / ${scene.totalPhotos}`,
        duration,
        format,
        style,
        11,
      ),
      ...buildSplitInfoContent(data, duration, format, style, scene.infoVariant, 14),
    ],
  };
}

function buildMiddleScene(
  scene: MiddleScene,
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  switch (scene.kind) {
    case "split-duo":
      return buildSplitDuoScene(scene, data, duration, format, style, transitionIndex);
    case "split-trio":
      return buildSplitTrioScene(scene, data, duration, format, style, transitionIndex);
    default:
      return buildPhotoShowcaseScene(scene, duration, data.carTitle, style, transitionIndex);
  }
}

// ─── Foto showcase (tek foto tam ekran) ─────────────────────────────────────

function buildPhotoShowcaseScene(
  scene: Extract<MiddleScene, { kind: "showcase" }>,
  duration: number,
  carTitle: string,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const dynamic = style === "dynamic";
  const slideDir = scene.photoNumber % 2 === 0 ? "270°" : "90°";

  return {
    name: `Showcase-${scene.photoNumber}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      buildCarPhoto(
        `Photo-${scene.photoNumber}`,
        scene.url,
        duration,
        1,
        { width: "100%", height: "100%" },
        dynamic ? [slideIn(slideDir, 0)] : [quickFade(0)],
      ),
      {
        name: "Photo-Counter",
        type: "text",
        track: 3,
        time: 0,
        duration,
        x: "4%",
        y: "6%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: `${scene.photoNumber} / ${scene.totalPhotos}`,
        font_family: "Roboto Condensed",
        font_weight: "700",
        font_size: "2.4 vmin",
        letter_spacing: "8%",
        background_color: "rgba(0,0,0,0.65)",
        background_x_padding: "45%",
        background_y_padding: "40%",
        background_border_radius: "25%",
        fill_color: COLORS.text,
        animations: dynamic ? [popIn(0.05)] : [quickFade(0)],
      },
      {
        name: "Showcase-Title",
        type: "text",
        track: 4,
        time: 0,
        duration,
        y: "92%",
        width: "92%",
        x_alignment: "50%",
        y_anchor: "100%",
        text: carTitle,
        font_family: "Montserrat",
        font_weight: "700",
        font_size: "3 vmin",
        fill_color: COLORS.text,
        stroke_color: "rgba(0,0,0,0.55)",
        stroke_width: "0.1 vmin",
        animations: dynamic ? [textSlideUp(0.12)] : [quickFade(0.1)],
      },
    ],
  };
}

// ─── Outro ───────────────────────────────────────────────────────────────────

function buildOutroScene(
  data: CarVideoFormData,
  duration: number,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const dynamic = style === "dynamic";
  return {
    name: "Outro",
    type: "composition",
    track: 2,
    duration,
    fill_color: COLORS.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      {
        type: "shape",
        track: 1,
        time: 0,
        duration,
        width: "100%",
        height: "100%",
        path: rectPath(),
        fill_color: [
          { offset: "0%", color: COLORS.panelLight },
          { offset: "100%", color: COLORS.bg },
        ],
      },
      {
        name: "CTA-Main",
        type: "text",
        track: 2,
        time: 0,
        duration,
        y: "38%",
        width: "90%",
        x_alignment: "50%",
        y_alignment: "100%",
        text: data.ctaMain,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "8 vmin",
        fill_color: COLORS.text,
        animations: dynamic ? [popIn(0), quickFade(0)] : [quickFade(0)],
      },
      {
        name: "Phone",
        type: "text",
        track: 3,
        time: 0,
        duration,
        y: "54%",
        width: "90%",
        x_alignment: "50%",
        text: data.phone,
        font_family: "Roboto Condensed",
        font_weight: "700",
        font_size: "5 vmin",
        letter_spacing: "5%",
        fill_color: COLORS.accent,
        animations: dynamic ? [textSlideUp(0.15)] : [quickFade(0.1)],
      },
      {
        name: "Address",
        type: "text",
        track: 4,
        time: 0,
        duration,
        y: "66%",
        width: "90%",
        x_alignment: "50%",
        text: data.address,
        font_family: "Roboto Condensed",
        font_size: "2.6 vmin",
        fill_color: COLORS.textMuted,
        animations: dynamic ? [slideIn("0°", 0.25)] : [quickFade(0.2)],
      },
    ],
  };
}

// ─── Ana üretici ─────────────────────────────────────────────────────────────

export function buildRenderScript(
  formData: CarVideoFormData,
  format: VideoFormat,
): RenderScript {
  const style = formData.templateStyle === "dynamic" ? "dynamic" : "classic";
  const { width, height } = formatDimensions(format);
  const photos = formData.photos.map((p) => p.trim()).filter(Boolean);
  const middleScenes = planMiddleScenes(photos);
  const middleDuration = calcMiddleSceneDuration(middleScenes.length);

  let transitionIndex = 0;

  const plans: ScenePlan[] = [
    {
      name: "intro",
      duration: BASE_DURATION.intro,
      build: (time) => ({
        ...buildIntroScene(formData, BASE_DURATION.intro, style),
        time,
      }),
    },
    {
      name: "hero",
      duration: BASE_DURATION.hero,
      build: (time) => ({
        ...buildHeroScene(
          photos[0],
          formData,
          BASE_DURATION.hero,
          style,
          ++transitionIndex,
        ),
        time,
      }),
    },
    {
      name: "specs",
      duration: BASE_DURATION.specs,
      build: (time) => ({
        ...buildSpecsScene(
          photos[1],
          formData,
          BASE_DURATION.specs,
          format,
          style,
          ++transitionIndex,
        ),
        time,
      }),
    },
    ...middleScenes.map((scene, index): ScenePlan => ({
      name: `middle-${index}`,
      duration: middleDuration,
      build: (time) => ({
        ...buildMiddleScene(
          scene,
          formData,
          middleDuration,
          format,
          style,
          ++transitionIndex,
        ),
        time,
      }),
    })),
    {
      name: "outro",
      duration: BASE_DURATION.outro,
      build: (time) => ({
        ...buildOutroScene(
          formData,
          BASE_DURATION.outro,
          style,
          ++transitionIndex,
        ),
        time,
      }),
    },
  ];

  const totalDuration = plans.reduce((sum, p) => sum + p.duration, 0);
  const sceneElements = plans.map((p) => p.build(0)).map((el, i) => {
    const time = plans.slice(0, i).reduce((sum, p) => sum + p.duration, 0);
    return { ...el, time };
  });

  const audioElements: RenderElement[] = [buildMusicElement(formData)];
  const voiceover = buildVoiceoverElement(formData);
  if (voiceover) audioElements.push(voiceover);

  return {
    output_format: "mp4",
    width,
    height,
    frame_rate: 30,
    elements: [...sceneElements, ...audioElements],
  };
}

export function distributePhotos(photos: string[]): MiddleScene[] {
  return planMiddleScenes(photos);
}
