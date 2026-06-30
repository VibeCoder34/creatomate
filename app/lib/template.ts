// ─── Renk sabitleri (tek yerden düzenle) ───────────────────────────────────
export const COLORS = {
  bg: "#0a0a0a",
  accent: "#ff2d2d",
  text: "#ffffff",
  textMuted: "#aaaaaa",
  overlay: "rgba(0,0,0,0.55)",
} as const;

// ─── Zamanlama sabitleri ─────────────────────────────────────────────────────
const SCENE_DURATION = {
  opening: 3,
  hero: 3,
  grid: 3.5,
  closing: 4,
} as const;

const TRANSITION_DURATION = 0.5;
const MUSIC_SOURCE = "https://cdn.creatomate.com/demo/music3.mp3";

// ─── Tipler ──────────────────────────────────────────────────────────────────
export type VideoFormat = "reels" | "youtube";

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
};

export type RenderScript = {
  output_format: "mp4";
  width: number;
  height: number;
  frame_rate: number;
  elements: RenderElement[];
};

type RenderElement = Record<string, unknown>;

type PhotoScene =
  | { kind: "hero"; urls: [string] }
  | { kind: "grid"; urls: [string, string, string] };

type SceneBlueprint = {
  name: string;
  duration: number;
  build: (time: number, withTransition: boolean) => RenderElement;
};

// ─── Foto dağıtım reçetesi ───────────────────────────────────────────────────
export function distributePhotos(photos: string[]): PhotoScene[] {
  if (photos.length === 0) return [];

  const scenes: PhotoScene[] = [{ kind: "hero", urls: [photos[0]] }];
  const remaining = photos.slice(1);
  let i = 0;

  while (i < remaining.length) {
    const left = remaining.length - i;
    if (left >= 3) {
      scenes.push({
        kind: "grid",
        urls: [remaining[i], remaining[i + 1], remaining[i + 2]],
      });
      i += 3;
    } else {
      for (let j = i; j < remaining.length; j++) {
        scenes.push({ kind: "hero", urls: [remaining[j]] });
      }
      break;
    }
  }

  return scenes;
}

function formatDimensions(format: VideoFormat): { width: number; height: number } {
  return format === "reels"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

function specsLine(data: CarVideoFormData): string {
  return `${data.specKm}  ·  ${data.specFuel}  ·  ${data.specGear}  ·  ${data.specYear}`;
}

function transitionAnimation(): RenderElement {
  return {
    time: 0,
    duration: TRANSITION_DURATION,
    transition: true,
    type: "fade",
  };
}

function bgShape(duration: number): RenderElement {
  return {
    type: "shape",
    track: 1,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    fill_color: COLORS.bg,
  };
}

function imageElement(
  source: string,
  duration: number,
  layout: { x: string; y: string; width: string; height: string },
  track = 2,
): RenderElement {
  return {
    type: "image",
    track,
    time: 0,
    duration,
    source,
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    fit: "cover",
  };
}

function textElement(
  text: string,
  duration: number,
  opts: {
    y?: string;
    fontSize?: string;
    color?: string;
    weight?: string;
    track?: number;
  } = {},
): RenderElement {
  return {
    type: "text",
    track: opts.track ?? 3,
    time: 0,
    duration,
    text,
    x: "5%",
    y: opts.y ?? "8%",
    width: "90%",
    height: "20%",
    x_alignment: "50%",
    y_alignment: "50%",
    fill_color: opts.color ?? COLORS.text,
    font_family: "Inter",
    font_weight: opts.weight ?? "700",
    font_size: opts.fontSize ?? "6 vmin",
  };
}

// ─── Sahne kalıpları ─────────────────────────────────────────────────────────

function buildOpeningScene(
  data: CarVideoFormData,
  duration: number,
): RenderElement {
  return {
    name: "Opening",
    type: "composition",
    track: 2,
    duration,
    elements: [
      bgShape(duration),
      textElement(data.dealerName, duration, {
        y: "12%",
        fontSize: "5 vmin",
        color: COLORS.accent,
        weight: "800",
      }),
      textElement(data.introSubtitle, duration, {
        y: "20%",
        fontSize: "3.5 vmin",
        color: COLORS.textMuted,
        weight: "600",
      }),
      textElement(data.carTitle, duration, {
        y: "38%",
        fontSize: "8 vmin",
        weight: "900",
      }),
      textElement(data.carSubtitle, duration, {
        y: "50%",
        fontSize: "4 vmin",
        color: COLORS.textMuted,
      }),
      textElement(specsLine(data), duration, {
        y: "60%",
        fontSize: "3.5 vmin",
        color: COLORS.textMuted,
      }),
    ],
  };
}

function buildHeroScene(
  photoUrl: string,
  data: CarVideoFormData,
  duration: number,
  name: string,
): RenderElement {
  return {
    name,
    type: "composition",
    track: 2,
    duration,
    elements: [
      imageElement(photoUrl, duration, {
        x: "0%",
        y: "0%",
        width: "100%",
        height: "100%",
      }),
      {
        type: "shape",
        track: 3,
        time: 0,
        duration,
        width: "100%",
        height: "30%",
        y: "0%",
        fill_color: COLORS.overlay,
      },
      textElement(data.carTitle, duration, {
        y: "6%",
        fontSize: "6 vmin",
        track: 4,
      }),
    ],
  };
}

function buildGridScene(
  urls: [string, string, string],
  duration: number,
  format: VideoFormat,
  name: string,
): RenderElement {
  const layouts: Array<{ x: string; y: string; width: string; height: string }> =
    format === "reels"
      ? [
          { x: "0%", y: "0%", width: "100%", height: "33.33%" },
          { x: "0%", y: "33.33%", width: "100%", height: "33.33%" },
          { x: "0%", y: "66.66%", width: "100%", height: "33.34%" },
        ]
      : [
          { x: "0%", y: "0%", width: "33.33%", height: "100%" },
          { x: "33.33%", y: "0%", width: "33.33%", height: "100%" },
          { x: "66.66%", y: "0%", width: "33.34%", height: "100%" },
        ];

  return {
    name,
    type: "composition",
    track: 2,
    duration,
    elements: [
      bgShape(duration),
      imageElement(urls[0], duration, layouts[0]),
      imageElement(urls[1], duration, layouts[1]),
      imageElement(urls[2], duration, layouts[2]),
    ],
  };
}

function buildClosingScene(
  data: CarVideoFormData,
  duration: number,
): RenderElement {
  return {
    name: "Closing",
    type: "composition",
    track: 2,
    duration,
    elements: [
      bgShape(duration),
      {
        type: "shape",
        track: 2,
        time: 0,
        duration: 0.6,
        width: "100%",
        height: "1%",
        y: "0%",
        fill_color: COLORS.accent,
      },
      textElement(data.priceTag, duration, {
        y: "30%",
        fontSize: "10 vmin",
        color: COLORS.accent,
        weight: "900",
        track: 3,
      }),
      textElement(data.ctaMain, duration, {
        y: "48%",
        fontSize: "6 vmin",
        weight: "800",
        track: 4,
      }),
      textElement(data.phone, duration, {
        y: "58%",
        fontSize: "5 vmin",
        track: 5,
      }),
      textElement(data.address, duration, {
        y: "68%",
        fontSize: "3.5 vmin",
        color: COLORS.textMuted,
        track: 6,
      }),
    ],
  };
}

function wrapScene(
  scene: RenderElement,
  time: number,
  withTransition: boolean,
): RenderElement {
  const wrapped: RenderElement = { ...scene, time };
  if (withTransition) {
    wrapped.animations = [transitionAnimation()];
  }
  return wrapped;
}

function buildMusicElement(totalDuration: number): RenderElement {
  return {
    name: "BG-Music",
    type: "audio",
    track: 1,
    time: 0,
    duration: null,
    source: MUSIC_SOURCE,
    loop: true,
    audio_fade_out: Math.min(2, totalDuration * 0.1),
  };
}

// ─── Ana üretici ─────────────────────────────────────────────────────────────

export function buildRenderScript(
  formData: CarVideoFormData,
  format: VideoFormat,
): RenderScript {
  const { width, height } = formatDimensions(format);
  const photos = formData.photos.map((p) => p.trim()).filter(Boolean);
  const photoScenes = distributePhotos(photos);

  const blueprints: SceneBlueprint[] = [
    {
      name: "opening",
      duration: SCENE_DURATION.opening,
      build: (time, withTransition) =>
        wrapScene(buildOpeningScene(formData, SCENE_DURATION.opening), time, withTransition),
    },
    ...photoScenes.map((scene, index): SceneBlueprint => {
      if (scene.kind === "hero") {
        const duration = SCENE_DURATION.hero;
        return {
          name: `hero-${index}`,
          duration,
          build: (time, withTransition) =>
            wrapScene(
              buildHeroScene(scene.urls[0], formData, duration, `Hero-${index + 1}`),
              time,
              withTransition,
            ),
        };
      }
      const duration = SCENE_DURATION.grid;
      return {
        name: `grid-${index}`,
        duration,
        build: (time, withTransition) =>
          wrapScene(
            buildGridScene(scene.urls, duration, format, `Grid-${index + 1}`),
            time,
            withTransition,
          ),
      };
    }),
    {
      name: "closing",
      duration: SCENE_DURATION.closing,
      build: (time, withTransition) =>
        wrapScene(buildClosingScene(formData, SCENE_DURATION.closing), time, withTransition),
    },
  ];

  const durations = blueprints.map((b) => b.duration);
  const times: number[] = [0];
  for (let i = 1; i < durations.length; i++) {
    times.push(times[i - 1] + durations[i - 1] - TRANSITION_DURATION);
  }
  const totalDuration =
    times[times.length - 1] + durations[durations.length - 1];

  const sceneElements = blueprints.map((bp, i) =>
    bp.build(times[i], i > 0),
  );

  return {
    output_format: "mp4",
    width,
    height,
    frame_rate: 30,
    elements: [buildMusicElement(totalDuration), ...sceneElements],
  };
}
