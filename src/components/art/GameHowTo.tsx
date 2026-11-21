import type { Locale } from "@/i18n/locales";
import { BadIdeasLabHowToPanel } from "./BadIdeasLabArt";
import { DeadEndStreetHowToPanel } from "./DeadEndStreetArt";
import { DownhillDerbyHowToPanel } from "./DownhillDerbyArt";
import { FoodFightHowToPanel } from "./FoodFightArt";
import { OffAirVacationHowToPanel } from "./OffAirVacationArt";
import { OperationRecessHowToPanel } from "./OperationRecessArt";
import { PajamaWarHowToPanel } from "./PajamaWarArt";

export function GameHowToPanel({ slug, step, locale }: { slug: string; step: 0 | 1 | 2; locale: Locale }) {
  if (slug === "bad-ideas-lab") return <BadIdeasLabHowToPanel step={step} locale={locale} />;
  if (slug === "food-fight") return <FoodFightHowToPanel step={step} locale={locale} />;
  if (slug === "operation-recess") return <OperationRecessHowToPanel step={step} locale={locale} />;
  if (slug === "pajama-war") return <PajamaWarHowToPanel step={step} locale={locale} />;
  if (slug === "off-air-vacation") return <OffAirVacationHowToPanel step={step} />;
  if (slug === "downhill-derby") return <DownhillDerbyHowToPanel step={step} locale={locale} />;
  return <DeadEndStreetHowToPanel step={step} />;
}
