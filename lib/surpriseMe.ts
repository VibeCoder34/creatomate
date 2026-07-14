import type { LanguageCode } from "@/lib/languages";
import type { MusicTrackId } from "@/lib/music";

export type VideoFormat = "reels" | "youtube";
export type TemplateStyle = "classic" | "dynamic" | "classic-pro" | "elegance" | "sport" | "urban" | "minimal";

export type TemplateEngine = "legacy" | "studio";

export type SurpriseConfig = {
  format: VideoFormat;
  templateStyle: TemplateStyle;
  templateEngine: TemplateEngine;
  musicTrackId: MusicTrackId;
  voiceoverEnabled: boolean;
  introSubtitle: string;
  ctaMain: string;
  shufflePhotos: boolean;
};

const FORMATS: readonly VideoFormat[] = ["reels", "youtube"];
const ENGINES: readonly TemplateEngine[] = ["legacy"];
const STYLES: readonly TemplateStyle[] = ["classic-pro", "elegance", "sport", "urban", "minimal"];

const MUSIC_IDS: readonly MusicTrackId[] = ["smooth1", "smooth2", "smooth3"];

const INTRO_SUBTITLE_VARIANTS: Record<LanguageCode, readonly string[]> = {
  tr: [
    "HAFTANIN ÖNE ÇIKAN ARACI",
    "ÖZEL FIRSAT",
    "KAÇIRMAYIN",
    "SHOWROOM'DA",
    "YENİ GELEN",
    "FIRSATI YAKALA",
    "PREMIUM SEÇİM",
    "SINIRLI SÜRE",
  ],
  en: [
    "FEATURED VEHICLE OF THE WEEK",
    "SPECIAL OFFER",
    "DON'T MISS OUT",
    "NOW IN STOCK",
    "JUST ARRIVED",
    "GRAB THE DEAL",
    "PREMIUM PICK",
    "LIMITED TIME",
  ],
  es: [
    "VEHÍCULO DESTACADO",
    "OFERTA ESPECIAL",
    "NO TE LO PIERDAS",
    "EN SHOWROOM",
    "RECIÉN LLEGADO",
    "APROVECHA",
    "SELECCIÓN PREMIUM",
    "TIEMPO LIMITADO",
  ],
  fr: [
    "VÉHICULE À LA UNE",
    "OFFRE SPÉCIALE",
    "À NE PAS MANQUER",
    "EN SHOWROOM",
    "NOUVEL ARRIVAGE",
    "SAISISSEZ L'OFFRE",
    "SÉLECTION PREMIUM",
    "DURÉE LIMITÉE",
  ],
  de: [
    "FAHRZEUG DER WOCHE",
    "SONDERANGEBOT",
    "NICHT VERPASSEN",
    "IM SHOWROOM",
    "FRISCH EINGETROFFEN",
    "JETZT ZUGREIFEN",
    "PREMIUM AUSWAHL",
    "NUR KURZE ZEIT",
  ],
  it: [
    "AUTO IN EVIDENZA",
    "OFFERTA SPECIALE",
    "NON PERDERE",
    "IN SHOWROOM",
    "APPENA ARRIVATA",
    "AFFERRA L'OFFERTA",
    "SCELTA PREMIUM",
    "TEMPO LIMITATO",
  ],
  ru: [
    "АВТО НЕДЕЛИ",
    "СПЕЦПРЕДЛОЖЕНИЕ",
    "НЕ УПУСТИТЕ",
    "В ШОУРУМЕ",
    "ТОЛЬКО ПОСТУПИЛ",
    "УСПЕЙТЕ",
    "ПРЕМИУМ ВЫБОР",
    "ОГРАНИЧЕННО",
  ],
  pt: [
    "VEÍCULO EM DESTAQUE",
    "OFERTA ESPECIAL",
    "NÃO PERCA",
    "NO SHOWROOM",
    "RECÉM-CHEGADO",
    "APROVEITE",
    "ESCOLHA PREMIUM",
    "TEMPO LIMITADO",
  ],
};

const CTA_VARIANTS: Record<LanguageCode, readonly string[]> = {
  tr: ["HEMEN ARAYIN", "BİLGİ ALIN", "TEST SÜRÜŞÜ YAPIN", "DETAYLAR İÇİN ARAYIN", "RANDEVU ALIN", "TEKLİF ALIN"],
  en: ["CALL NOW", "GET INFO", "BOOK A TEST DRIVE", "CALL FOR DETAILS", "BOOK A VISIT", "GET A QUOTE"],
  es: ["LLÁMANOS", "MÁS INFO", "PRUEBA DE MANEJO", "LLAMA POR DETALLES", "RESERVA VISITA", "PIDE PRESUPUESTO"],
  fr: ["APPELEZ-NOUS", "PLUS D'INFOS", "ESSAI ROUTIER", "DÉTAILS PAR TÉL", "PRENEZ RDV", "DEMANDEZ UN DEVIS"],
  de: ["JETZT ANRUFEN", "INFO ANFORDERN", "PROBEFAHRT", "DETAILS ANRUFEN", "TERMIN BUCHEN", "ANGEBOT HOLEN"],
  it: ["CHIAMACI", "RICHIEDI INFO", "TEST DRIVE", "CHIAMA PER DETTAGLI", "PRENOTA VISITA", "CHIEDI PREVENTIVO"],
  ru: ["ЗВОНИТЕ", "УЗНАТЬ БОЛЬШЕ", "ТЕСТ-ДРАЙВ", "ЗВОНИТЕ ЗА ДЕТАЛЯМИ", "ЗАПИСАТЬСЯ", "ПОЛУЧИТЬ ЦЕНУ"],
  pt: ["LIGUE AGORA", "MAIS INFO", "TEST DRIVE", "LIGUE PARA DETALHES", "AGENDE VISITA", "PEÇA ORÇAMENTO"],
};

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function generateSurpriseConfig(language: LanguageCode): SurpriseConfig {
  const voiceoverEnabled = Math.random() < 0.55;

  return {
    format: pickRandom(FORMATS),
    templateEngine: pickRandom(ENGINES),
    templateStyle: pickRandom(STYLES),
    musicTrackId: pickRandom(MUSIC_IDS),
    voiceoverEnabled,
    introSubtitle: pickRandom(INTRO_SUBTITLE_VARIANTS[language]),
    ctaMain: pickRandom(CTA_VARIANTS[language]),
    shufflePhotos: !voiceoverEnabled,
  };
}

export function describeSurpriseConfig(
  config: SurpriseConfig,
  language: LanguageCode,
): string {
  const formatLabel =
    config.format === "reels"
      ? "9:16 Reels"
      : "16:9 YouTube";

  const styleLabel =
    config.templateStyle === "classic"
      ? language === "tr"
        ? "Klasik"
        : "Classic"
      : language === "tr"
        ? "Modern"
        : "Modern";

  const musicLabel =
    config.musicTrackId === "smooth1"
      ? language === "tr"
        ? "Elektronik"
        : "Electronic"
      : config.musicTrackId === "smooth2"
        ? language === "tr"
          ? "Dinamik"
          : "Dynamic"
        : language === "tr"
          ? "Sinematik"
          : "Cinematic";

  const voiceLabel =
    language === "tr"
      ? config.voiceoverEnabled
        ? "seslendirme açık"
        : "sessiz kurgu"
      : config.voiceoverEnabled
        ? "voiceover on"
        : "no voiceover";

  const engineLabel =
    config.templateEngine === "studio"
      ? language === "tr"
        ? "Studio Pro"
        : "Studio Pro"
      : language === "tr"
        ? "Klasik motor"
        : "Classic engine";

  return `${engineLabel} · ${styleLabel} · ${formatLabel} · ${musicLabel} · ${voiceLabel}`;
}
