"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";
import type { Localized } from "./copy";
import { DEFAULT_LOCALE, localePath, splitLocale, type Locale } from "./locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useCopy<T>(copy: Localized<T>): T {
  return copy[useLocale()];
}

export function useLocalPathname() {
  return splitLocale(usePathname() ?? "/").path;
}

export function useLocalePath() {
  const locale = useLocale();
  return (path: string) => localePath(locale, path);
}

export function useLocaleRouter() {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      push: (href: string) => router.push(localePath(locale, href)),
      replace: (href: string) => router.replace(localePath(locale, href)),
      prefetch: (href: string) => router.prefetch(localePath(locale, href)),
      back: () => router.back(),
      refresh: () => router.refresh(),
    }),
    [router, locale],
  );
}
