import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "IMAGINE — A creative interface for intelligence",
    description: "Here, your output is intelligent. Discover a creative interface for human–AI interaction.",
    applicationName: "IMAGINE",
    metadataBase: new URL(origin),
    keywords: ["IMAGINE", "real-time creation", "persistent objects", "creative intelligence"],
    openGraph: {
      title: "IMAGINE — A creative interface for intelligence",
      description: "Here, your output is intelligent. Discover a creative interface for human–AI interaction.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-imagine-landing-v1.png`, width: 1729, height: 910, alt: "IMAGINE — A creative interface for intelligence." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "IMAGINE — A creative interface for intelligence",
      description: "Here, your output is intelligent. Discover a creative interface for human–AI interaction.",
      images: [`${origin}/og-imagine-landing-v1.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
