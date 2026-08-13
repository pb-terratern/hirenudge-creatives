import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "HireNudge Content Operations",
  description: "Evidence-led social content operations for HireNudge.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
