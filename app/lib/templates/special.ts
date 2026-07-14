import { formatDimensions, collectSpecChunks } from "@/lib/templateFormat";
import { templateTitleFont, templateTitleWeight } from "@/lib/templateRegistry";
import {
  colorsFor,
  sceneEnter,
  buildSceneSchedule,
  planMiddleScenes,
  type CarVideoFormData,
  type RenderElement,
  type RenderScript,
  type VideoFormat,
} from "../template";

export function buildSpecialScript(
  formData: CarVideoFormData,
  format: VideoFormat,
): RenderScript {
  const { width, height } = formatDimensions(format);
  const photos = formData.photos.map((p) => p.trim()).filter(Boolean);
  const specChunks = collectSpecChunks(formData);
  const specSceneCount = Math.min(specChunks.length, 3);
  const galleryStartIndex = specSceneCount > 0 ? 1 + specSceneCount : 1;
  const middleScenes = planMiddleScenes(photos, format, galleryStartIndex);

  const schedule = buildSceneSchedule(photos, format, {
    photoVoiceovers: formData.photoVoiceovers,
    photoVoiceoverDurations: formData.photoVoiceoverDurations,
  }, specSceneCount);

  // Special style specific colors (Black, Red, White)
  const palette = {
    bg: "#0a0a0a",
    accent: "#ff2d2d",
    text: "#ffffff",
    textSoft: "#e0e0e0",
  };
  const titleFont = "Montserrat";
  const titleWeight = "800";
  const isPortrait = format === "reels";

  const sceneElements = schedule.map((entry, index) => {
    const duration = entry.duration;
    let element: RenderElement;

    if (entry.name === "intro") {
      element = buildIntroSpecial(formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name === "hero") {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      element = buildHeroSpecial(photoUrls, formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name === "outro") {
      element = buildOutroSpecial(formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name.startsWith("spec-chunk-")) {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      const chunkIndex = parseInt(entry.name.replace("spec-chunk-", ""), 10);
      const chunk = specChunks[chunkIndex];
      if (chunk) {
        element = buildSpecSpecial(photoUrls, chunk, duration, format, palette, titleFont, titleWeight, isPortrait, index, formData);
      } else {
        element = buildMiddleSpecial(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
      }
    } else {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      element = buildMiddleSpecial(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    }
    return { ...element, time: entry.startTime };
  });

  return {
    output_format: "mp4",
    width,
    height,
    frame_rate: 30,
    elements: [
      {
        name: "BG-Music",
        type: "audio",
        track: 1,
        time: 0,
        duration: null,
        source: formData.musicSource || "https://cdn.creatomate.com/demo/music3.mp3",
        loop: true,
        audio_fade_out: 1.5,
      },
      ...sceneElements,
    ],
  };
}

function buildIntroSpecial(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number
): RenderElement {
  const elements: RenderElement[] = [];

  // Dark gradient BG
  elements.push({
    name: "Intro-BG",
    type: "shape",
    track: 1,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: [{ offset: "0%", color: "#141414" }, { offset: "100%", color: "#1f1f1f" }]
  });

  // Intro photo bg (darkened) if exists
  const firstPhoto = data.photos[0];
  if (firstPhoto) {
    elements.push({
      name: "Intro-Photo-BG",
      type: "image",
      track: 2,
      time: 0,
      duration,
      source: firstPhoto,
      width: "100%",
      height: "100%",
      opacity: "20%",
      animations: [
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "115%", easing: "linear" }
      ]
    });
  }

  // Accent Bar
  elements.push({
    name: "Accent-Bar",
    type: "shape",
    track: 3,
    time: 0,
    duration,
    y: isPortrait ? "42%" : "62%",
    x: "50%",
    x_alignment: "50%",
    width: "18%",
    height: isPortrait ? "0.8 vmin" : "0.6 vmin",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.accent,
    animations: [
      { time: 0.4, duration: 0.5, easing: "quadratic-out", type: "scale", x_anchor: "50%", start_scale: "0% 100%", end_scale: "100% 100%" }
    ]
  });

  let trackCounter = 4;

  if (data.dealerName) {
    elements.push({
      name: "Dealer-Name",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: isPortrait ? "38%" : "44%",
      x: "50%",
      x_alignment: "50%",
      y_alignment: "100%",
      width: "90%",
      text: data.dealerName.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "7 vmin" : "8 vmin",
      letter_spacing: "6%",
      fill_color: palette.text,
      animations: [
        { time: 0.1, duration: 0.7, easing: "quadratic-out", type: "text-slide", split: "letter", overlap: "93%", direction: "up" },
        { time: 0.1, duration: 0.7, easing: "quadratic-out", type: "fade" }
      ],
    });
  }

  elements.push({
    name: "Intro-Subtitle",
    type: "text",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "46%" : "68%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: (data.introSubtitle || "HAFTANIN ÖNE ÇIKAN ARACI").toUpperCase(),
    font_family: "Roboto Condensed",
    font_weight: "500",
    font_size: isPortrait ? "3.5 vmin" : "2.8 vmin",
    letter_spacing: "14%",
    fill_color: palette.accent,
    animations: [
      { time: 0.7, duration: 0.6, easing: "quadratic-out", type: "fade" }
    ]
  });

  return {
    name: `Intro-Special-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.4, type: "fade", easing: "quadratic-out" }],
    elements,
  };
}

function buildHeroSpecial(
  photoUrls: string[],
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number
): RenderElement {
  const elements: RenderElement[] = [];

  elements.push({
    name: "Photo-Hero",
    type: "image",
    track: 1,
    time: 0,
    duration,
    source: photoUrls[0],
    width: "100%",
    height: "100%",
    animations: [
      { time: 0, duration: "media", type: "scale", start_scale: "110%", end_scale: "125%", easing: "linear" }
    ]
  });

  // Hero Gradient Overlay
  elements.push({
    name: "Hero-Gradient",
    type: "shape",
    track: 2,
    time: 0,
    duration,
    y: "100%",
    width: "100%",
    height: "55%",
    y_anchor: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: [{ offset: "0%", color: "rgba(0,0,0,0)" }, { offset: "100%", color: "rgba(0,0,0,0.88)" }]
  });

  let trackCounter = 3;

  if (data.priceTag) {
    elements.push({
      name: "Price-Tag",
      type: "text",
      track: trackCounter++,
      time: 0.5,
      duration: duration - 0.5,
      x: "50%",
      y: isPortrait ? "80%" : "68%",
      x_alignment: "50%",
      y_alignment: "50%",
      text: data.priceTag,
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "6 vmin" : "5 vmin",
      background_color: palette.accent,
      background_x_padding: "55%",
      background_y_padding: "40%",
      background_border_radius: "16%",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.5, easing: "back-out", type: "slide", direction: "right" },
        { time: 0, duration: 0.4, type: "fade" }
      ]
    });
  }



  if (data.carTitle) {
    elements.push({
      name: "Car-Title",
      type: "text",
      track: trackCounter++,
      time: 0.7,
      duration: duration - 0.7,
      x: "50%",
      y: isPortrait ? "90%" : "82%",
      x_alignment: "50%",
      y_alignment: "50%",
      width: "80%",
      text: data.carTitle.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "6.5 vmin" : "7.5 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.6, easing: "quadratic-out", type: "text-slide", direction: "right" },
        { time: 0, duration: 0.6, type: "fade" }
      ]
    });
  }

  return {
    name: `Hero-Special-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.4, type: "fade", easing: "quadratic-out" }],
    elements,
  };
}

function buildMiddleSpecial(
  photoUrls: string[],
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number
): RenderElement {
  const elements: RenderElement[] = [];

  if (isPortrait && photoUrls.length > 1) {
    const photoCount = photoUrls.length;
    const heightPerPhoto = 100 / photoCount;
    for (let i = 0; i < photoCount; i++) {
      elements.push({
        name: `Photo-${i}`,
        type: "image",
        track: i + 1,
        time: 0,
        duration,
        source: photoUrls[i],
        x: "50%",
        y: `${(i * heightPerPhoto) + (heightPerPhoto / 2)}%`,
        width: "100%",
        height: `${heightPerPhoto}%`,
        x_alignment: "50%",
        y_alignment: "50%",
        animations: [
          { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "115%", easing: "linear" }
        ]
      });
    }
  } else {
    elements.push({
      name: "Photo",
      type: "image",
      track: 1,
      time: 0,
      duration,
      source: photoUrls[0],
      width: "100%",
      height: "100%",
      animations: [
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "115%", easing: "linear" }
      ]
    });
  }

  // Red thick border
  elements.push({
    name: "Red-Border",
    type: "shape",
    track: 10,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "transparent",
    stroke_color: palette.accent,
    stroke_width: isPortrait ? "2 vmin" : "1.5 vmin",
    animations: [{ time: 0, duration: 0.5, type: "fade" }]
  });

  return {
    name: `Middle-Special-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.4, type: "fade", easing: "quadratic-out" }],
    elements,
  };
}

function buildSpecSpecial(
  photoUrls: string[],
  chunk: any,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number,
  data: CarVideoFormData
): RenderElement {
  const elements: RenderElement[] = [];

  const panelLayout = isPortrait
    ? { x: "0%", y: "60%", width: "100%", height: "40%", x_anchor: "0%", y_anchor: "0%" }
    : { x: "0%", y: "0%", width: "35%", height: "100%", x_anchor: "0%", y_anchor: "0%" };

  if (isPortrait && photoUrls.length > 1) {
    const photoCount = photoUrls.length;
    const heightPerPhoto = 60 / photoCount;
    for (let i = 0; i < photoCount; i++) {
      elements.push({
        name: `Photo-${i}`,
        type: "image",
        track: i + 1,
        time: 0,
        duration,
        source: photoUrls[i],
        x: "50%",
        y: `${(i * heightPerPhoto) + (heightPerPhoto / 2)}%`,
        width: "100%",
        height: `${heightPerPhoto}%`,
        x_alignment: "50%",
        y_alignment: "50%",
        animations: [
          { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "115%", easing: "linear" }
        ]
      });
    }
  } else {
    elements.push({
      name: "Photo",
      type: "image",
      track: 1,
      time: 0,
      duration,
      source: photoUrls[0],
      x: isPortrait ? "50%" : "65%",
      y: isPortrait ? "30%" : "50%",
      width: isPortrait ? "100%" : "70%",
      height: isPortrait ? "60%" : "100%",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "115%", easing: "linear" }
      ]
    });
  }

  // Dark Overlay Panel
  elements.push({
    name: "Overlay",
    type: "shape",
    track: 10,
    time: 0,
    duration,
    ...panelLayout,
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.bg,
    opacity: "95%"
  });

  const textXOffset = isPortrait ? 6 : 5;

  elements.push({
    name: "Spec-Heading",
    type: "text",
    track: 11,
    time: 0,
    duration,
    y: isPortrait ? "64%" : "18%",
    x: isPortrait ? "50%" : "17.5%",
    x_alignment: "50%",
    y_alignment: "50%",
    width: isPortrait ? "90%" : "32%",
    text: chunk.heading.toUpperCase(),
    font_family: titleFont,
    font_weight: titleWeight,
    font_size: isPortrait ? "5.5 vmin" : "6 vmin",
    fill_color: palette.accent,
    animations: [{ time: 0.2, duration: 0.5, easing: "quadratic-out", type: "text-slide", direction: "right" }]
  });

  let trackCounter = 12;
  let currentY = isPortrait ? 70 : 30;
  const yStep = isPortrait ? 7 : 12;

  for (let i = 0; i < chunk.lines.length; i++) {
    const line = chunk.lines[i];

    elements.push({
      name: `Spec-Icon-${i}`,
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      text: line.icon,
      font_family: titleFont,
      font_weight: "900",
      font_size: isPortrait ? "4 vmin" : "4.5 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.3 + i * 0.1, duration: 0.4, type: "scale", start_scale: "0%", end_scale: "100%" }]
    });

    elements.push({
      name: `Spec-Label-${i}`,
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY + (isPortrait ? 3 : 5)}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      width: isPortrait ? "90%" : "32%",
      text: line.label,
      font_family: titleFont,
      font_weight: "500",
      font_size: isPortrait ? "3.5 vmin" : "4.5 vmin",
      fill_color: palette.textSoft,
      animations: [{ time: 0.4 + i * 0.1, duration: 0.4, type: "slide", direction: "right" }]
    });

    elements.push({
      name: `Spec-Value-${i}`,
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY + (isPortrait ? 6 : 10)}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      width: isPortrait ? "90%" : "32%",
      text: line.value,
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "3.5 vmin" : "4.5 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.5 + i * 0.1, duration: 0.4, type: "fade" }]
    });

    currentY += yStep;
  }

  return {
    name: `Spec-Special-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.4, type: "fade", easing: "quadratic-out" }],
    elements,
  };
}

function buildOutroSpecial(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number
): RenderElement {
  const elements: RenderElement[] = [];

  elements.push({
    name: "Outro-BG",
    type: "shape",
    track: 1,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: [{ offset: "0%", color: "#141414" }, { offset: "100%", color: "#1f1f1f" }]
  });

  let trackCounter = 2;

  if (data.dealerLogoUrl) {
    elements.push({
      name: "Dealer-Logo",
      type: "image",
      track: trackCounter++,
      time: 0.2,
      duration: duration - 0.2,
      y: "30%",
      x: "50%",
      x_alignment: "50%",
      width: isPortrait ? "40%" : "25%",
      height: isPortrait ? "20%" : "25%",
      source: data.dealerLogoUrl,
      fit: "contain",
      animations: [{ time: 0, duration: 0.6, easing: "back-out", type: "scale", start_scale: "0%", end_scale: "100%" }]
    });
  }

  if (data.dealerName) {
    elements.push({
      name: "Outro-Dealer-Name",
      type: "text",
      track: trackCounter++,
      time: 0.5,
      duration: duration - 0.5,
      y: "50%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.dealerName.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "6 vmin" : "7 vmin",
      letter_spacing: "6%",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.6, easing: "quadratic-out", type: "text-slide", split: "letter", overlap: "93%", direction: "up" },
        { time: 0, duration: 0.6, type: "fade" }
      ]
    });
  }

  elements.push({
    name: "Outro-CTA",
    type: "text",
    track: trackCounter++,
    time: 0.9,
    duration: duration - 0.9,
    y: "65%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: data.ctaMain.toUpperCase(),
    font_family: "Roboto Condensed",
    font_weight: "500",
    font_size: isPortrait ? "4 vmin" : "4.5 vmin",
    letter_spacing: "14%",
    fill_color: palette.accent,
    animations: [{ time: 0, duration: 0.5, type: "fade" }]
  });

  if (data.phone) {
    elements.push({
      name: "Outro-Phone",
      type: "text",
      track: trackCounter++,
      time: 1.2,
      duration: duration - 1.2,
      y: "75%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.phone,
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "5.5 vmin" : "6 vmin",
      fill_color: palette.text,
      animations: [{ time: 0, duration: 0.6, easing: "back-out", type: "slide", direction: "up" }, { time: 0, duration: 0.6, type: "fade" }]
    });
  }

  return {
    name: `Outro-Special-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.6, type: "fade", easing: "quadratic-out" }],
    elements,
  };
}
