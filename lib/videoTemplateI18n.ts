import { parseLanguageCode, type LanguageCode } from "@/lib/languages";

export type VideoTemplateStrings = {
  specsHeading: string;
  carInfoHeading: string;
  techDetailsHeading: string;
  summaryHeading: string;
  galleryLabel: string;
  introSubtitleDefault: string;
  ctaMainDefault: string;
  carTitleFallback: string;
  carSubtitleFallback: string;
  warrantyYes: string;
  warrantyNo: string;
  damageFree: string;
  damageRecorded: string;
  specKm: string;
  specFuel: string;
  specGear: string;
  specYear: string;
  specMotor: string;
  specColor: string;
  specBody: string;
  specSeries: string;
  specPower: string;
  specVolume: string;
  specDrivetrain: string;
  specCondition: string;
  specWarranty: string;
  specDamage: string;
  specCar: string;
  specPrice: string;
};

const TR: VideoTemplateStrings = {
  specsHeading: "TEKNİK ÖZELLİKLER",
  carInfoHeading: "ARAÇ BİLGİLERİ",
  techDetailsHeading: "TEKNİK DETAYLAR",
  summaryHeading: "ÖZET",
  galleryLabel: "GALERİ",
  introSubtitleDefault: "HAFTANIN ÖNE ÇIKAN ARACI",
  ctaMainDefault: "HEMEN ARAYIN",
  carTitleFallback: "Araç Tanıtımı",
  carSubtitleFallback: "Detaylı inceleme için arayın",
  warrantyYes: "Garantili",
  warrantyNo: "Garantisiz",
  damageFree: "Hasarsız",
  damageRecorded: "Ağır hasar kayıtlı",
  specKm: "KİLOMETRE",
  specFuel: "YAKIT",
  specGear: "VİTES",
  specYear: "MODEL",
  specMotor: "MOTOR",
  specColor: "RENK",
  specBody: "KASA",
  specSeries: "SERİ",
  specPower: "GÜÇ",
  specVolume: "HACİM",
  specDrivetrain: "ÇEKİŞ",
  specCondition: "DURUM",
  specWarranty: "GARANTİ",
  specDamage: "HASAR",
  specCar: "ARAÇ",
  specPrice: "FİYAT",
};

const EN: VideoTemplateStrings = {
  specsHeading: "TECHNICAL SPECS",
  carInfoHeading: "VEHICLE INFO",
  techDetailsHeading: "TECH DETAILS",
  summaryHeading: "SUMMARY",
  galleryLabel: "GALLERY",
  introSubtitleDefault: "FEATURED VEHICLE OF THE WEEK",
  ctaMainDefault: "CALL NOW",
  carTitleFallback: "Vehicle Showcase",
  carSubtitleFallback: "Call us for more details",
  warrantyYes: "Under warranty",
  warrantyNo: "No warranty",
  damageFree: "Accident-free",
  damageRecorded: "Major damage record",
  specKm: "MILEAGE",
  specFuel: "FUEL",
  specGear: "TRANSMISSION",
  specYear: "YEAR",
  specMotor: "ENGINE",
  specColor: "COLOR",
  specBody: "BODY",
  specSeries: "TRIM",
  specPower: "POWER",
  specVolume: "DISPLACEMENT",
  specDrivetrain: "DRIVETRAIN",
  specCondition: "CONDITION",
  specWarranty: "WARRANTY",
  specDamage: "DAMAGE",
  specCar: "VEHICLE",
  specPrice: "PRICE",
};

const ES: VideoTemplateStrings = {
  ...EN,
  specsHeading: "ESPECIFICACIONES",
  carInfoHeading: "INFORMACIÓN",
  techDetailsHeading: "DETALLES TÉCNICOS",
  summaryHeading: "RESUMEN",
  galleryLabel: "GALERÍA",
  introSubtitleDefault: "VEHÍCULO DESTACADO",
  ctaMainDefault: "LLÁMANOS",
  carTitleFallback: "Presentación del vehículo",
  carSubtitleFallback: "Llámanos para más información",
  warrantyYes: "Con garantía",
  warrantyNo: "Sin garantía",
  damageFree: "Sin daños",
  damageRecorded: "Daños graves registrados",
  specKm: "KILOMETRAJE",
  specFuel: "COMBUSTIBLE",
  specGear: "CAMBIO",
  specYear: "AÑO",
  specMotor: "MOTOR",
  specColor: "COLOR",
  specBody: "CARROCERÍA",
  specSeries: "SERIE",
  specPower: "POTENCIA",
  specVolume: "CILINDRADA",
  specDrivetrain: "TRACCIÓN",
  specCondition: "ESTADO",
  specWarranty: "GARANTÍA",
  specDamage: "DAÑOS",
  specCar: "VEHÍCULO",
  specPrice: "PRECIO",
};

const FR: VideoTemplateStrings = {
  ...EN,
  specsHeading: "CARACTÉRISTIQUES",
  carInfoHeading: "INFORMATIONS",
  techDetailsHeading: "DÉTAILS TECHNIQUES",
  summaryHeading: "RÉSUMÉ",
  galleryLabel: "GALERIE",
  introSubtitleDefault: "VÉHICULE À LA UNE",
  ctaMainDefault: "APPELEZ-NOUS",
  carTitleFallback: "Présentation du véhicule",
  carSubtitleFallback: "Contactez-nous pour plus de détails",
  warrantyYes: "Sous garantie",
  warrantyNo: "Sans garantie",
  damageFree: "Sans accident",
  damageRecorded: "Sinistre majeur",
  specKm: "KILOMÉTRAGE",
  specFuel: "CARBURANT",
  specGear: "BOÎTE",
  specYear: "ANNÉE",
  specMotor: "MOTEUR",
  specColor: "COULEUR",
  specBody: "CARROSSERIE",
  specSeries: "SÉRIE",
  specPower: "PUISSANCE",
  specVolume: "CILINDRÉE",
  specDrivetrain: "TRACTION",
  specCondition: "ÉTAT",
  specWarranty: "GARANTIE",
  specDamage: "DOMMAGES",
  specCar: "VÉHICULE",
  specPrice: "PRIX",
};

const DE: VideoTemplateStrings = {
  ...EN,
  specsHeading: "TECHNISCHE DATEN",
  carInfoHeading: "FAHRZEUGINFO",
  techDetailsHeading: "TECHNISCHE DETAILS",
  summaryHeading: "ZUSAMMENFASSUNG",
  galleryLabel: "GALERIE",
  introSubtitleDefault: "FAHRZEUG DER WOCHE",
  ctaMainDefault: "JETZT ANRUFEN",
  carTitleFallback: "Fahrzeugpräsentation",
  carSubtitleFallback: "Rufen Sie uns für Details an",
  warrantyYes: "Mit Garantie",
  warrantyNo: "Ohne Garantie",
  damageFree: "Unfallfrei",
  damageRecorded: "Schwerer Schaden",
  specKm: "KILOMETER",
  specFuel: "KRAFTSTOFF",
  specGear: "GETRIEBE",
  specYear: "JAHR",
  specMotor: "MOTOR",
  specColor: "FARBE",
  specBody: "KAROSSERIE",
  specSeries: "SERIE",
  specPower: "LEISTUNG",
  specVolume: "HUBRAUM",
  specDrivetrain: "ANTRIEB",
  specCondition: "ZUSTAND",
  specWarranty: "GARANTIE",
  specDamage: "SCHADEN",
  specCar: "FAHRZEUG",
  specPrice: "PREIS",
};

const IT: VideoTemplateStrings = {
  ...EN,
  specsHeading: "SPECIFICHE",
  carInfoHeading: "INFORMAZIONI",
  techDetailsHeading: "DETTAGLI TECNICI",
  summaryHeading: "RIEPILOGO",
  galleryLabel: "GALLERIA",
  introSubtitleDefault: "AUTO IN EVIDENZA",
  ctaMainDefault: "CHIAMACI",
  carTitleFallback: "Presentazione veicolo",
  carSubtitleFallback: "Chiamaci per maggiori dettagli",
  warrantyYes: "In garanzia",
  warrantyNo: "Senza garanzia",
  damageFree: "Senza incidenti",
  damageRecorded: "Danni gravi registrati",
  specKm: "CHILOMETRAGGIO",
  specFuel: "CARBURANTE",
  specGear: "CAMBIO",
  specYear: "ANNO",
  specMotor: "MOTORE",
  specColor: "COLORE",
  specBody: "CARROZZERIA",
  specSeries: "SERIE",
  specPower: "POTENZA",
  specVolume: "CILINDRATA",
  specDrivetrain: "TRAZIONE",
  specCondition: "CONDIZIONE",
  specWarranty: "GARANZIA",
  specDamage: "DANNI",
  specCar: "VEICOLO",
  specPrice: "PREZZO",
};

const RU: VideoTemplateStrings = {
  ...EN,
  specsHeading: "ХАРАКТЕРИСТИКИ",
  carInfoHeading: "ОБ АВТО",
  techDetailsHeading: "ТЕХ. ДАННЫЕ",
  summaryHeading: "ИТОГ",
  galleryLabel: "ГАЛЕРЕЯ",
  introSubtitleDefault: "АВТО НЕДЕЛИ",
  ctaMainDefault: "ЗВОНИТЕ",
  carTitleFallback: "Презентация автомобиля",
  carSubtitleFallback: "Позвоните для подробностей",
  warrantyYes: "С гарантией",
  warrantyNo: "Без гарантии",
  damageFree: "Без ДТП",
  damageRecorded: "Крупные повреждения",
  specKm: "ПРОБЕГ",
  specFuel: "ТОПЛИВО",
  specGear: "КПП",
  specYear: "ГОД",
  specMotor: "ДВИГАТЕЛЬ",
  specColor: "ЦВЕТ",
  specBody: "КУЗОВ",
  specSeries: "СЕРИЯ",
  specPower: "МОЩНОСТЬ",
  specVolume: "ОБЪЁМ",
  specDrivetrain: "ПРИВОД",
  specCondition: "СОСТОЯНИЕ",
  specWarranty: "ГАРАНТИЯ",
  specDamage: "ПОВРЕЖДЕНИЯ",
  specCar: "АВТО",
  specPrice: "ЦЕНА",
};

const PT: VideoTemplateStrings = {
  ...EN,
  specsHeading: "ESPECIFICAÇÕES",
  carInfoHeading: "INFORMAÇÕES",
  techDetailsHeading: "DETALHES TÉCNICOS",
  summaryHeading: "RESUMO",
  galleryLabel: "GALERIA",
  introSubtitleDefault: "VEÍCULO EM DESTAQUE",
  ctaMainDefault: "LIGUE AGORA",
  carTitleFallback: "Apresentação do veículo",
  carSubtitleFallback: "Ligue para mais detalhes",
  warrantyYes: "Com garantia",
  warrantyNo: "Sem garantia",
  damageFree: "Sem danos",
  damageRecorded: "Danos graves registrados",
  specKm: "QUILOMETRAGEM",
  specFuel: "COMBUSTÍVEL",
  specGear: "CÂMBIO",
  specYear: "ANO",
  specMotor: "MOTOR",
  specColor: "COR",
  specBody: "CARROCERIA",
  specSeries: "SÉRIE",
  specPower: "POTÊNCIA",
  specVolume: "CILINDRADA",
  specDrivetrain: "TRAÇÃO",
  specCondition: "CONDIÇÃO",
  specWarranty: "GARANTIA",
  specDamage: "DANOS",
  specCar: "VEÍCULO",
  specPrice: "PREÇO",
};

export const VIDEO_TEMPLATE_I18N: Record<LanguageCode, VideoTemplateStrings> = {
  tr: TR,
  en: EN,
  es: ES,
  fr: FR,
  de: DE,
  it: IT,
  ru: RU,
  pt: PT,
};

export function videoTemplateStrings(lang?: string): VideoTemplateStrings {
  const code = parseLanguageCode(lang, "tr");
  return VIDEO_TEMPLATE_I18N[code];
}

/** Eski varsayılan marka adı — videoda gösterilmez */
export function isPlaceholderDealerName(name?: string): boolean {
  const n = name?.trim().toLowerCase() ?? "";
  return !n || n === "carstudio" || n === "carstudio reels";
}
