import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "ENTRENA — El teu pla de força",
    description: "Registra els teus entrenaments, controla els pesos i progressa amb bona tècnica.",
    openGraph: {
      title: "ENTRENA — Força que es pot mesurar",
      description: "3 dies per setmana. Registra cada quilo i entrena amb bona tècnica.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "ENTRENA — Força que es pot mesurar" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ENTRENA — Força que es pot mesurar",
      description: "3 dies per setmana. Registra cada quilo i entrena amb bona tècnica.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
