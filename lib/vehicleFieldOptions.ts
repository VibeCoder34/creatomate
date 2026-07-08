import type { LanguageCode } from "@/lib/languages";
import { enumOptions } from "@/lib/vehicleEnums";

export function gearboxOptions(lang: LanguageCode) {
  return enumOptions("gearbox", lang);
}
export function fuelOptions(lang: LanguageCode) {
  return enumOptions("fuel", lang);
}
export function drivetrainOptions(lang: LanguageCode) {
  return enumOptions("drivetrain", lang);
}
export function bodyOptions(lang: LanguageCode) {
  return enumOptions("body", lang);
}
export function conditionOptions(lang: LanguageCode) {
  return enumOptions("condition", lang);
}
export function colorOptions(lang: LanguageCode) {
  return enumOptions("color", lang);
}
export function yesNoOptions(lang: LanguageCode) {
  return enumOptions("yesNo", lang);
}

export function selectEmptyLabel(lang: LanguageCode): string {
  const labels: Record<LanguageCode, string> = {
    tr: "— Seçin —",
    en: "— Select —",
    es: "— Seleccionar —",
    fr: "— Choisir —",
    de: "— Auswählen —",
    it: "— Seleziona —",
    ru: "— Выберите —",
    pt: "— Selecionar —",
  };
  return labels[lang] ?? labels.en;
}

// Backward-compatible TR-only exports (avoid in new code)
export const GEARBOX_OPTIONS = ["", "Manuel", "Otomatik", "Yarı Otomatik"] as const;
export const FUEL_OPTIONS = ["", "Benzin", "Dizel", "LPG", "Benzin & LPG", "Elektrik", "Hibrit"] as const;
export const DRIVETRAIN_OPTIONS = ["", "Önden Çekiş", "Arkadan İtiş", "4x4", "AWD"] as const;
export const BODY_OPTIONS = ["", "Sedan", "Hatchback", "SUV", "Coupe", "Cabrio", "Station Wagon"] as const;
export const CONDITION_OPTIONS = ["", "İkinci El", "Sıfır"] as const;
export const COLOR_OPTIONS = ["", "Siyah", "Beyaz", "Gri", "Gümüş", "Kırmızı", "Mavi"] as const;
export const YES_NO_OPTIONS = ["", "Evet", "Hayır", "Bilinmiyor"] as const;
