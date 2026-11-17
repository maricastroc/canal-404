import type { Locale } from "./locales";

export type Localized<T> = Readonly<Record<Locale, T>>;

export function localized<T>(copy: { "pt-BR": T; en: NoInfer<T> }): Localized<T> {
  return copy;
}
