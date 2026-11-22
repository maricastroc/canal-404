import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Player, PlayerSave } from "@/generated/prisma/client";
import { NICKNAME_PROBLEMS } from "@/lib/competition/nickname";
import { RECOVERY_ALPHABET, RECOVERY_LENGTH, type CloudCopy, type Snapshot } from "@/lib/competition/recovery";
import type { PublicPlayer } from "@/lib/competition/types";
import { isUniqueViolation, type Db } from "./db";
import { HttpError } from "./http";

export const PLAYER_COOKIE = "c404_player";

const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const SEEN_EVERY_MS = 6 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TAG_COUNT = 10_000;
const TAG_DRAWS = 20;
const TAG_SAVE_ATTEMPTS = 3;

export function newToken() {
  return randomBytes(32).toString("base64url");
}

function formatTag(value: number) {
  return String(value).padStart(4, "0");
}

function newTag() {
  return formatTag(randomInt(0, TAG_COUNT));
}

type TagOptions = { player?: string; keep?: string };

async function freeTag(db: Db, nicknameKey: string, { player, keep }: TagOptions) {
  const rows = await db.player.findMany({ where: { nicknameKey, ...(player ? { id: { not: player } } : {}) }, select: { tag: true } });
  const taken = new Set(rows.map((row) => row.tag));
  if (keep && !taken.has(keep)) return keep;
  if (taken.size >= TAG_COUNT) return null;
  for (let draw = 0; draw < TAG_DRAWS; draw += 1) {
    const tag = newTag();
    if (!taken.has(tag)) return tag;
  }
  const free = Array.from({ length: TAG_COUNT }, (_, value) => formatTag(value)).filter((tag) => !taken.has(tag));
  return free[randomInt(0, free.length)];
}

export async function saveWithFreeTag<T>(db: Db, nicknameKey: string, save: (tag: string) => Promise<T>, options: TagOptions = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const tag = await freeTag(db, nicknameKey, options);
    if (!tag) throw new HttpError("bad_nickname", NICKNAME_PROBLEMS.full, { problem: "full" });
    try {
      return await save(tag);
    } catch (error) {
      if (attempt >= TAG_SAVE_ATTEMPTS || !isUniqueViolation(error)) throw error;
    }
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readToken(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== PLAYER_COOKIE) continue;
    const value = part.slice(index + 1).trim();
    return TOKEN_PATTERN.test(value) ? value : null;
  }
  return null;
}

function secureFlag() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function playerCookie(token: string) {
  return `${PLAYER_COOKIE}=${token}; Path=/api; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secureFlag()}`;
}

export function clearedPlayerCookie() {
  return `${PLAYER_COOKIE}=; Path=/api; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag()}`;
}

export function publicPlayer(player: Pick<Player, "id" | "nickname" | "tag" | "createdAt" | "recoveryAt">): PublicPlayer {
  return { id: player.id, nickname: player.nickname, tag: player.tag, createdAt: player.createdAt.toISOString(), recoveryAt: player.recoveryAt?.toISOString() ?? null };
}

export function newRecoveryCode() {
  return Array.from({ length: RECOVERY_LENGTH }, () => RECOVERY_ALPHABET[randomInt(0, RECOVERY_ALPHABET.length)]).join("");
}

export function tokenFromRecoveryCode(code: string) {
  return createHash("sha256").update(`canal404:recovery:${code}`).digest("base64url");
}

export function cloudCopyView(save: Pick<PlayerSave, "data" | "savedAt"> | null): CloudCopy | null {
  return save ? { savedAt: save.savedAt.toISOString(), snapshot: save.data as Snapshot } : null;
}

export async function currentPlayer(db: Db, request: Request, now = new Date()) {
  const token = readToken(request);
  if (!token) return null;
  const player = await db.player.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!player || player.status === "banned") return null;
  if (now.getTime() - player.lastSeenAt.getTime() > SEEN_EVERY_MS) {
    await db.player.update({ where: { id: player.id }, data: { lastSeenAt: now } }).catch(() => undefined);
  }
  return player;
}
