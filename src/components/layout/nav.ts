export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: "house" | "controller" | "star" | "smiley" | "chest" | "tower";
  color: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", short: "Início", icon: "house", color: "bg-sun" },
  { href: "/jogos", label: "Todos os jogos", short: "Jogos", icon: "controller", color: "bg-mint" },
  { href: "/jogos/rua-sem-saida", label: "Jogo da semana", short: "Da semana", icon: "star", color: "bg-tangerine" },
  { href: "/personagens", label: "Personagens", short: "Personagens", icon: "smiley", color: "bg-bubblegum" },
  { href: "/extras", label: "Extras", short: "Extras", icon: "chest", color: "bg-plum-300" },
  { href: "/sobre", label: "Sobre o canal", short: "Sobre", icon: "tower", color: "bg-sky" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/jogos") return pathname === "/jogos";
  return pathname === href || pathname.startsWith(`${href}/`);
}
