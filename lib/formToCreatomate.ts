import type { CarVideoFormData } from "@/app/lib/template";
import type { CurrencyCode } from "@/lib/money";
import { formatPrice } from "@/lib/money";
import type { LanguageCode } from "@/lib/languages";
import { isPlaceholderDealerName, videoTemplateStrings } from "@/lib/videoTemplateI18n";
import { localizeFormForVideo, translateEnumValue } from "@/lib/vehicleEnums";

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

export function buildCarSubtitle(form: DemoFormData, language: LanguageCode): string {
  const localized = localizeFormForVideo(form, language);
  const t = videoTemplateStrings(language);
  const parts = [
    localized.aracDurumu,
    localized.seri,
    translateEnumValue("yesNo", form.garanti, language) === t.warrantyYes ||
    form.garanti === "Evet" ||
    form.garanti === "Yes"
      ? t.warrantyYes
      : "",
    translateEnumValue("yesNo", form.agirHasarKayitli, language) === t.damageFree ||
    form.agirHasarKayitli === "Hayır" ||
    form.agirHasarKayitli === "No"
      ? t.damageFree
      : "",
  ].filter(Boolean);
  return parts.join(" · ") || t.carSubtitleFallback;
}

export function formToCreatomatePayload(
  form: DemoFormData,
  photos: string[],
  opts: {
    format: "reels" | "youtube" | "square";
    templateStyle: "classic" | "dynamic";
    templateEngine?: "legacy" | "studio";
    videoLanguage: LanguageCode;
    currency: CurrencyCode;
    musicSource?: string;
    voiceoverAudioSource?: string;
    musicVolume?: number;
  },
): CarVideoFormData {
  const t = videoTemplateStrings(opts.videoLanguage);
  const localized = localizeFormForVideo(form, opts.videoLanguage);
  const titleParts = [localized.year, localized.carBrand, localized.carModel].filter(Boolean);
  const carTitle = titleParts.join(" ") || t.carTitleFallback;

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
  const kmUnit = opts.videoLanguage === "ru" ? "км" : "km";
  const specKm = kmRaw
    ? new RegExp(`\\b(${kmUnit}|km|км)\\b`, "i").test(kmRaw)
      ? kmRaw
      : `${kmRaw} ${kmUnit}`
    : "";

  const dealerRaw = form.dealerName?.trim() ?? "";
  const dealerName = isPlaceholderDealerName(dealerRaw) ? "" : dealerRaw;

  const yesGaranti =
    translateEnumValue("yesNo", form.garanti, opts.videoLanguage) === t.warrantyYes ||
    form.garanti === "Evet" ||
    form.garanti === "Yes";
  const noGaranti =
    translateEnumValue("yesNo", form.garanti, opts.videoLanguage) === t.warrantyNo ||
    form.garanti === "Hayır" ||
    form.garanti === "No";
  const noHasar =
    translateEnumValue("yesNo", form.agirHasarKayitli, opts.videoLanguage) === t.damageFree ||
    form.agirHasarKayitli === "Hayır" ||
    form.agirHasarKayitli === "No";
  const yesHasar =
    translateEnumValue("yesNo", form.agirHasarKayitli, opts.videoLanguage) === t.damageRecorded ||
    form.agirHasarKayitli === "Evet" ||
    form.agirHasarKayitli === "Yes";

  let specWarranty = localized.garanti;
  if (yesGaranti) specWarranty = t.warrantyYes;
  else if (noGaranti) specWarranty = t.warrantyNo;

  let specDamage = localized.agirHasarKayitli;
  if (noHasar) specDamage = t.damageFree;
  else if (yesHasar) specDamage = t.damageRecorded;

  return {
    dealerName,
    introSubtitle: form.introSubtitle?.trim() || t.introSubtitleDefault,
    carTitle,
    carSubtitle: buildCarSubtitle(form, opts.videoLanguage),
    priceTag,
    specKm,
    specFuel: localized.yakit,
    specGear: localized.vites,
    specYear: localized.year,
    specMotor: localized.motor,
    specColor: localized.renk,
    specBody: localized.kasa,
    specSeries: localized.seri,
    specEnginePower: localized.motorGucu,
    specEngineVolume: localized.motorHacmi,
    specDrivetrain: localized.cekis,
    specCondition: localized.aracDurumu,
    specWarranty,
    specDamage,
    ctaMain: form.ctaMain?.trim() || t.ctaMainDefault,
    phone: form.ctaPhone,
    address: form.address?.trim() || "",
    photos,
    format: opts.format,
    templateStyle: opts.templateStyle,
    templateEngine: opts.templateEngine ?? "legacy",
    videoLanguage: opts.videoLanguage,
    musicSource: opts.musicSource,
    voiceoverAudioSource: opts.voiceoverAudioSource,
    musicVolume: opts.musicVolume,
  };
}
