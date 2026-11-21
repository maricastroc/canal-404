export type ExtraKind = "bust" | "full";

export type Extra = { id: string; kind: ExtraKind; idle: string; cheer: string; height: number };

const RIVALS = ["big-1", "big-2", "big-3", "big-4", "cap-1", "cap-2", "cap-3", "cap-4", "speedy-1", "speedy-2", "speedy-3", "speedy-4"];

export const EXTRAS: readonly Extra[] = [
  ...RIVALS.map((r): Extra => ({ id: `kid-${r}`, kind: "bust", idle: `x-rival-${r}-windup`, cheer: `x-rival-${r}-up`, height: 98 })),
  { id: "lia", kind: "full", idle: "x-kid-lia-idle-f", cheer: "x-kid-lia-cheer", height: 172 },
  { id: "nico", kind: "full", idle: "x-kid-nico-idle-f", cheer: "x-kid-nico-cheer", height: 172 },
  { id: "bia", kind: "full", idle: "x-kid-bia-idle-f", cheer: "x-kid-bia-cheer", height: 172 },
];

export const CAST_FILES: [string, string][] = [
  ...RIVALS.flatMap((r): [string, string][] => [
    [`x-rival-${r}-windup`, `food-fight/rival-${r}-windup`],
    [`x-rival-${r}-up`, `food-fight/rival-${r}-up`],
  ]),
  ...["lia", "nico", "bia"].flatMap((k): [string, string][] => [
    [`x-kid-${k}-idle-f`, `pajama-war/kid-${k}-idle-f`],
    [`x-kid-${k}-cheer`, `pajama-war/kid-${k}-cheer`],
  ]),
  ["x-cook", "food-fight/cook-walk-0"],
  ["x-cook-huff", "food-fight/cook-huff-0"],
];

export class CastPlanner {
  private readonly uses = new Map<string, number[]>();
  private readonly turn: Record<ExtraKind, number> = { bust: 0, full: 0 };

  constructor(private readonly gap: number) {}

  claim(id: string, x: number) {
    const list = this.uses.get(id) ?? [];
    list.push(x);
    this.uses.set(id, list);
  }

  free(id: string, x: number) {
    return (this.uses.get(id) ?? []).every((u) => Math.abs(u - x) >= this.gap);
  }

  take(kind: ExtraKind, x: number): Extra | null {
    const pool = EXTRAS.filter((e) => e.kind === kind);
    for (let i = 0; i < pool.length; i += 1) {
      const index = (this.turn[kind] + i) % pool.length;
      const e = pool[index];
      if (!this.free(e.id, x)) continue;
      this.claim(e.id, x);
      this.turn[kind] = (index + 1) % pool.length;
      return e;
    }
    return null;
  }
}
