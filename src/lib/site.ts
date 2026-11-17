import type { Metadata } from "next";
import { localized } from "@/i18n/copy";
import { DEFAULT_LOCALE, LOCALES, OG_LOCALES, localePath, type Locale } from "@/i18n/locales";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://canal-404.marianacastro.dev").replace(/\/$/, "");

export const SITE_NAME = "CANAL 404";

export const SITE_TITLE = localized({
  "pt-BR": "CANAL 404 — Desenhos. Jogos. Bagunça.",
  en: "CANAL 404 — Cartoons. Games. Chaos.",
});

const ROOM_ALT = localized({
  "pt-BR": "A sala de transmissão do Canal 404, com a TV, o fliperama e o mascote 404",
  en: "The Canal 404 broadcast room, with the TV, the arcade cabinet and the mascot 404",
});

export const OG_SIZE = { width: 1200, height: 630 } as const;

export function ogImage(name: string, alt: string, locale: Locale) {
  const folder = locale === DEFAULT_LOCALE ? "" : `${locale}/`;
  return { url: `/og/${folder}${name}.png`, ...OG_SIZE, alt };
}

export function pageMetadata({
  title,
  description,
  path,
  locale,
  image = ogImage("canal-404", ROOM_ALT[locale], locale),
  index = true,
  canonical = path,
}: {
  title?: string;
  description: string;
  path: string;
  locale: Locale;
  image?: ReturnType<typeof ogImage>;
  index?: boolean;
  canonical?: string;
}): Metadata {
  const shared = title ? `${title} · ${SITE_NAME}` : SITE_TITLE[locale];
  const languages = Object.fromEntries([...LOCALES.map((l) => [l, localePath(l, canonical)]), ["x-default", canonical]]);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: localePath(locale, canonical), languages },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url: localePath(locale, path),
      title: shared,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: shared, description, images: [image.url] },
  };
}
