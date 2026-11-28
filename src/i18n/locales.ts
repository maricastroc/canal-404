export const LOCALES = ["pt-BR", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const OG_LOCALES: Record<Locale, string> = { "pt-BR": "pt_BR", en: "en_US" };

export const LOCALE_NAMES: Record<Locale, { short: string; name: string }> = {
  "pt-BR": { short: "PT", name: "Português" },
  en: { short: "EN", name: "English" },
};

const NOT_PAGES = /^\/(?:api|assets|og|_next)(?:\/|$)|\.[a-z0-9]+(?:[?#]|$)/i;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localePath(locale: Locale, path: string) {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || NOT_PAGES.test(path)) return path;
  const prefix = `/${locale}`;
  if (path === "/") return prefix;
  if (path.startsWith("/?") || path.startsWith("/#")) return `${prefix}${path.slice(1)}`;
  return `${prefix}${path}`;
}

export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return { locale, path: "/" };
    if (pathname.startsWith(`${prefix}/`)) return { locale, path: pathname.slice(prefix.length) };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}
