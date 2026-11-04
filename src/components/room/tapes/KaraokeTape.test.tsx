import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KARAOKE_SONG, TRACKS, parseNotes, type Track } from "@/lib/audio/tracks";
import { BroadcastProvider } from "./broadcast";
import { BAR_MS, BEATS, LYRICS, RESULT_AT, SCORE, SCORE_AT, SHOW_MS, SONG_MS, STEP_MS, VERSES, karaokeTape, noteOnsets, syllablesFor } from "./KaraokeTape";

function playFrom(ms: number) {
  const { Screen } = karaokeTape;
  const since = performance.now() - ms;
  const tree = () => (
    <BroadcastProvider value={{ since, take: 0, zoomed: false, replay: () => {} }}>
      <Screen />
    </BroadcastProvider>
  );
  return render(tree());
}

const text = (part: Element | null | undefined) => part?.firstChild?.textContent ?? null;

function sungLine(view: ReturnType<typeof render>) {
  const active = view.container.querySelector("[data-syllable=active]");
  const row = active?.closest("[data-row]");
  const parts = Array.from(row?.querySelectorAll<HTMLElement>("[data-syllable]") ?? []);
  return {
    active: text(active),
    sung: parts.filter((part) => part.dataset.syllable === "sung").map(text),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("karaoke song", () => {
  it("lasts exactly as long as the program says, in every voice", () => {
    const voices: Track["lead"]["notes"][] = [KARAOKE_SONG.lead.notes, KARAOKE_SONG.bass.notes, KARAOKE_SONG.pad!.notes];
    for (const notes of voices) expect(parseNotes(notes).length * STEP_MS).toBe(SONG_MS);
    expect(STEP_MS).toBe(60000 / KARAOKE_SONG.bpm / 4);
    expect(SONG_MS).toBe((VERSES.length + 1) * BAR_MS);
    expect(karaokeTape.song).toEqual({ track: KARAOKE_SONG, length: SONG_MS });
    for (const pattern of [KARAOKE_SONG.drums.kick, KARAOKE_SONG.drums.snare, KARAOKE_SONG.drums.hat]) expect(pattern).toHaveLength(16);
    expect(TRACKS.some((track) => track.id === KARAOKE_SONG.id)).toBe(false);
  });

  it("gives every syllable group its own note, one lyric line per bar", () => {
    VERSES.forEach((verse, line) => {
      expect(noteOnsets(KARAOKE_SONG.lead.notes, line + 1)).toHaveLength(verse.split("|").length);
    });
    expect(LYRICS.map((line) => line.map((s) => `${s.text}${s.gap ? " " : ""}`).join(""))).toEqual([
      "Meu amor é um chuvisco",
      "que aparece às quatro e quatro",
      "eu dei um tapa na antena",
      "e agora eu só pego o gato",
      "Chuviscoooooooo!",
    ]);
  });

  it("times each highlight and ball bounce on the onset of its note", () => {
    LYRICS.forEach((line, i) => {
      const bar = i + 1;
      const onsets = noteOnsets(KARAOKE_SONG.lead.notes, bar);
      expect(line[0].at).toBe(bar * BAR_MS);
      line.forEach((syllable, j) => {
        expect(syllable.at).toBe(onsets[j] * STEP_MS);
        expect(syllable.until).toBe(j + 1 < line.length ? onsets[j + 1] * STEP_MS : (bar + 1) * BAR_MS);
        expect(syllable.until).toBeGreaterThan(syllable.at);
      });
    });
  });

  it("follows the melody when the melody changes", () => {
    const shifted: Track = { ...KARAOKE_SONG, lead: { ...KARAOKE_SONG.lead, notes: `${"C5 ".repeat(16)} . . G4 - C5 - E5 D5 C5 - E5 - G5 - E5 -` } };
    const syllables = syllablesFor(VERSES[0], 1, shifted);
    expect(syllables.map((s) => s.at / STEP_MS - 16)).toEqual([2, 4, 6, 7, 8, 10, 12, 14]);
  });

  it("counts in on the lead's ticks and keeps every beat in order", () => {
    const ticks = noteOnsets(KARAOKE_SONG.lead.notes, 0).slice(-3).map((step) => step * STEP_MS);
    expect(BEATS.filter((beat) => beat.kind === "count").map((beat) => beat.at)).toEqual(ticks);
    BEATS.forEach((beat, i) => expect(beat.at).toBeGreaterThan(i ? BEATS[i - 1].at : -1));
  });
});

describe("karaoke program", () => {
  it("ends on the score card a moment after the song and offers to sing again", () => {
    expect(SCORE_AT).toBe(SONG_MS);
    expect(RESULT_AT).toBeGreaterThan(SCORE_AT);
    expect(karaokeTape.length).toBe(SHOW_MS);
    expect(SHOW_MS).toBeGreaterThan(RESULT_AT);
    expect(SHOW_MS).toBeGreaterThanOrEqual(20000);
    expect(SHOW_MS).toBeLessThanOrEqual(24000);
    expect(karaokeTape.loop).toBeUndefined();
    expect(karaokeTape.rewind).toBe("Cantar de novo");
  });

  it("keeps the room mascot's reactions few and inside the show", () => {
    const cues = karaokeTape.cues ?? [];
    expect(cues.length).toBeLessThanOrEqual(4);
    cues.forEach((cue, i) => {
      expect(cue.at).toBeLessThanOrEqual(SHOW_MS);
      if (i) expect(cue.at).toBeGreaterThan(cues[i - 1].at);
    });
    expect(cues[0]).toMatchObject({ at: LYRICS[0][0].at, mascot: { expression: "excited" } });
    expect(cues.at(-1)?.at).toBe(RESULT_AT);
    expect(cues.at(-1)?.mascot?.line).toBeTruthy();
  });
});

describe("karaoke screen", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  it("counts in over the title before the first line", () => {
    const view = playFrom(BEATS[1].at + 100);
    expect(view.container).toHaveTextContent("Balada do");
    expect(view.container).toHaveTextContent("3");
    expect(view.container.querySelectorAll("[data-syllable=sung]")).toHaveLength(0);
    expect(view.container.querySelector("[data-syllable=active]")).toBeNull();
  });

  it("highlights the syllable being sung after the ones already sung", () => {
    const view = playFrom(LYRICS[2][3].at + 60);
    expect(sungLine(view)).toEqual({ active: "ta", sung: ["eu", "dei", "um"] });
  });

  it("joins mid-song on the same syllable when it remounts", () => {
    const at = LYRICS[1][5].at + 120;
    const first = playFrom(at);
    const before = sungLine(first);
    first.unmount();
    expect(sungLine(playFrom(at))).toEqual(before);
    expect(before.active).toBe("tro e");
  });

  it("moves on syllable by syllable in time with the melody", () => {
    const view = playFrom(LYRICS[3][5].at + 10);
    expect(sungLine(view).active).toBe("go o");
    act(() => vi.advanceTimersByTime(LYRICS[3][6].at - LYRICS[3][5].at));
    expect(sungLine(view).active).toBe("ga");
    act(() => vi.advanceTimersByTime(LYRICS[4][0].at - LYRICS[3][6].at));
    expect(sungLine(view)).toEqual({ active: "Chu", sung: [] });
  });

  it("ends on the score card with the lyrics gone", () => {
    const view = playFrom(RESULT_AT + 300);
    expect(view.container).toHaveTextContent(SCORE);
    expect(view.container).toHaveTextContent("Ninguém pediu bis.");
    expect(view.container.querySelector("[data-row]")).toBeNull();
  });
});
