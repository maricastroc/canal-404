import type { MetadataRoute } from "next";
import { GAMES } from "@/games/registry";
import { SITE_URL } from "@/lib/site";

const SECTIONS = ["", "/games", "/records", "/characters", "/extras", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  const sections = SECTIONS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const games = GAMES.map((game) => ({
    url: `${SITE_URL}/games/${game.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [...sections, ...games];
}
