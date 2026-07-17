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
    description: "The output is not the end. It becomes the interface.",
    applicationName: "IMAGINE",
    icons: { icon: "/imagine-logo.png", apple: "/imagine-logo.png" },
    metadataBase: new URL(origin),
    keywords: ["IMAGINE", "real-time creation", "persistent objects", "creative intelligence"],
    openGraph: {
      title: "IMAGINE — A creative interface for intelligence",
      description: "The output is not the end. It becomes the interface.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-imagine-v3.png`, width: 1672, height: 941, alt: "IMAGINE — The output is not the end. It becomes the interface." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "IMAGINE — A creative interface for intelligence",
      description: "The output is not the end. It becomes the interface.",
      images: [`${origin}/og-imagine-v3.png`],
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
