import type { CarVideoFormData } from "@/app/lib/template";
import type { CurrencyCode } from "@/lib/money";
import { formatPrice } from "@/lib/money";
import type { LanguageCode } from "@/lib/languages";

export type DemoFormData = {
  carBrand: string;
  carModel: string;
  year: string;
  price: string;
  ctaPhone: string;
  km: string;
  motor: string;
  renk: string;
  vites: string;
  yakit: string;
  kasa: string;
  seri: string;
  aracDurumu: string;
  motorGucu: string;
  motorHacmi: string;
  cekis: string;
  garanti: string;
  agirHasarKayitli: string;
  plaka: string;
  ilanTarihi: string;
  dealerName?: string;
  introSubtitle?: string;
  ctaMain?: string;
  address?: string;
};

export function buildCarSubtitle(form: DemoFormData): string {
  const parts = [
    form.aracDurumu,
    form.seri,
    form.garanti === "Evet" ? "Garantili" : "",
    form.agirHasarKayitli === "Hayır" ? "Hasarsız" : "",
  ].filter(Boolean);
  return parts.join(" · ") || "Detaylı inceleme için arayın";
}

export function formToCreatomatePayload(
  form: DemoFormData,
  photos: string[],
  opts: {
    format: "reels" | "youtube";
    templateStyle: "classic" | "dynamic";
    videoLanguage: LanguageCode;
    currency: CurrencyCode;
    musicSource?: string;
    voiceoverAudioSource?: string;
    musicVolume?: number;
  },
): CarVideoFormData {
  const titleParts = [form.year, form.carBrand, form.carModel].filter(Boolean);
  const carTitle = titleParts.join(" ") || "Araç Tanıtımı";

  const priceFormatted =
    formatPrice(form.price, {
      language: opts.videoLanguage,
      currency: opts.currency,
      style: "number",
    }) ?? form.price;

  const currencySymbols: Record<CurrencyCode, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
    RUB: "₽",
  };
  const priceTag = priceFormatted
    ? `${priceFormatted} ${currencySymbols[opts.currency] ?? ""}`.trim()
    : "";

  const kmRaw = form.km?.trim() ?? "";
  const specKm = kmRaw
    ? /\bkm\b/i.test(kmRaw)
      ? kmRaw
      : `${kmRaw} km`
    : "";

  return {
    dealerName: form.dealerName?.trim() || "CarStudio",
    introSubtitle: form.introSubtitle?.trim() || "HAFTANIN ÖNE ÇIKAN ARACI",
    carTitle,
    carSubtitle: buildCarSubtitle(form),
    priceTag,
    specKm,
    specFuel: form.yakit,
    specGear: form.vites,
    specYear: form.year,
    ctaMain: form.ctaMain?.trim() || "HEMEN ARAYIN",
    phone: form.ctaPhone,
    address: form.address?.trim() || "",
    photos,
    format: opts.format,
    templateStyle: opts.templateStyle,
    musicSource: opts.musicSource,
    voiceoverAudioSource: opts.voiceoverAudioSource,
    musicVolume: opts.musicVolume,
  };
}
