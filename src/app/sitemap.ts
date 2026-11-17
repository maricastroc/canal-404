import type { MetadataRoute } from "next";
import { GAMES } from "@/games/registry";
import { LOCALES, localePath } from "@/i18n/locales";
import { SITE_URL } from "@/lib/site";

const SECTIONS = ["/", "/games", "/mission", "/records", "/characters", "/extras", "/about"];

function alternates(path: string) {
  return { languages: Object.fromEntries(LOCALES.map((locale) => [locale, url(locale, path)])) };
}

function url(locale: (typeof LOCALES)[number], path: string) {
  const localized = localePath(locale, path);
  return `${SITE_URL}${localized === "/" ? "" : localized}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...SECTIONS.map((path) => ({ path, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...GAMES.map((game) => ({ path: `/games/${game.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
  return LOCALES.flatMap((locale) =>
    pages.map(({ path, changeFrequency, priority }) => ({ url: url(locale, path), changeFrequency, priority, alternates: alternates(path) })),
  );
}
