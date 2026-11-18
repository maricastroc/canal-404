import { BadIdeasLabLogo, DeadEndStreetLogo, FoodFightLogo, OffAirVacationLogo, OperationRecessLogo, PajamaWarLogo } from "./GameTitleLogos";

export const GAME_LOGOS: Record<string, (props: { className?: string; bare?: boolean }) => React.JSX.Element> = {
  "dead-end-street": DeadEndStreetLogo,
  "bad-ideas-lab": BadIdeasLabLogo,
  "food-fight": FoodFightLogo,
  "operation-recess": OperationRecessLogo,
  "pajama-war": PajamaWarLogo,
  "off-air-vacation": OffAirVacationLogo,
};
