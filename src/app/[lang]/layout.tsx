import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppProviders } from "@/components/layout/AppProviders";
import { localized } from "@/i18n/copy";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/i18n/locales";
import { SITE_NAME, SITE_TITLE, SITE_URL, pageMetadata } from "@/lib/site";
import { FONT_CLASSES } from "../fonts";
import "../globals.css";

const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

const COPY = localized({
  "pt-BR": {
    description: "O canal saiu do ar, mas o portal de jogos continua funcionando. Explore a sala de transmissão, descubra segredos e jogue os jogos do canal.",
    skip: "Pular para o conteúdo",
  },
  en: {
    description: "The channel went off the air, but its game portal is still running. Explore the broadcast room, find the secrets and play the channel's games.",
    skip: "Skip to content",
  },
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    ...pageMetadata({ description: COPY[lang].description, path: "/", locale: lang }),
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_TITLE[lang], template: `%s · ${SITE_NAME}` },
    applicationName: SITE_NAME,
  };
}

export const viewport: Viewport = {
  themeColor: "#1f1839",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang: param } = await params;
  const lang = isLocale(param) ? param : DEFAULT_LOCALE;
  return (
    <html lang={lang} className={FONT_CLASSES} data-scroll-behavior="smooth">
      <body className="min-h-svh">
        <a
          href="#content"
          className="sr-only-focusable left-4 top-4 z-[100] rounded-xl border-[3px] border-ink bg-sun px-4 py-2 font-display text-lg text-ink shadow-[var(--shadow-ink)]"
        >
          {COPY[lang].skip}
        </a>
        <AppProviders locale={lang}>{children}</AppProviders>
        {UMAMI_ID && <Script src={UMAMI_SRC} data-website-id={UMAMI_ID} data-do-not-track="true" data-exclude-search="true" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
