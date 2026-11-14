import { Cormorant_Garamond, Manrope, Marcellus, Poppins } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AssistantShell } from "@/components/assistant/assistant-shell";
import { StorefrontShell } from "@/components/storefront";
import { auth } from "@/lib/auth";
import { Providers } from "./providers";

import "./globals.css";
import "./storefront.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Greencart",
  description: "Fresh groceries, delivered fast to your door.",
  authors: [{ name: "Greencart" }],
  openGraph: { type: "website", siteName: "Greencart" },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorant.variable} ${marcellus.variable} ${poppins.variable}`}
    >
      <body className={manrope.className}>
        <Providers session={session}>
          <AssistantShell>
            <StorefrontShell>{children}</StorefrontShell>
          </AssistantShell>
        </Providers>
      </body>
    </html>
  );
}
