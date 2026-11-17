export const STAR_MAX_HITS = 3;

export type StarRun = { won: boolean; hits: number; kills: number; monitors: number };

export function recessStars({ won, hits, kills, monitors }: StarRun) {
  if (!won) return 0;
  return 1 + (hits <= STAR_MAX_HITS ? 1 : 0) + (kills >= monitors ? 1 : 0);
}

export function recessStarHint({ hits, kills, monitors }: StarRun) {
  const left = Math.max(0, monitors - kills);
  const careful = hits <= STAR_MAX_HITS;
  if (careful && !left) return undefined;
  const missing = left === 1 ? "Faltou 1 monitor" : `Faltaram ${left} monitores`;
  if (careful) return `${missing}. Derrube todos os ${monitors} da fase para a 3ª estrela.`;
  if (!left) return `Com até ${STAR_MAX_HITS} batidas, a fase vale 3 estrelas.`;
  return `Uma estrela é por levar até ${STAR_MAX_HITS} batidas. A outra, por derrubar os ${monitors} monitores.`;
}
