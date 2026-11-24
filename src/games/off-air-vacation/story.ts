import type { AreaId } from "./config";
import { ALL_POSTERS, ALL_SECRETS, ALL_TOKENS, type FolkKey, type Item, type PosterId, type SecretId, type State, type TokenId } from "./save";
import type { ResortSfx } from "./sounds";
import type { VacationText } from "./text/pt-BR";

export type Speaker = FolkKey | "deco" | "narrator";
export type Mood = "normal" | "talk" | "look" | "happy" | "sad" | "surprised";

export const SPEAKERS: Record<Speaker, { voice: ResortSfx | null; pitch: number }> = {
  deco: { voice: "blip", pitch: 1.15 },
  bigodes: { voice: "blip", pitch: 0.62 },
  marola: { voice: "blip", pitch: 0.85 },
  tilt: { voice: "arcadeBeep", pitch: 1 },
  marisa: { voice: "blipSoft", pitch: 1.2 },
  psiu: { voice: "blipSoft", pitch: 1.7 },
  lento: { voice: "blip", pitch: 0.5 },
  mascot: { voice: "blipSoft", pitch: 1 },
  capi: { voice: "blip", pitch: 0.75 },
  clique: { voice: "blipSoft", pitch: 1.4 },
  cavuca: { voice: "blip", pitch: 0.95 },
  chiado: { voice: "arcadeBeep", pitch: 1.7 },
  placar: { voice: "blip", pitch: 1.05 },
  narrator: { voice: null, pitch: 1 },
};

export const ITEM_ICON: Record<Item, string> = {
  net: "item-net",
  whistle: "item-whistle",
  remote: "item-remote",
  order: "item-order",
  key: "item-key",
  cartridge: "item-cartridge",
};

export const POSTER_AREA: Record<PosterId, AreaId> = {
  club: "lobby",
  summer: "pool",
  tilt: "arcade",
  surf: "beach",
  ghost: "forest",
};

export const spotLabel = (t: VacationText, id: string): string | undefined => (t.spots as Record<string, string | undefined>)[id];

export const foundText = (t: VacationText, id: string): string | undefined => (t.found as Record<string, string | undefined>)[id];

export type Director = {
  s: State;
  text: VacationText;
  say(who: Speaker, text: string, mood?: Mood): Promise<void>;
  ask(who: Speaker, text: string, options: string[], mood?: Mood): Promise<number>;
  has(item: Item): boolean;
  give(item: Item): Promise<void>;
  take(item: Item): void;
  flag(name: string): boolean;
  set(name: string): void;
  poster(id: PosterId): Promise<void>;
  token(id: TokenId): Promise<void>;
  secret(id: SecretId): Promise<void>;
  meet(id: FolkKey): void;
  discover(id: string): void;
  objective(): void;
  sfx(name: ResortSfx, volume?: number): void;
  wait(ms: number): Promise<void>;
  act(): void;
  mood(who: FolkKey, mood: Mood): void;
  action(name: string): Promise<void>;
  goto(area: AreaId, spawn: string): void;
};

export type MainStep = { text: string; area: AreaId | null; done: boolean };

export function mainObjective(s: State, t: VacationText): MainStep {
  const f = s.flags;
  const o = t.objectives;
  const has = (i: Item) => s.items.includes(i);
  if (f.ended) return { text: o.ended, area: null, done: true };
  if (!f.talkedBigodes && !f.metMarola && !f.whistleReturned) return { text: o.reception, area: "lobby", done: false };
  if (!f.whistleReturned) {
    if (has("whistle")) return { text: o.returnWhistle, area: "pool", done: false };
    if (!f.metMarola) return { text: o.findLifeguard, area: "pool", done: false };
    if (has("net")) return { text: o.useNet, area: "pool", done: false };
    if (f.sawFlamingo) return { text: o.findLong, area: "pool", done: false };
    return { text: o.findWhistle, area: "pool", done: false };
  }
  if (!has("remote") && !f.tiltWon) return { text: f.metTilt ? o.helpTilt : o.askTilt, area: "arcade", done: false };
  if (!f.gotOrder) return { text: f.metMarisa ? o.pauseSea : o.takeRemote, area: "beach", done: false };
  if (!f.fallPaused) return { text: f.psiuRiddle ? o.pauseFall : o.findStation, area: "forest", done: false };
  return { text: o.deliver, area: "station", done: false };
}

export function sideQuests(s: State, t: VacationText) {
  const out: { text: string; done: boolean }[] = [];
  out.push({ text: t.side.posters(s.posters.length, ALL_POSTERS.length), done: s.posters.length === ALL_POSTERS.length });
  if (s.tokens.length || s.flags.tokensHint) out.push({ text: t.side.tokens(s.tokens.length, ALL_TOKENS.length), done: s.secrets.includes("machine") });
  if (s.flags.gotKey) out.push({ text: t.side.room, done: s.secrets.includes("room404") });
  if (s.flags.ended && !s.secrets.includes("lento")) out.push({ text: t.side.lento, done: false });
  return out;
}

export function score(s: State) {
  const posters = s.posters.length;
  const tokens = s.tokens.length;
  const secrets = s.secrets.filter((x) => ALL_SECRETS.includes(x)).length;
  return { posters, tokens, secrets };
}

const repeatLine = (s: State, key: string, lines: string[]) => {
  const n = Object.keys(s.flags).filter((k) => k.startsWith(`n_${key}_`)).length;
  return lines[n % lines.length];
};

async function bump(d: Director, key: string) {
  const n = Object.keys(d.s.flags).filter((k) => k.startsWith(`n_${key}_`)).length;
  d.set(`n_${key}_${n}`);
}

export const SCRIPTS: Record<string, (d: Director) => Promise<void>> = {
  intro: async (d) => {
    const L = d.text.lines.intro;
    await d.say("narrator", L.arrive);
    await d.say("deco", L.wow, "surprised");
    await d.say("deco", L.where);
    d.objective();
  },

  bigodes: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.bigodes;
    d.meet("bigodes");
    if (!f.talkedBigodes) {
      if (!f.greeted) {
        d.set("greeted");
        await d.say("bigodes", L.welcome);
        await d.say("deco", L.never, "surprised");
        await d.say("bigodes", L.figure, "talk");
      } else {
        await d.say("bigodes", L.again);
      }
      for (;;) {
        const pick = await d.ask("bigodes", L.ask, L.options);
        if (pick === 0) {
          await d.say("bigodes", L.nothing, "talk");
          await d.say("deco", L.notNormal);
          await d.say("bigodes", L.system, "look");
          await d.say("bigodes", L.remote, "talk");
          await d.say("bigodes", L.lastSeen, "normal");
          d.set("talkedBigodes");
          d.discover("tv");
          d.objective();
          return;
        }
        if (pick === 1) {
          await d.say("bigodes", L.residents, "talk");
          await d.say("bigodes", L.forest, "look");
          continue;
        }
        await d.say("bigodes", L.bye);
        return;
      }
    }
    if (f.ended) {
      if (d.s.ending === "off") await d.say("bigodes", L.endedOff, "happy");
      else await d.say("bigodes", L.endedOn, "happy");
      return;
    }
    if (d.has("order")) {
      await d.say("bigodes", L.order, "surprised");
      await d.say("bigodes", L.sawNothing, "look");
      return;
    }
    if (d.has("remote")) {
      await d.say("bigodes", L.remoteFeelings, "surprised");
      await d.say("bigodes", L.gull, "talk");
      return;
    }
    if (f.whistleReturned) {
      await d.say("bigodes", L.tilt, "talk");
      await d.say("bigodes", L.arcade);
      return;
    }
    await d.say("bigodes", L.pool, "talk");
  },

  bell: async (d) => {
    d.sfx("bell", 0.9);
    d.act();
    await d.action("bellRing");
    const n = Object.keys(d.s.flags).filter((k) => k.startsWith("n_bell_")).length;
    await bump(d, "bell");
    d.mood("bigodes", "look");
    await d.say("bigodes", d.text.lines.bell[n % 4], "look");
  },

  clock: async (d) => {
    await d.say("narrator", d.text.lines.clock);
    d.discover("clock");
  },

  tvLobby: async (d) => {
    const L = d.text.lines.tvLobby;
    if (d.s.flags.ended && d.s.ending === "on") return d.say("narrator", L.live);
    await d.action("tvFragment");
    const n = Object.keys(d.s.flags).filter((k) => k.startsWith("n_tvLobby_")).length;
    await d.say("narrator", L.clips[n % 4]);
    await bump(d, "tvLobby");
    if (d.has("remote") && n % 2 === 1) await d.say("deco", L.remote);
    d.discover("tv");
  },

  elevator: async (d) => {
    const L = d.text.lines.elevator;
    if (d.s.flags.ended) return d.say("narrator", L.ended);
    await d.say("narrator", L.broken);
  },

  suitcases: async (d) => {
    const L = d.text.lines.suitcases;
    await d.action("suitcaseWiggle");
    if (d.s.flags.n_cases_0) {
      await d.say("narrator", repeatLine(d.s, "cases2", L.more));
      await bump(d, "cases2");
      return;
    }
    d.set("n_cases_0");
    await d.say("narrator", L.tags);
    await d.say("deco", L.street, "happy");
  },
  guestbook: async (d) => {
    const s = d.s;
    const L = d.text.lines.guestbook;
    const rows = [L.marola, L.marisa];
    rows.push(s.flags.gotKey ? L.lentoKey : L.lentoWay);
    rows.push(s.secrets.includes("room404") ? L.room404 : L.room404Blur);
    await d.say("narrator", L.intro);
    for (const r of rows) await d.say("narrator", r);
    if (s.flags.ended) await d.say("narrator", L.deco);
    else if (!s.flags.n_guestbook_0) {
      d.set("n_guestbook_0");
      d.mood("bigodes", "look");
      await d.say("bigodes", L.bigodes, "look");
    }
  },

  frameSunset: async (d) => {
    d.act();
    await d.action("frameStraighten");
    await d.say("narrator", d.text.lines.frameSunset);
  },

  frameTv: async (d) => {
    await d.action("frameFlicker");
    await d.say("narrator", d.text.lines.frameTv);
  },

  sofa: async (d) => {
    await d.say("narrator", d.text.lines.sofa);
  },

  door404: async (d) => {
    const L = d.text.lines.door404;
    if (d.has("key")) {
      d.act();
      d.sfx("door", 0.8);
      await d.say("narrator", L.open);
      d.goto("room404", "door");
      return;
    }
    await d.say("narrator", L.locked);
    d.mood("bigodes", "look");
    await d.say("bigodes", L.bigodes, "look");
  },

  marola: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.marola;
    d.meet("marola");
    if (f.ended) {
      await d.say("marola", L.ended, "happy");
      return;
    }
    if (f.whistleReturned) {
      await d.say("marola", repeatLine(d.s, "marola", L.after), "talk");
      await bump(d, "marola");
      return;
    }
    if (d.has("whistle")) {
      await d.say("deco", L.found, "happy");
      d.take("whistle");
      d.set("whistleReturned");
      d.mood("marola", "happy");
      await d.action("marolaBlow");
      await d.say("marola", L.restored, "talk");
      if (f.talkedBigodes) {
        await d.say("deco", L.bigodesSaid);
        await d.say("marola", L.borrowed, "talk");
      } else {
        await d.say("marola", L.askAround, "talk");
      }
      await d.say("marola", L.arcade, "normal");
      d.objective();
      return;
    }
    if (!f.metMarola) {
      d.set("metMarola");
      await d.say("marola", L.halt, "sad");
      if (f.talkedBigodes) await d.say("deco", L.bigodesSaidShort);
      await d.say("marola", L.noWhistle, "talk");
      await d.say("marola", L.lost, "sad");
      await d.say("deco", L.help);
      d.objective();
      return;
    }
    if (f.sawFlamingo) await d.say("marola", L.flamingo, "look");
    else await d.say("marola", L.keepLooking, "look");
  },

  flamingo: async (d) => {
    const L = d.text.lines.flamingo;
    if (d.s.flags.gotWhistle) {
      await d.action("flamingoLook");
      await d.say("narrator", repeatLine(d.s, "flamingo", L.after));
      await bump(d, "flamingo");
      return;
    }
    if (d.has("net")) {
      d.act();
      await d.action("fishFlamingo");
      d.set("gotWhistle");
      await d.give("whistle");
      await d.say("narrator", L.netBack);
      d.take("net");
      d.objective();
      return;
    }
    d.set("sawFlamingo");
    await d.action("flamingoLook");
    await d.say("narrator", L.first);
    await d.say("deco", L.far);
    d.objective();
  },

  net: async (d) => {
    d.act();
    await d.give("net");
    await d.say("deco", d.text.lines.net, "happy");
    d.objective();
  },

  loungeToken: async (d) => {
    const L = d.text.lines.loungeToken;
    if (d.s.tokens.includes("lounge")) return d.say("narrator", L.empty);
    d.act();
    await d.say("narrator", L.found);
    await d.token("lounge");
  },

  capi: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.capi;
    d.meet("capi");
    if (f.ended) {
      await d.say("capi", d.s.ending === "off" ? L.endedOff : L.endedOn, "happy");
      return;
    }
    if (!f.metCapi) {
      d.set("metCapi");
      await d.say("capi", L.hello, "happy");
      await d.say("capi", L.twenty, "talk");
    }
    const pick = await d.ask("capi", L.ask, L.options);
    if (pick === 0) {
      await d.action("capiShake");
      if (!f.juiceDrunk) {
        d.set("juiceDrunk");
        await d.say("capi", L.mango, "happy");
        d.act();
        await d.action("rewind");
        await d.say("deco", L.rerun, "surprised");
      } else await d.say("capi", L.again, "happy");
      return;
    }
    if (pick === 1) {
      const line = !f.whistleReturned ? L.gossipWhistle : !f.tiltWon && !d.has("remote") ? L.gossipTilt : !f.gotOrder ? L.gossipSea : !f.fallPaused ? L.gossipFall : L.gossipScreens;
      await d.say("capi", line, "talk");
      return;
    }
    await d.say("capi", L.here);
  },
  juiceMenu: async (d) => d.say("narrator", d.text.lines.juiceMenu),
  poolSign: async (d) => {
    await d.say("narrator", d.text.lines.poolSign);
    await d.action("marolaBark");
  },
  towel: async (d) => {
    await d.action("towelSwan");
    await d.say("narrator", d.text.lines.towel);
  },
  enterHotel: async (d) => {
    d.sfx("door", 0.8);
    d.goto("lobby", "door");
  },
  enterArcade: async (d) => {
    d.sfx("door", 0.8);
    d.goto("arcade", "door");
  },

  signpost: async (d) => {
    await d.say("narrator", d.text.lines.signpost);
  },

  duck: async (d) => {
    await d.action("duckSqueak");
    await d.say("narrator", repeatLine(d.s, "duck", d.text.lines.duck));
    await bump(d, "duck");
  },

  tilt: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.tilt;
    d.meet("tilt");
    if (f.ended) {
      await d.say("tilt", d.s.ending === "on" ? L.endedOn : L.endedOff, "happy");
      return;
    }
    if (f.tiltWon) {
      await d.say("tilt", repeatLine(d.s, "tilt", L.won), "happy");
      await bump(d, "tilt");
      return;
    }
    if (!f.metTilt) {
      d.set("metTilt");
      await d.say("tilt", L.hello, "sad");
      await d.say("deco", L.remote);
      await d.say("tilt", L.mine, "surprised");
      await d.say("tilt", L.stuck, "sad");
      d.objective();
    }
    const pick = await d.ask("tilt", L.ask, L.options, "sad");
    if (pick === 1) {
      await d.say("tilt", L.wait, "sad");
      return;
    }
    await d.say("tilt", L.rules, "happy");
    await d.action("arcade");
    d.set("tiltWon");
    await d.say("tilt", L.complete, "happy");
    await d.say("tilt", L.take, "talk");
    await d.give("remote");
    await d.say("deco", L.pauses, "surprised");
    await d.say("tilt", L.sea, "talk");
    d.discover("pause");
    d.set("tokensHint");
    await d.say("tilt", L.tokens, "look");
    d.objective();
  },

  cabA: async (d) => {
    await d.action("burst:cabA");
    await d.say("narrator", d.text.lines.cabA);
  },
  cabB: async (d) => {
    await d.action("burst:cabB");
    await d.say("narrator", d.text.lines.cabB);
  },
  cabC: async (d) => {
    await d.action("burst:cabC");
    await d.say("narrator", d.text.lines.cabC);
  },
  cabD: async (d) => {
    const L = d.text.lines.cabD;
    if (d.s.flags.sawBroken) {
      await d.action("burst:cabD");
      await d.say("narrator", L.wink);
      return;
    }
    d.set("sawBroken");
    await d.say("narrator", L.tap);
    d.act();
    await d.action("brokenScreen");
    await d.say("deco", L.deco, "surprised");
    d.discover("broken");
  },
  records: async (d) => {
    const L = d.text.lines.records;
    const rows = d.s.secrets.includes("machine") ? [L.dec, L.tilt] : [L.tilt];
    rows.push(L.placar);
    if (d.s.flags.tiltWon) rows.push(L.deco);
    await d.say("narrator", L.board(rows.join(" ")));
    if (!d.s.flags.ended) await d.say("placar", L.warn, "look");
  },
  posterPijama: async (d) => d.say("narrator", d.text.lines.posterPijama),
  placar: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.placar;
    d.meet("placar");
    if (f.ended) {
      await d.say("placar", d.s.ending === "on" ? L.endedOn : L.endedOff, "happy");
      return;
    }
    if (!f.metPlacar) {
      d.set("metPlacar");
      await d.say("placar", L.hello, "normal");
      await d.say("placar", L.records, "talk");
      return;
    }
    if (f.tiltWon && !f.placarStamp) {
      d.set("placarStamp");
      await d.say("placar", L.stampAsk, "surprised");
      await d.action("stamp");
      await d.say("placar", L.stamped, "happy");
      return;
    }
    await d.say("placar", repeatLine(d.s, "placar", L.more), "talk");
    await bump(d, "placar");
  },
  claw: async (d) => {
    d.act();
    await d.say("narrator", d.text.lines.claw);
  },
  pinball: async (d) => d.say("narrator", d.text.lines.pinball),
  hockey: async (d) => d.say("narrator", d.text.lines.hockey),
  prizes: async (d) => d.say("narrator", d.text.lines.prizes),

  curtain: async (d) => {
    d.act();
    d.sfx("open", 0.8);
    await d.action("openCurtain");
    await d.say("narrator", d.text.lines.curtain);
    d.set("tokensHint");
  },

  goldMachine: async (d) => {
    const L = d.text.lines.goldMachine;
    if (d.s.secrets.includes("machine")) {
      await d.say("narrator", L.lit);
      return;
    }
    const n = d.s.tokens.length;
    if (n < 3) {
      await d.say("narrator", L.insert(n));
      if (n === 0) await d.say("deco", L.where);
      d.set("tokensHint");
      return;
    }
    d.act();
    await d.say("narrator", L.coins);
    await d.action("goldMachine");
    await d.say("narrator", L.scores);
    await d.say("deco", L.me, "surprised");
    await d.say("narrator", L.yet);
    await d.secret("machine");
  },

  marisa: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.marisa;
    d.meet("marisa");
    if (f.ended) {
      await d.say("marisa", L.ended, "happy");
      return;
    }
    if (f.gotOrder) {
      await d.say("marisa", L.bottle, "happy");
      return;
    }
    if (d.has("remote")) {
      await d.say("marisa", L.remote, "look");
      await d.say("marisa", L.tip, "talk");
      d.set("metMarisa");
      d.set("marisaTip");
      d.objective();
      return;
    }
    if (!f.metMarisa) {
      d.set("metMarisa");
      await d.say("marisa", L.hello);
      await d.say("deco", L.off);
      await d.say("marisa", L.rerun, "talk");
      await d.say("marisa", L.twenty, "happy");
      d.discover("waves");
      return;
    }
    await d.say("marisa", repeatLine(d.s, "marisa", L.more), "talk");
    await bump(d, "marisa");
  },

  shore: async (d) => {
    const L = d.text.lines.shore;
    if (d.s.flags.gotOrder) return d.say("narrator", L.known);
    if (d.s.flags.seaPaused) return d.say("narrator", L.paused);
    if (!d.has("remote")) {
      await d.say("narrator", L.look);
      d.discover("waves");
      return;
    }
    d.act();
    await d.action("pauseSea");
    d.set("seaPaused");
    await d.say("narrator", L.pause);
    d.discover("pause");
  },

  bottle: async (d) => {
    const L = d.text.lines.bottle;
    d.act();
    await d.give("order");
    d.set("gotOrder");
    await d.say("narrator", L.note);
    await d.say("deco", L.deco, "surprised");
    d.discover("order");
    await d.action("playSea");
    d.objective();
  },

  shellToken: async (d) => {
    const L = d.text.lines.shellToken;
    if (d.s.tokens.includes("shell")) return d.say("narrator", L.empty);
    d.act();
    await d.say("narrator", L.found);
    await d.token("shell");
  },

  kiosk: async (d) => {
    const L = d.text.lines.kiosk;
    const pick = await d.ask("narrator", L.ask, L.options);
    if (pick === 0) {
      await d.say("narrator", L.menu);
      return;
    }
    if (pick === 1) {
      await d.action("radioTune");
      await d.say("narrator", repeatLine(d.s, "radio", L.radio));
      await bump(d, "radio");
      return;
    }
    await d.action("kioskBell");
    await d.say("narrator", L.bell);
  },
  shells: async (d) => {
    d.act();
    d.sfx("wave", 0.4);
    await d.say("narrator", repeatLine(d.s, "shells", d.text.lines.shells));
    await bump(d, "shells");
  },
  waveSign: async (d) => d.say("narrator", d.text.lines.waveSign),
  sandcastle: async (d) => {
    await d.action("crabPop");
    await d.say("narrator", repeatLine(d.s, "castle", d.text.lines.sandcastle));
    await bump(d, "castle");
  },
  pierEnd: async (d) => {
    const L = d.text.lines.pierEnd;
    await d.action("lighthouseLook");
    await d.say("narrator", L.look);
    await d.say("deco", L.deco, "surprised");
  },
  surf: async (d) => {
    await d.action("surfWobble");
    await d.say("narrator", d.text.lines.surf);
  },
  clique: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.clique;
    d.meet("clique");
    if (f.photoDone) {
      await d.say("clique", f.ended ? L.partyPhoto : L.album, "happy");
      return;
    }
    if (!f.metClique) {
      d.set("metClique");
      await d.say("clique", L.hello, "talk");
      await d.action("cliqueTry");
      await d.say("clique", L.missed, "sad");
      if (!d.has("remote")) return;
    }
    if (d.has("remote")) {
      const pick = await d.ask("deco", L.ask, L.options);
      if (pick === 1) {
        await d.say("clique", L.later, "sad");
        return;
      }
      d.act();
      await d.action("cliquePhoto");
      d.set("photoDone");
      await d.say("clique", L.perfect, "happy");
      d.discover("photo");
      return;
    }
    await d.say("clique", repeatLine(d.s, "clique", L.more), "talk");
    await bump(d, "clique");
  },
  chips: async (d) => {
    await d.action("marisaGuard");
    await d.say("marisa", d.text.lines.chips, "look");
  },

  lento: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.lento;
    d.meet("lento");
    if (f.ended) {
      const first = !d.s.secrets.includes("lento");
      if (first) {
        await d.say("lento", L.arrived, "surprised");
        await d.say("deco", L.story, "happy");
        await d.say("lento", L.next, "talk");
        await d.secret("lento");
      }
      if (!f.gotKey) {
        await d.say("lento", L.keyLate, "talk");
        d.set("gotKey");
        await d.action("lentoKeyless");
        await d.give("key");
        await d.say("deco", L.room, "surprised");
        return;
      }
      if (first) return;
      await d.say("lento", L.stay, "talk");
      return;
    }
    if (!f.gotKey) {
      await d.say("lento", L.hello, "talk");
      await d.say("deco", L.where);
      await d.say("lento", L.reception, "talk");
      await d.say("lento", L.almost, "talk");
      await d.say("lento", L.takeIt, "talk");
      d.set("gotKey");
      await d.give("key");
      await d.say("deco", L.room, "surprised");
      return;
    }
    await d.say("lento", L.hurry, "talk");
  },

  psiu: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.psiu;
    d.meet("psiu");
    if (f.ended) {
      await d.say("psiu", d.s.ending === "off" ? L.endedOff : L.endedOn, "happy");
      return;
    }
    if (f.fallPaused) {
      await d.say("psiu", L.door, "happy");
      return;
    }
    if (f.gotOrder || d.has("remote")) {
      await d.say("psiu", f.gotOrder ? L.haveOrder : L.haveRemote, "talk");
      await d.say("psiu", L.riddle, "look");
      d.set("psiuRiddle");
      d.objective();
      return;
    }
    if (!f.metPsiu) {
      d.set("metPsiu");
      await d.say("psiu", L.psst);
      await d.say("deco", L.hi, "surprised");
      await d.say("psiu", L.dark, "talk");
      await d.say("psiu", L.comeBack, "look");
      return;
    }
    await d.say("psiu", repeatLine(d.s, "psiu", L.more), "look");
    await bump(d, "psiu");
  },

  fall: async (d) => {
    const L = d.text.lines.fall;
    if (d.s.flags.fallPaused) return d.say("narrator", L.paused);
    if (!d.has("remote")) {
      await d.action("fallFlicker");
      await d.say("narrator", L.look);
      return;
    }
    d.act();
    await d.action("pauseFall");
    d.set("fallPaused");
    await d.say("narrator", L.pause);
    d.discover("door");
    d.objective();
  },

  stationDoor: async (d) => {
    d.sfx("door", 0.8);
    d.goto("station", "door");
  },

  placardArch: async (d) => d.say("narrator", d.text.lines.placardArch),
  placardStatue: async (d) => d.say("narrator", d.text.lines.placardStatue),
  placardDish: async (d) => {
    const L = d.text.lines.placardDish;
    await d.action("dishWobble");
    await d.say("narrator", L.sign);
    if (d.s.flags.ended) await d.say("deco", d.s.ending === "off" ? L.endedOff : L.endedOn);
    else if (d.has("order")) await d.say("deco", L.haveOrder, "surprised");
    else await d.say("deco", L.what);
    d.discover("antenna");
  },
  booth: async (d) => {
    await d.action("ticketPrint");
    await d.say("narrator", repeatLine(d.s, "ticket", d.text.lines.booth));
    await bump(d, "ticket");
  },
  horse: async (d) => d.say("narrator", d.text.lines.horse),
  cavuca: async (d) => {
    const f = d.s.flags;
    const L = d.text.lines.cavuca;
    d.meet("cavuca");
    if (f.ended) {
      await d.say("cavuca", L.ended, "happy");
      return;
    }
    if (!f.metCavuca) {
      d.set("metCavuca");
      await d.say("cavuca", L.hello, "happy");
      await d.say("deco", L.circles);
      await d.say("cavuca", L.mapping, "talk");
      return;
    }
    if (f.fallPaused) {
      await d.say("cavuca", L.stopped, "surprised");
      return;
    }
    await d.say("cavuca", repeatLine(d.s, "cavuca", L.more), "talk");
    await bump(d, "cavuca");
  },
  chiado: async (d) => {
    d.meet("chiado");
    await d.action("chiadoHello");
    await d.say("narrator", d.text.lines.chiado);
    d.discover("creature");
    await d.action("chiadoBye");
  },
  mushrooms: async (d) => {
    await d.action("mushGlow");
    await d.say("narrator", repeatLine(d.s, "mush", d.text.lines.mushrooms));
    await bump(d, "mush");
  },
  bridge: async (d) => {
    await d.action("bridgeBars");
    await d.say("narrator", d.text.lines.bridge);
    d.discover("bridge");
  },
  treehouse: async (d) => d.say("narrator", d.text.lines.treehouse),
  logToken: async (d) => {
    const L = d.text.lines.logToken;
    if (d.s.tokens.includes("log")) return d.say("narrator", L.empty);
    d.act();
    await d.say("narrator", L.found);
    await d.token("log");
  },

  monitors: async (d) => {
    await d.say("narrator", d.text.lines.monitors);
    d.discover("monitors");
  },
  calendar: async (d) => {
    await d.say("narrator", d.text.lines.calendar);
    d.discover("calendar");
  },
  mug: async (d) => d.say("narrator", d.text.lines.mug),
  tape: async (d) => {
    const L = d.text.lines.tape;
    await d.say("narrator", L.label);
    await d.say("deco", L.deco, "surprised");
  },
  stationWindow: async (d) => d.say("narrator", d.text.lines.stationWindow),
  button: async (d) => {
    if (!d.has("order")) return d.say("narrator", d.text.lines.button);
    return SCRIPTS.console(d);
  },
  console: async (d) => {
    const L = d.text.lines.console;
    if (d.s.flags.ended) {
      await d.say("narrator", d.s.ending === "off" ? L.endedOff : L.endedOn);
      return;
    }
    if (!d.has("order")) {
      await d.say("narrator", L.slot);
      if (!d.s.flags.gotOrder) await d.say("deco", L.where);
      return;
    }
    d.act();
    await d.say("narrator", L.insert);
    d.take("order");
    await d.action("monitorsOn");
    await d.say("deco", L.realize);
    await d.action("feed:bigodes");
    await d.say("bigodes", L.bigodes, "look");
    await d.action("feed:marisa");
    await d.say("marisa", L.marisa, "talk");
    await d.action("feed:marola");
    await d.say("marola", L.marola, "talk");
    await d.action("feed:tilt");
    await d.say("tilt", L.tilt, "sad");
    await d.action("psiuIn");
    await d.say("psiu", L.psiu, "talk");
    d.discover("twist");
    await d.say("psiu", L.choice, "happy");
    const pick = await d.ask("deco", L.ask, L.options);
    d.s.ending = pick === 0 ? "off" : "on";
    d.s.flags.resultPending = true;
    d.set("ended");
    if (pick === 0) {
      await d.action("endOff");
      await d.say("narrator", L.nothing);
      await d.action("lightsBack");
      await d.say("bigodes", L.normal, "happy");
      await d.say("psiu", L.vacation, "happy");
    } else {
      await d.say("narrator", L.drawer);
      await d.action("endOn");
      await d.say("tilt", L.continue, "happy");
      await d.say("marisa", L.like, "happy");
    }
    await d.action("party");
  },

  mascot: async (d) => {
    const L = d.text.lines.mascot;
    if (d.s.flags.metMascot) {
      await d.say("mascot", L.sleep, "normal");
      return;
    }
    d.meet("mascot");
    d.set("metMascot");
    await d.action("mascotWake");
    await d.say("mascot", L.wake, "surprised");
    await d.say("deco", L.you, "surprised");
    await d.say("mascot", L.vacation, "happy");
    await d.say("mascot", L.cartridge, "happy");
    await d.action("mascotSleep");
  },

  cartridge: async (d) => {
    const L = d.text.lines.cartridge;
    d.act();
    await d.give("cartridge");
    await d.say("narrator", L.label);
    await d.say("deco", L.deco, "surprised");
    await d.secret("room404");
  },

  tv404: async (d) => d.say("narrator", d.text.lines.tv404),
};

export const POSTER_SCRIPT = (id: PosterId) => async (d: Director) => {
  if (d.s.posters.includes(id)) {
    await d.say("narrator", d.text.poster(d.text.posters[id].title));
    return;
  }
  await d.say("narrator", d.text.posters[id].text);
  await d.poster(id);
};

export function hasMain(s: State, who: FolkKey) {
  const f = s.flags;
  const has = (i: Item) => s.items.includes(i);
  if (f.ended) return who === "lento" && !s.secrets.includes("lento") ? "!" : null;
  switch (who) {
    case "bigodes":
      return !f.talkedBigodes ? "!" : null;
    case "marola":
      return (f.talkedBigodes && !f.metMarola) || has("whistle") ? "!" : null;
    case "tilt":
      return !f.tiltWon && (f.whistleReturned || f.metTilt) ? "!" : null;
    case "marisa":
      return has("remote") && !f.gotOrder && !f.marisaTip ? "!" : null;
    case "psiu":
      return "?";
    case "lento":
      return !f.gotKey ? "!" : null;
    case "mascot":
      return !f.metMascot ? "!" : null;
    case "clique":
      return has("remote") && !f.photoDone ? "?" : null;
  }
  return null;
}
