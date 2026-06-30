import { NextRequest, NextResponse } from "next/server";
import {
  buildRenderScript,
  type CarVideoFormData,
  type VideoFormat,
} from "@/app/lib/template";

const CREATOMATE_API_URL = "https://api.creatomate.com/v2/renders";
const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 40;
const MIN_PHOTOS = 8;
const MAX_PHOTOS = 15;

type CreatomateRender = {
  id: string;
  status: string;
  url?: string;
  error_message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CREATOMATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Creatomate API yapılandırması eksik (CREATOMATE_API_KEY)." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as CarVideoFormData;
    const photos = normalizePhotos(body.photos);
    const format: VideoFormat =
      body.format === "youtube" ? "youtube" : "reels";

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

    const formData: CarVideoFormData = {
      dealerName: body.dealerName ?? "",
      introSubtitle: body.introSubtitle ?? "",
      carTitle: body.carTitle ?? "",
      carSubtitle: body.carSubtitle ?? "",
      priceTag: body.priceTag ?? "",
      specKm: body.specKm ?? "",
      specFuel: body.specFuel ?? "",
      specGear: body.specGear ?? "",
      specYear: body.specYear ?? "",
      ctaMain: body.ctaMain ?? "",
      phone: body.phone ?? "",
      address: body.address ?? "",
      photos,
      format,
    };

    const source = buildRenderScript(formData, format);

    const createResponse = await fetch(CREATOMATE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(source),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return NextResponse.json(
        { error: `Creatomate render isteği başarısız: ${errorText}` },
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

    while (
      (render.status === "planned" || render.status === "rendering") &&
      attempts < MAX_ATTEMPTS
    ) {
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
          { error: `Render durumu alınamadı: ${errorText}` },
          { status: 500 },
        );
      }

      render = (await pollResponse.json()) as CreatomateRender;

      if (render.status === "failed") {
        return NextResponse.json(
          { error: render.error_message || "Render başarısız" },
          { status: 500 },
        );
      }
    }

    if (render.status === "succeeded") {
      return NextResponse.json({
        url: render.url,
        status: render.status,
        id: render.id,
      });
    }

    if (render.status === "planned" || render.status === "rendering") {
      return NextResponse.json(
        { error: "Render zaman aşımına uğradı" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: render.error_message || "Render başarısız" },
      { status: 500 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
