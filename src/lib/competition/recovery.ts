export const RECOVERY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const RECOVERY_LENGTH = 16;

const LOOKALIKES: Record<string, string> = { O: "0", I: "1", L: "1" };

export function normalizeRecoveryCode(input: string) {
  const code = Array.from(input.toUpperCase().replace(/[\s.\-_]/g, ""), (c) => LOOKALIKES[c] ?? c).join("");
  if (code.length !== RECOVERY_LENGTH) return null;
  for (const c of code) if (!RECOVERY_ALPHABET.includes(c)) return null;
  return code;
}

export function formatRecoveryCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export const SNAPSHOT_MAX_KEYS = 32;
export const SNAPSHOT_MAX_BYTES = 48_000;

export const SYNC_MARK_KEY = "canal404:sync:v1";

export const DEVICE_ONLY_KEYS: readonly string[] = ["canal404:outbox:v1", "canal404:talent-show:calibration:v1", SYNC_MARK_KEY];

const SAVE_KEY = /^canal404:[a-z0-9-]+(?::[a-z0-9-]+)*$/;

export function isSyncableKey(key: string) {
  return key.length <= 64 && SAVE_KEY.test(key) && !key.includes(":backup:") && !DEVICE_ONLY_KEYS.includes(key);
}

export type Snapshot = { version: 1; keys: Record<string, string> };

export type CloudCopy = { savedAt: string; snapshot: Snapshot };
