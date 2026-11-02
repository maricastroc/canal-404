import type { Metadata, Viewport } from "next";
import { Baloo_2, Fredoka, Patrick_Hand } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { AppProviders } from "@/components/layout/AppProviders";
import { SITE_NAME, SITE_TITLE, SITE_URL, pageMetadata } from "@/lib/site";
import "./globals.css";

const luckiest = localFont({
  src: "./fonts/luckiest-guy-latin-400.woff2",
  variable: "--font-luckiest",
  weight: "400",
  display: "swap",
  declarations: [
    { prop: "ascent-override", value: "85%" },
    { prop: "descent-override", value: "15%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const patrick = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

const DESCRIPTION =
  "O canal saiu do ar, mas o portal de jogos continua funcionando. Explore a sala de transmissão, descubra segredos e jogue os jogos do canal.";

export const metadata: Metadata = {
  ...pageMetadata({ description: DESCRIPTION, path: "/" }),
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · CANAL 404" },
  applicationName: SITE_NAME,
};

export const viewport: Viewport = {
  themeColor: "#1f1839",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${luckiest.variable} ${baloo.variable} ${patrick.variable} ${fredoka.variable} antialiased`}
    >
      <body className="min-h-svh">
        <a
          href="#content"
          className="sr-only-focusable left-4 top-4 z-[100] rounded-xl border-[3px] border-ink bg-sun px-4 py-2 font-display text-lg text-ink shadow-[var(--shadow-ink)]"
        >
          Pular para o conteúdo
        </a>
        <AppProviders>{children}</AppProviders>
        {UMAMI_ID && <Script src={UMAMI_SRC} data-website-id={UMAMI_ID} data-do-not-track="true" data-exclude-search="true" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
