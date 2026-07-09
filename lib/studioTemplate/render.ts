import type { CarVideoFormData, RenderScript, VideoFormat } from "@/app/lib/template";
import type { SceneScheduleEntry } from "@/app/lib/template";
import {
  formatDimensions,
  introTypography,
  outroTypography,
  truncateLabel,
  truncateSubtitle,
  truncateTitle,
  type SpecChunk,
} from "@/lib/templateFormat";
import { isPlaceholderDealerName } from "@/lib/videoTemplateI18n";
import { STUDIO_PALETTE } from "@/lib/studioTemplate/palette";
import { planStudioVideo, studioPlanToSchedule } from "@/lib/studioTemplate/planner";
import type { StudioScenePlan, StudioPalette } from "@/lib/studioTemplate/types";
import { buildAudioTrack } from "@/app/lib/templateAudio";

type RenderElement = Record<string, unknown>;

function rectPath(): string {
  return "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z";
}

function fadeIn(delay = 0, duration = 0.5): RenderElement {
  return { time: delay, duration, easing: "quadratic-out", type: "fade" };
}

function slideUp(delay = 0): RenderElement {
  return {
    time: delay,
    duration: 0.65,
    easing: "quadratic-out",
    type: "text-slide",
    scope: "split-clip",
    split: "line",
    overlap: "88%",
    direction: "up",
  };
}

function kenBurns(delay = 0): RenderElement {
  return {
    time: delay,
    duration: 0.01,
    easing: "linear",
    type: "scale",
    fade: false,
    start_scale: "108%",
    end_scale: "100%",
    x_anchor: "50%",
    y_anchor: "50%",
  };
}

function sceneTransition(index: number): RenderElement {
  const types = ["fade", "slide", "wipe"] as const;
  const type = types[index % types.length]!;
  const base: RenderElement = {
    time: 0,
    duration: 0.45,
    easing: "quadratic-out",
    type,
    transition: true,
  };
  if (type === "slide") {
    return { ...base, direction: index % 2 === 0 ? "90°" : "270°", distance: "14%" };
  }
  return base;
}

function isPortrait(format: VideoFormat): boolean {
  return format !== "youtube";
}

function buildImage(
  name: string,
  source: string,
  duration: number,
  track: number,
  layout: Record<string, unknown>,
  palette: StudioPalette,
  animations: RenderElement[] = [],
): RenderElement {
  return {
    name,
    type: "composition",
    track,
    time: 0,
    duration,
    fill_color: palette.bg,
    clip: true,
    ...layout,
    animations,
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

function gradientOverlay(
  palette: StudioPalette,
  duration: number,
  track: number,
  height = "42%",
): RenderElement {
  return {
    name: "Gradient",
    type: "shape",
    track,
    time: 0,
    duration,
    width: "100%",
    height,
    y: "100%",
    y_anchor: "100%",
    path: rectPath(),
    fill_color: [
      { offset: "0%", color: palette.gradientTop },
      { offset: "100%", color: palette.gradientBottom },
    ],
  };
}

function buildIntroScene(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: StudioPalette,
): RenderElement {
  const typo = introTypography(format);
  const dealer = isPlaceholderDealerName(data.dealerName) ? "" : data.dealerName;

  return {
    name: "Studio-Intro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [fadeIn()],
    elements: [
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
          { offset: "100%", color: palette.bg },
        ],
      },
      {
        name: "Gold-Line",
        type: "shape",
        track: 2,
        time: 0,
        duration,
        y: typo.accentY,
        width: "22%",
        height: "0.45 vmin",
        x_anchor: "50%",
        path: rectPath(),
        fill_color: palette.accent,
        animations: [
          {
            time: 0.35,
            duration: 0.55,
            easing: "quadratic-out",
            type: "scale",
            fade: false,
            x_anchor: "50%",
            start_scale: "0% 100%",
            end_scale: "100% 100%",
          },
        ],
      },
      ...(dealer
        ? [
            {
              name: "Dealer",
              type: "text",
              track: 3,
              time: 0,
              duration,
              y: typo.dealerY,
              width: typo.textWidth,
              x_alignment: "50%",
              y_alignment: "100%",
              text: truncateLabel(dealer, 28),
              font_family: "Montserrat",
              font_weight: "700",
              font_size: typo.dealerSize,
              letter_spacing: "10%",
              fill_color: palette.textMuted,
              animations: [slideUp(0.1)],
            },
          ]
        : []),
      {
        name: "Title",
        type: "text",
        track: 4,
        time: 0,
        duration,
        y: typo.titleY,
        width: typo.textWidth,
        x_alignment: "50%",
        text: truncateTitle(data.carTitle, format),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.titleSize,
        fill_color: palette.text,
        animations: [slideUp(0.25)],
      },
      {
        name: "Subtitle",
        type: "text",
        track: 5,
        time: 0,
        duration,
        y: typo.subtitleY,
        width: typo.textWidth,
        x_alignment: "50%",
        text: truncateSubtitle(data.introSubtitle, format),
        font_family: "Roboto Condensed",
        font_weight: "500",
        font_size: typo.subtitleSize,
        letter_spacing: "12%",
        fill_color: palette.accent,
        animations: [fadeIn(0.45)],
      },
      {
        name: "Price",
        type: "text",
        track: 6,
        time: 0,
        duration,
        y: typo.priceY,
        width: typo.textWidth,
        x_alignment: "50%",
        text: truncateLabel(data.priceTag, 24),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.priceSize,
        fill_color: palette.accentSoft,
        animations: [fadeIn(0.55)],
      },
    ],
  };
}

function buildOutroScene(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const typo = outroTypography(format);

  return {
    name: "Studio-Outro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
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
        name: "CTA",
        type: "text",
        track: 2,
        time: 0,
        duration,
        y: typo.ctaY,
        width: "90%",
        x_alignment: "50%",
        text: truncateLabel(data.ctaMain, 28),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: typo.ctaSize,
        fill_color: palette.text,
        animations: [slideUp(0)],
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
        letter_spacing: "6%",
        fill_color: palette.accent,
        animations: [fadeIn(0.15)],
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
        animations: [fadeIn(0.25)],
      },
    ],
  };
}

function buildStudioSpecGrid(
  lines: SpecChunk["lines"],
  duration: number,
  format: VideoFormat,
  palette: StudioPalette,
  trackStart: number,
): RenderElement[] {
  const portrait = isPortrait(format);
  const displayLines = lines.slice(0, 4);
  const columns = displayLines.length >= 4 ? 2 : 1;
  const rowStep = portrait ? 9 : 10;
  const valueOffset = portrait ? 4.5 : 4;
  const rows = columns === 2 ? Math.ceil(displayLines.length / 2) : displayLines.length;
  const contentHeight = rows * rowStep + valueOffset;

  const headingBottom = portrait ? 13 : 18;
  const regionBottom = portrait ? (format === "square" ? 46 : 48) : 92;
  const yStart =
    headingBottom + Math.max(0, (regionBottom - headingBottom - contentHeight) / 2);

  const labelX = portrait ? "5%" : "4%";
  const valueX = portrait ? "52%" : "21%";
  const labelWidth = portrait ? "42%" : "15%";
  const valueWidth = portrait ? "42%" : "15%";

  const elements: RenderElement[] = [];

  displayLines.forEach((line, i) => {
    const col = columns === 2 ? i % 2 : 0;
    const row = columns === 2 ? Math.floor(i / 2) : i;
    const xLabel = col === 0 ? labelX : valueX;
    const xValue = col === 0 ? valueX : portrait ? "78%" : "32%";
    const y = yStart + row * rowStep;

    elements.push(
      {
        name: `Spec-L-${i}`,
        type: "text",
        track: trackStart + i * 2,
        time: 0,
        duration,
        x: xLabel,
        y: `${y}%`,
        width: labelWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: `${line.icon} ${line.label}`,
        font_family: "Roboto Condensed",
        font_size: portrait ? "2.1 vmin" : "1.9 vmin",
        fill_color: palette.textDim,
        animations: [fadeIn(0.15 + i * 0.05)],
      },
      {
        name: `Spec-V-${i}`,
        type: "text",
        track: trackStart + i * 2 + 1,
        time: 0,
        duration,
        x: xValue,
        y: `${y + valueOffset}%`,
        width: valueWidth,
        x_anchor: "0%",
        y_anchor: "0%",
        text: line.value,
        font_family: "Montserrat",
        font_weight: "700",
        font_size: portrait ? "2.3 vmin" : "2.1 vmin",
        fill_color: palette.text,
        animations: [slideUp(0.18 + i * 0.05)],
      },
    );
  });

  return elements;
}

function buildCinematicHero(
  scene: StudioScenePlan,
  data: CarVideoFormData,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const url = scene.photoUrls[0] ?? "";
  const portrait = isPortrait(format);

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage("Hero-Photo", url, scene.duration, 1, { width: "100%", height: "100%" }, palette, [
        fadeIn(),
      ]),
    ],
  };
}

function buildSpecPanel(
  scene: StudioScenePlan,
  data: CarVideoFormData,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const url = scene.photoUrls[0] ?? "";
  const portrait = isPortrait(format);
  const chunk = scene.specChunk;
  const lines = chunk?.lines ?? [];
  const heading = chunk?.heading ?? "";

  const photoLayout = portrait
    ? {
        x: "50%",
        y: format === "square" ? "70%" : "72%",
        width: "100%",
        height: format === "square" ? "58%" : "56%",
      }
    : { x: "62%", width: "72%", height: "100%" };

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

  const elements: RenderElement[] = [
    buildImage("Spec-Photo", url, scene.duration, 1, photoLayout, palette, [fadeIn()]),
    {
      name: "Spec-Panel",
      type: "shape",
      track: 2,
      time: 0,
      duration: scene.duration,
      ...panelLayout,
      path: rectPath(),
      fill_color: [
        { offset: "0%", color: palette.panel },
        { offset: "100%", color: palette.bg },
      ],
      animations: [fadeIn()],
    },
  ];

  if (heading) {
    elements.push({
      name: "Spec-Heading",
      type: "text",
      track: 3,
      time: 0.1,
      duration: scene.duration - 0.1,
      x: portrait ? "5%" : "4%",
      y: portrait ? "4%" : "12%",
      width: portrait ? "90%" : "32%",
      x_anchor: "0%",
      y_anchor: "0%",
      text: heading,
      font_family: "Montserrat",
      font_weight: "800",
      font_size: portrait ? "2.8 vmin" : "2.5 vmin",
      letter_spacing: "5%",
      fill_color: palette.accent,
      animations: [fadeIn(0.1)],
    });
  }

  if (lines.length) {
    elements.push(...buildStudioSpecGrid(lines, scene.duration, format, palette, 4));
  } else if (data.priceTag) {
    elements.push({
      name: "Spec-Fallback",
      type: "text",
      track: 4,
      time: 0,
      duration: scene.duration,
      x: portrait ? "5%" : "4%",
      y: portrait ? "22%" : "28%",
      width: portrait ? "90%" : "32%",
      x_anchor: "0%",
      y_anchor: "0%",
      text: truncateLabel(data.priceTag, 28),
      font_family: "Montserrat",
      font_weight: "800",
      font_size: "3.2 vmin",
      fill_color: palette.accentSoft,
      animations: [fadeIn(0.2)],
    });
  }

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements,
  };
}

function buildDuoSplit(
  scene: StudioScenePlan,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const [a, b] = scene.photoUrls;
  const portrait = isPortrait(format);

  const layouts = portrait
    ? [
        { width: "100%", height: "49.5%", y: "0%", y_anchor: "0%" },
        { width: "100%", height: "49.5%", y: "100%", y_anchor: "100%" },
      ]
    : [
        { width: "49.5%", height: "100%", x: "0%", x_anchor: "0%" },
        { width: "49.5%", height: "100%", x: "100%", x_anchor: "100%" },
      ];

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage("Duo-A", a ?? "", scene.duration, 1, layouts[0]!, palette, [fadeIn(0)]),
      buildImage("Duo-B", b ?? "", scene.duration, 2, layouts[1]!, palette, [fadeIn(0.1)]),
      {
        name: "Divider",
        type: "shape",
        track: 3,
        time: 0,
        duration: scene.duration,
        width: portrait ? "100%" : "0.35%",
        height: portrait ? "0.35%" : "100%",
        x: "50%",
        y: "50%",
        path: rectPath(),
        fill_color: palette.accent,
        opacity: "70%",
      },
    ],
  };
}

function buildDuoFeature(
  scene: StudioScenePlan,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const [hero, detail] = scene.photoUrls;
  const portrait = isPortrait(format);

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage(
        "Feature-Hero",
        hero ?? "",
        scene.duration,
        1,
        portrait
          ? { width: "100%", height: "62%", y: "0%", y_anchor: "0%" }
          : { width: "64%", height: "100%", x: "0%", x_anchor: "0%" },
        palette,
        [fadeIn()],
      ),
      buildImage(
        "Feature-Detail",
        detail ?? "",
        scene.duration,
        2,
        portrait
          ? { width: "100%", height: "36%", y: "100%", y_anchor: "100%" }
          : { width: "34%", height: "100%", x: "100%", x_anchor: "100%" },
        palette,
        [fadeIn(0.12)],
      ),
    ],
  };
}

function buildTrioMosaic(
  scene: StudioScenePlan,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const [main, left, right] = scene.photoUrls;
  const portrait = isPortrait(format);

  const layouts = portrait
    ? [
        { width: "100%", height: "58%", y: "0%", y_anchor: "0%" },
        { width: "49%", height: "40%", y: "100%", y_anchor: "100%", x: "0%", x_anchor: "0%" },
        { width: "49%", height: "40%", y: "100%", y_anchor: "100%", x: "100%", x_anchor: "100%" },
      ]
    : [
        { width: "50%", height: "100%", x: "0%", x_anchor: "0%" },
        { width: "24%", height: "49%", x: "100%", x_anchor: "100%", y: "0%", y_anchor: "0%" },
        { width: "24%", height: "49%", x: "100%", x_anchor: "100%", y: "100%", y_anchor: "100%" },
      ];

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage("Trio-Main", main ?? "", scene.duration, 1, layouts[0]!, palette, [fadeIn()]),
      buildImage("Trio-L", left ?? "", scene.duration, 2, layouts[1]!, palette, [fadeIn(0.08)]),
      buildImage("Trio-R", right ?? "", scene.duration, 3, layouts[2]!, palette, [fadeIn(0.14)]),
    ],
  };
}

function buildTrioFilmstrip(
  scene: StudioScenePlan,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const portrait = isPortrait(format);
  const urls = scene.photoUrls;

  const layouts = portrait
    ? urls.map((_, i) => ({
        width: "100%",
        height: "32%",
        y: `${i * 34}%`,
        y_anchor: "0%" as const,
      }))
    : urls.map((_, i) => ({
        width: "32%",
        height: "100%",
        x: `${i * 34}%`,
        x_anchor: "0%" as const,
      }));

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: urls.map((url, i) =>
      buildImage(`Strip-${i}`, url, scene.duration, i + 1, layouts[i]!, palette, [fadeIn(i * 0.08)]),
    ),
  };
}

function buildSingleFocus(
  scene: StudioScenePlan,
  data: CarVideoFormData,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const url = scene.photoUrls[0] ?? "";

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage("Focus-Photo", url, scene.duration, 1, { width: "100%", height: "100%" }, palette, [
        fadeIn(),
      ]),
    ],
  };
}

function buildPriceSpotlight(
  scene: StudioScenePlan,
  data: CarVideoFormData,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  const url = scene.photoUrls[0] ?? "";

  return {
    name: scene.id,
    type: "composition",
    track: 2,
    duration: scene.duration,
    fill_color: palette.bg,
    animations: [sceneTransition(transitionIndex)],
    elements: [
      buildImage("Price-Photo", url, scene.duration, 1, { width: "100%", height: "100%" }, palette, [
        fadeIn(),
      ]),
      gradientOverlay(palette, scene.duration, 2, "55%"),
      {
        name: "Price-Tag",
        type: "text",
        track: 3,
        time: 0,
        duration: scene.duration,
        y: isPortrait(format) ? "72%" : "76%",
        width: "92%",
        x_alignment: "50%",
        text: truncateLabel(data.priceTag, 28),
        font_family: "Montserrat",
        font_weight: "800",
        font_size: isPortrait(format) ? "6 vmin" : "5 vmin",
        fill_color: palette.accent,
        animations: [slideUp(0.15)],
      },
    ],
  };
}

function buildPhotoScene(
  scene: StudioScenePlan,
  data: CarVideoFormData,
  format: VideoFormat,
  palette: StudioPalette,
  transitionIndex: number,
): RenderElement {
  switch (scene.layout) {
    case "cinematic-hero":
      return buildCinematicHero(scene, data, format, palette, transitionIndex);
    case "spec-panel":
      return buildSpecPanel(scene, data, format, palette, transitionIndex);
    case "duo-split":
      return buildDuoSplit(scene, format, palette, transitionIndex);
    case "duo-feature":
      return buildDuoFeature(scene, format, palette, transitionIndex);
    case "trio-mosaic":
      return buildTrioMosaic(scene, format, palette, transitionIndex);
    case "trio-filmstrip":
      return buildTrioFilmstrip(scene, format, palette, transitionIndex);
    case "single-focus":
      return buildSingleFocus(scene, data, format, palette, transitionIndex);
    case "price-spotlight":
      return buildPriceSpotlight(scene, data, format, palette, transitionIndex);
    default:
      return buildSingleFocus(scene, data, format, palette, transitionIndex);
  }
}

export function buildStudioRenderScript(
  formData: CarVideoFormData,
  format: VideoFormat,
): RenderScript {
  const palette = STUDIO_PALETTE;
  const { width, height } = formatDimensions(format);
  const plan = planStudioVideo(formData, format);
  const schedule: SceneScheduleEntry[] = studioPlanToSchedule(plan);

  let transitionIndex = 0;
  const sceneElements: RenderElement[] = plan.scenes.map((scene) => {
    let element: RenderElement;

    if (scene.id === "studio-intro") {
      element = buildIntroScene(formData, scene.duration, format, palette);
    } else if (scene.id === "studio-outro") {
      element = buildOutroScene(formData, scene.duration, format, palette, ++transitionIndex);
    } else {
      element = buildPhotoScene(scene, formData, format, palette, ++transitionIndex);
    }

    return { ...element, time: scene.startTime };
  });

  const audioElements = buildAudioTrack(formData, schedule);

  return {
    output_format: "mp4",
    width,
    height,
    frame_rate: 30,
    elements: [...sceneElements, ...audioElements],
  };
}
