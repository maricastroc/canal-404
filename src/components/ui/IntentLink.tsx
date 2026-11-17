"use client";

import Link from "@/i18n/Link";
import type { ComponentProps } from "react";
import { useLocaleRouter } from "@/i18n/client";

export function IntentLink({ href, onPointerEnter, onFocus, onTouchStart, ...rest }: Omit<ComponentProps<typeof Link>, "prefetch" | "href"> & { href: string }) {
  const router = useLocaleRouter();
  const warm = () => router.prefetch(href);
  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={(event) => {
        warm();
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        onTouchStart?.(event);
      }}
      {...rest}
    />
  );
}
