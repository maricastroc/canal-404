import { RIVAL_KINDS, type RivalKind } from "./config";

export const FEATS = ["brawl", "cook"] as const;
export type FeatId = (typeof FEATS)[number];

export const NEED = { brawl: 8 };

export type RoundFeats = { brawlHits: number; confiscated: number; returned: RivalKind[] };

export function freshFeats(): RoundFeats {
  return { brawlHits: 0, confiscated: 0, returned: [] };
}

export function featDone(id: FeatId, m: RoundFeats, won: boolean) {
  if (id === "brawl") return m.brawlHits >= NEED.brawl;
  return won && m.confiscated === 0;
}

export type ChallengeBook = { feats: FeatId[]; returned: RivalKind[] };

export type Challenge = { feat: FeatId | null; done: boolean; fresh: boolean; kinds: RivalKind[]; newKinds: RivalKind[] };

export function readChallenges(book: ChallengeBook): Challenge[] {
  return [
    ...FEATS.map((feat) => ({ feat, done: book.feats.includes(feat), fresh: false, kinds: [], newKinds: [] })),
    { feat: null, done: RIVAL_KINDS.every((k) => book.returned.includes(k)), fresh: false, kinds: [...book.returned], newKinds: [] },
  ];
}

export function settleChallenges(book: ChallengeBook, won: boolean, m: RoundFeats): Challenge[] {
  const fresh = FEATS.filter((feat) => !book.feats.includes(feat) && featDone(feat, m, won));
  book.feats = FEATS.filter((feat) => book.feats.includes(feat) || fresh.includes(feat));
  const swept = RIVAL_KINDS.every((k) => book.returned.includes(k));
  const newKinds = RIVAL_KINDS.filter((k) => m.returned.includes(k) && !book.returned.includes(k));
  book.returned = RIVAL_KINDS.filter((k) => book.returned.includes(k) || newKinds.includes(k));
  return readChallenges(book).map((c) => ({
    ...c,
    fresh: c.feat ? fresh.includes(c.feat) : !swept && c.done,
    newKinds: c.feat ? [] : newKinds,
  }));
}
