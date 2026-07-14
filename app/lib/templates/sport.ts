import { templateTitleFont, templateTitleWeight } from "@/lib/templateRegistry";
import { isPlaceholderDealerName } from "@/lib/videoTemplateI18n";
import { formatDimensions, collectSpecChunks } from "@/lib/templateFormat";
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

export function buildSportScript(
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

  const palette = colorsFor("sport");
  const titleFont = templateTitleFont("sport");
  const titleWeight = templateTitleWeight("sport");
  const isPortrait = format === "reels";

  const sceneElements = schedule.map((entry, index) => {
    const duration = entry.duration;
    let element: RenderElement;

    if (entry.name === "intro") {
      element = buildIntroSport(formData, duration, format, palette, titleFont, titleWeight, isPortrait);
    } else if (entry.name === "outro") {
      element = buildOutroSport(formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name.startsWith("spec-chunk-")) {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      const chunkIndex = parseInt(entry.name.replace("spec-chunk-", ""), 10);
      const chunk = specChunks[chunkIndex];
      if (chunk) {
        element = buildSpecSport(photoUrls, chunk, duration, format, palette, titleFont, titleWeight, isPortrait, index);
      } else {
        element = buildMiddleSport(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
      }
    } else {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      element = buildMiddleSport(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index);
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

function buildIntroSport(
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
        { time: 0, duration: "media", easing: "linear", type: "scale", start_scale: "120%", end_scale: "100%" }, // Fast zoom out
      ],
    });
  }

  // Red flash overlay
  bgElements.push({
    name: "Flash-Overlay",
    type: "shape",
    track: 2,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.accent,
    animations: [
      { time: 0, duration: 0.15, type: "fade", easing: "linear" }, // Very quick flash
      { time: 0.15, duration: 0.3, type: "fade", reversed: true, easing: "linear" }, 
    ]
  });
  
  bgElements.push({
    name: "Dark-Overlay",
    type: "shape",
    track: 3,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "rgba(0,0,0,0.6)",
  });

  const textElements: RenderElement[] = [];
  let trackCounter = 4;
  
  // Dealer Logo (Large and Punchy)
  if (data.dealerLogoUrl) {
    textElements.push({
      name: "Dealer-Logo",
      type: "image",
      track: trackCounter++,
      time: 0,
      duration,
      source: data.dealerLogoUrl,
      y: isPortrait ? "25%" : "20%",
      width: isPortrait ? "50%" : "30%",
      height: "15%",
      fit: "contain",
      animations: [
        { time: 0.1, duration: 0.4, easing: "bounce-out", type: "scale", start_scale: "0%", end_scale: "100%" },
      ],
    });
  } else if (!isPlaceholderDealerName(data.dealerName)) {
    textElements.push({
      name: "Dealer-Name",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: isPortrait ? "18%" : "28%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.dealerName.toUpperCase(),
      font_family: titleFont,
      font_weight: titleWeight,
      font_size: isPortrait ? "5 vmin" : "6 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.5, easing: "quadratic-out", type: "scale", start_scale: "50%", end_scale: "100%" },
      ],
    });
  }

  // Giant skewed title
  textElements.push({
    name: "Car-Title",
    type: "text",
    track: trackCounter++,
    time: 0,
    y: isPortrait ? "42%" : "40%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: data.carTitle.toUpperCase(),
    font_family: titleFont,
    font_weight: titleWeight,
    font_size: isPortrait ? "7 vmin" : "8 vmin",
    fill_color: "#ffffff",
    y_alignment: "100%",
    animations: [
      { time: 0.3, duration: 0.3, easing: "quadratic-out", type: "text-slide", direction: "up", split: "letter" },
    ],
  });

  // Price + KM with Accent Background
  let priceKmText = data.priceTag;
  if (data.specKm) priceKmText += ` · ${data.specKm}`;
  
  textElements.push({
    name: "Price-BG",
    type: "shape",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "52%" : "58%",
    width: "90%",
    height: isPortrait ? "6%" : "10%",
    y_alignment: "0%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.accent,
    animations: [
      { time: 0.6, duration: 0.3, easing: "quadratic-out", type: "scale", x_anchor: "0%", start_scale: "0% 100%", end_scale: "100% 100%" },
    ]
  });

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
    y_alignment: "0%",
    text: priceKmText,
    font_family: titleFont,
    font_weight: "900",
    font_style: "italic",
    font_size: isPortrait ? "5 vmin" : "6 vmin",
    fill_color: "#000000", // Black text on red bg
    animations: [
      { time: 0.7, duration: 0.3, easing: "quadratic-out", type: "fade" },
    ],
  });

  return {
    name: "Intro-Sport",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    elements: [...bgElements, ...textElements],
  };
}

function buildMiddleSport(
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

  // Glitch flash effect
  elements.push({
    name: "Glitch-Flash",
    type: "shape",
    track: 10,
    time: 0,
    duration: 0.1,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "#ffffff",
    opacity: "80%",
    animations: [{ time: 0, duration: 0.1, type: "fade" }]
  });

  return {
    name: `Middle-Sport-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter("sport", index)],
    elements,
  };
}

function buildOutroSport(
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
      width: isPortrait ? "60%" : "40%",
      height: "25%",
      fit: "contain",
      animations: [
        { time: 0.2, duration: 0.4, easing: "bounce-out", type: "scale", start_scale: "0%", end_scale: "100%" },
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
      font_size: isPortrait ? "6 vmin" : "7.5 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 0.4, easing: "quadratic-out", type: "scale", start_scale: "50%", end_scale: "100%" },
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
    font_family: titleFont,
    font_weight: "600",
    font_size: isPortrait ? "4.5 vmin" : "5 vmin",
    fill_color: palette.accent,
    animations: [
      { time: 0.3, duration: 0.5, easing: "quadratic-out", type: "scale", start_scale: "0%", end_scale: "100%" },
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
      font_weight: "900",
      font_size: isPortrait ? "5 vmin" : "6 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.5, duration: 0.5, easing: "quadratic-out", type: "scale", start_scale: "0%", end_scale: "100%" }]
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
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.address,
      font_family: titleFont,
      font_weight: "600",
      font_style: "italic",
      font_size: isPortrait ? "3.5 vmin" : "4 vmin",
      fill_color: "#ffffff",
      animations: [{ time: 1.0, duration: 0.3, easing: "quadratic-out", type: "text-slide", direction: "up" }]
    });
  }

  return {
    name: "Outro-Sport",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.2, type: "slide", direction: "up", easing: "quadratic-out" }],
    elements,
  };
}

function buildSpecSport(
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
      x: isPortrait ? "50%" : "65%",
      y: isPortrait ? "30%" : "50%",
      width: isPortrait ? "100%" : "70%",
      height: isPortrait ? "60%" : "100%",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "110%", easing: "linear" }
      ]
    });
  }

  // Panel Background with dark overlay
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
    font_weight: "900",
    font_style: "italic",
    font_size: isPortrait ? "5.5 vmin" : "6.5 vmin",
    fill_color: palette.accent,
    animations: [{ time: 0, duration: 0.4, easing: "bounce-out", type: "scale", start_scale: "0%", end_scale: "100%" }]
  });

  let trackCounter = 12;
  let currentY = isPortrait ? 73 : 35;
  const yStep = isPortrait ? 6 : 10;

  for (let i = 0; i < chunk.lines.length; i++) {
    const line = chunk.lines[i];
    
    // Sporty background stripe for each row
    elements.push({
      name: `Spec-BG-${i}`,
      type: "shape",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      width: isPortrait ? "90%" : "32%",
      height: "0.2 vmin",
      y_alignment: "100%",
      path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
      fill_color: "#ffffff",
      opacity: "20%",
      animations: [{ time: 0.2 + i * 0.1, duration: 0.3, type: "scale", x_anchor: "0%", start_scale: "0% 100%", end_scale: "100% 100%" }]
    });

    elements.push({
      name: `Spec-Label-${i}`,
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: `${currentY - 1}%`,
      x: isPortrait ? "50%" : "17.5%",
      x_alignment: "50%",
      width: isPortrait ? "90%" : "32%",
      y_alignment: "100%",
      text: `${line.icon} ${line.label}: ${line.value}`,
      font_family: titleFont,
      font_weight: "600",
      font_style: "italic",
      font_size: isPortrait ? "3.5 vmin" : "4.5 vmin",
      fill_color: "#ffffff",
      animations: [{ time: 0.3 + i * 0.1, duration: 0.3, type: "slide", direction: "right" }]
    });

    currentY += yStep;
  }

  return {
    name: `Spec-Sport-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 0.2, type: "slide", direction: "left", easing: "quadratic-out" }],
    elements,
  };
}
