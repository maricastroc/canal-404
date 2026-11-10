"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function IntentLink({ href, onPointerEnter, onFocus, onTouchStart, ...rest }: Omit<ComponentProps<typeof Link>, "prefetch" | "href"> & { href: string }) {
  const router = useRouter();
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
