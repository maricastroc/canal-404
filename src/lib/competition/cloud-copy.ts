import { isRecord } from "@/lib/progress/migrate";
import { applySnapshot, hasProgress, sameSnapshot, takeSnapshot } from "@/lib/progress/snapshot";
import { adoptPlayer, apiCall, getCompetition, type ApiError } from "./client";
import { SNAPSHOT_MAX_BYTES, SYNC_MARK_KEY, type CloudCopy, type Snapshot } from "./recovery";
import type { PublicPlayer } from "./types";

const SENT_KEY = "canal404:cloud-sent";
const DELAY_MS = 4000;

let timer: number | undefined;
let sending: string | null = null;

function local(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function markedPlayer(storage: Storage) {
  try {
    const value = JSON.parse(storage.getItem(SYNC_MARK_KEY) ?? "null") as unknown;
    return isRecord(value) && typeof value.player === "string" ? value.player : null;
  } catch {
    return null;
  }
}

function markFor(storage: Storage, playerId: string) {
  try {
    storage.setItem(SYNC_MARK_KEY, JSON.stringify({ version: 1, player: playerId }));
  } catch {}
}

function digest(text: string) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = (Math.imul(hash, 33) + text.charCodeAt(i)) | 0;
  return `${text.length}:${hash >>> 0}`;
}

function lastSent() {
  try {
    return window.sessionStorage.getItem(SENT_KEY);
  } catch {
    return null;
  }
}

function rememberSent(id: string) {
  try {
    window.sessionStorage.setItem(SENT_KEY, id);
  } catch {}
}

async function upload(snapshot: Snapshot, playerId: string, keepalive: boolean) {
  const text = JSON.stringify(snapshot);
  if (new TextEncoder().encode(text).length > SNAPSHOT_MAX_BYTES) return false;
  const id = `${playerId}:${digest(text)}`;
  if (id === lastSent() || id === sending) return true;
  sending = id;
  try {
    const response = await apiCall<{ savedAt: string }>("/api/players/me/copy", { method: "PUT", body: snapshot, keepalive });
    if (response.ok) rememberSent(id);
    return response.ok;
  } finally {
    if (sending === id) sending = null;
  }
}

export type CopyCheck = { kind: "synced" } | { kind: "offer"; copy: CloudCopy } | { kind: "unknown" };

export async function checkCloudCopy(): Promise<CopyCheck> {
  const { status, player } = getCompetition();
  const storage = local();
  if (status !== "online" || !player || !storage) return { kind: "unknown" };
  if (markedPlayer(storage) === player.id) return { kind: "synced" };
  const response = await apiCall<{ copy: CloudCopy | null }>("/api/players/me/copy");
  if (!response.ok) return { kind: "unknown" };
  const copy = response.data.copy;
  if (copy && hasProgress(copy.snapshot) && !sameSnapshot(copy.snapshot, takeSnapshot(storage))) return { kind: "offer", copy };
  markFor(storage, player.id);
  return { kind: "synced" };
}

export async function syncCloudCopy(options: { keepalive?: boolean; force?: boolean } = {}) {
  const { status, player } = getCompetition();
  const storage = local();
  if (status !== "online" || !player || !storage) return false;
  if (options.force) markFor(storage, player.id);
  else if (markedPlayer(storage) !== player.id) {
    if (options.keepalive) return false;
    if ((await checkCloudCopy()).kind !== "synced") return false;
  }
  return upload(takeSnapshot(storage), player.id, options.keepalive ?? false);
}

export function scheduleCloudCopy() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncCloudCopy(), DELAY_MS);
}

export function restoreCloudCopy(copy: CloudCopy) {
  const { player } = getCompetition();
  const storage = local();
  if (!player || !storage) return false;
  try {
    applySnapshot(copy.snapshot, storage);
  } catch {
    return false;
  }
  markFor(storage, player.id);
  return true;
}

export function keepThisBrowser() {
  return syncCloudCopy({ force: true });
}

export type CodeOutcome = { ok: true; code: string } | { ok: false; error: ApiError | null };

export async function createRecoveryCode(): Promise<CodeOutcome> {
  const response = await apiCall<{ code: string; player: PublicPlayer }>("/api/players/me/recovery", { method: "POST", body: {} });
  if (!response.ok) return { ok: false, error: response.error };
  adoptPlayer(response.data.player);
  await syncCloudCopy();
  return { ok: true, code: response.data.code };
}

export type RecoverOutcome = { ok: true; player: PublicPlayer; next: "done" | "restored" | "ask" } | { ok: false; offline: boolean; error: ApiError | null };

export async function recoverWithCode(code: string): Promise<RecoverOutcome> {
  const response = await apiCall<{ player: PublicPlayer; copy: CloudCopy | null }>("/api/players/recover", { method: "POST", body: { code } });
  if (!response.ok) return { ok: false, offline: response.status === 0 || response.status >= 500, error: response.error };
  const { player, copy } = response.data;
  adoptPlayer(player);
  const storage = local();
  if (!storage) return { ok: true, player, next: "done" };
  const here = takeSnapshot(storage);
  if (copy && hasProgress(copy.snapshot) && !sameSnapshot(copy.snapshot, here)) {
    if (hasProgress(here)) return { ok: true, player, next: "ask" };
    return { ok: true, player, next: restoreCloudCopy(copy) ? "restored" : "done" };
  }
  markFor(storage, player.id);
  void syncCloudCopy();
  return { ok: true, player, next: "done" };
}
