import { FALLBACK_WEEKLY } from "@/lib/schedule";

export type NavItem = {
  href: string;
  weekly?: boolean;
  label: string;
  short: string;
  icon: "house" | "controller" | "star" | "target" | "trophy" | "smiley" | "chest" | "tower";
  color: string;
  prefetch?: false;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", short: "Início", icon: "house", color: "bg-sun" },
  { href: "/games", label: "Todos os jogos", short: "Jogos", icon: "controller", color: "bg-mint" },
  { href: `/games/${FALLBACK_WEEKLY.slug}`, weekly: true, label: "Jogo da semana", short: "Da semana", icon: "star", color: "bg-tangerine" },
  { href: "/mission", label: "Missão do dia", short: "Missão", icon: "target", color: "bg-lime", prefetch: false },
  { href: "/records", label: "Fliperama de recordes", short: "Recordes", icon: "trophy", color: "bg-tomato" },
  { href: "/characters", label: "Personagens", short: "Personagens", icon: "smiley", color: "bg-bubblegum" },
  { href: "/extras", label: "Extras", short: "Extras", icon: "chest", color: "bg-plum-300" },
  { href: "/about", label: "Sobre o canal", short: "Sobre", icon: "tower", color: "bg-sky" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/games") return pathname === "/games";
  return pathname === href || pathname.startsWith(`${href}/`);
}
