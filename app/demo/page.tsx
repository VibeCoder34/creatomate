"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Wand2,
  Sparkles,
  ArrowLeft,
  X,
  ChevronRight,
  ChevronDown,
  ImageIcon,
  Phone,
  Brain,
  Search,
  Mic,
  Loader2,
  Download,
  Link2,
  Video,
} from "lucide-react";
import { LANGUAGE_OPTIONS, type LanguageCode } from "@/lib/languages";
import { MUSIC_TRACKS, resolveMusicTrack, type MusicTrackId } from "@/lib/music";
import {
  defaultCurrencyForLanguage,
  localeForLanguage,
  formatPrice,
  type CurrencyCode,
} from "@/lib/money";
import {
  bodyOptions,
  colorOptions,
  conditionOptions,
  drivetrainOptions,
  fuelOptions,
  gearboxOptions,
  selectEmptyLabel,
  yesNoOptions,
} from "@/lib/vehicleFieldOptions";
import { conditionDefault, localizeFormForVideo } from "@/lib/vehicleEnums";
import {
  normalizePhotoAnalyzeResult,
  getFlowRecommendation,
  type PhotoAnalyzeResult,
  type FlowRecommendation,
} from "@/lib/storyboard";
import { formToCreatomatePayload, type DemoFormData } from "@/lib/formToCreatomate";
import { aspectRatioForFormat } from "@/lib/templateFormat";
import { orderPhotosWithVoiceover } from "@/lib/photoOrder";
import {
  describeSurpriseConfig,
  generateSurpriseConfig,
  shuffleArray,
  type SurpriseConfig,
} from "@/lib/surpriseMe";

const MIN_PHOTOS = 8;
const MAX_PHOTOS = 15;

const PLACEHOLDER_PHOTOS = [
  "https://i0.shbdn.com/photos/92/61/93/x5_132592619341z.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_132592619355z.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_13259261934un.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_13259261934bj.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_1325926193org.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_1325926193nid.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_132592619397p.avif",
  "https://i0.shbdn.com/photos/92/61/93/x5_13259261939b5.avif",
];

type Step = "upload" | "identify" | "analyzing" | "preview";
type TemplateStyle = "classic" | "dynamic";
type TemplateEngine = "legacy" | "studio";
type VideoFormat = "reels" | "youtube" | "square";

const INPUT_CLS =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20 focus:border-[var(--ring)]";

const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;

function formatGroupedIntegerInput(raw: string, locale: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "decimal",
      useGrouping: true,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}

const UI_I18N: Record<LanguageCode, Record<string, string>> = {
  tr: {
    preview: "Önizleme",
    vehicleInfo: "Araç bilgileri",
    processing: "İşleniyor…",
    aiAnalysis: "AI analizi",
    back: "Geri dön",
    editor: "Editör",
    pricing: "Fiyatlar",
    home: "Ana sayfa",
    nextVehicleInfo: "İleri — Araç bilgileri",
    checkVehicleInfoTitle: "Araç bilgilerini kontrol et",
    checkVehicleInfoDesc: "AI fotoğraflardan bilgileri doldurdu — düzenleyip onaylayabilirsin.",
    aiReviewing: "AI fotoğrafları inceliyor…",
    aiWillAutofill: "Bilgiler otomatik doldurulacak, düzenleyebilirsin.",
    required: "Zorunlu",
    brand: "Marka",
    model: "Model",
    year: "Yıl",
    price: "Fiyat",
    km: "KM",
    basicInfo: "Temel bilgiler",
    techInfo: "Teknik bilgiler",
    series: "Seri",
    enginePower: "Motor gücü",
    engineDisplacement: "Motor hacmi",
    gearbox: "Vites",
    fuel: "Yakıt tipi",
    drivetrain: "Çekiş",
    showLess: "Daha az göster",
    showMoreDetails: "Kasa tipi ve diğer detaylar",
    bodyType: "Kasa tipi",
    color: "Renk",
    engine: "Motor",
    condition: "Araç durumu",
    warranty: "Garanti",
    damageRecord: "Ağır hasar kaydı",
    plateNationality: "Plaka / uyruk",
    listingDate: "İlan tarihi",
    phoneOptional: "Telefon (opsiyonel)",
    identifyFailed: "AI araç tanıma başarısız",
    retry: "Tekrar dene",
    enterPrice: "Lütfen fiyat bilgisini girin.",
    enterKm: "Lütfen kilometre bilgisini girin.",
    reviewAutofill: "Otomatik doldurulan bilgiler hatalı olabilir. Lütfen kontrol edin.",
    voiceoverSection: "Seslendirme",
    voiceoverToggle:
      "Videoya AI seslendirmesi ekle (isteğe bağlı). Açıkken her sahne için söylenecek metin kurguda üretilir.",
    voiceoverUsesVideoLang: "Seslendirme dili video diliyle aynıdır.",
    musicLevel: "Müzik seviyesi",
    surpriseMe: "Beni şaşırt",
    surpriseMeHint: "Şablon, format, müzik ve metinleri rastgele seçer",
    surprisePreparing: "Sürpriz tasarım hazırlanıyor…",
    surpriseAgain: "Başka bir sürpriz dene",
    surprisePick: "Bu sürüm",
    videoSettings: "Video ayarları",
    videoSettingsHint: "Sadece «Videoyu oluştur» için geçerlidir — Beni şaşırt her şeyi rastgele seçer.",
    createVideo: "Videoyu oluştur",
    templateEngine: "Video motoru",
    engineLegacy: "Klasik",
    engineLegacyDesc: "Mevcut şablon sistemi",
    engineStudio: "Studio Pro",
    engineStudioDesc: "Fotoğraf sayısına göre tasarlanmış sahneler",
    videoLook: "Video şablonu",
    currentVideoLook: "Seçili",
    templateClassic: "Klasik",
    templateClassicDesc: "Koyu · kırmızı vurgu · foto odaklı",
    templateModern: "Modern",
    templateModernDesc: "Teal · turuncu · dinamik geçişler",
  },
  en: {
    preview: "Preview",
    vehicleInfo: "Vehicle info",
    processing: "Processing…",
    aiAnalysis: "AI analysis",
    back: "Back",
    editor: "Editor",
    pricing: "Pricing",
    home: "Home",
    nextVehicleInfo: "Next — Vehicle info",
    checkVehicleInfoTitle: "Review vehicle info",
    checkVehicleInfoDesc: "AI filled details from photos — edit and confirm.",
    aiReviewing: "AI is reviewing photos…",
    aiWillAutofill: "Details will be auto-filled; you can edit them.",
    required: "Required",
    brand: "Brand",
    model: "Model",
    year: "Year",
    price: "Price",
    km: "Mileage",
    basicInfo: "Basic info",
    techInfo: "Technical details",
    series: "Series",
    enginePower: "Engine power",
    engineDisplacement: "Engine displacement",
    gearbox: "Gearbox",
    fuel: "Fuel type",
    drivetrain: "Drivetrain",
    showLess: "Show less",
    showMoreDetails: "Body type and other details",
    bodyType: "Body type",
    color: "Color",
    engine: "Engine",
    condition: "Condition",
    warranty: "Warranty",
    damageRecord: "Major damage record",
    plateNationality: "Plate / registration",
    listingDate: "Listing date",
    phoneOptional: "Phone (optional)",
    identifyFailed: "AI vehicle identification failed",
    retry: "Try again",
    enterPrice: "Please enter the price.",
    enterKm: "Please enter the mileage.",
    reviewAutofill: "Auto-filled details may be incorrect. Please review.",
    voiceoverSection: "Voiceover",
    voiceoverToggle:
      "Add AI voiceover to the video (optional). When enabled, spoken text is generated per scene.",
    voiceoverUsesVideoLang: "Voiceover uses the same language as the video.",
    musicLevel: "Music level",
    surpriseMe: "Surprise me",
    surpriseMeHint: "Picks template, format, music, and copy at random",
    surprisePreparing: "Preparing a surprise design…",
    surpriseAgain: "Try another surprise",
    surprisePick: "This version",
    videoSettings: "Video settings",
    videoSettingsHint: "Only applies to «Create video» — Surprise me picks everything at random.",
    createVideo: "Create video",
    templateEngine: "Video engine",
    engineLegacy: "Classic",
    engineLegacyDesc: "Current template system",
    engineStudio: "Studio Pro",
    engineStudioDesc: "Photo-count blueprints with multi-photo scenes",
    videoLook: "Video template",
    currentVideoLook: "Selected",
    templateClassic: "Classic",
    templateClassicDesc: "Dark · red accent · photo-first",
    templateModern: "Modern",
    templateModernDesc: "Teal · orange · dynamic transitions",
  },
  es: {},
  fr: {},
  de: {},
  it: {},
  ru: {},
  pt: {},
};

function uiT(lang: LanguageCode, key: string): string {
  return UI_I18N[lang]?.[key] ?? UI_I18N.en[key] ?? key;
}

function placeholderFor(
  lang: LanguageCode,
  key:
    | "search"
    | "notes"
    | "brand"
    | "model"
    | "year"
    | "series"
    | "km"
    | "engine"
    | "enginePower"
    | "engineDisplacement"
    | "plate"
    | "phone"
    | "url"
): string {
  const L: Record<LanguageCode, Partial<Record<typeof key, string>>> = {
    tr: {
      search: "Plaka veya dosya adı ile ara…",
      notes: 'Örn: "Daha agresif bir ton", "Fiyatı vurgula", "SUV aile aracı gibi anlat", "Minimal yazı"',
      brand: "BMW",
      model: "320i",
      year: "2020",
      series: "3 Serisi",
      km: "0 km",
      engine: "2.0L Benzin",
      enginePower: "150 HP",
      engineDisplacement: "1995 cc",
      plate: "TR plakalı",
      phone: "0532 123 45 67",
      url: "https://example.com/arac-foto.jpg",
    },
    en: {
      search: "Search by plate or filename…",
      notes: 'E.g. "More aggressive tone", "Emphasize price", "Family SUV vibe", "Minimal text"',
      brand: "BMW",
      model: "320i",
      year: "2020",
      series: "3 Series",
      km: "0 km",
      engine: "2.0L Petrol",
      enginePower: "150 hp",
      engineDisplacement: "1995 cc",
      plate: "Local plate",
      phone: "+90 532 123 45 67",
      url: "https://example.com/car-photo.jpg",
    },
    es: {},
    fr: {},
    de: {},
    it: {},
    ru: {},
    pt: {},
  };
  return L[lang]?.[key] ?? L.en[key] ?? "";
}

function pricePlaceholderForCurrency(currency: CurrencyCode, videoLanguage: LanguageCode): string {
  const sample: Record<CurrencyCode, number> = {
    TRY: 2850000,
    USD: 85000,
    EUR: 79000,
    GBP: 69000,
    RUB: 7900000,
  };
  const n = sample[currency] ?? 100000;
  try {
    return new Intl.NumberFormat(localeForLanguage(videoLanguage), {
      style: "decimal",
      useGrouping: true,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return "2.850.000";
  }
}

function isValidHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function emptyForm(lang: LanguageCode = "tr"): DemoFormData {
  return {
    carBrand: "",
    carModel: "",
    year: "",
    price: "",
    ctaPhone: "",
    km: "",
    motor: "",
    renk: "",
    vites: "",
    yakit: "",
    kasa: "",
    seri: "",
    aracDurumu: conditionDefault(lang),
    motorGucu: "",
    motorHacmi: "",
    cekis: "",
    garanti: "",
    agirHasarKayitli: "",
    plaka: "",
    ilanTarihi: "",
  };
}

function enumSelect(
  value: string,
  onChange: (v: string) => void,
  options: readonly string[],
  emptyLabel: string
) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      {options.map((opt) => (
        <option key={opt || "__empty"} value={opt}>
          {opt || emptyLabel}
        </option>
      ))}
    </select>
  );
}

export default function DemoPage() {
  const [step, setStep] = useState<Step>("upload");
  const [photoUrls, setPhotoUrls] = useState<string[]>([...PLACEHOLDER_PHOTOS]);
  const [orderedPhotoUrls, setOrderedPhotoUrls] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalyzeResult | null>(null);
  const [analyzePhase, setAnalyzePhase] = useState("");
  const [analyzeError, setAnalyzeError] = useState("");
  const [renderError, setRenderError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<VideoFormat>("reels");
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>("classic");
  const [templateEngine, setTemplateEngine] = useState<TemplateEngine>("legacy");
  const [form, setForm] = useState<DemoFormData>(emptyForm);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState("");
  const [identifyAttempted, setIdentifyAttempted] = useState(false);
  const [videoLanguage, setVideoLanguage] = useState<LanguageCode>("tr");
  const [currency, setCurrency] = useState<CurrencyCode>(() => defaultCurrencyForLanguage("tr"));
  const [videoNotes, setVideoNotes] = useState("");
  const [musicTrackId, setMusicTrackId] = useState<MusicTrackId>("smooth1");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [voiceoverTtsNotice, setVoiceoverTtsNotice] = useState("");
  const [surpriseSummary, setSurpriseSummary] = useState("");
  const renderInFlightRef = useRef(false);

  const musicVolume = voiceoverEnabled ? 0.35 : 0.8;
  const validPhotoUrls = useMemo(
    () => photoUrls.map((u) => u.trim()).filter(isValidHttpUrl),
    [photoUrls]
  );
  const flowRec = useMemo<FlowRecommendation | null>(
    () => (validPhotoUrls.length > 0 ? getFlowRecommendation(validPhotoUrls.length) : null),
    [validPhotoUrls.length]
  );

  useEffect(() => {
    setCurrency(defaultCurrencyForLanguage(videoLanguage));
    setForm((prev) => localizeFormForVideo(prev, videoLanguage));
  }, [videoLanguage]);

  const identifyCarFromPhotos = useCallback(
    async (urls: string[]) => {
      if (!urls.length) return;
      setIsIdentifying(true);
      setIdentifyError("");
      try {
        const photos = urls.slice(0, 5).map((url) => ({ url }));
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos, videoLanguage }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setIdentifyError(
            (data as { error?: string }).error ||
              (data as { details?: string }).details ||
              `Araç tanıma başarısız (HTTP ${res.status})`
          );
          return;
        }
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data as Record<string, string>).filter(
              ([, v]) => typeof v === "string" && v.trim()
            )
          ),
        }));
      } catch (err) {
        console.error("[identify]", err);
        setIdentifyError(err instanceof Error ? err.message : "Araç tanıma isteği başarısız");
      } finally {
        setIsIdentifying(false);
      }
    },
    [videoLanguage]
  );

  const goToIdentify = useCallback(() => {
    setForm(emptyForm());
    setIdentifyError("");
    setIdentifyAttempted(true);
    setStep("identify");
    setTimeout(() => identifyCarFromPhotos(validPhotoUrls), 0);
  }, [validPhotoUrls, identifyCarFromPhotos]);

  const handleCreateVideo = async (options?: {
    surprise?: SurpriseConfig;
    reuseAnalysis?: boolean;
  }) => {
    if (renderInFlightRef.current) return;
    renderInFlightRef.current = true;

    const surprise = options?.surprise;
    const reuseAnalysis = options?.reuseAnalysis ?? false;

    setAnalyzeError("");
    setRenderError("");
    setVoiceoverTtsNotice("");
    setVideoUrl(null);
    if (!reuseAnalysis) {
      setAnalysisResult(null);
      setOrderedPhotoUrls([]);
    }
    if (surprise) {
      setSurpriseSummary(describeSurpriseConfig(surprise, videoLanguage));
      setFormat(surprise.format);
      setTemplateStyle(surprise.templateStyle);
      setTemplateEngine(surprise.templateEngine);
      setMusicTrackId(surprise.musicTrackId);
      setVoiceoverEnabled(surprise.voiceoverEnabled);
      setForm((prev) => ({
        ...prev,
        introSubtitle: surprise.introSubtitle,
        ctaMain: surprise.ctaMain,
      }));
    } else {
      setSurpriseSummary("");
    }
    setStep("analyzing");

    const effectiveFormat = surprise?.format ?? format;
    const effectiveTemplateStyle = surprise?.templateStyle ?? templateStyle;
    const effectiveTemplateEngine = surprise?.templateEngine ?? templateEngine;
    const effectiveMusicTrackId = surprise?.musicTrackId ?? musicTrackId;
    const effectiveVoiceover = surprise?.voiceoverEnabled ?? voiceoverEnabled;
    const effectiveMusicVolume = effectiveVoiceover ? 0.35 : 0.8;
    const effectiveForm = surprise
      ? {
          ...form,
          introSubtitle: surprise.introSubtitle,
          ctaMain: surprise.ctaMain,
        }
      : form;

    const aspectRatio = aspectRatioForFormat(effectiveFormat);

    try {
      let photosForRender = validPhotoUrls;
      let analysis: PhotoAnalyzeResult | null = reuseAnalysis ? analysisResult : null;
      let photoVoiceovers: string[] | undefined;

      if (surprise) {
        setAnalyzePhase(uiT(videoLanguage, "surprisePreparing"));
      }

      const shouldAnalyze =
        effectiveVoiceover && (!reuseAnalysis || !analysisResult);

      if (shouldAnalyze) {
        setAnalyzePhase("AI seslendirme metni hazırlanıyor…");
        const photos = validPhotoUrls.map((url, index) => ({ index, url }));

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photos,
            aspectRatio,
            videoLanguage,
            userNotes: videoNotes,
            voiceover: true,
            voiceoverLanguage: videoLanguage,
            listing: {
              carBrand: effectiveForm.carBrand,
              carModel: effectiveForm.carModel,
              year: effectiveForm.year,
              price: effectiveForm.price,
              ctaPhone: effectiveForm.ctaPhone,
              km: effectiveForm.km,
              motor: effectiveForm.motor,
              renk: effectiveForm.renk,
              vites: effectiveForm.vites,
              yakit: effectiveForm.yakit,
              kasa: effectiveForm.kasa,
              seri: effectiveForm.seri,
              aracDurumu: effectiveForm.aracDurumu,
              motorGucu: effectiveForm.motorGucu,
              motorHacmi: effectiveForm.motorHacmi,
              cekis: effectiveForm.cekis,
              garanti: effectiveForm.garanti,
              agirHasarKayitli: effectiveForm.agirHasarKayitli,
              plaka: effectiveForm.plaka,
              ilanTarihi: effectiveForm.ilanTarihi,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.details || err.error || "API hatası");
        }

        const raw = await res.json();
        analysis = normalizePhotoAnalyzeResult(raw, validPhotoUrls.length, {
          voiceover: true,
          videoLanguage,
        });
        const ordered = orderPhotosWithVoiceover(validPhotoUrls, analysis.storyboard);
        photosForRender = ordered.map((item) => item.url);
        photoVoiceovers = ordered.map((item) => item.voiceoverText);

        if (!photoVoiceovers.some((line) => line.trim())) {
          setVoiceoverTtsNotice("Seslendirme metni üretilemedi; video sessiz oluşturulacak.");
          photoVoiceovers = undefined;
        }

        setAnalysisResult(analysis);
      } else if (effectiveVoiceover && analysisResult) {
        const basePhotos = orderedPhotoUrls.length ? orderedPhotoUrls : validPhotoUrls;
        const ordered = orderPhotosWithVoiceover(basePhotos, analysisResult.storyboard);
        photosForRender = ordered.map((item) => item.url);
        photoVoiceovers = ordered.map((item) => item.voiceoverText);
        if (!photoVoiceovers.some((line) => line.trim())) {
          photoVoiceovers = undefined;
        }
        analysis = analysisResult;
      } else if (surprise?.shufflePhotos && effectiveTemplateEngine === "legacy") {
        photosForRender = shuffleArray(validPhotoUrls);
      } else if (reuseAnalysis && orderedPhotoUrls.length) {
        photosForRender = orderedPhotoUrls;
      } else {
        setAnalyzePhase("Video render ediliyor…");
      }

      setOrderedPhotoUrls(photosForRender);

      setAnalyzePhase(
        photoVoiceovers?.some((line) => line.trim())
          ? "Seslendirme ve video hazırlanıyor…"
          : "Video render ediliyor…",
      );

      const musicTrack = resolveMusicTrack(effectiveMusicTrackId);
      const musicSource =
        effectiveMusicTrackId !== "none" && musicTrack.src
          ? `${window.location.origin}${musicTrack.src}`
          : undefined;

      const payload = {
        ...formToCreatomatePayload(effectiveForm, photosForRender, {
          format: effectiveFormat,
          templateStyle: effectiveTemplateStyle,
          templateEngine: effectiveTemplateEngine,
          videoLanguage,
          currency,
          musicSource,
          musicVolume: effectiveMusicVolume,
        }),
        ...(photoVoiceovers?.some((line) => line.trim())
          ? { photoVoiceovers, voiceoverLanguage: videoLanguage }
          : {}),
      };

      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!renderRes.ok) {
        let errMsg = `HTTP ${renderRes.status}`;
        try {
          const err = await renderRes.json();
          errMsg = err.error || err.details || errMsg;
        } catch {
          const text = await renderRes.text().catch(() => "");
          errMsg = text.slice(0, 200) || errMsg;
        }
        setRenderError(errMsg);
        setVideoUrl(null);
      } else {
        const data = await renderRes.json();
        setVideoUrl(data.url ?? null);
        setRenderError("");
      }

      setStep("preview");
    } catch (err) {
      console.error(err);
      setAnalyzeError(String(err));
      setStep("identify");
    } finally {
      renderInFlightRef.current = false;
    }
  };

  const handleAnalyze = () => handleCreateVideo();
  const handleSurprise = () => handleCreateVideo({ surprise: generateSurpriseConfig(videoLanguage) });
  const handleSurpriseAgain = () => {
    const surprise = generateSurpriseConfig(videoLanguage);
    handleCreateVideo({
      surprise,
      reuseAnalysis: surprise.voiceoverEnabled && Boolean(analysisResult),
    });
  };

  const canProceed =
    validPhotoUrls.length >= MIN_PHOTOS && validPhotoUrls.length <= MAX_PHOTOS;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="dashboard-header flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8 md:gap-14">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="text-[var(--foreground)] lowercase">car</span>
            <span className="text-[var(--primary)] lowercase">studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#pricing"
              className="nav-link text-[var(--muted-foreground)] hover:text-[var(--primary)]"
            >
              {uiT(videoLanguage, "pricing")}
            </Link>
            <Link href="/demo" className="nav-link active">
              {uiT(videoLanguage, "editor")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            Beta
          </span>
          <Link href="/" className="btn-pill-primary text-xs py-2 px-4">
            {uiT(videoLanguage, "home")}
          </Link>
        </div>
      </header>

      {(step === "preview" || step === "analyzing" || step === "identify") && (
        <div className="dashboard-toolbar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 sm:px-6">
          {step === "analyzing" ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Brain className="w-4 h-4 text-[var(--primary)]" />
              {uiT(videoLanguage, "aiAnalysis")}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {uiT(videoLanguage, "back")}
            </button>
          )}
          <p className="text-xs text-[var(--muted-foreground)] sm:text-right">
            {step === "preview"
              ? uiT(videoLanguage, "preview")
              : step === "identify"
              ? uiT(videoLanguage, "vehicleInfo")
              : uiT(videoLanguage, "processing")}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {step === "upload" && (
          <UploadStep
            photoUrls={photoUrls}
            validCount={validPhotoUrls.length}
            error={analyzeError}
            flowRec={flowRec}
            videoLanguage={videoLanguage}
            videoNotes={videoNotes}
            onVideoLanguageChange={setVideoLanguage}
            onVideoNotesChange={setVideoNotes}
            onPhotoUrlsChange={setPhotoUrls}
            onNext={goToIdentify}
            canProceed={canProceed}
          />
        )}

        {step === "identify" && (
          <IdentifyStep
            photoUrls={validPhotoUrls}
            form={form}
            isIdentifying={isIdentifying}
            identifyError={identifyError}
            identifyAttempted={identifyAttempted}
            currency={currency}
            onCurrencyChange={setCurrency}
            onFormChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
            onRetry={() => identifyCarFromPhotos(validPhotoUrls)}
            onConfirm={handleAnalyze}
            onSurprise={handleSurprise}
            onBack={() => setStep("upload")}
            videoLanguage={videoLanguage}
            templateStyle={templateStyle}
            onTemplateStyleChange={setTemplateStyle}
            templateEngine={templateEngine}
            onTemplateEngineChange={setTemplateEngine}
            format={format}
            onFormatChange={setFormat}
            musicTrackId={musicTrackId}
            onMusicTrackIdChange={setMusicTrackId}
            voiceoverEnabled={voiceoverEnabled}
            onVoiceoverEnabledChange={setVoiceoverEnabled}
            musicVolume={musicVolume}
          />
        )}

        {step === "analyzing" && (
          <AnalyzingStep photoUrls={validPhotoUrls} phase={analyzePhase} />
        )}

        {step === "preview" && (
          <PreviewStep
            videoUrl={videoUrl}
            renderError={renderError}
            form={form}
            photoUrls={orderedPhotoUrls.length ? orderedPhotoUrls : validPhotoUrls}
            analysisResult={analysisResult}
            format={format}
            templateStyle={templateStyle}
            templateEngine={templateEngine}
            videoLanguage={videoLanguage}
            currency={currency}
            voiceoverEnabled={voiceoverEnabled}
            ttsNotice={voiceoverTtsNotice}
            surpriseSummary={surpriseSummary}
            onSurpriseAgain={handleSurpriseAgain}
            onReset={() => {
              setAnalysisResult(null);
              setVideoUrl(null);
              setRenderError("");
              setVoiceoverTtsNotice("");
              setSurpriseSummary("");
              setOrderedPhotoUrls([]);
              setStep("upload");
            }}
          />
        )}
      </div>
    </div>
  );
}

function UploadStep({
  photoUrls,
  validCount,
  error,
  flowRec,
  videoLanguage,
  videoNotes,
  onVideoLanguageChange,
  onVideoNotesChange,
  onPhotoUrlsChange,
  onNext,
  canProceed,
}: {
  photoUrls: string[];
  validCount: number;
  error: string;
  flowRec: FlowRecommendation | null;
  videoLanguage: LanguageCode;
  videoNotes: string;
  onVideoLanguageChange: (v: LanguageCode) => void;
  onVideoNotesChange: (v: string) => void;
  onPhotoUrlsChange: (urls: string[]) => void;
  onNext: () => void;
  canProceed: boolean;
}) {
  const updateUrl = (index: number, value: string) => {
    const next = [...photoUrls];
    next[index] = value;
    onPhotoUrlsChange(next);
  };

  const addUrlField = () => {
    if (photoUrls.length >= MAX_PHOTOS) return;
    onPhotoUrlsChange([...photoUrls, ""]);
  };

  const removeUrlField = (index: number) => {
    if (photoUrls.length <= MIN_PHOTOS) return;
    onPhotoUrlsChange(photoUrls.filter((_, i) => i !== index));
  };

  const fillDemoUrls = () => {
    onPhotoUrlsChange([...PLACEHOLDER_PHOTOS]);
  };

  const validUrls = photoUrls.map((u) => u.trim()).filter(isValidHttpUrl);

  return (
    <>
      <div className="dashboard-toolbar px-4 py-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
              Projelerim
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {validCount} / {MIN_PHOTOS}–{MAX_PHOTOS} fotoğraf URL
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button type="button" className="btn-pill-primary text-sm whitespace-nowrap" disabled title="Yakında">
              + Kredi satın al
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none z-[1]" />
          <input
            type="search"
            className="input-pill input-pill--readonly"
            placeholder={placeholderFor(videoLanguage, "search")}
            readOnly
            aria-readonly
            tabIndex={-1}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 sm:gap-8 items-start">
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <div className="demo-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="demo-section-label flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[var(--primary)]" />
                    Fotoğraf URL&apos;leri
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Her satıra bir public görsel URL&apos;si girin. En az {MIN_PHOTOS}, en fazla{" "}
                    {MAX_PHOTOS} fotoğraf.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoUrls}
                  className="btn-pill-primary text-xs py-1.5 px-3"
                >
                  Demo URL&apos;leri doldur
                </button>
              </div>

              <div className="space-y-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] w-6 shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      placeholder={placeholderFor(videoLanguage, "url")}
                      className={INPUT_CLS}
                    />
                    {photoUrls.length > MIN_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(i)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:border-[var(--destructive)]/30 transition-colors"
                        aria-label="URL kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {photoUrls.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={addUrlField}
                  className="flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  URL ekle
                </button>
              )}

              {validUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-[var(--border)]">
                  {validUrls.map((src, i) => (
                    <div
                      key={src}
                      className="relative aspect-square rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded px-1 py-0.5 bg-[var(--foreground)]/55">
                        <ImageIcon className="w-2.5 h-2.5 text-[var(--primary-foreground)]" />
                      </div>
                      <div className="absolute top-1 left-1 w-4 h-4 bg-black/55 rounded text-[9px] text-white flex items-center justify-center font-medium">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {validCount > 0 && validCount < MIN_PHOTOS && (
                <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/25 rounded-[var(--radius)] px-3 py-2">
                  En az {MIN_PHOTOS} geçerli URL gerekli ({MIN_PHOTOS - validCount} eksik).
                </p>
              )}
              {validCount > MAX_PHOTOS && (
                <p className="text-xs text-[var(--destructive)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/25 rounded-[var(--radius)] px-3 py-2">
                  En fazla {MAX_PHOTOS} fotoğraf eklenebilir.
                </p>
              )}
            </div>

            {flowRec?.warning && (
              <div
                className={`rounded-[var(--radius)] border px-4 py-3 text-sm ${
                  flowRec.mode === "fast_sequence"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    : "border-[var(--primary)]/30 bg-[var(--primary)]/8 text-[var(--primary)]"
                }`}
              >
                <div className="font-semibold mb-0.5">
                  {flowRec.mode === "fast_sequence" ? "Çok fazla fotoğraf" : "Uzun video modu"}
                </div>
                <p className="text-[12px] leading-snug opacity-90">{flowRec.warning}</p>
                {flowRec.suggestion && (
                  <p className="text-[11px] leading-snug mt-1 opacity-75">{flowRec.suggestion}</p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-[var(--radius)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
                {error}
              </div>
            )}

            <div className="demo-card p-4 space-y-3">
              <div className="demo-section-label flex items-center gap-2">
                <Brain className="w-4 h-4 text-[var(--primary)]" />
                Video dili
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                Videodaki yazılar bu dile göre hazırlanır.
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((opt) => {
                  const active = videoLanguage === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => onVideoLanguageChange(opt.code)}
                      className={`px-4 py-2 rounded-[var(--radius-pill)] text-sm font-medium border transition-all ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 space-y-2">
                <div className="text-xs text-[var(--muted-foreground)]">
                  Eklemek istediğin bir şey var mı? (opsiyonel)
                </div>
                <textarea
                  value={videoNotes}
                  onChange={(e) => onVideoNotesChange(e.target.value)}
                  placeholder={placeholderFor(videoLanguage, "notes")}
                  className={`${INPUT_CLS} min-h-[90px] resize-y`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-[var(--radius-pill)] font-semibold text-base transition-all ${
                !canProceed
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--teal)] to-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 hover:opacity-95"
              }`}
            >
              {uiT(videoLanguage, "nextVehicleInfo")}
              {canProceed && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 lg:mt-8">
          <div className="card-gradient card-gradient--aside min-h-[220px] sm:min-h-[240px]">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-white/18 backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold leading-snug text-white">
                    Ekibimizle görüşme planlayın
                  </h3>
                  <p className="mt-2 text-sm text-white/88 leading-relaxed">
                    Galerinize özel demo ve kurumsal paketler için bize ulaşın.
                  </p>
                </div>
              </div>
              <a
                href="mailto:hello@carstudio.example"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-[var(--radius-pill)] bg-white px-5 py-3 text-sm font-semibold text-[var(--primary)] shadow-md transition-opacity hover:opacity-95"
              >
                Randevu al
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function IdentifyStep({
  photoUrls,
  form,
  isIdentifying,
  identifyError,
  identifyAttempted,
  currency,
  onCurrencyChange,
  onFormChange,
  onRetry,
  onConfirm,
  onSurprise,
  onBack,
  videoLanguage,
  templateStyle,
  onTemplateStyleChange,
  templateEngine,
  onTemplateEngineChange,
  format,
  onFormatChange,
  musicTrackId,
  onMusicTrackIdChange,
  voiceoverEnabled,
  onVoiceoverEnabledChange,
  musicVolume,
}: {
  photoUrls: string[];
  form: DemoFormData;
  isIdentifying: boolean;
  identifyError: string;
  identifyAttempted: boolean;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onFormChange: (field: keyof DemoFormData, value: string) => void;
  onRetry: () => void;
  onConfirm: () => void;
  onSurprise: () => void;
  onBack: () => void;
  videoLanguage: LanguageCode;
  templateStyle: TemplateStyle;
  onTemplateStyleChange: (s: TemplateStyle) => void;
  templateEngine: TemplateEngine;
  onTemplateEngineChange: (e: TemplateEngine) => void;
  format: VideoFormat;
  onFormatChange: (f: VideoFormat) => void;
  musicTrackId: MusicTrackId;
  onMusicTrackIdChange: (v: MusicTrackId) => void;
  voiceoverEnabled: boolean;
  onVoiceoverEnabledChange: (v: boolean) => void;
  musicVolume: number;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const emptyLabel = selectEmptyLabel(videoLanguage);
  const gearboxOpts = useMemo(() => gearboxOptions(videoLanguage), [videoLanguage]);
  const fuelOpts = useMemo(() => fuelOptions(videoLanguage), [videoLanguage]);
  const drivetrainOpts = useMemo(() => drivetrainOptions(videoLanguage), [videoLanguage]);
  const bodyOpts = useMemo(() => bodyOptions(videoLanguage), [videoLanguage]);
  const colorOpts = useMemo(() => colorOptions(videoLanguage), [videoLanguage]);
  const conditionOpts = useMemo(() => conditionOptions(videoLanguage), [videoLanguage]);
  const yesNoOpts = useMemo(() => yesNoOptions(videoLanguage), [videoLanguage]);
  const requiredMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.price.trim()) missing.push(uiT(videoLanguage, "price"));
    if (!form.km.trim()) missing.push(uiT(videoLanguage, "km"));
    return missing;
  }, [form.km, form.price, videoLanguage]);
  const canConfirm = !isIdentifying && requiredMissing.length === 0;
  const showRequiredUi = identifyAttempted && !isIdentifying;
  const isPriceMissing = showRequiredUi && !form.price.trim();
  const isKmMissing = showRequiredUi && !form.km.trim();
  const pricePlaceholder = pricePlaceholderForCurrency(currency, videoLanguage);

  const videoLookSummary = useMemo(() => {
    const style = templateStyle === "classic" ? uiT(videoLanguage, "templateClassic") : uiT(videoLanguage, "templateModern");
    const formatLabel =
      format === "reels" ? "9:16" : format === "square" ? "1:1" : "16:9";
    return `${style} · ${formatLabel}`;
  }, [format, templateStyle, videoLanguage]);

  const selectVideoTemplate = (choice: "classic" | "dynamic") => {
    onTemplateEngineChange("legacy");
    onTemplateStyleChange(choice);
  };

  const activeVideoTemplate = templateStyle;

  return (
    <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 bg-[var(--background)]">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {uiT(videoLanguage, "checkVehicleInfoTitle")}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {uiT(videoLanguage, "checkVehicleInfoDesc")}
          </p>
        </div>

        {photoUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photoUrls.slice(0, 8).map((src, i) => (
              <div
                key={src}
                className="w-14 h-14 rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-[var(--muted)] shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {photoUrls.length > 8 && (
              <div className="w-14 h-14 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center shrink-0">
                <span className="text-xs text-[var(--muted-foreground)] font-medium">
                  +{photoUrls.length - 8}
                </span>
              </div>
            )}
          </div>
        )}

        {isIdentifying && (
          <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--primary)]/30 bg-[var(--primary)]/[0.06] px-4 py-3">
            <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">
                {uiT(videoLanguage, "aiReviewing")}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {uiT(videoLanguage, "aiWillAutofill")}
              </p>
            </div>
          </div>
        )}

        {identifyError && !isIdentifying && (
          <div
            role="alert"
            className="rounded-[var(--radius)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]"
          >
            <p className="font-medium">{uiT(videoLanguage, "identifyFailed")}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{identifyError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-xs font-semibold underline hover:opacity-80"
            >
              {uiT(videoLanguage, "retry")}
            </button>
          </div>
        )}

        <div
          className={`demo-card p-5 space-y-4 transition-opacity ${
            isIdentifying ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              {uiT(videoLanguage, "basicInfo")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["carBrand", "carModel", "year", "price"] as const).map((field) => (
                <div key={field}>
                  <label className="flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)] mb-1.5">
                    <span>
                      {field === "carBrand"
                        ? uiT(videoLanguage, "brand")
                        : field === "carModel"
                        ? uiT(videoLanguage, "model")
                        : field === "year"
                        ? uiT(videoLanguage, "year")
                        : uiT(videoLanguage, "price")}
                    </span>
                    {showRequiredUi && field === "price" && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {uiT(videoLanguage, "required")}
                      </span>
                    )}
                  </label>
                  <input
                    value={form[field]}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (field !== "price") {
                        onFormChange(field, v);
                        return;
                      }
                      const locale = localeForLanguage(videoLanguage);
                      onFormChange("price", formatGroupedIntegerInput(v, locale));
                    }}
                    onBlur={(e) => {
                      if (field !== "price") return;
                      const locale = localeForLanguage(videoLanguage);
                      onFormChange("price", formatGroupedIntegerInput(e.target.value, locale));
                    }}
                    placeholder={
                      field === "carBrand"
                        ? placeholderFor(videoLanguage, "brand")
                        : field === "carModel"
                        ? placeholderFor(videoLanguage, "model")
                        : field === "year"
                        ? placeholderFor(videoLanguage, "year")
                        : pricePlaceholder
                    }
                    className={INPUT_CLS}
                    inputMode={field === "price" ? "numeric" : undefined}
                  />
                  {field === "price" && (
                    <div className="mt-2">
                      <select
                        value={currency}
                        onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                        className={INPUT_CLS}
                      >
                        <option value="TRY">TRY (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="RUB">RUB (₽)</option>
                      </select>
                    </div>
                  )}
                  {field === "price" && isPriceMissing && (
                    <div className="mt-1 text-[11px] text-amber-700">
                      {uiT(videoLanguage, "enterPrice")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              {uiT(videoLanguage, "techInfo")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["seri", uiT(videoLanguage, "series"), placeholderFor(videoLanguage, "series")],
                  ["km", uiT(videoLanguage, "km"), placeholderFor(videoLanguage, "km")],
                  [
                    "motorGucu",
                    uiT(videoLanguage, "enginePower"),
                    placeholderFor(videoLanguage, "enginePower"),
                  ],
                  [
                    "motorHacmi",
                    uiT(videoLanguage, "engineDisplacement"),
                    placeholderFor(videoLanguage, "engineDisplacement"),
                  ],
                ] as [keyof DemoFormData, string, string][]
              ).map(([field, label, ph]) => (
                <div key={field}>
                  <label className="flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)] mb-1.5">
                    <span>{label}</span>
                    {showRequiredUi && field === "km" && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {uiT(videoLanguage, "required")}
                      </span>
                    )}
                  </label>
                  <input
                    value={form[field]}
                    onChange={(e) => onFormChange(field, e.target.value)}
                    placeholder={ph}
                    className={INPUT_CLS}
                  />
                  {field === "km" && isKmMissing && (
                    <div className="mt-1 text-[11px] text-amber-700">
                      {uiT(videoLanguage, "enterKm")}
                    </div>
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                  {uiT(videoLanguage, "gearbox")}
                </label>
                {enumSelect(form.vites, (v) => onFormChange("vites", v), gearboxOpts, emptyLabel)}
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                  {uiT(videoLanguage, "fuel")}
                </label>
                {enumSelect(form.yakit, (v) => onFormChange("yakit", v), fuelOpts, emptyLabel)}
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                  {uiT(videoLanguage, "drivetrain")}
                </label>
                {enumSelect(form.cekis, (v) => onFormChange("cekis", v), drivetrainOpts, emptyLabel)}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full text-left"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform shrink-0 ${detailsOpen ? "rotate-180" : ""}`}
              />
              {detailsOpen ? uiT(videoLanguage, "showLess") : uiT(videoLanguage, "showMoreDetails")}
            </button>
            {detailsOpen && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "bodyType")}
                  </label>
                  {enumSelect(form.kasa, (v) => onFormChange("kasa", v), bodyOpts, emptyLabel)}
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "color")}
                  </label>
                  {enumSelect(form.renk, (v) => onFormChange("renk", v), colorOpts, emptyLabel)}
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "engine")}
                  </label>
                  <input
                    value={form.motor}
                    onChange={(e) => onFormChange("motor", e.target.value)}
                    placeholder={placeholderFor(videoLanguage, "engine")}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "condition")}
                  </label>
                  {enumSelect(
                    form.aracDurumu,
                    (v) => onFormChange("aracDurumu", v),
                    conditionOpts,
                    emptyLabel,
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "warranty")}
                  </label>
                  {enumSelect(form.garanti, (v) => onFormChange("garanti", v), yesNoOpts, emptyLabel)}
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "damageRecord")}
                  </label>
                  {enumSelect(
                    form.agirHasarKayitli,
                    (v) => onFormChange("agirHasarKayitli", v),
                    yesNoOpts,
                    emptyLabel,
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "plateNationality")}
                  </label>
                  <input
                    value={form.plaka}
                    onChange={(e) => onFormChange("plaka", e.target.value)}
                    placeholder={placeholderFor(videoLanguage, "plate")}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    {uiT(videoLanguage, "listingDate")}
                  </label>
                  <input
                    value={form.ilanTarihi}
                    onChange={(e) => onFormChange("ilanTarihi", e.target.value)}
                    placeholder=""
                    className={INPUT_CLS}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    <Phone className="w-3 h-3 inline mr-1" />
                    {uiT(videoLanguage, "phoneOptional")}
                  </label>
                  <input
                    value={form.ctaPhone}
                    onChange={(e) => onFormChange("ctaPhone", e.target.value)}
                    placeholder={placeholderFor(videoLanguage, "phone")}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {showRequiredUi && (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
            {uiT(videoLanguage, "reviewAutofill")}
          </div>
        )}

        <div className="demo-card p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {uiT(videoLanguage, "videoLook")}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {uiT(videoLanguage, "currentVideoLook")}: {videoLookSummary}
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  ["classic", uiT(videoLanguage, "templateClassic"), uiT(videoLanguage, "templateClassicDesc"), "🏛️"],
                  ["dynamic", uiT(videoLanguage, "templateModern"), uiT(videoLanguage, "templateModernDesc"), "⚡"],
                ] as const
              ).map(([id, label, desc, icon]) => {
                const active = activeVideoTemplate === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectVideoTemplate(id)}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-[var(--radius)] border text-center transition-all ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                    }`}
                  >
                    <span className="text-xl leading-none">{icon}</span>
                    <span className={`text-xs font-semibold ${active ? "text-[var(--primary)]" : ""}`}>
                      {label}
                    </span>
                    <span className="text-[10px] leading-snug opacity-90">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Çıktı formatı
            </div>
            <div className="flex gap-2">
              {(
                [
                  ["reels", "9:16", "Reels / Shorts", "▯"],
                  ["square", "1:1", "Instagram", "◻"],
                  ["youtube", "16:9", "YouTube", "▬"],
                ] as const
              ).map(([value, ratio, sub, icon]) => {
                const active = format === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onFormatChange(value)}
                    className={`flex flex-1 flex-col items-center gap-1 p-3 rounded-[var(--radius)] border text-center transition-all ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                    }`}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span
                      className={`text-xs font-bold ${active ? "text-[var(--primary)]" : ""}`}
                    >
                      {ratio}
                    </span>
                    <span className="text-[9px] text-[var(--muted-foreground)]">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="demo-card overflow-hidden">
          <button
            type="button"
            onClick={() => setAudioSettingsOpen((open) => !open)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--muted)]/50 transition-colors"
          >
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                Ses ve müzik
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {resolveMusicTrack(musicTrackId).label}
                {voiceoverEnabled ? " · Seslendirme açık" : ""}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-[var(--muted-foreground)] transition-transform ${
                audioSettingsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {audioSettingsOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]">
              <div className="pt-4 space-y-3">
                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Müzik
                </div>
                <select
                  value={musicTrackId}
                  onChange={(e) => onMusicTrackIdChange(e.target.value as MusicTrackId)}
                  className={INPUT_CLS}
                >
                  {MUSIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {uiT(videoLanguage, "musicLevel")}
                  </span>
                  <span className="text-xs font-semibold text-[var(--foreground)] tabular-nums">
                    {musicVolume.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" />
                  {uiT(videoLanguage, "voiceoverSection")}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceoverEnabled}
                    onChange={(e) => onVoiceoverEnabledChange(e.target.checked)}
                    className="mt-1 rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)] leading-snug">
                    {uiT(videoLanguage, "voiceoverToggle")}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-[var(--radius-pill)] text-sm font-medium border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--card)] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canConfirm) return;
                onSurprise();
              }}
              disabled={!canConfirm}
              title={uiT(videoLanguage, "surpriseMeHint")}
              className={`flex items-center justify-center gap-2 py-3 px-5 rounded-[var(--radius-pill)] text-sm font-semibold border transition-all ${
                !canConfirm
                  ? "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "border-[var(--primary)]/40 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--teal)]/10 text-[var(--primary)] hover:from-[var(--primary)]/15 hover:to-[var(--teal)]/15 shadow-sm shadow-[var(--primary)]/10"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {uiT(videoLanguage, "surpriseMe")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canConfirm) return;
                onConfirm();
              }}
              disabled={!canConfirm}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[var(--radius-pill)] font-semibold text-base transition-all ${
                !canConfirm
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--teal)] to-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 hover:opacity-95"
              }`}
            >
              <Brain className="w-5 h-5" />
              {uiT(videoLanguage, "createVideo")}
              {canConfirm && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-center text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            {uiT(videoLanguage, "videoSettingsHint")}
          </p>
        </div>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          AI: kategori, yorum ve sahne kurgusu (~30–60 sn) + Creatomate render
        </p>
      </div>
    </div>
  );
}

function AnalyzingStep({ photoUrls, phase }: { photoUrls: string[]; phase: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-6 bg-[var(--background)]">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full bg-[var(--primary)]/20 animate-ping" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#0a455a] to-[var(--primary)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
            <Brain className="w-9 h-9 text-[var(--primary-foreground)]" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">AI Analiz Yapıyor</h2>
        <p className="text-[var(--muted-foreground)] text-sm mb-8 min-h-[20px]">{phase}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {photoUrls.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="w-14 h-14 rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] opacity-70 animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewStep({
  videoUrl,
  renderError,
  form,
  photoUrls,
  analysisResult,
  format,
  templateStyle,
  templateEngine,
  videoLanguage,
  currency,
  voiceoverEnabled,
  ttsNotice,
  surpriseSummary,
  onSurpriseAgain,
  onReset,
}: {
  videoUrl: string | null;
  renderError: string;
  form: DemoFormData;
  photoUrls: string[];
  analysisResult: PhotoAnalyzeResult | null;
  format: VideoFormat;
  templateStyle: TemplateStyle;
  templateEngine: TemplateEngine;
  videoLanguage: LanguageCode;
  currency: CurrencyCode;
  voiceoverEnabled: boolean;
  ttsNotice: string;
  surpriseSummary: string;
  onSurpriseAgain: () => void;
  onReset: () => void;
}) {
  const isPortrait = format !== "youtube";
  const formattedPrice =
    formatPrice(form.price, { language: videoLanguage, currency, style: "number" }) ??
    form.price;

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `carstudio-${form.carBrand}-${form.carModel}-${form.year}.mp4`
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_.]/g, "")
      .toLowerCase();
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex-1 overflow-auto px-4 py-6 sm:p-6 bg-[var(--background)]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          {ttsNotice ? (
            <div
              role="status"
              className="mb-4 max-w-2xl mx-auto rounded-xl border border-amber-500/35 bg-amber-500/[0.08] px-4 py-3 text-left text-xs sm:text-sm text-amber-800 leading-relaxed"
            >
              {ttsNotice}
            </div>
          ) : null}
          <div className="inline-flex items-center gap-2 border border-[var(--primary)]/25 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold px-4 py-2 rounded-[var(--radius-pill)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            {analysisResult ? "AI kurgusu hazır" : "Önizleme"}
          </div>
          <h2 className="text-2xl font-bold">
            {form.carBrand} {form.carModel}
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            {photoUrls.length} sahne · {format === "reels" ? "9:16 Reels" : format === "square" ? "1:1 Instagram" : "16:9 YouTube"} ·{" "}
            {templateStyle === "classic" ? "Klasik" : "Modern"}{" "}
            şablon
            {voiceoverEnabled && (
              <span className="block mt-1 text-[11px]">Seslendirme: istendi</span>
            )}
            {surpriseSummary && (
              <span className="block mt-1 text-[11px] text-[var(--primary)]">
                {uiT(videoLanguage, "surprisePick")}: {surpriseSummary}
              </span>
            )}
          </p>
        </div>

        <div
          className={
            isPortrait
              ? "flex flex-col gap-8 items-start justify-center lg:grid lg:grid-cols-[420px_360px] lg:gap-10 lg:items-start lg:justify-center"
              : "flex flex-col gap-8 items-start justify-center lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start"
          }
        >
          <div
            className={`flex-shrink-0 w-full flex justify-center mx-auto lg:mx-0 ${
              isPortrait ? "max-w-[420px] sm:max-w-[460px] lg:max-w-[420px]" : "max-w-4xl"
            }`}
          >
            <div className="relative w-full" style={isPortrait ? { maxHeight: "78vh" } : undefined}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent rounded-2xl blur-3xl -z-10 scale-105" />
              <div
                className="relative rounded-xl overflow-hidden bg-black border border-[var(--border)] shadow-2xl shadow-black/30"
                style={{
                  aspectRatio: isPortrait ? "9/16" : "16/9",
                  ...(isPortrait ? { maxHeight: "78vh" } : null),
                }}
              >
                {renderError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Video className="w-10 h-10 text-[var(--destructive)] mb-3 opacity-80" />
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-2">
                      Video oluşturulamadı
                    </p>
                    <p className="text-xs text-[var(--destructive)] leading-relaxed max-w-sm">
                      {renderError}
                    </p>
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`w-full ${
              isPortrait
                ? "mx-auto max-w-[420px] sm:max-w-[460px] lg:max-w-[420px]"
                : "w-full max-w-sm mx-auto lg:mx-0"
            }`}
          >
            <div className={isPortrait ? "lg:sticky lg:top-6" : "lg:sticky lg:top-6"}>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-4">
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                    Araç detayları
                  </div>
                  <div className="space-y-2">
                    {[
                      ["Marka", form.carBrand],
                      ["Model", form.carModel],
                      ["Yıl", form.year],
                      ["Fiyat", formattedPrice, "text-[var(--primary)] font-semibold"],
                      ["KM", form.km],
                      ["Vites", form.vites],
                      ["Yakıt", form.yakit],
                    ].map(([label, value, extraClass = ""]) => (
                      <div key={label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--muted-foreground)] shrink-0">{label}</span>
                        <span className={`font-medium text-right truncate ${extraClass}`}>
                          {value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                    Uygun platformlar
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(format === "reels"
                      ? ["TikTok", "Instagram Reels", "YouTube Shorts"]
                      : ["YouTube (16:9)", "Web / galeri", "LinkedIn"]
                    ).map((p) => (
                      <span
                        key={p}
                        className="text-[11px] bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {analysisResult?.editing_notes_tr && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                      AI kurgu notu
                    </div>
                    <p className="text-xs text-[var(--foreground)] leading-relaxed">
                      {analysisResult.editing_notes_tr}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--border)] space-y-2">
                  <button
                    type="button"
                    onClick={onSurpriseAgain}
                    disabled={Boolean(renderError) && !videoUrl}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-[var(--primary)]/35 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--teal)]/10 text-[var(--primary)] hover:from-[var(--primary)]/15 hover:to-[var(--teal)]/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    {uiT(videoLanguage, "surpriseAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!videoUrl || Boolean(renderError)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/25"
                  >
                    <Download className="w-4 h-4" />
                    Video İndir (.mp4)
                  </button>
                  {renderError && (
                    <p className="text-xs text-[var(--destructive)] leading-snug px-1">{renderError}</p>
                  )}
                  <button
                    type="button"
                    onClick={onReset}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-[var(--muted)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    Yeni video oluştur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
