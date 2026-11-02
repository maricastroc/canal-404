import { describe, expect, it } from "vitest";
import { backupRaw, listBackups, migrate, readVersioned, type MigrationSpec } from "./migrate";

type Doc = { version: number; name: string; count: number };

const SPEC: MigrationSpec<Doc> = {
  version: 3,
  unversioned: 1,
  migrations: {
    1: (v) => ({ ...v, name: String(v.title ?? "sem nome") }),
    2: (v) => ({ ...v, count: Number(v.total ?? 0) }),
  },
  normalize: (v) => (typeof v.name === "string" ? { version: 3, name: v.name, count: Number(v.count) || 0 } : null),
};

const KEY = "canal404:test:v1";

describe("migrate", () => {
  it("accepts a document already at the current version", () => {
    expect(migrate({ version: 3, name: "a", count: 2 }, SPEC)).toEqual({ ok: true, value: { version: 3, name: "a", count: 2 }, migrated: false, from: 3 });
  });

  it("runs every migration step in order", () => {
    expect(migrate({ version: 1, title: "velho", total: 5 }, SPEC)).toEqual({ ok: true, value: { version: 3, name: "velho", count: 5 }, migrated: true, from: 1 });
  });

  it("treats a document without a version as the unversioned version", () => {
    expect(migrate({ title: "x" }, SPEC)).toMatchObject({ ok: true, migrated: true, from: 1 });
  });

  it("refuses documents from the future, with a bad version or the wrong shape", () => {
    expect(migrate({ version: 4, name: "a" }, SPEC)).toEqual({ ok: false });
    expect(migrate({ version: "3", name: "a" }, SPEC)).toEqual({ ok: false });
    expect(migrate([1, 2], SPEC)).toEqual({ ok: false });
    expect(migrate({ version: 3, name: 7 }, SPEC)).toEqual({ ok: false });
  });

  it("refuses a gap in the migration chain and a migration that throws", () => {
    expect(migrate({ version: 0 }, SPEC)).toEqual({ ok: false });
    const broken: MigrationSpec<Doc> = { ...SPEC, migrations: { 2: () => { throw new Error("x"); } } };
    expect(migrate({ version: 2, name: "a" }, broken)).toEqual({ ok: false });
  });
});

describe("readVersioned", () => {
  it("reports an empty slot", () => {
    expect(readVersioned(KEY, SPEC, window.localStorage)).toEqual({ status: "empty" });
  });

  it("backs up and rewrites a migrated document", () => {
    const raw = JSON.stringify({ version: 2, name: "a", total: 9 });
    window.localStorage.setItem(KEY, raw);
    expect(readVersioned(KEY, SPEC, window.localStorage)).toEqual({ status: "ok", value: { version: 3, name: "a", count: 9 }, migrated: true });
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual({ version: 3, name: "a", count: 9 });
    const backups = listBackups(KEY, window.localStorage);
    expect(backups).toHaveLength(1);
    expect(backups[0]).toMatch(/^canal404:test:v1:backup:v2:\d+$/);
    expect(window.localStorage.getItem(backups[0])).toBe(raw);
  });

  it("backs up an unreadable document and leaves the slot untouched", () => {
    window.localStorage.setItem(KEY, "{oops");
    expect(readVersioned(KEY, SPEC, window.localStorage)).toEqual({ status: "invalid" });
    expect(window.localStorage.getItem(KEY)).toBe("{oops");
    const [backup] = listBackups(KEY, window.localStorage);
    expect(backup).toMatch(/:backup:unreadable:\d+$/);
    expect(window.localStorage.getItem(backup)).toBe("{oops");
  });

  it("labels a document from the future with its version", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 9, name: "novo" }));
    expect(readVersioned(KEY, SPEC, window.localStorage)).toEqual({ status: "invalid" });
    expect(listBackups(KEY, window.localStorage)[0]).toMatch(/:backup:v9:/);
  });

  it("does not duplicate a backup and keeps only the latest two", async () => {
    const storage = window.localStorage;
    backupRaw(KEY, "a", "v1", storage);
    backupRaw(KEY, "a", "v1", storage);
    expect(listBackups(KEY, storage)).toHaveLength(1);
    for (const raw of ["b", "c", "d"]) {
      await new Promise((r) => setTimeout(r, 2));
      backupRaw(KEY, raw, "v1", storage);
    }
    expect(listBackups(KEY, storage).map((k) => storage.getItem(k))).toEqual(["c", "d"]);
  });
});
