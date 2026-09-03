import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMAGINE — A creative interface for intelligence",
  description: "Your thoughts become worlds you can see, shape, question, and continue.",
  applicationName: "IMAGINE",
  keywords: ["IMAGINE", "creative intelligence", "persistent worlds", "interactive learning"],
  openGraph: {
    title: "IMAGINE — A creative interface for intelligence",
    description: "Your thoughts become worlds you can see, shape, question, and continue.",
    type: "website",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "IMAGINE — A creative interface for intelligence." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IMAGINE — A creative interface for intelligence",
    description: "Your thoughts become worlds you can see, shape, question, and continue.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
