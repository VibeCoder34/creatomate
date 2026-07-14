import { templateTitleFont, templateTitleWeight } from "@/lib/templateRegistry";
import { isPlaceholderDealerName } from "@/lib/videoTemplateI18n";
import { formatDimensions, collectSpecChunks, truncateTitle, truncateSubtitle, truncateLabel } from "@/lib/templateFormat";
import {
  RenderScript,
  CarVideoFormData,
  VideoFormat,
  RenderElement,
  planMiddleScenes,
  buildSceneSchedule,
  buildMusicElement,
  buildVoiceoverElements,
  colorsFor,
  sceneEnter,
} from "../template";

export function buildClassicProScript(
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

  const palette = colorsFor("classic-pro");
  const titleFont = templateTitleFont("classic-pro");
  const titleWeight = templateTitleWeight("classic-pro");
  const isPortrait = format === "reels";

  const sceneElements = schedule.map((entry, index) => {
    const duration = entry.duration;
    let element: RenderElement;

    if (entry.name === "intro") {
      element = buildIntroClassicPro(formData, duration, format, palette, titleFont, titleWeight, isPortrait);
    } else if (entry.name === "outro") {
      element = buildOutroClassicPro(formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name.startsWith("spec-chunk-")) {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      const chunkIndex = parseInt(entry.name.replace("spec-chunk-", ""), 10);
      const chunk = specChunks[chunkIndex];
      if (chunk) {
        element = buildSpecClassicPro(photoUrls, chunk, duration, format, palette, titleFont, titleWeight, isPortrait, index);
      } else {
        element = buildMiddleClassicPro(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
      }
    } else {
      // Middle scenes
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      element = buildMiddleClassicPro(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
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

function buildIntroClassicPro(
  data: CarVideoFormData,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
): RenderElement {
  const bgElements: RenderElement[] = [];
  const firstPhoto = data.photos[0];

  if (firstPhoto) {
    bgElements.push({
      name: "Intro-Photo-BG",
      type: "image",
      track: 1,
      time: 0,
      duration,
      source: firstPhoto,
      width: "100%",
      height: "100%",
      animations: [
        {
          time: 0,
          duration: "media",
          easing: "linear",
          type: "scale",
          start_scale: "100%",
          end_scale: "115%",
        },
      ],
    });
  }

  // Dark gradient overlay
  bgElements.push({
    name: "Overlay",
    type: "shape",
    track: 2,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: [
      { offset: "0%", color: "rgba(0,0,0,0.4)" },
      { offset: "100%", color: "rgba(0,0,0,0.85)" },
    ],
  });

  const textElements: RenderElement[] = [];
  let trackCounter = 3;
  
  // Dealer Logo (Enlarged)
  if (data.dealerLogoUrl) {
    textElements.push({
      name: "Dealer-Logo",
      type: "image",
      track: trackCounter++,
      time: 0,
      duration,
      source: data.dealerLogoUrl,
      y: isPortrait ? "20%" : "30%",
      width: isPortrait ? "45%" : "30%", // Larger logo
      height: "15%",
      fit: "contain",
      animations: [
        { time: 0, duration: 0.8, easing: "quadratic-out", type: "fade" },
      ],
    });
  } else if (!isPlaceholderDealerName(data.dealerName)) {
    textElements.push({
      name: "Dealer-Name",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: isPortrait ? "20%" : "30%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.dealerName.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "5 vmin" : "6 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.8, easing: "quadratic-out", type: "fade" },
      ],
    });
  }

  // Accent Bar
  textElements.push({
    name: "Accent-Bar",
    type: "shape",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "60%" : "55%",
    width: "15%",
    height: "0.8 vmin",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.accent,
    animations: [
      { time: 0.3, duration: 0.6, easing: "quadratic-out", type: "scale", x_anchor: "50%", start_scale: "0% 100%", end_scale: "100% 100%" },
    ],
  });

  // Title
  textElements.push({
    name: "Car-Title",
    type: "text",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "48%" : "45%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: data.carTitle.toUpperCase(),
    font_family: titleFont,
    font_weight: titleWeight,
    font_size: isPortrait ? "5.5 vmin" : "6.5 vmin",
    fill_color: "#ffffff",
    y_alignment: "100%",
    animations: [
      { time: 0.2, duration: 0.8, easing: "quadratic-out", type: "text-slide", direction: "up", split: "word" },
    ],
  });

  // Price + KM
  let priceKmText = data.priceTag;
  if (data.specKm) {
    priceKmText += ` · ${data.specKm}`;
  }
  
  textElements.push({
    name: "Price-KM",
    type: "text",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "52%" : "58%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: priceKmText,
    font_family: titleFont,
    font_weight: "600",
    font_size: isPortrait ? "4.5 vmin" : "5.5 vmin",
    fill_color: palette.accent,
    y_alignment: "0%",
    animations: [
      { time: 0.4, duration: 0.6, easing: "quadratic-out", type: "text-slide", direction: "up", split: "word" },
    ],
  });

  return {
    name: "Intro-Classic-Pro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    elements: [...bgElements, ...textElements],
  };
}

function buildMiddleClassicPro(
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
          { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "110%", easing: "linear" }
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
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "110%", easing: "linear" }
      ]
    });
  }

  return {
    name: `Middle-Classic-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter("classic-pro", index)],
    elements
  };
}

function buildOutroClassicPro(
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
  let trackCounter = 1;

  if (data.dealerLogoUrl) {
    elements.push({
      name: "Outro-Logo",
      type: "image",
      track: trackCounter++,
      time: 0,
      duration,
      source: data.dealerLogoUrl,
      y: "40%",
      width: isPortrait ? "50%" : "35%", // Larger logo in Outro
      height: "20%",
      fit: "contain",
      animations: [
        { time: 0, duration: 1, easing: "quadratic-out", type: "fade" },
      ],
    });
  } else if (!isPlaceholderDealerName(data.dealerName)) {
    elements.push({
      name: "Outro-Dealer-Name",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: "40%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.dealerName.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "6 vmin" : "7 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 1, easing: "quadratic-out", type: "text-slide", direction: "up" },
      ],
    });
  }

  elements.push({
    name: "Outro-CTA",
    type: "text",
    track: trackCounter++,
    time: 0,
    duration,
    y: "65%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: data.ctaMain,
    font_family: "Inter",
    font_weight: "500",
    font_size: isPortrait ? "3.5 vmin" : "4.5 vmin",
    fill_color: palette.textSoft,
    animations: [
      { time: 0.4, duration: 0.8, easing: "quadratic-out", type: "text-slide", direction: "up" },
    ],
  });

  if (data.phone) {
    elements.push({
      name: "Outro-Phone",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: "72%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.phone,
      font_family: titleFont,
      font_weight: "700",
      font_size: isPortrait ? "5.5 vmin" : "6.5 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.6, duration: 0.8, easing: "quadratic-out", type: "text-slide", direction: "up" }]
    });
  }

  if (data.address) {
    elements.push({
      name: "Outro-Address",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: "75%",
      width: "90%",
      text: data.address,
      font_family: titleFont,
      font_weight: "400",
      font_size: isPortrait ? "3 vmin" : "3.5 vmin",
      fill_color: palette.textMuted,
      animations: [{ time: 0.7, duration: 1, easing: "quadratic-out", type: "fade" }]
    });
  }

  return {
    name: "Outro-Classic-Pro",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter("classic-pro", index)],
    elements,
  };
}

function buildSpecClassicPro(
  photoUrls: string[],
  chunk: any,
  duration: number,
  format: VideoFormat,
  palette: any,
  titleFont: string,
  titleWeight: string,
  isPortrait: boolean,
  index: number
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
          { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "105%", easing: "linear" }
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
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "105%", easing: "linear" }
      ]
    });
  }

  // Panel Background
  elements.push({
    name: "Overlay",
    type: "shape",
    track: 10,
    time: 0,
    duration,
    ...panelLayout,
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "rgba(0,0,0,0.85)"
  });

  const textXOffset = isPortrait ? 5 : 4;
  
  elements.push({
    name: "Spec-Heading",
    type: "text",
    track: 11,
    time: 0,
    duration,
    y: isPortrait ? "65%" : "20%",
    x: isPortrait ? "50%" : "17.5%",
    x_alignment: "50%",
    y_alignment: "50%",
    width: isPortrait ? "90%" : "32%",
    text: chunk.heading.toUpperCase(),
    font_family: titleFont,
    font_weight: titleWeight,
    font_size: isPortrait ? "5 vmin" : "6 vmin",
    fill_color: palette.accent,
    animations: [{ time: 0, duration: 0.8, easing: "quadratic-out", type: "fade" }]
  });

  let trackCounter = 12;
  let currentY = isPortrait ? 73 : 35;
  const yStep = isPortrait ? 6 : 10;

  for (let i = 0; i < chunk.lines.length; i++) {
    const line = chunk.lines[i];
    elements.push({
      name: `Spec-Label-${i}`,
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      width: isPortrait ? "90%" : "32%",
      text: `${line.icon} ${line.label}: ${line.value}`,
      font_family: titleFont,
      font_weight: "500",
      font_size: isPortrait ? "3.5 vmin" : "4 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.2 + i * 0.1, duration: 0.5, type: "fade" }]
    });

    currentY += yStep;
  }

  return {
    name: `Spec-Classic-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter("classic-pro", index)],
    elements,
  };
}
