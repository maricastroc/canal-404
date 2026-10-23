import { ChestIcon, ControllerIcon, HouseIcon, SmileyIcon, StarIcon, TowerIcon } from "@/components/art/Icons";
import type { NavItem } from "./nav";

export function NavIcon({ icon, className }: { icon: NavItem["icon"]; className?: string }) {
  switch (icon) {
    case "house":
      return <HouseIcon className={className} />;
    case "controller":
      return <ControllerIcon className={className} />;
    case "star":
      return <StarIcon className={className} />;
    case "smiley":
      return <SmileyIcon className={className} />;
    case "chest":
      return <ChestIcon className={className} />;
    case "tower":
      return <TowerIcon className={className} />;
  }
}
