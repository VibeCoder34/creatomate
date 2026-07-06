import { NextRequest, NextResponse } from "next/server";
import { getEphemeralAudio } from "@/lib/ephemeralAudio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const buffer = getEphemeralAudio(id);

  if (!buffer) {
    return NextResponse.json({ error: "Ses dosyası bulunamadı veya süresi doldu." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=900",
      "Content-Length": String(buffer.length),
    },
  });
}
