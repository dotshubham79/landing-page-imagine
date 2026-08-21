import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "IMAGINE — Where imagination becomes intelligence",
    description: "A new creative interface where human imagination becomes intelligence.",
    applicationName: "IMAGINE",
    metadataBase: new URL(origin),
    keywords: ["IMAGINE", "real-time creation", "persistent objects", "creative intelligence"],
    openGraph: {
      title: "IMAGINE — Where imagination becomes intelligence",
      description: "A new creative interface where human imagination becomes intelligence.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1672, height: 941, alt: "IMAGINE — Where imagination becomes intelligence." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "IMAGINE — Where imagination becomes intelligence",
      description: "A new creative interface where human imagination becomes intelligence.",
      images: [`${origin}/og.png`],
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
