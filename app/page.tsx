"use client";

import { useState } from "react";
import type { CarVideoFormData, VideoFormat } from "@/app/lib/template";

const ACCENT = "#ff2d2d";
const BG = "#0a0a0a";
const PANEL = "#141414";
const MUTED = "#888";

const MIN_PHOTOS = 8;
const MAX_PHOTOS = 15;

const SAMPLE_PHOTO =
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&w=800";

const DEFAULT_FORM: Omit<CarVideoFormData, "photos" | "format"> = {
  dealerName: "ÖRNEK OTOMOTİV",
  introSubtitle: "HAFTANIN ÖNE ÇIKAN ARACI",
  carTitle: "2021 BMW 320i M Sport",
  carSubtitle: "Hatasız · Boyasız · Servis Bakımlı",
  priceTag: "1.450.000 TL",
  specKm: "45.000 km",
  specFuel: "Benzin",
  specGear: "Otomatik",
  specYear: "2021",
  ctaMain: "HEMEN ARAYIN",
  phone: "0212 555 12 34",
  address: "Bağdat Cad. No:123, Kadıköy / İstanbul",
};

const inputClassName =
  "w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff2d2d] focus:ring-2 focus:ring-[#ff2d2d]/20";

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ color: ACCENT }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "url";
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-white">
        {label}
        {hint && (
          <span className="text-[11px] font-normal" style={{ color: MUTED }}>
            {hint}
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </label>
  );
}

function PreviewSkeleton({ format }: { format: VideoFormat }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-lg border border-zinc-800 bg-[#0a0a0a] p-8">
      <div
        className={`w-full animate-pulse rounded-lg bg-zinc-800 ${
          format === "reels" ? "aspect-[9/16]" : "aspect-video"
        }`}
      />
      <p className="text-sm text-white">Render sürüyor, lütfen bekleyin</p>
    </div>
  );
}

function createEmptyPhotos(count = MIN_PHOTOS): string[] {
  return Array.from({ length: count }, () => "");
}

export default function Home() {
  const [form, setForm] = useState<Omit<CarVideoFormData, "photos" | "format">>(
    DEFAULT_FORM,
  );
  const [photos, setPhotos] = useState<string[]>(createEmptyPhotos);
  const [format, setFormat] = useState<VideoFormat>("reels");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhoto(index: number, value: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPhoto() {
    if (photos.length >= MAX_PHOTOS) return;
    setPhotos((prev) => [...prev, ""]);
  }

  function removePhoto(index: number) {
    if (photos.length <= MIN_PHOTOS) return;
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function fillDemoPhotos() {
    setPhotos((prev) => prev.map(() => SAMPLE_PHOTO));
  }

  async function handleSubmit() {
    setError(null);
    setVideoUrl(null);

    const filled = photos.map((p) => p.trim()).filter(Boolean);

    if (filled.length < MIN_PHOTOS) {
      setError("En az 8 fotoğraf gerekli");
      return;
    }

    if (filled.length > MAX_PHOTOS) {
      setError("En fazla 15 fotoğraf eklenebilir");
      return;
    }

    setLoading(true);

    try {
      const payload: CarVideoFormData = { ...form, photos: filled, format };

      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }

      setVideoUrl(data.url);
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full text-white" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
        <header className="mb-8">
          <p
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Creatomate RenderScript
          </p>
          <h1 className="text-2xl font-bold lg:text-3xl">
            Araba Tanıtım Video Dashboard
          </h1>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>
            8–15 fotoğraf · dinamik sahne üretimi · Reels / YouTube
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10 xl:grid-cols-[1fr_420px]">
          <section
            className="max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl border border-zinc-800 p-6 lg:p-8"
            style={{ backgroundColor: PANEL }}
          >
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-lg bg-[#ff2d2d]/15 px-4 py-3 text-sm text-[#ff6b6b]"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-8">
              {/* FORMAT */}
              <div className="flex flex-col gap-3">
                <SectionTitle>FORMAT</SectionTitle>
                <div className="flex gap-3">
                  {(
                    [
                      { value: "reels", label: "Reels (dikey)" },
                      { value: "youtube", label: "YouTube (yatay)" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormat(opt.value)}
                      className="flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition"
                      style={{
                        borderColor:
                          format === opt.value ? ACCENT : "#333",
                        backgroundColor:
                          format === opt.value ? "#ff2d2d22" : "#0a0a0a",
                        color: format === opt.value ? "#fff" : MUTED,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: MUTED }}>
                  {format === "reels"
                    ? "1080×1920 (9:16)"
                    : "1920×1080 (16:9)"}
                </p>
              </div>

              {/* GİRİŞ */}
              <div className="flex flex-col gap-4">
                <SectionTitle>GİRİŞ</SectionTitle>
                <Field
                  label="Galeri Adı"
                  value={form.dealerName}
                  onChange={(v) => setField("dealerName", v)}
                />
                <Field
                  label="Alt Başlık"
                  value={form.introSubtitle}
                  onChange={(v) => setField("introSubtitle", v)}
                />
              </div>

              {/* ARAÇ BİLGİSİ */}
              <div className="flex flex-col gap-4">
                <SectionTitle>ARAÇ BİLGİSİ</SectionTitle>
                <Field
                  label="Araç Başlığı"
                  value={form.carTitle}
                  onChange={(v) => setField("carTitle", v)}
                />
                <Field
                  label="Alt Açıklama"
                  value={form.carSubtitle}
                  onChange={(v) => setField("carSubtitle", v)}
                />
                <Field
                  label="Fiyat"
                  value={form.priceTag}
                  onChange={(v) => setField("priceTag", v)}
                />
              </div>

              {/* TEKNİK ÖZELLİKLER */}
              <div className="flex flex-col gap-4">
                <SectionTitle>TEKNİK ÖZELLİKLER</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Kilometre"
                    value={form.specKm}
                    onChange={(v) => setField("specKm", v)}
                  />
                  <Field
                    label="Yakıt"
                    value={form.specFuel}
                    onChange={(v) => setField("specFuel", v)}
                  />
                  <Field
                    label="Vites"
                    value={form.specGear}
                    onChange={(v) => setField("specGear", v)}
                  />
                  <Field
                    label="Model Yılı"
                    value={form.specYear}
                    onChange={(v) => setField("specYear", v)}
                  />
                </div>
              </div>

              {/* FOTOĞRAFLAR */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionTitle>FOTOĞRAFLAR</SectionTitle>
                    <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
                      8–15 arası public erişilebilir fotoğraf URL&apos;si girin.
                      Boş alanlar gönderilmez. ({photos.length}/{MAX_PHOTOS},
                      min {MIN_PHOTOS})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoPhotos}
                    className="shrink-0 text-xs underline"
                    style={{ color: MUTED }}
                  >
                    Demo URL doldur
                  </button>
                </div>

                {photos.map((photo, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Field
                        label={
                          index === 0
                            ? "Ana Fotoğraf"
                            : `Detay Foto ${index + 1}`
                        }
                        value={photo}
                        onChange={(v) => updatePhoto(index, v)}
                        placeholder={
                          index === 0
                            ? "https://... (zorunlu)"
                            : "https://... public link"
                        }
                        type="url"
                        hint="public URL"
                      />
                    </div>
                    {photos.length > MIN_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="mt-7 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 hover:border-[#ff2d2d] hover:text-white"
                        aria-label={`Fotoğraf ${index + 1} çıkar`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="rounded-lg border border-dashed border-zinc-700 px-4 py-2.5 text-sm transition hover:border-[#ff2d2d]"
                    style={{ color: MUTED }}
                  >
                    + Fotoğraf ekle
                  </button>
                )}
              </div>

              {/* İLETİŞİM */}
              <div className="flex flex-col gap-4">
                <SectionTitle>İLETİŞİM</SectionTitle>
                <Field
                  label="CTA Metni"
                  value={form.ctaMain}
                  onChange={(v) => setField("ctaMain", v)}
                />
                <Field
                  label="Telefon"
                  value={form.phone}
                  onChange={(v) => setField("phone", v)}
                />
                <Field
                  label="Adres"
                  value={form.address}
                  onChange={(v) => setField("address", v)}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-lg px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: loading ? "#991b1b" : ACCENT }}
              >
                {loading ? "Video hazırlanıyor… (~90 sn)" : "Video Oluştur"}
              </button>
            </div>
          </section>

          <section className="lg:sticky lg:top-8 lg:self-start">
            <div
              className="rounded-2xl border border-zinc-800 p-6"
              style={{ backgroundColor: PANEL }}
            >
              <h2 className="mb-1 text-sm font-semibold">Önizleme</h2>
              <p className="mb-5 text-xs" style={{ color: MUTED }}>
                Render tamamlanınca video burada oynatılır
              </p>

              {loading ? (
                <PreviewSkeleton format={format} />
              ) : videoUrl ? (
                <div className="flex flex-col gap-4">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg"
                  />
                  <a
                    href={videoUrl}
                    download
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#ff2d2d]"
                  >
                    ⬇ Videoyu İndir
                  </a>
                </div>
              ) : (
                <div
                  className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm"
                  style={{ color: MUTED, backgroundColor: BG }}
                >
                  Formu doldurup video oluşturun
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
