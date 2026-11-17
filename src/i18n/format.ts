import type { Locale } from "./locales";

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const englishOrdinals = new Intl.PluralRules("en", { type: "ordinal" });
const ENGLISH_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  const key = `${locale}|${options ? JSON.stringify(options) : ""}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format.format(value);
}

export function dateFormat(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    dateFormats.set(key, format);
  }
  return format;
}

export function ordinal(value: number, locale: Locale) {
  if (locale === "en") return `${formatNumber(value, locale)}${ENGLISH_SUFFIX[englishOrdinals.select(value)] ?? "th"}`;
  return `${formatNumber(value, locale)}º`;
}

export function pick(value: number, forms: readonly [one: string, many: string]) {
  return value === 1 ? forms[0] : forms[1];
}

export function countOf(value: number, forms: readonly [one: string, many: string], locale: Locale) {
  return `${formatNumber(value, locale)} ${pick(value, forms)}`.trim();
}
