import { localized } from "@/i18n/copy";
import type { Locale } from "@/i18n/locales";

export const STAR_MAX_HITS = 3;

export type StarRun = { won: boolean; hits: number; kills: number; monitors: number };

const HINT = localized({
  "pt-BR": {
    missing: (left: number) => (left === 1 ? "Faltou 1 monitor" : `Faltaram ${left} monitores`),
    allMonitors: (missing: string, monitors: number) => `${missing}. Derrube todos os ${monitors} da fase para a 3ª estrela.`,
    fewHits: `Com até ${STAR_MAX_HITS} batidas, a fase vale 3 estrelas.`,
    both: (monitors: number) => `Uma estrela é por levar até ${STAR_MAX_HITS} batidas. A outra, por derrubar os ${monitors} monitores.`,
  },
  en: {
    missing: (left: number) => (left === 1 ? "You missed 1 monitor" : `You missed ${left} monitors`),
    allMonitors: (missing: string, monitors: number) => `${missing}. Take down all ${monitors} in the level for the 3rd star.`,
    fewHits: `Take ${STAR_MAX_HITS} hits or fewer and the level is worth 3 stars.`,
    both: (monitors: number) => `One star is for taking ${STAR_MAX_HITS} hits or fewer. The other is for taking down all ${monitors} monitors.`,
  },
});

export function recessStars({ won, hits, kills, monitors }: StarRun) {
  if (!won) return 0;
  return 1 + (hits <= STAR_MAX_HITS ? 1 : 0) + (kills >= monitors ? 1 : 0);
}

export function recessStarHint({ hits, kills, monitors }: StarRun, locale: Locale) {
  const left = Math.max(0, monitors - kills);
  const careful = hits <= STAR_MAX_HITS;
  if (careful && !left) return undefined;
  const text = HINT[locale];
  const missing = text.missing(left);
  if (careful) return text.allMonitors(missing, monitors);
  if (!left) return text.fewHits;
  return text.both(monitors);
}
