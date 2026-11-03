import { createHmac } from "node:crypto";

export type ErrorCode =
  | "unconfigured"
  | "unavailable"
  | "bad_origin"
  | "bad_request"
  | "too_large"
  | "bad_nickname"
  | "bad_ticket"
  | "expired_ticket"
  | "not_joined"
  | "wrong_player"
  | "rate_limited"
  | "rejected"
  | "conflict"
  | "not_found"
  | "unauthorized";

const STATUS: Record<ErrorCode, number> = {
  unconfigured: 503,
  unavailable: 503,
  bad_origin: 403,
  bad_request: 400,
  too_large: 413,
  bad_nickname: 422,
  bad_ticket: 400,
  expired_ticket: 410,
  not_joined: 401,
  wrong_player: 403,
  rate_limited: 429,
  rejected: 422,
  conflict: 409,
  not_found: 404,
  unauthorized: 401,
};

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return Response.json(data, { status: init.status ?? 200, headers: { ...NO_STORE, ...init.headers } });
}

export function fail(code: ErrorCode, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return json({ error: { code, message, ...extra } }, { status: STATUS[code], headers });
}

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly extra: Record<string, unknown> = {},
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
  }

  toResponse() {
    return fail(this.code, this.message, this.extra, this.headers);
  }
}

export function sameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function assertWritable(request: Request) {
  if (!sameOrigin(request)) throw new HttpError("bad_origin", "Pedido de outro site.");
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new HttpError("bad_request", "Envie JSON.");
}

export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new HttpError("too_large", "Pedido grande demais.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new HttpError("too_large", "Pedido grande demais.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError("bad_request", "JSON inválido.");
  }
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "local";
}

export function addressKey(request: Request, secret: string) {
  return createHmac("sha256", secret).update(`address:${clientAddress(request)}`).digest("hex").slice(0, 32);
}
