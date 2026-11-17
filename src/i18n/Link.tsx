"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./client";
import { localePath } from "./locales";

export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target = typeof href === "string" ? localePath(locale, href) : href.pathname ? { ...href, pathname: localePath(locale, href.pathname) } : href;
  return <NextLink href={target} {...rest} />;
}
