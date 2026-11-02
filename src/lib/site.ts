import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://canal-404.marianacastro.dev").replace(/\/$/, "");

export const SITE_NAME = "CANAL 404";

export const SITE_TITLE = "CANAL 404 — Desenhos. Jogos. Bagunça.";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export function ogImage(name: string, alt: string) {
  return { url: `/og/${name}.png`, ...OG_SIZE, alt };
}

const ROOM_IMAGE = ogImage("canal-404", "A sala de transmissão do Canal 404, com a TV, o fliperama e o mascote 404");

export function pageMetadata({
  title,
  description,
  path,
  image = ROOM_IMAGE,
  index = true,
  canonical = path,
}: {
  title?: string;
  description: string;
  path: string;
  image?: ReturnType<typeof ogImage>;
  index?: boolean;
  canonical?: string;
}): Metadata {
  const shared = title ? `${title} · ${SITE_NAME}` : SITE_TITLE;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "pt_BR", url: path, title: shared, description, images: [image] },
    twitter: { card: "summary_large_image", title: shared, description, images: [image.url] },
  };
}
