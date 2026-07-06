import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CarStudio Reels — Araç Fotoğrafından Saniyeler İçinde Profesyonel Video",
  description:
    "Otomotiv galerileri için AI destekli sosyal medya reels üretim platformu. TikTok, Instagram ve YouTube Shorts için otomatik video üretin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${plusJakarta.variable} antialiased`} suppressHydrationWarning>
      <body className={`${plusJakarta.className} min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
