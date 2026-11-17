import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
