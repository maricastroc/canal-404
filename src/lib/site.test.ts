import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GAMES } from "@/games/registry";
import { SITE_URL, ogImage, pageMetadata } from "./site";

const PUBLIC = join(process.cwd(), "public");

describe("sharing", () => {
  it("has an Open Graph image for the portal and for every game", () => {
    for (const name of ["canal-404", ...GAMES.map((g) => g.slug)]) {
      expect(existsSync(join(PUBLIC, ogImage(name, "").url)), `${name}: run npm run og`).toBe(true);
    }
  });

  it("builds page metadata with its own canonical address and preview", () => {
    const meta = pageMetadata({ title: "Extras", description: "Pôsteres", path: "/extras" });
    expect(meta.alternates?.canonical).toBe("/extras");
    expect(meta.openGraph).toMatchObject({ url: "/extras", title: "Extras · CANAL 404", locale: "pt_BR" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toBeUndefined();
  });

  it("lets a page point its canonical elsewhere and stay out of search results", () => {
    const meta = pageMetadata({ title: "Jogando", description: "x", path: "/play/food-fight", canonical: "/games/food-fight", index: false });
    expect(meta.alternates?.canonical).toBe("/games/food-fight");
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("sitemap and robots", () => {
  it("lists the sections and every game page", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(SITE_URL);
    for (const path of ["/games", "/characters", "/extras", "/about"]) expect(urls).toContain(`${SITE_URL}${path}`);
    for (const game of GAMES) expect(urls).toContain(`${SITE_URL}/games/${game.slug}`);
    expect(urls.some((url) => url.includes("/play/") || url.includes("/og-card/"))).toBe(false);
  });

  it("points crawlers to the sitemap and away from the card renderer", () => {
    const rules = robots();
    expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(rules.rules).toMatchObject({ disallow: ["/og-card/"] });
  });
});
