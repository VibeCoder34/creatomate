import type { NextRequest } from "next/server";

export function getPublicBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export function isPubliclyReachable(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  } catch {
    return false;
  }
}

export const VOICEOVER_PUBLIC_URL_HINT =
  "Creatomate seslendirmeyi indirmek için uygulamanın internetten erişilebilir bir URL'si olmalı. `.env.local` içine `NEXT_PUBLIC_APP_URL=https://....` ekleyin (ngrok, Cloudflare Tunnel veya deploy adresi). localhost ile seslendirme çalışmaz.";
