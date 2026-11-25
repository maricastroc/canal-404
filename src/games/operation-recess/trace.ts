import type { GameStats, RecessReplay } from "@/games/types";
import { HEARTS, RUN, SCORE, TILE } from "./config";
import type { LevelDef } from "./levels";

export const TRACE_MAX = 64;
export const TRACE_TIME_MAX = 60 * 60 * 1000;

const SLACK = 0.9;
const KILL_REACH = 900;
const ITEM_REACH = 60;
const BELL_REACH = 30;
const ARENA_REACH = 260;
export const BOSS_MIN_MS = 5000;

const center = (col: number) => col * TILE + TILE / 2;

export class TraceRecorder {
  private kills: [number, number][] = [];
  private items: [number, number][] = [];
  private hits: number[] = [];
  private bells: number[] = [];
  private arena: number | null = null;

  kill(t: number, index: number) {
    if (this.kills.length < TRACE_MAX) this.kills.push([Math.round(t), index]);
  }

  item(t: number, index: number) {
    if (this.items.length < TRACE_MAX) this.items.push([Math.round(t), index]);
  }

  hit(t: number) {
    if (this.hits.length < TRACE_MAX) this.hits.push(Math.round(t));
  }

  bell(t: number) {
    if (this.bells.length < TRACE_MAX) this.bells.push(Math.round(t));
  }

  enter(t: number) {
    this.arena = Math.round(t);
  }

  toReplay(): RecessReplay {
    return { kind: "recess-trace", version: 1, kills: [...this.kills], items: [...this.items], hits: [...this.hits], bells: [...this.bells], arena: this.arena };
  }
}

const sorted = (times: number[]) => times.every((t, i) => i === 0 || t >= times[i - 1]);

export function checkTrace(def: LevelDef, s: GameStats, won: boolean, trace: RecessReplay): string | null {
  const killTimes = trace.kills.map(([t]) => t);
  const itemTimes = trace.items.map(([t]) => t);
  const all = [...killTimes, ...itemTimes, ...trace.hits, ...trace.bells, ...(trace.arena === null ? [] : [trace.arena])];
  if (all.some((t) => t < 0 || t > s.timeMs)) return "evento fora da partida";
  if (!sorted(killTimes) || !sorted(itemTimes) || !sorted(trace.hits) || !sorted(trace.bells)) return "eventos fora de ordem";
  if (trace.bells.length > def.checkpoints.length) return "sinos demais";
  if (trace.kills.some(([, i]) => i < 0 || i >= def.enemies.length)) return "monitor desconhecido";
  if (trace.items.some(([, i]) => i < 0 || i >= def.items.length)) return "item desconhecido";
  if (new Set(trace.items.map(([, i]) => i)).size !== trace.items.length) return "item pego duas vezes";
  if (trace.arena !== null && !def.boss) return "sala do chefe numa fase sem chefe";
  if (s.resumed) return null;

  if (new Set(trace.kills.map(([, i]) => i)).size !== trace.kills.length) return "monitor derrubado duas vezes";
  if (trace.kills.length !== s.kills) return "monitores não conferem";
  const points = trace.kills.reduce((sum, [, i]) => sum + SCORE[def.enemies[i].kind], 0);
  if (points !== s.killPoints) return "pontos de monitores não conferem";
  if (trace.items.filter(([, i]) => def.items[i].kind === "sticker").length !== s.stickers) return "figurinhas não conferem";
  if (trace.hits.length !== s.hits) return "batidas não conferem";

  const events = [...trace.hits.map((t) => ({ t, heal: false })), ...trace.items.filter(([, i]) => def.items[i].kind === "snack").map(([t]) => ({ t, heal: true }))].sort((a, b) => a.t - b.t || Number(a.heal) - Number(b.heal));
  let hearts = HEARTS;
  let downAt: number | null = null;
  for (const e of events) {
    if (downAt !== null) return "evento depois de ser pego";
    hearts = e.heal ? Math.min(HEARTS, hearts + 1) : hearts - 1;
    if (hearts <= 0) downAt = e.t;
  }
  if (hearts !== s.hearts) return "corações não conferem";
  if (downAt !== null && (won || all.some((t) => t > downAt))) return "evento depois de ser pego";

  const startX = center(def.start);
  const reach = (x: number) => ((Math.max(0, x - startX) / RUN) * 1000 * SLACK);
  if (trace.bells.some((t, i) => t < reach(center(def.checkpoints[i]) - BELL_REACH))) return "sino cedo demais";
  if (trace.kills.some(([t, i]) => t < reach(center(def.enemies[i].col) - KILL_REACH))) return "monitor cedo demais";
  if (trace.items.some(([t, i]) => t < reach(center(def.items[i].col) - ITEM_REACH))) return "item cedo demais";
  if (won && trace.bells.length !== def.checkpoints.length) return "sino pulado";
  if (def.boss) {
    if (won && trace.arena === null) return "chefe vencido fora da sala";
    if (trace.arena !== null && trace.arena < reach(def.boss.arena * TILE + ARENA_REACH)) return "sala do chefe cedo demais";
    if (won && trace.arena !== null && s.timeMs - trace.arena < BOSS_MIN_MS) return "chefe vencido rápido demais";
  }
  return null;
}
