import type { CarVideoFormData, SceneScheduleEntry } from "@/app/lib/template";
import { buildVoiceoverCues } from "@/app/lib/template";
import {
  buildCreatomateElevenLabsProvider,
  parseTtsLanguage,
  type TtsLanguage,
} from "@/lib/elevenlabs";

type RenderElement = Record<string, unknown>;

const MUSIC_SOURCE = "https://cdn.creatomate.com/demo/music3.mp3";

function hasVoiceover(data: CarVideoFormData): boolean {
  return Boolean(
    data.photoVoiceovers?.some((line) => line.trim()) ||
      data.voiceoverText?.trim() ||
      data.voiceoverAudioSource?.trim(),
  );
}

function resolveVoiceoverLanguage(data: CarVideoFormData): TtsLanguage {
  try {
    return parseTtsLanguage(data.voiceoverLanguage);
  } catch {
    return "tr";
  }
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

export function buildAudioTrack(
  data: CarVideoFormData,
  schedule: SceneScheduleEntry[],
): RenderElement[] {
  return [buildMusicElement(data), ...buildVoiceoverElements(data, schedule)];
}
