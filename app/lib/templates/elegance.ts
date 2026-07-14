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

export function buildEleganceScript(
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

  const palette = colorsFor("elegance");
  const titleFont = templateTitleFont("elegance");
  const titleWeight = templateTitleWeight("elegance");
  const isPortrait = format === "reels";

  const sceneElements = schedule.map((entry, index) => {
    const duration = entry.duration;
    let element: RenderElement;

    if (entry.name === "intro") {
      element = buildIntroElegance(formData, duration, format, palette, titleFont, titleWeight, isPortrait);
    } else if (entry.name === "outro") {
      element = buildOutroElegance(formData, duration, format, palette, titleFont, titleWeight, isPortrait, index);
    } else if (entry.name.startsWith("spec-chunk-")) {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      const chunkIndex = parseInt(entry.name.replace("spec-chunk-", ""), 10);
      const chunk = specChunks[chunkIndex];
      if (chunk) {
        element = buildSpecElegance(photoUrls, chunk, duration, format, palette, titleFont, titleWeight, isPortrait, index, formData);
      } else {
        element = buildMiddleElegance(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index, formData);
      }
    } else {
      const photoUrls = entry.photoIndices.map(i => photos[i] ?? photos[0] ?? "");
      element = buildMiddleElegance(photoUrls, duration, format, palette, titleFont, titleWeight, isPortrait, index, formData);
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

function buildIntroElegance(
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
        { time: 0, duration: "media", easing: "linear", type: "pan", start_x: "50%", end_x: "45%", start_y: "50%", end_y: "55%" },
      ],
    });
  }

  // Elegant blur overlay
  bgElements.push({
    name: "Overlay",
    type: "shape",
    track: 2,
    time: 0,
    duration,
    width: "100%",
    height: "100%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.bg,
    opacity: "75%",
    animations: [{ time: 0, duration: 1.5, type: "fade", easing: "linear" }]
  });

  const textElements: RenderElement[] = [];
  let trackCounter = 3;
  
  // Dealer Logo (Centered & Elegant)
  if (data.dealerLogoUrl) {
    textElements.push({
      name: "Dealer-Logo",
      type: "image",
      track: trackCounter++,
      time: 0,
      duration,
      source: data.dealerLogoUrl,
      y: isPortrait ? "30%" : "25%",
      width: isPortrait ? "40%" : "25%",
      height: "15%",
      fit: "contain",
      animations: [
        { time: 0, duration: 1.5, easing: "quadratic-in-out", type: "fade" },
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
        { time: 0, duration: 1.2, easing: "quadratic-out", type: "fade" },
      ],
    });
  }

  // Divider Line
  textElements.push({
    name: "Divider",
    type: "shape",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "50%" : "50%",
    width: "30%",
    height: "0.2 vmin",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.accent,
    animations: [
      { time: 0.5, duration: 1, easing: "quadratic-in-out", type: "scale", x_anchor: "50%", start_scale: "0% 100%", end_scale: "100% 100%" },
    ],
  });

  // Title
  textElements.push({
    name: "Car-Title",
    type: "text",
    track: trackCounter++,
    time: 0,
    y: isPortrait ? "46%" : "46%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: data.carTitle,
    font_family: titleFont,
    y_alignment: "100%",
    font_weight: "400", // Thinner font
    font_size: isPortrait ? "6 vmin" : "7 vmin",
    fill_color: palette.text,
    animations: [
      { time: 0.8, duration: 1.2, easing: "quadratic-in-out", type: "fade" },
    ],
  });

  // Price + KM
  let priceKmText = data.priceTag;
  if (data.specKm) priceKmText += ` · ${data.specKm}`;
  
  textElements.push({
    name: "Price-KM",
    type: "text",
    track: trackCounter++,
    time: 0,
    duration,
    y: isPortrait ? "54%" : "60%",
    x: "50%",
    x_alignment: "50%",
    width: "90%",
    text: priceKmText,
    font_family: "Montserrat",
    y_alignment: "0%",
    font_weight: "300",
    font_size: isPortrait ? "4.5 vmin" : "5 vmin",
    fill_color: palette.textMuted,
    letter_spacing: "5%",
    animations: [
      { time: 1.2, duration: 1, easing: "quadratic-in-out", type: "fade" },
    ],
  });

  return {
    name: "Intro-Elegance",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    elements: [...bgElements, ...textElements],
  };
}

function buildMiddleElegance(
  photoUrls: string[],
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
          { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "108%", easing: "linear" }
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
        { time: 0, duration: "media", type: "scale", start_scale: "100%", end_scale: "108%", easing: "linear" }
      ]
    });
  }

  // Thin gold border frame
  elements.push({
    name: "Frame",
    type: "shape",
    track: 10,
    time: 0,
    duration,
    width: "94%",
    height: "94%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "rgba(0,0,0,0)",
    stroke_color: palette.accent,
    stroke_width: "0.2 vmin",
    animations: [{ time: 0, duration: 1, easing: "quadratic-out", type: "fade" }]
  });

  return {
    name: `Middle-Elegance-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [sceneEnter("elegance", index)],
    elements,
  };
}

function buildOutroElegance(
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
      width: isPortrait ? "45%" : "30%",
      height: "20%",
      fit: "contain",
      animations: [
        { time: 0.5, duration: 1.5, easing: "quadratic-in-out", type: "fade" },
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
      font_size: isPortrait ? "6.5 vmin" : "8 vmin",
      fill_color: palette.text,
      animations: [
        { time: 0, duration: 1.5, easing: "quadratic-out", type: "fade" },
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
    font_family: "Montserrat",
    font_weight: "500",
    font_size: isPortrait ? "4 vmin" : "4.5 vmin",
    fill_color: palette.textMuted,
    animations: [
      { time: 0.5, duration: 1, easing: "quadratic-out", type: "fade" },
    ],
  });

  if (data.phone) {
    elements.push({
      name: "Outro-Phone",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: "70%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.phone,
      font_family: "Montserrat",
      font_weight: "400",
      font_size: isPortrait ? "4.5 vmin" : "5 vmin",
      fill_color: palette.text,
      animations: [{ time: 1.0, duration: 1, easing: "quadratic-out", type: "fade" }]
    });
  }

  if (data.address) {
    elements.push({
      name: "Outro-Address",
      type: "text",
      track: trackCounter++,
      time: 0,
      duration,
      y: "78%",
      x: "50%",
      x_alignment: "50%",
      width: "90%",
      text: data.address,
      font_family: "Montserrat",
      font_weight: "300",
      font_size: isPortrait ? "3 vmin" : "3.5 vmin",
      fill_color: palette.textMuted,
      animations: [{ time: 1.8, duration: 1.5, easing: "quadratic-in-out", type: "fade" }]
    });
  }

  return {
    name: "Outro-Elegance",
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 1.2, type: "fade", easing: "linear" }],
    elements,
  };
}

function buildSpecElegance(
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

  // Thin gold border frame for photo (optional elegance touch)
  elements.push({
    name: "Frame",
    type: "shape",
    track: 10,
    time: 0,
    duration,
    width: "94%",
    height: "94%",
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: "rgba(0,0,0,0)",
    stroke_color: palette.accent,
    stroke_width: "0.2 vmin",
    animations: [{ time: 0, duration: 1, easing: "quadratic-out", type: "fade" }]
  });

  elements.push({
    name: "Panel-BG",
    type: "shape",
    track: 11,
    time: 0,
    duration,
    ...panelLayout,
    path: "M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z",
    fill_color: palette.panel
  });

  const textXOffset = isPortrait ? 5 : 4;
  
  elements.push({
    name: "Spec-Heading",
    type: "text",
    track: 12,
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
    animations: [{ time: 0.5, duration: 1.5, easing: "quadratic-in-out", type: "fade" }]
  });

  let trackCounter = 13;
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
      font_family: "Montserrat",
      font_weight: "400",
      font_size: isPortrait ? "3.5 vmin" : "4 vmin",
      fill_color: palette.text,
      animations: [{ time: 0.8 + i * 0.15, duration: 1.5, easing: "quadratic-in-out", type: "fade" }]
    });

    currentY += yStep;
  }

  return {
    name: `Spec-Elegance-${index}`,
    type: "composition",
    track: 2,
    duration,
    fill_color: palette.bg,
    animations: [{ time: 0, duration: 1, type: "fade", easing: "linear" }],
    elements,
  };
}
