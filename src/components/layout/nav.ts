import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: "house" | "controller" | "target" | "trophy" | "smiley" | "chest" | "tower";
  color: string;
  prefetch?: false;
};

type NavKey = "home" | "games" | "mission" | "records" | "characters" | "extras" | "about";

const ITEMS: (Omit<NavItem, "label" | "short"> & { key: NavKey })[] = [
  { key: "home", href: "/", icon: "house", color: "bg-sun" },
  { key: "games", href: "/games", icon: "controller", color: "bg-mint" },
  { key: "mission", href: "/mission", icon: "target", color: "bg-lime", prefetch: false },
  { key: "records", href: "/records", icon: "trophy", color: "bg-tomato" },
  { key: "characters", href: "/characters", icon: "smiley", color: "bg-bubblegum" },
  { key: "extras", href: "/extras", icon: "chest", color: "bg-plum-300" },
  { key: "about", href: "/about", icon: "tower", color: "bg-sky" },
];

const LABELS = localized<Record<NavKey, { label: string; short: string }>>({
  "pt-BR": {
    home: { label: "Início", short: "Início" },
    games: { label: "Todos os jogos", short: "Jogos" },
    mission: { label: "Missão do dia", short: "Missão" },
    records: { label: "Fliperama de recordes", short: "Recordes" },
    characters: { label: "Personagens", short: "Personagens" },
    extras: { label: "Extras", short: "Extras" },
    about: { label: "Sobre o canal", short: "Sobre" },
  },
  en: {
    home: { label: "Home", short: "Home" },
    games: { label: "All games", short: "Games" },
    mission: { label: "Today's mission", short: "Mission" },
    records: { label: "Record arcade", short: "Records" },
    characters: { label: "Characters", short: "Characters" },
    extras: { label: "Extras", short: "Extras" },
    about: { label: "About the channel", short: "About" },
  },
});

export const NAV_COPY = localized({
  "pt-BR": {
    main: "Principal",
    footer: "Rodapé",
    home: "CANAL 404 — página inicial",
    homeWithSlogan: "CANAL 404 — Desenhos. Jogos. Bagunça. Página inicial",
    menu: "Menu do canal",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  en: {
    main: "Main",
    footer: "Footer",
    home: "CANAL 404 — home page",
    homeWithSlogan: "CANAL 404 — Cartoons. Games. Chaos. Home page",
    menu: "Channel menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
});

export function navItems(locale: Locale): NavItem[] {
  return ITEMS.map(({ key, ...item }) => ({ ...item, ...LABELS[locale][key] }));
}

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/games") return pathname === "/games";
  return pathname === href || pathname.startsWith(`${href}/`);
}
