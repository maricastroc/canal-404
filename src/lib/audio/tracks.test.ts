import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/lib/progress/definitions";
import { DEFAULT_STATE, type ProgressState } from "@/lib/progress/store";
import { TRACKS, midiToFreq, parseNotes, trackById } from "./tracks";
import { isTrackUnlocked, unlockedTracks } from "./unlocks";

describe("parseNotes", () => {
  it("turns note names into MIDI numbers", () => {
    expect(parseNotes("C4 A4 C#5 B-1")).toEqual([
      { midi: 60, steps: 1 },
      { midi: 69, steps: 1 },
      { midi: 73, steps: 1 },
      { midi: 11, steps: 1 },
    ]);
  });

  it("extends the previous note with dashes", () => {
    expect(parseNotes("E5 - - G5")).toEqual([{ midi: 76, steps: 3 }, null, null, { midi: 79, steps: 1 }]);
  });

  it("treats dots as rests that stop a hold", () => {
    expect(parseNotes("C4 . - D4")).toEqual([{ midi: 60, steps: 1 }, null, null, { midi: 62, steps: 1 }]);
  });

  it("skips unknown tokens without extending anything", () => {
    expect(parseNotes("C4 H2 -")).toEqual([{ midi: 60, steps: 1 }, null, null]);
  });

  it("ignores extra whitespace", () => {
    expect(parseNotes("  C4\n\n -  ")).toEqual([{ midi: 60, steps: 2 }, null]);
  });
});

describe("midiToFreq", () => {
  it("tunes A4 to 440 Hz and doubles every octave", () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
    expect(midiToFreq(60)).toBeCloseTo(261.63, 2);
  });
});

describe("tracks", () => {
  it("have unique ids", () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only use valid notes", () => {
    for (const track of TRACKS) {
      for (const part of [track.lead, track.bass, track.pad].filter(Boolean)) {
        const tokens = part!.notes.split(/\s+/).filter(Boolean);
        const parsed = parseNotes(part!.notes);
        tokens.forEach((token, i) => {
          if (token !== "-" && token !== ".") expect(parsed[i], `${track.id}: ${token}`).not.toBeNull();
        });
      }
    }
  });

  it("use 16-step drum patterns", () => {
    for (const track of TRACKS) {
      for (const pattern of [track.drums.kick, track.drums.snare, track.drums.hat]) expect(pattern, track.id).toMatch(/^[x.]{16}$/);
    }
  });

  it("unlock with achievements that exist", () => {
    const known = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const track of TRACKS) if (track.unlock.type === "achievement") expect(known.has(track.unlock.id as never), track.id).toBe(true);
  });

  it("fall back to the theme for an unknown id", () => {
    expect(trackById("missing")).toBe(TRACKS[0]);
    expect(trackById(TRACKS[1].id)).toBe(TRACKS[1]);
  });
});

describe("track unlocks", () => {
  const progress = (patch: Partial<ProgressState>): ProgressState => ({ ...DEFAULT_STATE, ...patch });
  const byRule = (type: string) => TRACKS.find((t) => t.unlock.type === type)!;

  it("unlocks default tracks for everyone", () => {
    expect(isTrackUnlocked(byRule("default"), DEFAULT_STATE)).toBe(true);
  });

  it("unlocks achievement tracks after the achievement", () => {
    const track = byRule("achievement");
    const id = track.unlock.type === "achievement" ? track.unlock.id : "";
    expect(isTrackUnlocked(track, DEFAULT_STATE)).toBe(false);
    expect(isTrackUnlocked(track, progress({ achievements: { [id]: 1 } }))).toBe(true);
  });

  it("unlocks secret tracks after enough secrets", () => {
    const track = byRule("secrets");
    const count = track.unlock.type === "secrets" ? track.unlock.count : 0;
    const secrets = (n: number) => Object.fromEntries(["cat", "pizza", "plane", "tape", "poke", "blackout"].slice(0, n).map((s) => [s, 1]));
    expect(isTrackUnlocked(track, progress({ secrets: secrets(count - 1) }))).toBe(false);
    expect(isTrackUnlocked(track, progress({ secrets: secrets(count) }))).toBe(true);
  });

  it("lists only the default tracks for a new visitor", () => {
    expect(unlockedTracks(DEFAULT_STATE).map((t) => t.id)).toEqual(TRACKS.filter((t) => t.unlock.type === "default").map((t) => t.id));
  });
});
