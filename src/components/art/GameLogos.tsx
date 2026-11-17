import type { Locale } from "@/i18n/locales";
import { BadIdeasLabHowToPanel } from "./BadIdeasLabArt";
import { DeadEndStreetHowToPanel } from "./DeadEndStreetArt";
import { FoodFightHowToPanel } from "./FoodFightArt";
import { BadIdeasLabLogo, DeadEndStreetLogo, FoodFightLogo, OffAirVacationLogo, OperationRecessLogo, PajamaWarLogo } from "./GameTitleLogos";
import { OffAirVacationHowToPanel } from "./OffAirVacationArt";
import { OperationRecessHowToPanel } from "./OperationRecessArt";
import { PajamaWarHowToPanel } from "./PajamaWarArt";

export const GAME_LOGOS: Record<string, (props: { className?: string; bare?: boolean }) => React.JSX.Element> = {
  "dead-end-street": DeadEndStreetLogo,
  "bad-ideas-lab": BadIdeasLabLogo,
  "food-fight": FoodFightLogo,
  "operation-recess": OperationRecessLogo,
  "pajama-war": PajamaWarLogo,
  "off-air-vacation": OffAirVacationLogo,
};

export function GameHowToPanel({ slug, step, locale }: { slug: string; step: 0 | 1 | 2; locale: Locale }) {
  if (slug === "bad-ideas-lab") return <BadIdeasLabHowToPanel step={step} />;
  if (slug === "food-fight") return <FoodFightHowToPanel step={step} locale={locale} />;
  if (slug === "operation-recess") return <OperationRecessHowToPanel step={step} locale={locale} />;
  if (slug === "pajama-war") return <PajamaWarHowToPanel step={step} locale={locale} />;
  if (slug === "off-air-vacation") return <OffAirVacationHowToPanel step={step} />;
  return <DeadEndStreetHowToPanel step={step} />;
}
