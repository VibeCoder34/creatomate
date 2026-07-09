import { NextRequest, NextResponse } from "next/server";
import {
  buildRenderScript,
  type CarVideoFormData,
  type TemplateStyle,
  type TemplateEngine,
  type VideoFormat,
} from "@/app/lib/template";
import { getPublicBaseUrl, isPubliclyReachable } from "@/lib/publicBaseUrl";
import { preparePhotoVoiceovers } from "@/lib/preparePhotoVoiceovers";
import { resolveVoiceoverSourceForCreatomate } from "@/lib/resolveVoiceoverSource";
import { isPlaceholderDealerName } from "@/lib/videoTemplateI18n";
import { parseLanguageCode } from "@/lib/languages";

const CREATOMATE_API_URL = "https://api.creatomate.com/v2/renders";
const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 60;
const PENDING_RENDER_STATUSES = new Set(["planned", "waiting", "rendering"]);

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MIN_PHOTOS = 8;
const MAX_PHOTOS = 15;

type CreatomateRender = {
  id: string;
  status: string;
  url?: string;
  error_message?: string;
  width?: number;
  height?: number;
  render_scale?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCreatomateErrorBody(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Creatomate render hatası";
  try {
    const j = JSON.parse(trimmed) as {
      hint?: string;
      error?: string;
      message?: string;
    };
    return j.hint ?? j.error ?? j.message ?? trimmed;
  } catch {
    return trimmed;
  }
}

function formatRenderFailure(render: CreatomateRender): string {
  return (
    render.error_message?.trim() ||
    "Render başarısız. Creatomate hesabınızda kredi veya entegrasyon sorunu olabilir."
  );
}

function parseRenderResponse(data: unknown): CreatomateRender | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  if (data && typeof data === "object" && "id" in data) {
    return data as CreatomateRender;
  }
  return null;
}

function normalizePhotos(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim())
    .filter(Boolean);
}

type RenderRequestBody = CarVideoFormData & {
  voiceoverText?: string;
  photoVoiceovers?: string[];
  voiceoverLanguage?: string;
};

function resolveMusicSource(request: NextRequest, musicSource?: string): string | undefined {
  if (!musicSource?.trim()) return undefined;
  const trimmed = musicSource.trim();
  const publicBase = getPublicBaseUrl(request);

  try {
    const u = new URL(trimmed);
    const isLocal =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "::1";
    if (isLocal && isPubliclyReachable(publicBase)) {
      return `${publicBase}${u.pathname}`;
    }
    if (isLocal) return undefined;
  } catch {
    return trimmed;
  }

  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CREATOMATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Creatomate API yapılandırması eksik (CREATOMATE_API_KEY)." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as RenderRequestBody;
    const photos = normalizePhotos(body.photos);
    const format: VideoFormat =
      body.format === "youtube"
        ? "youtube"
        : body.format === "square"
          ? "square"
          : "reels";
    const templateStyle: TemplateStyle =
      body.templateStyle === "dynamic" ? "dynamic" : "classic";
    const templateEngine: TemplateEngine =
      body.templateEngine === "studio" ? "studio" : "legacy";

    if (photos.length < MIN_PHOTOS) {
      return NextResponse.json(
        { error: "En az 8 fotoğraf gerekli" },
        { status: 400 },
      );
    }

    if (photos.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: "En fazla 15 fotoğraf eklenebilir" },
        { status: 400 },
      );
    }

    const voiceoverText = body.voiceoverText?.trim();
    const photoVoiceovers = body.photoVoiceovers?.map((line) => line.trim());
    let voiceoverAudioSource: string | undefined;
    let photoVoiceoverDurations: number[] | undefined;
    let photoVoiceoverSources: string[] | undefined;

    const videoLanguage = parseLanguageCode(body.videoLanguage, "tr");
    const voiceoverLanguage = parseLanguageCode(
      body.voiceoverLanguage ?? body.videoLanguage,
      videoLanguage,
    );

    if (photoVoiceovers?.some((line) => line.trim())) {
      const prepared = await preparePhotoVoiceovers(
        request,
        photoVoiceovers,
        voiceoverLanguage,
      );
      photoVoiceoverDurations = prepared.durations;
      if (prepared.sources?.some((url) => url.trim())) {
        photoVoiceoverSources = prepared.sources;
      }
    } else if (!voiceoverText) {
      voiceoverAudioSource = await resolveVoiceoverSourceForCreatomate(request, {
        voiceoverAudioSource: body.voiceoverAudioSource,
      });
    }

    const formData: CarVideoFormData = {
      dealerName: isPlaceholderDealerName(body.dealerName) ? "" : (body.dealerName ?? ""),
      introSubtitle: body.introSubtitle ?? "",
      carTitle: body.carTitle ?? "",
      carSubtitle: body.carSubtitle ?? "",
      priceTag: body.priceTag ?? "",
      specKm: body.specKm ?? "",
      specFuel: body.specFuel ?? "",
      specGear: body.specGear ?? "",
      specYear: body.specYear ?? "",
      specMotor: body.specMotor,
      specColor: body.specColor,
      specBody: body.specBody,
      specSeries: body.specSeries,
      specEnginePower: body.specEnginePower,
      specEngineVolume: body.specEngineVolume,
      specDrivetrain: body.specDrivetrain,
      specCondition: body.specCondition,
      specWarranty: body.specWarranty,
      specDamage: body.specDamage,
      ctaMain: body.ctaMain ?? "",
      phone: body.phone ?? "",
      address: body.address ?? "",
      photos,
      format,
      templateStyle,
      templateEngine,
      videoLanguage,
      musicSource: resolveMusicSource(request, body.musicSource),
      voiceoverText,
      photoVoiceovers,
      photoVoiceoverDurations,
      photoVoiceoverSources,
      voiceoverLanguage,
      voiceoverAudioSource,
      musicVolume: body.musicVolume,
    };

    const source = buildRenderScript(formData, format);

    const createResponse = await fetch(CREATOMATE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...source,
        render_scale: 1,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return NextResponse.json(
        { error: parseCreatomateErrorBody(errorText) },
        { status: 500 },
      );
    }

    const createData = await createResponse.json();
    let render = parseRenderResponse(createData);

    if (!render?.id) {
      return NextResponse.json(
        { error: "Creatomate render yanıtı geçersiz." },
        { status: 500 },
      );
    }

    let attempts = 0;

    while (PENDING_RENDER_STATUSES.has(render.status) && attempts < MAX_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS);
      attempts++;

      const pollResponse = await fetch(
        `${CREATOMATE_API_URL}/${render.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        return NextResponse.json(
          { error: parseCreatomateErrorBody(errorText) },
          { status: 500 },
        );
      }

      render = (await pollResponse.json()) as CreatomateRender;

      if (render.status === "failed") {
        return NextResponse.json(
          { error: formatRenderFailure(render) },
          { status: 500 },
        );
      }
    }

    if (render.status === "succeeded") {
      return NextResponse.json({
        url: render.url,
        status: render.status,
        id: render.id,
        width: render.width,
        height: render.height,
        render_scale: render.render_scale,
      });
    }

    if (PENDING_RENDER_STATUSES.has(render.status)) {
      return NextResponse.json(
        { error: "Render zaman aşımına uğradı" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: formatRenderFailure(render) },
      { status: 500 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
