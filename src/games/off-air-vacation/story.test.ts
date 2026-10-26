import { describe, expect, it } from "vitest";
import type { AreaId } from "./config";
import { ALL_POSTERS, freshState, type FolkKey, type Item, type State } from "./save";
import { FOUND_TEXT, ITEM_INFO, POSTER_SCRIPT, SCRIPTS, SPEAKERS, TOTALS, hasMain, mainObjective, score, sideQuests, type Director } from "./story";

type Log = { said: string[]; actions: string[]; gotos: [AreaId, string][]; discovered: string[]; speakers: string[] };

function director(s: State, answers: Record<string, number> = {}) {
  const log: Log = { said: [], actions: [], gotos: [], discovered: [], speakers: [] };
  const d: Director = {
    s,
    say: async (who, text) => {
      log.speakers.push(who);
      log.said.push(text);
    },
    ask: async (who, text, options) => {
      log.speakers.push(who);
      const pick = answers[text] ?? 0;
      expect(pick).toBeLessThan(options.length);
      return pick;
    },
    has: (item) => s.items.includes(item),
    give: async (item) => {
      if (!s.items.includes(item)) s.items.push(item);
    },
    take: (item) => {
      s.items = s.items.filter((x) => x !== item);
    },
    flag: (name) => Boolean(s.flags[name]),
    set: (name) => {
      s.flags[name] = true;
    },
    poster: async (id) => {
      if (!s.posters.includes(id)) s.posters.push(id);
    },
    token: async (id) => {
      if (!s.tokens.includes(id)) s.tokens.push(id);
      s.flags.tokensHint = true;
    },
    secret: async (id) => {
      if (!s.secrets.includes(id)) s.secrets.push(id);
    },
    meet: (id) => {
      if (!s.met.includes(id)) s.met.push(id);
    },
    discover: (id) => {
      if (!s.found.includes(id)) s.found.push(id);
      log.discovered.push(id);
    },
    objective: () => undefined,
    sfx: () => undefined,
    wait: async () => undefined,
    act: () => undefined,
    mood: () => undefined,
    action: async (name) => {
      log.actions.push(name);
    },
    goto: (area, spawn) => {
      log.gotos.push([area, spawn]);
    },
  };
  return { d, log };
}

async function play(s: State, ids: string[], answers: Record<string, number> = {}) {
  const { d, log } = director(s, answers);
  for (const id of ids) await SCRIPTS[id](d);
  return log;
}

const MAIN_QUEST: { script: string; objective: string | null }[] = [
  { script: "intro", objective: "lobby" },
  { script: "bigodes", objective: "pool" },
  { script: "marola", objective: "pool" },
  { script: "flamingo", objective: "pool" },
  { script: "net", objective: "pool" },
  { script: "flamingo", objective: "pool" },
  { script: "marola", objective: "arcade" },
  { script: "tilt", objective: "beach" },
  { script: "marisa", objective: "beach" },
  { script: "shore", objective: "beach" },
  { script: "bottle", objective: "forest" },
  { script: "psiu", objective: "forest" },
  { script: "fall", objective: "station" },
  { script: "stationDoor", objective: "station" },
];

async function finishMainQuest(ending: 0 | 1) {
  const s = freshState();
  const areas: (AreaId | null)[] = [];
  const log = await play(s, []);
  for (const step of MAIN_QUEST) {
    const stepLog = await play(s, [step.script]);
    log.actions.push(...stepLog.actions);
    log.gotos.push(...stepLog.gotos);
    log.discovered.push(...stepLog.discovered);
    areas.push(mainObjective(s).area);
  }
  const end = await play(s, ["console"], { "O que você faz?": ending });
  log.actions.push(...end.actions);
  return { s, areas, log };
}

describe("Férias Fora do Ar story", () => {
  it("starts by sending the player to the receptionist", () => {
    expect(mainObjective(freshState())).toEqual({ text: "Fale com o recepcionista.", area: "lobby", done: false });
  });

  it("guides the player through the whole main quest in order", async () => {
    const { areas } = await finishMainQuest(0);
    expect(areas).toEqual(MAIN_QUEST.map((step) => step.objective));
  });

  it("hands over and takes back the quest items along the way", async () => {
    const s = freshState();
    await play(s, ["bigodes", "marola", "flamingo", "net"]);
    expect(s.items).toEqual(["net"]);
    await play(s, ["flamingo"]);
    expect(s.items).toEqual(["whistle"]);
    await play(s, ["marola"]);
    expect(s.items).toEqual([]);
    expect(s.flags.whistleReturned).toBe(true);
    await play(s, ["tilt"]);
    expect(s.items).toEqual(["remote"]);
    await play(s, ["shore", "bottle"]);
    expect(s.items).toEqual(["remote", "order"]);
  });

  it("lets the player turn the broadcast off", async () => {
    const { s, log } = await finishMainQuest(0);
    expect(s.ending).toBe("off");
    expect(s.flags.ended).toBe(true);
    expect(s.items).not.toContain("order");
    expect(log.actions).toContain("endOff");
    expect(log.actions.at(-1)).toBe("party");
    expect(mainObjective(s)).toMatchObject({ area: null, done: true });
  });

  it("lets the player keep the broadcast on", async () => {
    const { s, log } = await finishMainQuest(1);
    expect(s.ending).toBe("on");
    expect(log.actions).toContain("endOn");
    expect(log.actions).not.toContain("endOff");
  });

  it("does not let the player skip ahead", async () => {
    const s = freshState();
    await play(s, ["shore", "fall", "console", "tilt"], { "Você joga por mim? Por favorzinho?": 1 });
    expect(s.items).toEqual([]);
    expect(s.flags.seaPaused).toBeUndefined();
    expect(s.flags.fallPaused).toBeUndefined();
    expect(s.flags.ended).toBeUndefined();
    expect(s.flags.tiltWon).toBeUndefined();
  });

  it("does not hand out the remote when the player says no to Tilt", async () => {
    const s = freshState();
    await play(s, ["bigodes", "marola", "flamingo", "net", "flamingo", "marola"]);
    await play(s, ["tilt"], { "Você joga por mim? Por favorzinho?": 1 });
    expect(s.flags.metTilt).toBe(true);
    expect(s.items).not.toContain("remote");
    expect(mainObjective(s)).toEqual({ text: "Ajude o Tilt a passar da fase 404.", area: "arcade", done: false });
  });

  it("only uses known speakers, items and discoveries", async () => {
    const { s, log } = await finishMainQuest(0);
    for (const who of log.speakers) expect(SPEAKERS[who as keyof typeof SPEAKERS], who).toBeTruthy();
    for (const id of log.discovered) expect(FOUND_TEXT[id], id).toBeTruthy();
    for (const item of ["net", "whistle", "remote", "order", "key", "cartridge"] as Item[]) expect(ITEM_INFO[item]).toBeTruthy();
    expect(s.found.length).toBeGreaterThan(0);
  });

  it("runs every script safely at the start, middle and end of the story", async () => {
    const start = freshState();
    const middle = freshState();
    await play(middle, ["bigodes", "marola", "flamingo", "net", "flamingo", "marola", "tilt"]);
    const { s: end } = await finishMainQuest(0);
    for (const base of [start, middle, end]) {
      for (const id of Object.keys(SCRIPTS)) {
        const s = structuredClone(base);
        const log = await play(s, [id]);
        for (const who of log.speakers) expect(SPEAKERS[who as keyof typeof SPEAKERS], `${id}: ${who}`).toBeTruthy();
        for (const found of log.discovered) expect(FOUND_TEXT[found], `${id}: ${found}`).toBeTruthy();
      }
    }
  });
});

describe("Férias Fora do Ar side content", () => {
  it("collects the five posters once each", async () => {
    const s = freshState();
    const { d } = director(s);
    for (const id of [...ALL_POSTERS, ...ALL_POSTERS]) await POSTER_SCRIPT(id)(d);
    expect(s.posters).toEqual(ALL_POSTERS);
    expect(sideQuests(s)[0]).toEqual({ text: `Pôsteres perdidos do Canal 404 (5/${TOTALS.posters})`, done: true });
  });

  it("wakes the golden machine only with three tokens", async () => {
    const s = freshState();
    await play(s, ["goldMachine"]);
    expect(s.secrets).toEqual([]);
    expect(s.flags.tokensHint).toBe(true);
    s.tokens = ["lounge", "shell", "log"];
    await play(s, ["goldMachine"]);
    expect(s.secrets).toEqual(["machine"]);
  });

  it("opens room 404 with Seu Lento's key", async () => {
    const s = freshState();
    const locked = await play(s, ["door404"]);
    expect(locked.gotos).toEqual([]);
    await play(s, ["lento"]);
    expect(s.items).toContain("key");
    const open = await play(s, ["door404"]);
    expect(open.gotos).toEqual([["room404", "door"]]);
    await play(s, ["mascot", "cartridge"]);
    expect(s.secrets).toEqual(["room404"]);
  });

  it("gives Seu Lento's key and secret after the ending", async () => {
    const { s } = await finishMainQuest(0);
    expect(hasMain(s, "lento")).toBe("!");
    await play(s, ["lento"]);
    expect(s.items).toContain("key");
    expect(s.secrets).toContain("lento");
    expect(hasMain(s, "lento")).toBeNull();
  });

  it("lists side quests as they become known", () => {
    const s = freshState();
    expect(sideQuests(s)).toHaveLength(1);
    s.flags.tokensHint = true;
    s.flags.gotKey = true;
    expect(sideQuests(s).map((q) => q.text)).toEqual(["Pôsteres perdidos do Canal 404 (0/5)", "Fichas douradas (0/3)", "Abrir o quarto 404"]);
    s.flags.ended = true;
    expect(sideQuests(s).at(-1)).toEqual({ text: "Será que o Seu Lento chegou?", done: false });
  });

  it("counts collectibles for the score", () => {
    const s = freshState();
    s.posters = ["club", "surf"];
    s.tokens = ["shell"];
    s.secrets = ["room404", "lento"];
    expect(score(s)).toEqual({ posters: 2, tokens: 1, secrets: 2 });
  });
});

describe("quest markers", () => {
  const marker = (s: State, who: FolkKey) => hasMain(s, who);

  it("marks the receptionist first and the lifeguard after", () => {
    const s = freshState();
    expect(marker(s, "bigodes")).toBe("!");
    expect(marker(s, "marola")).toBeNull();
    s.flags.talkedBigodes = true;
    expect(marker(s, "bigodes")).toBeNull();
    expect(marker(s, "marola")).toBe("!");
  });

  it("marks the lifeguard again while the player carries the whistle", () => {
    const s = freshState();
    s.flags.talkedBigodes = true;
    s.flags.metMarola = true;
    expect(marker(s, "marola")).toBeNull();
    s.items = ["whistle"];
    expect(marker(s, "marola")).toBe("!");
  });

  it("marks Tilt until the arcade level is beaten", () => {
    const s = freshState();
    expect(marker(s, "tilt")).toBeNull();
    s.flags.whistleReturned = true;
    expect(marker(s, "tilt")).toBe("!");
    s.flags.tiltWon = true;
    expect(marker(s, "tilt")).toBeNull();
  });

  it("only keeps Seu Lento marked after the ending", () => {
    const s = freshState();
    s.flags.ended = true;
    expect(marker(s, "bigodes")).toBeNull();
    expect(marker(s, "psiu")).toBeNull();
    expect(marker(s, "lento")).toBe("!");
  });
});
