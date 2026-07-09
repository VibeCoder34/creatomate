// Creatomate RenderScript — araba tanıtım videosu (örnek şablona göre)

import {
  estimateTextDuration,
  MAX_VIDEO_SECONDS,
  MIN_VIDEO_SECONDS,
  scaleMiddleDurations,
  voiceBlockDuration,
  VO_GAP_SEC,
} from "@/lib/voiceoverTiming";
import { isPlaceholderDealerName, videoTemplateStrings } from "@/lib/videoTemplateI18n";
import {
  aspectRatioForFormat,
  collectSpecChunks,
  collectSpecLines,
  collectDisplaySpecLines,
  formatDimensions,
  heroTypography,
  introTypography,
  layoutProfile,
  MAX_SPEC_SCENES,
  outroTypography,
  splitLayoutFor,
  truncateSubtitle,
  truncateTitle,
  truncateLabel,
  type SpecChunk,
  type SpecLine,
} from "@/lib/templateFormat";
import {
  buildCreatomateElevenLabsProvider,
  parseTtsLanguage,
  type TtsLanguage,
} from "@/lib/elevenlabs";
import { buildStudioRenderScript } from "@/lib/studioTemplate/render";

export { aspectRatioForFormat, formatDimensions };

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

const COLORS_MODERN = {
  bg: "#081018",
  panel: "#0a455a",
  panelLight: "#0d5a73",
  accent: "#f27420",
  text: "#ffffff",
  textMuted: "#a8c5d4",
  textDim: "#7fa3b5",
  textSoft: "#e8f4fa",
} as const;

type Palette = {
  bg: string;
  panel: string;
  panelLight: string;
  accent: string;
  text: string;
  textMuted: string;
  textDim: string;
  textSoft: string;
};

function colorsFor(style: TemplateStyle): Palette {
  return style === "dynamic" ? COLORS_MODERN : COLORS;
}

function isPortraitStack(format: VideoFormat): boolean {
  return format === "reels" || format === "square";
}

const MUSIC_SOURCE = "https://cdn.creatomate.com/demo/music3.mp3";

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

export type VideoFormat = "reels" | "youtube" | "square";
export type TemplateStyle = "classic" | "dynamic";
export type TemplateEngine = "legacy" | "studio";

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
  specMotor?: string;
  specColor?: string;
  specBody?: string;
  specSeries?: string;
  specEnginePower?: string;
  specEngineVolume?: string;
  specDrivetrain?: string;
  specCondition?: string;
  specWarranty?: string;
  specDamage?: string;
  ctaMain: string;
  phone: string;
  address: string;
  photos: string[];
  format: VideoFormat;
  templateStyle: TemplateStyle;
  /** legacy = mevcut şablon, studio = yeni sahne planlayıcı */
  templateEngine?: TemplateEngine;
  /** Videodaki sabit metinlerin dili */
  videoLanguage?: string;
  /** Özel müzik URL (yoksa varsayılan Creatomate demo müziği) */
  musicSource?: string;
  /** Harici ses dosyası URL (yedek yol) */
  voiceoverAudioSource?: string;
  /** Creatomate içinde ElevenLabs ile üretilecek seslendirme metni (tek parça — yedek) */
  voiceoverText?: string;
  /** photos[] ile aynı sırada — sahne bazlı seslendirme */
  photoVoiceovers?: string[];
  /** Fotoğraf başına TTS süresi (saniye) */
  photoVoiceoverDurations?: number[];
  /** Önceden üretilmiş ses URL'leri (varsa Creatomate provider yerine) */
  photoVoiceoverSources?: string[];
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

// ─── Fotoğraf planlama ────────────────────────────────────────────────────────

/**
 * Foto 1 → hero, foto 2+ → spec chunk sahneleri (buildSceneSchedule).
 * Kalan fotoğraflar: split / showcase galeri sahneleri.
 */
export function planMiddleScenes(
  photos: string[],
  format: VideoFormat = "reels",
  galleryStartIndex = 2,
): MiddleScene[] {
  const total = photos.length;
  const rest = photos.slice(galleryStartIndex);
  const scenes: MiddleScene[] = [];
  const allowTrio = format === "youtube";
  let i = 0;
  let infoVariant = 0;
  let pattern = 0;

  while (i < rest.length) {
    const left = rest.length - i;
    const baseNum = i + galleryStartIndex + 1;

    if (left >= 3 && pattern % 2 === 0 && allowTrio) {
      scenes.push({
        kind: "split-trio",
        urls: [rest[i], rest[i + 1], rest[i + 2]],
        photoNumbers: [baseNum, baseNum + 1, baseNum + 2],
        totalPhotos: total,
        infoVariant,
      });
      i += 3;
    } else if (left >= 2) {
      scenes.push({
        kind: "split-duo",
        urls: [rest[i], rest[i + 1]],
        photoNumbers: [baseNum, baseNum + 1],
        totalPhotos: total,
        infoVariant,
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

/** Split panel içeriği: araç özeti → spec grupları → özet */
export function splitInfoCycleLength(chunkCount: number): number {
  return Math.max(3, chunkCount + 2);
}

function normalizeInfoVariant(infoVariant: number, chunkCount: number): number {
  const cycle = splitInfoCycleLength(chunkCount);
  return ((infoVariant % cycle) + cycle) % cycle;
}

/** @deprecated planMiddleScenes kullanın */
export function planShowcaseScenes(photos: string[]): MiddleScene[] {
  return planMiddleScenes(photos);
}

function calcMiddleSceneDuration(sceneCount: number, specSceneCount: number): number {
  const fixed =
    BASE_DURATION.intro +
    BASE_DURATION.hero +
    BASE_DURATION.specs * specSceneCount +
    BASE_DURATION.outro;

  if (sceneCount === 0) {
    return BASE_DURATION.showcase;
  }

  const needed = MIN_VIDEO_SECONDS - fixed;
  return Math.max(3, needed / sceneCount);
}

function specFontSize(format: VideoFormat, compact: boolean): string {
  if (format === "youtube") return compact ? "2.1 vmin" : "2.4 vmin";
  if (format === "square") return compact ? "2.2 vmin" : "2.5 vmin";
  return compact ? "2.3 vmin" : "2.6 vmin";
}

function specGridMetrics(format: VideoFormat, columns: 1 | 2): { valueOffset: number; rowStep: number } {
  if (columns === 2) {
    return {
      valueOffset: 3.2,
      rowStep: format === "youtube" ? 9.8 : 8.8,
    };
  }
  return {
    valueOffset: 3.5,
    rowStep: format === "youtube" ? 10.5 : format === "square" ? 9.8 : 10,
  };
}

function planSpecGridLayout(
  lineCount: number,
  format: VideoFormat,
  scene: "specs" | "split",
): {
  columns: 1 | 2;
  x: string;
  col2X: string;
  colWidth: string;
  yStart: number;
} {
  const portrait = format !== "youtube";
  const columns: 1 | 2 = lineCount >= 4 ? 2 : 1;
  const { rowStep, valueOffset } = specGridMetrics(format, columns);
  const rows = columns === 2 ? Math.ceil(lineCount / 2) : lineCount;
  const contentHeight = rows * rowStep + valueOffset;

  if (!portrait) {
    const headingBottom = scene === "specs" ? 18 : 26;
    const regionBottom = 92;
    const avail = regionBottom - headingBottom;
    const yStart = headingBottom + Math.max(0, (avail - contentHeight) / 2);
    return {
      columns,
      x: "4%",
      col2X: "21%",
      colWidth: "15%",
      yStart,
    };
  }

  if (scene === "specs") {
    const panelHeight = format === "square" ? 46 : 48;
    const headingSpace = 13;
    const yStart = headingSpace + Math.max(0, (panelHeight - headingSpace - contentHeight) / 2);
    return {
      columns,
      x: "5%",
      col2X: "52%",
      colWidth: "42%",
      yStart,
    };
  }

  const panelTop = format === "square" ? 56 : 58;
  const contentTop = panelTop + 12;
  const panelBottom = 96;
  const avail = panelBottom - contentTop;
  const yStart = contentTop + Math.max(0, (avail - contentHeight) / 2);
  return {
    columns,
    x: "5%",
    col2X: "52%",
    colWidth: "42%",
    yStart,
  };
}

function buildSpecGridElements(
  lines: SpecLine[],
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  trackStart: number,
  palette: Palette,
  opts: {
    x: string;
    yStart: number;
    width: string;
    columns: 1 | 2;
    rowStep?: number;
    col2X?: string;
    colWidth?: string;
  },
): RenderElement[] {
  const dynamic = style === "dynamic";
  const elements: RenderElement[] = [];
  const { valueOffset, rowStep } = {
    ...specGridMetrics(format, opts.columns),
    ...(opts.rowStep !== undefined ? { rowStep: opts.rowStep } : {}),
  };
  const col2X = opts.col2X ?? "52%";
  const twoColWidth = opts.colWidth ?? "46%";

  lines.forEach((line, index) => {
    const col = opts.columns === 2 ? index % 2 : 0;
    const row = opts.columns === 2 ? Math.floor(index / 2) : index;
    const x = opts.columns === 2 ? (col === 0 ? opts.x : col2X) : opts.x;
    const y = opts.yStart + row * rowStep;
    const colWidth = opts.columns === 2 ? twoColWidth : opts.width;

    elements.push(
      {
        name: `Spec-${line.label}-Label`,
        type: "text",
        track: trackStart + index * 2,
        time: 0.15 + index * 0.05,
        duration: duration - 0.15,
        x,
        y: `${y}%`,
        width: colWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: `${line.icon} ${line.label}`,
        font_family: "Roboto Condensed",
        font_size: specFontSize(format, true),
        letter_spacing: "4%",
        line_height: "110%",
        fill_color: palette.textDim,
        animations: dynamic ? [slideIn("90°", 0)] : [quickFade(0)],
      },
      {
        name: `Spec-${line.label}-Value`,
        type: "text",
        track: trackStart + index * 2 + 1,
        time: 0.2 + index * 0.05,
        duration: duration - 0.2,
        x,
        y: `${y + valueOffset}%`,
        width: colWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: line.value,
        font_family: "Montserrat",
        font_weight: "700",
        font_size: specFontSize(format, false),
        line_height: "110%",
        fill_color: palette.text,
        animations: dynamic ? [textSlideUp(0.05)] : [quickFade(0.05)],
      },
    );
  });

  return elements;
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
        fit: "contain",
        x_alignment: "50%",
        y_alignment: "50%",
      },
    ],
  };
}

export type SceneScheduleEntry = {
  name: string;
  startTime: number;
  duration: number;
  photoIndices: number[];
};

export type VoiceoverCue = {
  time: number;
  text: string;
  photoIndex: number;
};

export type SceneTimingOptions = {
  photoVoiceovers?: string[];
  photoVoiceoverDurations?: number[];
};

function middleSceneBaseDuration(scene: MiddleScene): number {
  return scene.kind === "showcase" ? BASE_DURATION.showcase : BASE_DURATION.split;
}

/** Video sahne zaman çizelgesi — ses süresine göre sahne uzunluğu ayarlanır */
export function buildSceneSchedule(
  photos: string[],
  format: VideoFormat = "reels",
  timing?: SceneTimingOptions,
  specSceneCount = 1,
): SceneScheduleEntry[] {
  const galleryStartIndex = 1 + specSceneCount;
  const middleScenes = planMiddleScenes(photos, format, galleryStartIndex);
  const voiceovers = timing?.photoVoiceovers;
  const durations = timing?.photoVoiceoverDurations;
  const hasVoiceover = Boolean(voiceovers?.some((line) => line.trim()));

  type Draft = Omit<SceneScheduleEntry, "startTime">;
  const drafts: Draft[] = [];

  drafts.push({ name: "intro", duration: BASE_DURATION.intro, photoIndices: [] });

  if (photos[0]) {
    const voNeed = voiceBlockDuration([0], voiceovers, durations);
    drafts.push({
      name: "hero",
      duration: hasVoiceover ? Math.max(BASE_DURATION.hero, voNeed) : BASE_DURATION.hero,
      photoIndices: [0],
    });
  }

  if (specSceneCount > 0 && photos.length > 1) {
    for (let c = 0; c < specSceneCount; c++) {
      const photoIdx = Math.min(1 + c, photos.length - 1);
      const voNeed = voiceBlockDuration([photoIdx], voiceovers, durations);
      drafts.push({
        name: `spec-chunk-${c}`,
        duration: hasVoiceover ? Math.max(BASE_DURATION.specs, voNeed) : BASE_DURATION.specs,
        photoIndices: [photoIdx],
      });
    }
  }

  let photoIndex = galleryStartIndex;
  const middleDrafts: Draft[] = [];

  middleScenes.forEach((scene, index) => {
    const photoIndices: number[] = [];
    if (scene.kind === "showcase") {
      photoIndices.push(photoIndex);
      photoIndex += 1;
    } else if (scene.kind === "split-duo") {
      photoIndices.push(photoIndex, photoIndex + 1);
      photoIndex += 2;
    } else {
      photoIndices.push(photoIndex, photoIndex + 1, photoIndex + 2);
      photoIndex += 3;
    }

    const voNeed = voiceBlockDuration(photoIndices, voiceovers, durations);
    const base = middleSceneBaseDuration(scene);
    middleDrafts.push({
      name: `middle-${index}`,
      duration: hasVoiceover ? Math.max(base, voNeed) : base,
      photoIndices,
    });
  });

  if (!hasVoiceover && middleDrafts.length > 0) {
    const uniform = calcMiddleSceneDuration(middleDrafts.length, specSceneCount);
    for (const draft of middleDrafts) {
      draft.duration = uniform;
    }
  }

  drafts.push(...middleDrafts);
  drafts.push({ name: "outro", duration: BASE_DURATION.outro, photoIndices: [] });

  if (hasVoiceover) {
    const fixedTotal = drafts
      .filter((d) => !d.name.startsWith("middle-"))
      .reduce((sum, d) => sum + d.duration, 0);
    const middleIdxs = drafts
      .map((d, i) => (d.name.startsWith("middle-") ? i : -1))
      .filter((i) => i >= 0);
    const middleDurs = middleIdxs.map((i) => drafts[i]!.duration);
    const scaled = scaleMiddleDurations(middleDurs, MAX_VIDEO_SECONDS, fixedTotal);
    middleIdxs.forEach((draftIdx, i) => {
      drafts[draftIdx]!.duration = scaled[i]!;
    });
  }

  let time = 0;
  return drafts.map((draft) => {
    const entry: SceneScheduleEntry = {
      ...draft,
      startTime: time,
    };
    time += draft.duration;
    return entry;
  });
}

/** Her fotoğrafın seslendirmesi sırayla çalar — üst üste binmez */
export function buildVoiceoverCues(
  schedule: SceneScheduleEntry[],
  photoVoiceovers: string[],
  durations?: number[],
): VoiceoverCue[] {
  const cues: VoiceoverCue[] = [];

  for (const scene of schedule) {
    if (!scene.photoIndices.length) continue;

    let offset = 0;
    for (const photoIdx of scene.photoIndices) {
      const text = photoVoiceovers[photoIdx]?.trim();
      if (!text) continue;

      cues.push({
        time: scene.startTime + offset,
        text,
        photoIndex: photoIdx,
      });

      const d =
        durations?.[photoIdx] && durations[photoIdx]! > 0
          ? durations[photoIdx]!
          : estimateTextDuration(text);
      offset += d + VO_GAP_SEC;
    }
  }

  return cues;
}

function hasVoiceover(data: CarVideoFormData): boolean {
  return Boolean(
    data.voiceoverText?.trim() ||
    data.voiceoverAudioSource?.trim() ||
    data.photoVoiceovers?.some((line) => line.trim()),
  );
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

function resolveVoiceoverLanguage(data: CarVideoFormData): TtsLanguage {
  try {
    return parseTtsLanguage(data.voiceoverLanguage);
  } catch {
    return "tr";
  }
}

function buildVoiceoverElements(
  data: CarVideoFormData,
  schedule: SceneScheduleEntry[],
): RenderElement[] {
  const lang = resolveVoiceoverLanguage(data);
  const provider = buildCreatomateElevenLabsProvider(lang);

  if (data.photoVoiceovers?.some((line) => line.trim())) {
    const cues = buildVoiceoverCues(
      schedule,
      data.photoVoiceovers ?? [],
      data.photoVoiceoverDurations,
    );
    return cues.map((cue, index) => {
      const hosted = data.photoVoiceoverSources?.[cue.photoIndex]?.trim();
      return {
        name: `Voiceover-${index + 1}`,
        type: "audio",
        track: 10,
        time: cue.time,
        duration: "media",
        source: hosted || cue.text,
        ...(hosted ? {} : { provider }),
        volume: "100%",
        audio_fade_in: 0.12,
      };
    });
  }

  const text = data.voiceoverText?.trim();
  if (text) {
    return [
      {
        name: "Voiceover",
        type: "audio",
        track: 10,
        time: 0,
        duration: "media",
        source: text,
        provider,
        volume: "100%",
        audio_fade_in: 0.2,
      },
    ];
  }

  const url = data.voiceoverAudioSource?.trim();
  if (!url) return [];

  return [
    {
      name: "Voiceover",
      type: "audio",
      track: 10,
      time: 0,
      duration: "media",
      source: url,
      volume: "100%",
      audio_fade_in: 0.2,
    },
  ];
}

// ─── Intro ───────────────────────────────────────────────────────────────────

function buildIntroScene(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
): RenderElement {
  const dynamic = style === "dynamic";
  const palette = colorsFor(style);
  const typo = introTypography(format);
  const carTitle = truncateTitle(data.carTitle, format);
  const introSubtitle = truncateSubtitle(data.introSubtitle, format);
  const priceTag = truncateLabel(data.priceTag, format === "youtube" ? 24 : 20);
  const showDealer = !isPlaceholderDealerName(data.dealerName);

  const textElements: RenderElement[] = [];

  if (showDealer) {
    textElements.push({
      name: "Dealer-Name",
      type: "text",
      track: 3,
      time: 0,
      duration,
      y: typo.dealerY,
      width: typo.textWidth,
      x_alignment: "50%",
      y_alignment: "100%",
      text: truncateLabel(data.dealerName, 28),
      font_family: "Montserrat",
      font_weight: "800",
      font_size: typo.dealerSize,
      letter_spacing: "6%",
      fill_color: palette.text,
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
    });
  }

  textElements.push(
    {
      name: "Intro-Car-Title",
      type: "text",
      track: 5,
      time: 0,
      duration,
      y: typo.titleY,
      width: typo.textWidth,
      x_alignment: "50%",
      y_alignment: "50%",
      text: carTitle,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: typo.titleSize,
      fill_color: palette.text,
      animations: dynamic ? [textSlideUp(0.25)] : [quickFade(0.2)],
    },
    {
      name: "Intro-Subtitle",
      type: "text",
      track: 4,
      time: 0,
      duration,
      y: typo.subtitleY,
      width: typo.textWidth,
      x_alignment: "50%",
      text: introSubtitle,
      font_family: "Roboto Condensed",
      font_weight: "500",
      font_size: typo.subtitleSize,
      letter_spacing: "14%",
      fill_color: palette.accent,
      animations: dynamic ? [slideIn("0°", 0.35)] : [quickFade(0.35)],
    },
    {
      name: "Intro-Price",
      type: "text",
      track: 6,
      time: 0,
      duration,
      y: typo.priceY,
      width: typo.textWidth,
      x_alignment: "50%",
      text: priceTag,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: typo.priceSize,
      fill_color: palette.accent,
      animations: dynamic ? [popIn(0.45), quickFade(0.45)] : [quickFade(0.45)],
    },
  );

  return {
    name: "Intro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
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
          { offset: "0%", color: palette.panel },
          { offset: "100%", color: palette.panelLight },
        ],
      },
      {
        name: "Accent-Bar",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        y: typo.accentY,
        width: "18%",
        height: "0.6 vmin",
        x_anchor: "50%",
        y_anchor: "50%",
        path: rectPath(),
        fill_color: palette.accent,
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
      ...textElements,
    ],
  };
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function buildHeroScene(
  photoUrl: string,
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
  name = "Hero",
): RenderElement {
  const dynamic = style === "dynamic";
  const palette = colorsFor(style);
  const typo = heroTypography(format);
  const carTitle = truncateTitle(data.carTitle, format);
  const carSubtitle = truncateSubtitle(data.carSubtitle, format);
  const priceTag = truncateLabel(data.priceTag, format === "youtube" ? 22 : 18);

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
        height: format === "youtube" ? "55%" : "60%",
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
        text: priceTag,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.priceSize,
        background_color: palette.accent,
        background_x_padding: "55%",
        background_y_padding: "40%",
        background_border_radius: "16%",
        fill_color: palette.text,
        animations: dynamic ? [popIn(0), quickFade(0)] : [quickFade(0)],
      },
      {
        name: "Side-Accent",
        type: "shape",
        track: 4,
        time: 0,
        duration,
        x: "4%",
        y: typo.titleY,
        width: "0.55 vmin",
        height: "12%",
        x_anchor: "0%",
        y_anchor: "0%",
        path: rectPath(),
        fill_color: palette.accent,
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
        y: typo.titleY,
        width: typo.textWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: carTitle,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.titleSize,
        fill_color: palette.text,
        animations: dynamic ? [textSlideUp(0.1)] : [quickFade(0.05)],
      },
      {
        name: "Car-Subtitle",
        type: "text",
        track: 6,
        time: 0,
        duration,
        x: "7%",
        y: typo.subtitleY,
        width: typo.textWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: carSubtitle,
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: typo.subtitleSize,
        letter_spacing: "3%",
        fill_color: palette.textSoft,
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

function buildSpecChunkScene(
  photoUrl: string,
  chunk: SpecChunk,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const palette = colorsFor(style);
  const portrait = isPortraitStack(format);
  const dynamic = style === "dynamic";
  const lines = chunk.lines;
  const gridPlan = planSpecGridLayout(lines.length, format, "specs");
  const columns = lines.length >= 4 ? gridPlan.columns : 1;

  const photoLayout = portrait
    ? { x: "50%", y: format === "square" ? "70%" : "72%", width: "100%" }
    : { x: "62%", width: "72%" };

  const panelLayout = portrait
    ? {
        x: "0%",
        y: "0%",
        width: "100%",
        height: format === "square" ? "46%" : "48%",
        x_anchor: "0%",
        y_anchor: "0%",
      }
    : { x: "0%", y: "0%", width: "40%", height: "100%", x_anchor: "0%", y_anchor: "0%" };

  const specGrid = buildSpecGridElements(lines, duration, format, style, 4, palette, {
    x: gridPlan.x,
    yStart: gridPlan.yStart,
    width: portrait ? "90%" : "32%",
    columns,
    col2X: gridPlan.col2X,
    colWidth: gridPlan.colWidth,
  });

  return {
    name: `Spec-Chunk-${chunk.id}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter(style, transitionIndex)],
    elements: [
      ...(dynamic ? [flashAccent()] : []),
      buildCarPhoto(
        `Photo-${chunk.id}`,
        photoUrl,
        duration,
        1,
        {
          ...photoLayout,
          height: portrait ? (format === "square" ? "58%" : "56%") : "100%",
        },
        dynamic ? [slideIn(portrait ? "180°" : "270°", 0)] : [],
      ),
      {
        name: "Specs-Panel",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        ...panelLayout,
        path: rectPath(),
        fill_color: [
          { offset: "0%", color: palette.panel },
          { offset: "100%", color: palette.bg },
        ],
        animations: [
          {
            time: 0,
            duration: 0.45,
            easing: "quadratic-out",
            type: "fade",
          },
        ],
      },
      {
        name: "Specs-Heading",
        type: "text",
        track: 3,
        time: 0.4,
        duration: duration - 0.4,
        x: portrait ? "5%" : "4%",
        y: portrait ? "4%" : "12%",
        width: portrait ? "90%" : "32%",
        x_anchor: "0%",
        y_anchor: "0%",
        text: chunk.heading,
        font_family: "Montserrat",
        font_weight: "800",
        font_size: portrait ? "2.8 vmin" : "2.5 vmin",
        letter_spacing: "5%",
        fill_color: palette.accent,
        animations: [{ time: 0, duration: 0.5, easing: "quadratic-out", type: "fade" }],
      },
      ...specGrid,
    ],
  };
}

// ─── Multi-image sahneler ────────────────────────────────────────────────────

function buildPanelSpecChunk(
  chunk: SpecChunk,
  duration: number,
  format: VideoFormat,
  trackStart: number,
  style: TemplateStyle,
  palette: Palette,
): RenderElement[] {
  const lines = chunk.lines;
  const gridPlan = planSpecGridLayout(lines.length, format, "split");
  const columns = lines.length >= 4 ? gridPlan.columns : 1;

  return buildSpecGridElements(lines, duration, format, style, trackStart, palette, {
    x: gridPlan.x,
    yStart: gridPlan.yStart,
    width: isPortraitStack(format) ? "90%" : "32%",
    columns,
    col2X: gridPlan.col2X,
    colWidth: gridPlan.colWidth,
  });
}

type SplitBlock = { id: string; show: boolean; height: number };

function splitStackPositions(
  contentTop: number,
  portrait: boolean,
  blocks: SplitBlock[],
  format: VideoFormat,
): Record<string, number> {
  const gap = portrait ? 5 : 4;
  const visible = blocks.filter((b) => b.show);
  let stackHeight = 0;

  visible.forEach((block, index) => {
    if (block.id === "price" && index > 0) {
      stackHeight += portrait ? 4 : 3;
    }
    stackHeight += block.height;
    if (index < visible.length - 1) {
      stackHeight += gap;
    }
  });

  const panelStart = contentTop + 10;
  const panelEnd = portrait ? (format === "square" ? 92 : 94) : 86;
  const avail = panelEnd - panelStart;
  let y = panelStart + Math.max(0, (avail - stackHeight) / 2);
  const positions: Record<string, number> = {};

  for (const block of blocks) {
    if (!block.show) continue;
    if (block.id === "price") {
      y += portrait ? 4 : 3;
    }
    positions[block.id] = y;
    y += block.height + gap;
  }

  return positions;
}

function buildSplitInfoContent(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  infoVariant: number,
  trackStart: number,
): RenderElement[] {
  const portrait = isPortraitStack(format);
  const dynamic = style === "dynamic";
  const palette = colorsFor(style);
  const t = videoTemplateStrings(data.videoLanguage);
  const { panelText } = splitLayoutFor(format);
  const { x: textX, width: textW } = panelText;

  const contentTop = portrait ? (format === "square" ? 56 : 58) : 12;
  const chunks = collectSpecChunks(data);
  const mod = normalizeInfoVariant(infoVariant, chunks.length);
  const summaryMod = chunks.length + 1;
  const heading =
    mod === 0
      ? t.carInfoHeading
      : mod === summaryMod
        ? t.summaryHeading
        : chunks[mod - 1]?.heading ?? t.specsHeading;

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
    fill_color: palette.accent,
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
    font_size: portrait ? "2.8 vmin" : "2.4 vmin",
    letter_spacing: "6%",
    fill_color: palette.accent,
    animations: dynamic ? [textSlideUp(0)] : [quickFade(0)],
  };

  if (mod === 0) {
    const hasSubtitle = Boolean(data.carSubtitle?.trim());
    const hasPrice = Boolean(data.priceTag?.trim());
    const yPos = splitStackPositions(contentTop, portrait, [
      { id: "title", show: true, height: portrait ? 7.5 : 6.5 },
      { id: "subtitle", show: hasSubtitle, height: portrait ? 5 : 4 },
      { id: "price", show: hasPrice, height: portrait ? 6.5 : 5.5 },
    ], format);

    const elements: RenderElement[] = [accentBar, headingEl];

    elements.push({
      name: "Split-Car-Title",
      type: "text",
      track: trackStart + 2,
      time: 0.25,
      duration: duration - 0.25,
      x: textX,
      y: `${yPos.title}%`,
      width: textW,
      x_anchor: "0%",
      y_anchor: "0%",
      text: truncateTitle(data.carTitle, format),
      font_family: "Montserrat",
      font_weight: "800",
      font_size: portrait ? "4 vmin" : "3.2 vmin",
      fill_color: palette.text,
      animations: dynamic ? [textSlideUp(0.08)] : [quickFade(0.08)],
    });

    if (hasSubtitle) {
      elements.push({
        name: "Split-Car-Subtitle",
        type: "text",
        track: trackStart + 3,
        time: 0.35,
        duration: duration - 0.35,
        x: textX,
        y: `${yPos.subtitle}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateSubtitle(data.carSubtitle, format),
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: portrait ? "2.4 vmin" : "2 vmin",
        letter_spacing: "2%",
        fill_color: palette.textSoft,
        animations: dynamic ? [slideIn("0°", 0.1)] : [quickFade(0.1)],
      });
    }

    if (hasPrice) {
      elements.push({
        name: "Split-Price",
        type: "text",
        track: trackStart + 4,
        time: 0.45,
        duration: duration - 0.45,
        x: textX,
        y: `${yPos.price}%`,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateLabel(data.priceTag, format === "youtube" ? 20 : 16),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: portrait ? "4.5 vmin" : "3.8 vmin",
        fill_color: palette.accent,
        animations: dynamic ? [popIn(0.12)] : [quickFade(0.12)],
      });
    }

    return elements;
  }

  if (mod === summaryMod) {
    const hasDealer = !isPlaceholderDealerName(data.dealerName);
    const hasTitle = Boolean(data.carTitle?.trim());
    const hasPrice = Boolean(data.priceTag?.trim());
    const hasPhone = Boolean(data.phone?.trim());
    const yPos = splitStackPositions(contentTop, portrait, [
      { id: "dealer", show: hasDealer, height: portrait ? 6 : 5 },
      { id: "title", show: hasTitle, height: portrait ? 5.5 : 4.5 },
      { id: "price", show: hasPrice, height: portrait ? 6.5 : 5.5 },
      { id: "phone", show: hasPhone, height: portrait ? 5 : 4 },
    ], format);

    const summaryElements: RenderElement[] = [accentBar, headingEl];

    if (hasDealer) {
      summaryElements.push({
        name: "Split-Dealer",
        type: "text",
        track: trackStart + 2,
        time: 0.25,
        duration: duration - 0.25,
        x: textX,
        y: `${yPos.dealer}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateLabel(data.dealerName, 28),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: portrait ? "3.8 vmin" : "3.2 vmin",
        letter_spacing: "4%",
        fill_color: palette.text,
        animations: dynamic ? [textSlideUp(0.05)] : [quickFade(0.05)],
      });
    }

    if (hasTitle) {
      summaryElements.push({
        name: "Split-Summary-Title",
        type: "text",
        track: trackStart + 3,
        time: 0.35,
        duration: duration - 0.35,
        x: textX,
        y: `${yPos.title}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateTitle(data.carTitle, format),
        font_family: "Montserrat",
        font_weight: "700",
        font_size: portrait ? "3 vmin" : "2.6 vmin",
        fill_color: palette.textSoft,
        animations: dynamic ? [slideIn("0°", 0.08)] : [quickFade(0.08)],
      });
    }

    if (hasPrice) {
      summaryElements.push({
        name: "Split-Summary-Price",
        type: "text",
        track: trackStart + 4,
        time: 0.45,
        duration: duration - 0.45,
        x: textX,
        y: `${yPos.price}%`,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateLabel(data.priceTag, format === "youtube" ? 20 : 16),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: portrait ? "4.8 vmin" : "4.2 vmin",
        fill_color: palette.accent,
        animations: dynamic ? [popIn(0.1)] : [quickFade(0.1)],
      });
    }

    if (hasPhone) {
      summaryElements.push({
        name: "Split-Phone",
        type: "text",
        track: trackStart + 5,
        time: 0.55,
        duration: duration - 0.55,
        x: textX,
        y: `${yPos.phone}%`,
        width: textW,
        x_anchor: "0%",
        y_anchor: "0%",
        text: truncateLabel(data.phone, 20),
        font_family: "Roboto Condensed",
        font_weight: "700",
        font_size: portrait ? "2.6 vmin" : "2.3 vmin",
        letter_spacing: "4%",
        fill_color: palette.textMuted,
        animations: dynamic ? [textSlideUp(0.1)] : [quickFade(0.1)],
      });
    }

    return summaryElements;
  }

  const chunk = chunks[mod - 1];
  if (chunk) {
    return [
      accentBar,
      headingEl,
      ...buildPanelSpecChunk(chunk, duration, format, trackStart + 2, style, palette),
    ];
  }

  return [accentBar, headingEl];
}

function buildMultiImageBase(
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
): { portrait: boolean; layout: ReturnType<typeof splitLayoutFor>; elements: RenderElement[] } {
  const portrait = isPortraitStack(format);
  const layout = splitLayoutFor(format);
  const palette = colorsFor(style);
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
        { offset: "0%", color: palette.panel },
        { offset: "100%", color: palette.bg },
      ],
      ...layout.panel,
      animations: [
        {
          time: 0,
          duration: 0.45,
          easing: "quadratic-out",
          type: "fade",
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
      fill_color: palette.bg,
      ...layout.photoZone,
    },
  ];

  if (portrait) {
    const photoZoneEnd =
      "photoZoneEnd" in layout ? layout.photoZoneEnd : "56%";
    elements.push({
      name: "Photo-Zone-Gradient",
      type: "shape",
      track: 3,
      time: 0,
      duration,
      x: "0%",
      y: photoZoneEnd,
      width: "100%",
      height: "10%",
      y_anchor: "50%",
      path: rectPath(),
      fill_color: [
        { offset: "0%", color: "rgba(10,10,10,0)" },
        { offset: "100%", color: palette.panel },
      ],
    });
  } else if ("dividerX" in layout) {
    elements.push({
      name: "Photo-Zone-Divider",
      type: "shape",
      track: 3,
      time: 0,
      duration,
      x: layout.dividerX,
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

  return { portrait, layout, elements };
}

function buildGalleryHeader(
  counter: string,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  track: number,
  videoLanguage?: string,
): RenderElement[] {
  const portrait = isPortraitStack(format);
  const layout = splitLayoutFor(format);
  const palette = colorsFor(style);
  const t = videoTemplateStrings(videoLanguage);
  const labelX = portrait ? layout.panelText.x : layout.photoZone.x;
  const labelWidth = portrait ? layout.panelText.width : "55%";

  return [
    {
      name: "Gallery-Label",
      type: "text",
      track,
      time: 0,
      duration,
      x: labelX,
      y: portrait ? "3%" : "4%",
      width: labelWidth,
      x_anchor: "0%",
      y_anchor: "0%",
      text: t.galleryLabel,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: portrait ? "2.4 vmin" : "2.1 vmin",
      letter_spacing: "8%",
      fill_color: palette.accent,
      animations: [quickFade(0.05)],
    },
    {
      name: "Photo-Counter",
      type: "text",
      track: track + 1,
      time: 0,
      duration,
      x: portrait ? "95%" : "96%",
      y: portrait ? "3%" : "4%",
      x_anchor: "100%",
      y_anchor: "0%",
      text: counter,
      font_family: "Roboto Condensed",
      font_weight: "700",
      font_size: "1.9 vmin",
      letter_spacing: "5%",
      fill_color: palette.textMuted,
      animations: [quickFade(0.1)],
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
  const { elements } = buildMultiImageBase(duration, format, style);
  const layout = splitLayoutFor(format);
  const photoLayouts = layout.duo.photos;
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
        data.videoLanguage,
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
  const { elements } = buildMultiImageBase(duration, format, style);
  const layout = splitLayoutFor(format);

  let photoElements: RenderElement[];

  if ("photos" in layout.trio) {
    const slideDirs: ("90°" | "270°" | "0°")[] = ["90°", "0°", "270°"];
    const stackPhotos = layout.trio.photos;
    photoElements = scene.urls.map((url, idx) =>
      buildGalleryPhoto(
        `Photo-${scene.photoNumbers[idx]}`,
        url,
        duration,
        5 + idx,
        stackPhotos[idx],
        style,
        idx * 0.08,
        slideDirs[idx],
      ),
    );
  } else {
    const ytTrio = layout.trio as typeof layout.trio & {
      hero: { x: string; y: string; width: string; height: string };
      stack: { x: string; y: string; width: string; height: string }[];
    };
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
        data.videoLanguage,
      ),
      ...buildSplitInfoContent(data, duration, format, style, scene.infoVariant, 13),
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
      return buildPhotoShowcaseScene(scene, duration, data.carTitle, format, style, transitionIndex);
  }
}

// ─── Foto showcase (tek foto tam ekran) ─────────────────────────────────────

function buildPhotoShowcaseScene(
  scene: Extract<MiddleScene, { kind: "showcase" }>,
  duration: number,
  carTitle: string,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const dynamic = style === "dynamic";
  const palette = colorsFor(style);
  const slideDir = scene.photoNumber % 2 === 0 ? "270°" : "90°";

  return {
    name: `Showcase-${scene.photoNumber}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
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
    ],
  };
}

// ─── Outro ───────────────────────────────────────────────────────────────────

function buildOutroScene(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  style: TemplateStyle,
  transitionIndex: number,
): RenderElement {
  const dynamic = style === "dynamic";
  const palette = colorsFor(style);
  const typo = outroTypography(format);

  return {
    name: "Outro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
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
          { offset: "0%", color: palette.panelLight },
          { offset: "100%", color: palette.bg },
        ],
      },
      {
        name: "CTA-Main",
        type: "text",
        track: 2,
        time: 0,
        duration,
        y: typo.ctaY,
        width: "90%",
        x_alignment: "50%",
        y_alignment: "100%",
        text: truncateLabel(data.ctaMain, 28),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.ctaSize,
        fill_color: palette.text,
        animations: dynamic ? [popIn(0), quickFade(0)] : [quickFade(0)],
      },
      {
        name: "Phone",
        type: "text",
        track: 3,
        time: 0,
        duration,
        y: typo.phoneY,
        width: "90%",
        x_alignment: "50%",
        text: truncateLabel(data.phone, 22),
        font_family: "Roboto Condensed",
        font_weight: "700",
        font_size: typo.phoneSize,
        letter_spacing: "5%",
        fill_color: palette.accent,
        animations: dynamic ? [textSlideUp(0.15)] : [quickFade(0.1)],
      },
      {
        name: "Address",
        type: "text",
        track: 4,
        time: 0,
        duration,
        y: typo.addressY,
        width: "90%",
        x_alignment: "50%",
        text: truncateSubtitle(data.address, format),
        font_family: "Roboto Condensed",
        font_size: typo.addressSize,
        fill_color: palette.textMuted,
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
  if (formData.templateEngine === "studio") {
    return buildStudioRenderScript(formData, format);
  }

  const style = formData.templateStyle === "dynamic" ? "dynamic" : "classic";
  const { width, height } = formatDimensions(format);
  const photos = formData.photos.map((p) => p.trim()).filter(Boolean);
  const specChunks = collectSpecChunks(formData);
  const specSceneCount = Math.min(specChunks.length, MAX_SPEC_SCENES);
  const galleryStartIndex = specSceneCount > 0 ? 1 + specSceneCount : 1;
  const middleScenes = planMiddleScenes(photos, format, galleryStartIndex);

  const schedule = buildSceneSchedule(photos, format, {
    photoVoiceovers: formData.photoVoiceovers,
    photoVoiceoverDurations: formData.photoVoiceoverDurations,
  }, specSceneCount);

  let transitionIndex = 0;

  const sceneElements = schedule.map((entry) => {
    const duration = entry.duration;
    let element: RenderElement;

    if (entry.name === "intro") {
      element = buildIntroScene(formData, duration, format, style);
    } else if (entry.name === "hero") {
      element = buildHeroScene(
        photos[0],
        formData,
        duration,
        format,
        style,
        ++transitionIndex,
      );
    } else if (entry.name.startsWith("spec-chunk-")) {
      const chunkIdx = Number.parseInt(entry.name.replace("spec-chunk-", ""), 10);
      const chunk = specChunks[chunkIdx] ?? specChunks[0]!;
      const photoUrl = photos[entry.photoIndices[0] ?? 1] ?? photos[1] ?? "";
      element = buildSpecChunkScene(
        photoUrl,
        chunk,
        duration,
        format,
        style,
        ++transitionIndex,
      );
    } else if (entry.name === "outro") {
      element = buildOutroScene(
        formData,
        duration,
        format,
        style,
        ++transitionIndex,
      );
    } else {
      const middleIdx = Number.parseInt(entry.name.replace("middle-", ""), 10);
      const scene = middleScenes[middleIdx];
      if (!scene) {
        element = { name: entry.name, type: "composition", track: 2, duration, fill_color: COLORS.bg };
      } else {
        element = buildMiddleScene(
          scene,
          formData,
          duration,
          format,
          style,
          ++transitionIndex,
        );
      }
    }

    return { ...element, time: entry.startTime };
  });

  const audioElements: RenderElement[] = [buildMusicElement(formData)];
  audioElements.push(...buildVoiceoverElements(formData, schedule));

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
