import type React from "react";
import type { Locale } from "@/i18n/locales";
import { KidBust } from "@/components/characters/Heads";
import { BadIdeasLabCast } from "./BadIdeasLabCast";
import { DeadEndStreetCast } from "./DeadEndStreetCast";
import { FoodFightCast } from "./FoodFightArt";
import { OffAirVacationResult } from "./OffAirVacationArt";
import { OperationRecessCast } from "./OperationRecessArt";
import { PajamaWarCast } from "./PajamaWarArt";
import { PajamaBust, type PajamaKidId } from "@/components/characters/PajamaKids";
import { FOLK_INFO, FolkBust, type FolkId } from "@/components/characters/ResortFolks";

export type CastMood = "intro" | "win" | "lose";

const PAJAMA_KIDS: PajamaKidId[] = ["lia", "nico", "bia"];

function isPajamaKid(id: string | undefined): id is PajamaKidId {
  return PAJAMA_KIDS.includes(id as PajamaKidId);
}

function PajamaCast({ mood, featured }: { mood: CastMood; featured?: string }) {
  const size = mood === "intro" ? "w-56 md:w-72" : mood === "win" ? "w-36 sm:w-44 sm:shorter:w-36" : "w-44 sm:w-52 sm:shorter:w-40";
  return <PajamaWarCast mood={mood} featured={featured} className={size} />;
}

function isFolk(id: string | undefined): id is FolkId {
  return Boolean(id && id in FOLK_INFO);
}

function ResortCast({ mood, featured }: { mood: CastMood; featured?: string }) {
  if (mood === "intro") {
    return (
      <div className="flex shrink-0 items-end">
        <FolkBust id="bigodes" mood="look" className="w-20 -rotate-6 sm:w-24" />
        <KidBust who="deco" face="wow" className="-ml-4 w-20 sm:w-24" />
        <FolkBust id="marola" mood="happy" className="-ml-4 w-20 rotate-6 sm:w-24" />
      </div>
    );
  }
  return <OffAirVacationResult ending={featured === "off" ? "off" : "on"} className="w-36 sm:w-44 sm:shorter:w-36" />;
}

function StreetCast({ mood }: { mood: CastMood }) {
  return <DeadEndStreetCast mood={mood} className={mood === "intro" ? "w-56 md:w-72" : "w-44 sm:w-52 sm:shorter:w-40"} />;
}

function LabCast({ mood }: { mood: CastMood }) {
  return <BadIdeasLabCast mood={mood} className={mood === "intro" ? "w-56 md:w-64" : "w-44 sm:w-52 sm:shorter:w-40"} />;
}

function RecessCast({ mood, locale }: { mood: CastMood; locale: Locale }) {
  return <OperationRecessCast mood={mood} locale={locale} className={mood === "intro" ? "w-56 md:w-72" : "w-36 sm:w-44 sm:shorter:w-36"} />;
}

function CanteenCast({ mood }: { mood: CastMood }) {
  return <FoodFightCast mood={mood} className={mood === "intro" ? "w-56 md:w-64" : "w-44 sm:w-52 sm:shorter:w-40"} />;
}

export const GAME_CAST: Record<string, (props: { mood: CastMood; featured?: string; locale: Locale }) => React.JSX.Element> = {
  "dead-end-street": StreetCast,
  "bad-ideas-lab": LabCast,
  "food-fight": CanteenCast,
  "pajama-war": PajamaCast,
  "operation-recess": RecessCast,
  "off-air-vacation": ResortCast,
};

const GUEST_CARD: Record<PajamaKidId, string> = { lia: "bg-sun", nico: "bg-plum-300", bia: "bg-bubblegum" };

export function guestCardClass(id: string) {
  if (isPajamaKid(id)) return GUEST_CARD[id];
  if (isFolk(id)) return FOLK_INFO[id].card;
  return "bg-cream";
}

export function GuestBust({ id, className }: { id: string; className?: string }) {
  if (isPajamaKid(id)) return <PajamaBust who={id} face="happy" className={className} />;
  if (isFolk(id)) return <FolkBust id={id} mood="happy" className={className} clip />;
  return null;
}
