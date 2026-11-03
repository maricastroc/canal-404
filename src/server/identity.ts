import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Player } from "@/generated/prisma/client";
import type { PublicPlayer } from "@/lib/competition/types";
import type { Db } from "./db";

export const PLAYER_COOKIE = "c404_player";

const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const SEEN_EVERY_MS = 6 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function newTag() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
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

export function publicPlayer(player: Pick<Player, "id" | "nickname" | "tag" | "createdAt">): PublicPlayer {
  return { id: player.id, nickname: player.nickname, tag: player.tag, createdAt: player.createdAt.toISOString() };
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
