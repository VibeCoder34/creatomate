import type { LanguageCode } from "@/lib/languages";
import type { DemoFormData } from "@/lib/formToCreatomate";

export type EnumGroup =
  | "gearbox"
  | "fuel"
  | "drivetrain"
  | "condition"
  | "yesNo"
  | "body"
  | "color";

const GEARBOX: Record<LanguageCode, string[]> = {
  tr: ["Manuel", "Otomatik", "Yarı Otomatik"],
  en: ["Manual", "Automatic", "Semi-automatic"],
  es: ["Manual", "Automático", "Semiautomático"],
  fr: ["Manuelle", "Automatique", "Semi-automatique"],
  de: ["Schaltgetriebe", "Automatik", "Halbautomatik"],
  it: ["Manuale", "Automatico", "Semiautomatico"],
  ru: ["Механика", "Автомат", "Робот"],
  pt: ["Manual", "Automático", "Semiautomático"],
};

const FUEL: Record<LanguageCode, string[]> = {
  tr: ["Benzin", "Dizel", "LPG", "Benzin & LPG", "Elektrik", "Hibrit"],
  en: ["Petrol", "Diesel", "LPG", "Petrol & LPG", "Electric", "Hybrid"],
  es: ["Gasolina", "Diésel", "GLP", "Gasolina y GLP", "Eléctrico", "Híbrido"],
  fr: ["Essence", "Diesel", "GPL", "Essence & GPL", "Électrique", "Hybride"],
  de: ["Benzin", "Diesel", "LPG", "Benzin & LPG", "Elektro", "Hybrid"],
  it: ["Benzina", "Diesel", "GPL", "Benzina & GPL", "Elettrico", "Ibrido"],
  ru: ["Бензин", "Дизель", "LPG", "Бензин и LPG", "Электро", "Гибрид"],
  pt: ["Gasolina", "Diesel", "GLP", "Gasolina & GLP", "Elétrico", "Híbrido"],
};

const DRIVETRAIN: Record<LanguageCode, string[]> = {
  tr: ["Önden Çekiş", "Arkadan İtiş", "4x4", "AWD"],
  en: ["FWD", "RWD", "4x4", "AWD"],
  es: ["Tracción delantera", "Tracción trasera", "4x4", "AWD"],
  fr: ["Traction", "Propulsion", "4x4", "AWD"],
  de: ["Frontantrieb", "Heckantrieb", "4x4", "AWD"],
  it: ["Trazione anteriore", "Trazione posteriore", "4x4", "AWD"],
  ru: ["Передний привод", "Задний привод", "4x4", "AWD"],
  pt: ["Tração dianteira", "Tração traseira", "4x4", "AWD"],
};

const CONDITION: Record<LanguageCode, string[]> = {
  tr: ["İkinci El", "Sıfır"],
  en: ["Used", "New"],
  es: ["Usado", "Nuevo"],
  fr: ["Occasion", "Neuf"],
  de: ["Gebraucht", "Neu"],
  it: ["Usato", "Nuovo"],
  ru: ["С пробегом", "Новый"],
  pt: ["Usado", "Novo"],
};

const YES_NO: Record<LanguageCode, string[]> = {
  tr: ["Evet", "Hayır", "Bilinmiyor"],
  en: ["Yes", "No", "Unknown"],
  es: ["Sí", "No", "Desconocido"],
  fr: ["Oui", "Non", "Inconnu"],
  de: ["Ja", "Nein", "Unbekannt"],
  it: ["Sì", "No", "Sconosciuto"],
  ru: ["Да", "Нет", "Неизвестно"],
  pt: ["Sim", "Não", "Desconhecido"],
};

const BODY: Record<LanguageCode, string[]> = {
  tr: ["Sedan", "Hatchback", "SUV", "Coupe", "Cabrio", "Station Wagon"],
  en: ["Sedan", "Hatchback", "SUV", "Coupe", "Convertible", "Station Wagon"],
  es: ["Sedán", "Hatchback", "SUV", "Coupé", "Cabrio", "Familiar"],
  fr: ["Berline", "Hayon", "SUV", "Coupé", "Cabriolet", "Break"],
  de: ["Limousine", "Schrägheck", "SUV", "Coupé", "Cabrio", "Kombi"],
  it: ["Berlina", "Hatchback", "SUV", "Coupé", "Cabrio", "Station Wagon"],
  ru: ["Седан", "Хэтчбек", "SUV", "Купе", "Кабриолет", "Универсал"],
  pt: ["Sedan", "Hatchback", "SUV", "Coupé", "Cabrio", "Station Wagon"],
};

const COLOR: Record<LanguageCode, string[]> = {
  tr: ["Siyah", "Beyaz", "Gri", "Gümüş", "Kırmızı", "Mavi"],
  en: ["Black", "White", "Gray", "Silver", "Red", "Blue"],
  es: ["Negro", "Blanco", "Gris", "Plateado", "Rojo", "Azul"],
  fr: ["Noir", "Blanc", "Gris", "Argent", "Rouge", "Bleu"],
  de: ["Schwarz", "Weiß", "Grau", "Silber", "Rot", "Blau"],
  it: ["Nero", "Bianco", "Grigio", "Argento", "Rosso", "Blu"],
  ru: ["Чёрный", "Белый", "Серый", "Серебристый", "Красный", "Синий"],
  pt: ["Preto", "Branco", "Cinza", "Prata", "Vermelho", "Azul"],
};

const GROUPS: Record<EnumGroup, Record<LanguageCode, string[]>> = {
  gearbox: GEARBOX,
  fuel: FUEL,
  drivetrain: DRIVETRAIN,
  condition: CONDITION,
  yesNo: YES_NO,
  body: BODY,
  color: COLOR,
};

const LANGS: LanguageCode[] = ["tr", "en", "es", "fr", "de", "it", "ru", "pt"];

function findEnumIndex(group: EnumGroup, value: string): number {
  const v = value.trim();
  if (!v) return -1;
  for (const lang of LANGS) {
    const idx = GROUPS[group][lang].findIndex((item) => item.toLowerCase() === v.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

export function translateEnumValue(
  group: EnumGroup,
  value: string,
  targetLang: LanguageCode,
): string {
  const v = value.trim();
  if (!v) return "";
  const idx = findEnumIndex(group, v);
  if (idx < 0) return v;
  return GROUPS[group][targetLang][idx] ?? v;
}

export function enumOptions(group: EnumGroup, lang: LanguageCode): string[] {
  return ["", ...GROUPS[group][lang]];
}

export function conditionDefault(lang: LanguageCode): string {
  return CONDITION[lang][0] ?? CONDITION.en[0];
}

export function identifyEnums(lang: LanguageCode) {
  return {
    gearbox: GEARBOX[lang],
    fuel: FUEL[lang],
    drivetrain: DRIVETRAIN[lang],
    yesNo: YES_NO[lang].slice(0, 2),
    conditionDefault: conditionDefault(lang),
  };
}

export function localizeFormForVideo(form: DemoFormData, lang: LanguageCode): DemoFormData {
  return {
    ...form,
    vites: translateEnumValue("gearbox", form.vites, lang),
    yakit: translateEnumValue("fuel", form.yakit, lang),
    cekis: translateEnumValue("drivetrain", form.cekis, lang),
    kasa: translateEnumValue("body", form.kasa, lang),
    renk: translateEnumValue("color", form.renk, lang),
    aracDurumu: translateEnumValue("condition", form.aracDurumu, lang),
    garanti: translateEnumValue("yesNo", form.garanti, lang),
    agirHasarKayitli: translateEnumValue("yesNo", form.agirHasarKayitli, lang),
  };
}
