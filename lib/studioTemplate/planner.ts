import type { CarVideoFormData, VideoFormat } from "@/app/lib/template";
import { voiceBlockDuration } from "@/lib/voiceoverTiming";
import { collectSpecChunks } from "@/lib/templateFormat";
import {
  baseDurationForLayout,
  recipeForPhotoCount,
  STUDIO_BASE_DURATION,
} from "@/lib/studioTemplate/recipes";
import type { StudioPlan, StudioScenePlan } from "@/lib/studioTemplate/types";

function hasVoiceover(data: CarVideoFormData): boolean {
  return Boolean(data.photoVoiceovers?.some((line) => line.trim()));
}

export function planStudioVideo(
  formData: CarVideoFormData,
  format: VideoFormat,
): StudioPlan {
  const photos = formData.photos.map((p) => p.trim()).filter(Boolean);
  const recipe = recipeForPhotoCount(photos.length);
  const specChunks = collectSpecChunks(formData);
  const voiceovers = formData.photoVoiceovers;
  const voDurations = formData.photoVoiceoverDurations;
  const withVo = hasVoiceover(formData);

  const photoScenes: StudioScenePlan[] = [];
  let photoCursor = 0;

  for (let i = 0; i < recipe.length; i++) {
    const blueprint = recipe[i]!;
    const indices: number[] = [];
    const urls: string[] = [];

    for (let p = 0; p < blueprint.photoCount; p++) {
      const idx = photoCursor % photos.length;
      indices.push(idx);
      urls.push(photos[idx] ?? "");
      photoCursor += 1;
    }

    const specChunk =
      blueprint.specChunkIndex !== undefined
        ? specChunks[blueprint.specChunkIndex]
        : undefined;

    let duration = baseDurationForLayout(blueprint.layout);
    if (withVo && indices.length) {
      const voNeed = voiceBlockDuration(indices, voiceovers, voDurations);
      duration = Math.max(duration, voNeed);
    }

    photoScenes.push({
      id: `studio-${i + 1}`,
      layout: blueprint.layout,
      role: blueprint.role,
      photoIndices: indices,
      photoUrls: urls,
      specChunk,
      duration,
      startTime: 0,
    });
  }

  const introDuration = STUDIO_BASE_DURATION.intro;
  const outroDuration = STUDIO_BASE_DURATION.outro;

  const introScene: StudioScenePlan = {
    id: "studio-intro",
    layout: "cinematic-hero",
    role: "hero",
    photoIndices: [],
    photoUrls: [],
    duration: introDuration,
    startTime: 0,
  };

  const outroScene: StudioScenePlan = {
    id: "studio-outro",
    layout: "price-spotlight",
    role: "price",
    photoIndices: [],
    photoUrls: [],
    duration: outroDuration,
    startTime: 0,
  };

  const allScenes = [introScene, ...photoScenes, outroScene];
  let time = 0;
  for (const scene of allScenes) {
    scene.startTime = time;
    time += scene.duration;
  }

  return {
    photoCount: photos.length,
    format,
    scenes: allScenes,
  };
}

/** Legacy voiceover sistemiyle uyumlu schedule */
export function studioPlanToSchedule(plan: StudioPlan) {
  return plan.scenes.map((scene) => ({
    name: scene.id,
    startTime: scene.startTime,
    duration: scene.duration,
    photoIndices: scene.photoIndices,
  }));
}
