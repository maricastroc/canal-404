import type { GameResult } from "@/games/types";
import { isRecord, readVersioned, type MigrationSpec } from "@/lib/progress/migrate";
import type { ApiErrorBody, CompetitionStatus, LeaderboardResponse, PublicPlayer, SubmitResponse, TicketResponse } from "./types";

export type CompetitionState = { status: CompetitionStatus | "checking"; player: PublicPlayer | null };

export type SubmitOutcome =
  | { kind: "accepted"; response: SubmitResponse }
  | { kind: "rejected"; message: string }
  | { kind: "not-joined" }
  | { kind: "queued" }
  | { kind: "unranked"; why: "no-ticket" | "unconfigured" | "expired" | "limited"; message?: string };

type Call<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiErrorBody["error"] | null };

const TIMEOUT_MS = 6000;
const STATUS_TTL_MS = 60_000;
const OUTBOX_KEY = "canal404:outbox:v1";
const OUTBOX_MAX = 10;
const OUTBOX_TTL_MS = 11 * 60 * 60 * 1000;

let state: CompetitionState = { status: "checking", player: null };
let checkedAt = 0;
let inflight: Promise<CompetitionState> | null = null;
const listeners = new Set<() => void>();
const SERVER_STATE: CompetitionState = { status: "checking", player: null };

function emit(next: CompetitionState) {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeCompetition(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCompetition() {
  return state;
}

export function getServerCompetition() {
  return SERVER_STATE;
}

export async function apiCall<T>(path: string, init: { method?: string; body?: unknown } = {}, timeout = TIMEOUT_MS): Promise<Call<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.body === undefined ? undefined : { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as unknown;
    if (response.ok) return { ok: true, status: response.status, data: data as T };
    const error = isRecord(data) && isRecord(data.error) ? (data.error as ApiErrorBody["error"]) : null;
    return { ok: false, status: response.status, error };
  } catch {
    return { ok: false, status: 0, error: null };
  } finally {
    window.clearTimeout(timer);
  }
}

async function check(): Promise<CompetitionState> {
  const status = await apiCall<{ status: CompetitionStatus }>("/api/status", {}, 5000);
  if (!status.ok) return { status: "offline", player: state.player };
  if (status.data.status !== "online") return { status: status.data.status, player: status.data.status === "unconfigured" ? null : state.player };
  const me = await apiCall<{ player: PublicPlayer | null }>("/api/players/me");
  if (!me.ok) return { status: "offline", player: state.player };
  return { status: "online", player: me.data.player };
}

export function connect(force = false): Promise<CompetitionState> {
  if (typeof window === "undefined") return Promise.resolve(state);
  if (inflight) return inflight;
  if (!force && state.status !== "checking" && Date.now() - checkedAt < STATUS_TTL_MS) return Promise.resolve(state);
  inflight = check()
    .then((next) => {
      checkedAt = Date.now();
      emit(next);
      if (next.status === "online" && next.player) void flushOutbox();
      return next;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export type TicketGrant = { token: string; mission: string | null };

export async function requestTicket(game: string, level: string | null, mission: string | null = null): Promise<TicketGrant | null> {
  const current = await connect();
  if (current.status !== "online") return null;
  const response = await apiCall<TicketResponse>("/api/runs/tickets", { method: "POST", body: mission ? { game, level, mission } : { game, level } });
  if (!response.ok) {
    if (response.status === 0 || response.status >= 500) emit({ ...state, status: "offline" });
    return null;
  }
  return { token: response.data.ticket, mission: response.data.mission ?? null };
}

type Claim = { won: boolean; score: number; stars: number; stats: Record<string, number>; replay?: GameResult["replay"] };

export function claimOf(result: GameResult): Claim | null {
  if (!result.stats) return null;
  return { won: result.won, score: result.score, stars: result.stars, stats: result.stats, ...(result.replay ? { replay: result.replay } : {}) };
}

async function send(ticket: string, claim: Claim): Promise<SubmitOutcome | "network"> {
  const response = await apiCall<SubmitResponse>("/api/runs", { method: "POST", body: { ticket, result: claim } }, 10_000);
  if (response.ok) return { kind: "accepted", response: response.data };
  const code = response.error?.code;
  if (response.status === 0 || response.status >= 500) {
    if (code === "unconfigured") return { kind: "unranked", why: "unconfigured" };
    return "network";
  }
  if (code === "not_joined") return { kind: "not-joined" };
  if (code === "expired_ticket") return { kind: "unranked", why: "expired" };
  if (code === "rate_limited") return { kind: "unranked", why: "limited", message: response.error?.message };
  return { kind: "rejected", message: response.error?.message ?? "O placar não aceitou este resultado." };
}

type OutboxItem = { ticket: string; claim: Claim; savedAt: number };

type Outbox = { version: 1; items: OutboxItem[] };

const OUTBOX_SPEC: MigrationSpec<Outbox> = {
  version: 1,
  normalize: (value) => {
    const items = Array.isArray(value.items) ? value.items : [];
    return {
      version: 1,
      items: items.filter(
        (item): item is OutboxItem =>
          isRecord(item) && typeof item.ticket === "string" && isRecord(item.claim) && typeof item.savedAt === "number" && Number.isFinite(item.savedAt),
      ),
    };
  },
};

function readOutbox(now = Date.now()) {
  const loaded = readVersioned(OUTBOX_KEY, OUTBOX_SPEC);
  const items = loaded.status === "ok" ? loaded.value.items : [];
  return items.filter((item) => now - item.savedAt < OUTBOX_TTL_MS);
}

function writeOutbox(items: OutboxItem[]) {
  try {
    if (items.length) window.localStorage.setItem(OUTBOX_KEY, JSON.stringify({ version: 1, items: items.slice(-OUTBOX_MAX) }));
    else window.localStorage.removeItem(OUTBOX_KEY);
  } catch {}
}

export function pendingCount() {
  return typeof window === "undefined" ? 0 : readOutbox().length;
}

let flushing = false;

export async function flushOutbox() {
  if (flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    const items = readOutbox();
    const keep: OutboxItem[] = [];
    for (const item of items) {
      const outcome = await send(item.ticket, item.claim);
      if (outcome === "network") {
        keep.push(item);
        continue;
      }
      if (outcome.kind === "not-joined") keep.push(item);
      else sent += 1;
    }
    writeOutbox(keep);
  } finally {
    flushing = false;
  }
  return sent;
}

export async function submitResult(ticket: Promise<TicketGrant | null> | null, result: GameResult): Promise<SubmitOutcome> {
  const claim = claimOf(result);
  const token = ticket ? ((await ticket)?.token ?? null) : null;
  if (!claim || !token) return { kind: "unranked", why: state.status === "unconfigured" ? "unconfigured" : "no-ticket" };
  if (!state.player) return { kind: "not-joined" };
  const outcome = await send(token, claim);
  if (outcome !== "network") return outcome;
  writeOutbox([...readOutbox(), { ticket: token, claim, savedAt: Date.now() }]);
  emit({ ...state, status: "offline" });
  return { kind: "queued" };
}

export type JoinOutcome = { ok: true; player: PublicPlayer } | { ok: false; message: string };

async function identity(method: "POST" | "PATCH", nickname: string): Promise<JoinOutcome> {
  const response = await apiCall<{ player: PublicPlayer }>(method === "POST" ? "/api/players" : "/api/players/me", { method, body: { nickname } });
  if (response.ok) {
    checkedAt = Date.now();
    emit({ status: "online", player: response.data.player });
    if (method === "POST") void flushOutbox();
    return { ok: true, player: response.data.player };
  }
  if (response.status === 0 || response.status >= 500) return { ok: false, message: "O placar está fora do ar agora. Tente de novo daqui a pouco." };
  return { ok: false, message: response.error?.message ?? "Não deu para salvar o apelido." };
}

export function join(nickname: string) {
  return identity("POST", nickname);
}

export function rename(nickname: string) {
  return identity("PATCH", nickname);
}

export async function leave(): Promise<boolean> {
  const response = await apiCall<{ deleted: boolean }>("/api/players/me", { method: "DELETE" });
  if (!response.ok) return false;
  writeOutbox([]);
  emit({ status: "online", player: null });
  return true;
}

export async function fetchBoard(game: string, level: string | null, limit = 10): Promise<LeaderboardResponse | null> {
  const params = new URLSearchParams({ game, limit: String(limit) });
  if (level) params.set("level", level);
  const response = await apiCall<LeaderboardResponse>(`/api/leaderboards?${params}`);
  return response.ok ? response.data : null;
}

export function resetCompetitionForTests() {
  state = { status: "checking", player: null };
  checkedAt = 0;
  inflight = null;
  flushing = false;
}
