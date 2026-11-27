import { KIDS, type KidId } from "./config";

export const FEATS = ["dodges", "streak", "bank", "bankKo", "grabs", "giantKo", "caveIn", "standing"] as const;
export type FeatId = (typeof FEATS)[number];

export const NEED = { dodges: 6, streak: 5, banks: 3, grabs: 2, forts: 2 };

export type MatchFeats = { dodges: number; bestDodges: number; streak: number; bestStreak: number; banks: number; bankKos: number; grabs: number; giantKos: number; caveIns: number; fortsLeft: number };

export function freshFeats(): MatchFeats {
  return { dodges: 0, bestDodges: 0, streak: 0, bestStreak: 0, banks: 0, bankKos: 0, grabs: 0, giantKos: 0, caveIns: 0, fortsLeft: 0 };
}

export function featDone(id: FeatId, m: MatchFeats, won: boolean) {
  if (id === "dodges") return m.bestDodges >= NEED.dodges;
  if (id === "streak") return m.bestStreak >= NEED.streak;
  if (id === "bank") return m.banks >= NEED.banks;
  if (id === "bankKo") return m.bankKos > 0;
  if (id === "grabs") return m.grabs >= NEED.grabs;
  if (id === "giantKo") return m.giantKos > 0;
  if (id === "caveIn") return m.caveIns > 0;
  return won && m.fortsLeft >= NEED.forts;
}

export type ChallengeBook = { feats: Partial<Record<string, FeatId[]>>; wonWith: Partial<Record<string, KidId[]>> };

export type Challenge = { feat: FeatId | null; done: boolean; fresh: boolean; kids: KidId[]; newKid: KidId | null };

export function readChallenges(book: ChallengeBook, arena: string, feats: readonly FeatId[]): Challenge[] {
  const got = book.feats[arena] ?? [];
  const kids = book.wonWith[arena] ?? [];
  return [...feats.map((feat) => ({ feat, done: got.includes(feat), fresh: false, kids: [], newKid: null })), { feat: null, done: kids.length >= KIDS.length, fresh: false, kids: [...kids], newKid: null }];
}

export function settleChallenges(book: ChallengeBook, arena: string, feats: readonly FeatId[], kid: KidId, won: boolean, m: MatchFeats): Challenge[] {
  const got = (book.feats[arena] ??= []);
  const fresh = new Set<FeatId>();
  for (const feat of feats) {
    if (got.includes(feat) || !featDone(feat, m, won)) continue;
    got.push(feat);
    fresh.add(feat);
  }
  const winners = (book.wonWith[arena] ??= []);
  const before = winners.length;
  const newKid = won && !winners.includes(kid) ? kid : null;
  if (newKid) winners.push(newKid);
  if (got.length === 0) delete book.feats[arena];
  if (winners.length === 0) delete book.wonWith[arena];
  return readChallenges(book, arena, feats).map((c) => ({
    ...c,
    fresh: c.feat ? fresh.has(c.feat) : before < KIDS.length && c.done,
    newKid: c.feat ? null : newKid,
  }));
}
