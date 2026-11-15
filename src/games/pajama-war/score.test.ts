import { describe, expect, it } from "vitest";
import { judgeRun } from "@/lib/competition/rules";
import { ARENAS } from "./arenas";
import { HP } from "./config";
import { matchScore } from "./score";

describe("Guerra do Pijama scoring", () => {
  it("scores and stars every finish exactly like the scoreboard judge", () => {
    let checked = 0;
    for (const place of [1, 2, 3]) {
      for (const kos of [0, 1, 2]) {
        if (kos > 3 - place) continue;
        for (const hits of [kos, kos + 3, 18]) {
          for (const hp of place === 1 ? [1, 3, 4, 6, 7, HP] : [0]) {
            const won = place === 1;
            const { score, stars, rows } = matchScore({ won, place, hits, kos, hp });
            expect(rows.reduce((a, r) => a + r.value, 0)).toBe(score);
            const damageTaken = HP - hp + 2;
            const stats = { hits, kos, throws: hits + 20, hp, damageTaken, place, timeMs: 95_000, kid: 2 };
            for (const arena of ARENAS) {
              const verdict = judgeRun("pajama-war", arena.id, { won, score, stars, stats });
              expect(verdict, `${arena.id} ${JSON.stringify(stats)}`).toMatchObject({ ok: true, score, stars });
              checked += 1;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(60);
  });

  it("keeps the star thresholds at 7 and 4 energy points", () => {
    expect([1, 3, 4, 6, 7, 10].map((hp) => matchScore({ won: true, place: 1, hits: 5, kos: 2, hp }).stars)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(matchScore({ won: false, place: 2, hits: 5, kos: 1, hp: 0 }).stars).toBe(0);
  });
});
