import type React from "react";
import { PajamaBust, type PajamaKidId } from "@/components/characters/PajamaKids";

export type CastMood = "intro" | "win" | "lose";

const PAJAMA_KIDS: PajamaKidId[] = ["lia", "nico", "bia"];

function isPajamaKid(id: string | undefined): id is PajamaKidId {
  return PAJAMA_KIDS.includes(id as PajamaKidId);
}

function PajamaCast({ mood, featured }: { mood: CastMood; featured?: string }) {
  if (mood === "intro") {
    return (
      <div className="flex shrink-0">
        {PAJAMA_KIDS.map((kid, i) => (
          <PajamaBust key={kid} who={kid} face={i === 1 ? "normal" : "happy"} className={`w-20 sm:w-24 ${i ? "-ml-5" : ""} ${["-rotate-6", "rotate-0", "rotate-6"][i]}`} />
        ))}
      </div>
    );
  }
  const who = isPajamaKid(featured) ? featured : "lia";
  return <PajamaBust who={who} face={mood === "win" ? "happy" : "dizzy"} className={`w-24 shrink-0 sm:w-28 ${mood === "win" ? "-rotate-3" : "rotate-6"}`} />;
}

export const GAME_CAST: Record<string, (props: { mood: CastMood; featured?: string }) => React.JSX.Element> = {
  "pajama-war": PajamaCast,
};

const GUEST_CARD: Record<PajamaKidId, string> = { lia: "bg-sun", nico: "bg-plum-300", bia: "bg-bubblegum" };

export function guestCardClass(id: string) {
  return isPajamaKid(id) ? GUEST_CARD[id] : "bg-cream";
}

export function GuestBust({ id, className }: { id: string; className?: string }) {
  if (!isPajamaKid(id)) return null;
  return <PajamaBust who={id} face="happy" className={className} />;
}
