import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getOpenAI, getOpenAIModelIdentify } from "@/lib/openai";
import { resolveImagesForOpenAI, type OpenAIImageInput } from "@/lib/openaiImage";
import { parseLanguageCode, type LanguageCode } from "@/lib/languages";
import { identifyEnums } from "@/lib/vehicleEnums";

interface IdentifyPhoto extends OpenAIImageInput {}

interface IdentifyRequest {
  photos: IdentifyPhoto[];
  videoLanguage?: LanguageCode;
}

export async function POST(req: Request) {
  try {
    const { photos, videoLanguage: rawLang }: IdentifyRequest = await req.json();
    if (!photos?.length) {
      return NextResponse.json({ error: "Fotoğraf bulunamadı" }, { status: 400 });
    }

    const imageUrls = await resolveImagesForOpenAI(photos.slice(0, 5));
    if (!imageUrls.length) {
      return NextResponse.json({ error: "Geçerli fotoğraf URL'si bulunamadı" }, { status: 400 });
    }

    const videoLanguage: LanguageCode = parseLanguageCode(rawLang, "tr");

    const openai = getOpenAI();
    const model = getOpenAIModelIdentify();

    const languageLine = `VIDEO LANGUAGE: ${videoLanguage}. All human-readable values you output must be in this language.`;
    const enums = identifyEnums(videoLanguage);

    const instruction = `Analyze these car photos and fill the car listing form as accurately as possible.
${languageLine}

Priority:
1) Information clearly visible in the photos
2) Strong visual inference (badges, trim cues, body shape, dashboard layout, etc.)

Rules (strict):
- If the following fields cannot be extracted from photos, return empty string "" and NEVER guess:
  price, km, ilanTarihi, garanti, agirHasarKayitli, plaka, ctaPhone
- "price" and "km" are especially critical: if not clearly visible, return "".
- For these fields, try not to leave them empty if you can infer reliably from visuals:
  carBrand, carModel, year, kasa, yakit, vites, renk, cekis, motor, motorGucu, motorHacmi, seri
- year: if not certain, write the most likely close year based on design cues. If no clue, return "".
- Output ONLY JSON. No markdown, no extra text, no placeholders like "-" or "—".

Allowed enumerations (MUST use one of these exact strings when applicable):
- vites (gearbox): ${enums.gearbox.map((s) => `"${s}"`).join(", ")}
- yakit (fuel): ${enums.fuel.map((s) => `"${s}"`).join(", ")}
- cekis (drivetrain): ${enums.drivetrain.map((s) => `"${s}"`).join(", ")}
- garanti / agirHasarKayitli: ${enums.yesNo.map((s) => `"${s}"`).join(", ")} or "" if unknown
- aracDurumu: if unknown, use "${enums.conditionDefault}"

Return JSON in this exact format:
{
  "carBrand": "",
  "carModel": "",
  "year": "",
  "price": "",
  "ctaPhone": "",
  "km": "",
  "seri": "",
  "motor": "",
  "motorGucu": "",
  "motorHacmi": "",
  "kasa": "",
  "renk": "",
  "vites": "",
  "yakit": "",
  "cekis": "",
  "aracDurumu": "",
  "garanti": "",
  "agirHasarKayitli": "",
  "plaka": "",
  "ilanTarihi": ""
}
`;

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      ...imageUrls.map(
        (imageUrl): OpenAI.Chat.ChatCompletionContentPart => ({
          type: "image_url",
          image_url: { url: imageUrl },
        }),
      ),
      { type: "text", text: instruction },
    ];

    const completion = await openai.chat.completions.create({
      model,
      max_tokens: 1400,
      temperature: 0,
      seed: 42,
      messages: [{ role: "user", content: userContent }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Araç tanınamadı" }, { status: 422 });
      }
      data = JSON.parse(match[0]);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[identify]", err);
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("429") || message.toLowerCase().includes("quota") ? 402 : 500;
    const friendly =
      status === 402
        ? "OpenAI kotası dolmuş veya faturalandırma aktif değil. platform.openai.com üzerinden kontrol edin."
        : message;
    return NextResponse.json({ error: friendly, details: message }, { status });
  }
}
