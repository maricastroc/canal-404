import { ControllerIcon, GiftIcon, HouseIcon, MissionIcon, SmileyIcon, TowerIcon, TrophyIcon } from "@/components/art/Icons";
import type { NavItem } from "./nav";

const ICONS = {
  house: HouseIcon,
  controller: ControllerIcon,
  target: MissionIcon,
  trophy: TrophyIcon,
  smiley: SmileyIcon,
  chest: GiftIcon,
  tower: TowerIcon,
} satisfies Record<NavItem["icon"], (props: { className?: string }) => React.JSX.Element>;

export function NavIcon({ icon, className = "" }: { icon: NavItem["icon"]; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={`text-ink ${className}`} />;
}
