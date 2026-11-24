import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import type { Locale } from "@/i18n/locales";
import { ALL_POSTERS, ALL_SECRETS, ALL_TOKENS, clearState, endingUnreported, freshState, loadState } from "./save";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { WorldScene } from "./scenes/WorldScene";
import { mainObjective, score } from "./story";
import type { VacationText } from "./text/pt-BR";

const TEXT_LOADERS: Record<Locale, () => Promise<{ TEXT: VacationText }>> = {
  "pt-BR": () => import("./text/pt-BR"),
  en: () => import("./text/en"),
};

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const text = TEXT_LOADERS[ctx.locale]().then((m) => m.TEXT);
  const frame = measureFrame(ctx.parent);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: frame.width,
    height: frame.height,
    backgroundColor: "#1d1830",
    transparent: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: { keyboard: { target: ctx.keyboardTarget }, touch: { capture: true }, activePointers: 3 },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, WorldScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("frame", frame);
        g.registry.set("state", null);
        g.registry.set("textLoad", text);
      },
      postBoot: () => ctx.onProgress(0.05, "art"),
    },
  });

  const world = () => game.scene.getScene("world") as WorldScene | null;

  const open = (data: object) => {
    if (!game.registry.get("text")) {
      game.registry.set("pending", data);
      return;
    }
    if (game.scene.isPaused("world")) game.scene.resume("world");
    const scene = game.scene.getScene("world");
    if (game.scene.isActive("world")) scene.scene.restart(data);
    else game.scene.start("world", data);
  };

  const begin = () => {
    game.registry.set("state", freshState());
    open({ mode: "play", area: "lobby", spawn: "start", intro: true });
  };

  const fresh = () => {
    clearState();
    begin();
  };

  const resume = () => {
    const saved = loadState();
    if (!saved) {
      begin();
      return;
    }
    game.registry.set("state", saved);
    if (endingUnreported(saved, ctx.highScore)) open({ mode: "party", area: "pool", spawn: "party" });
    else open({ mode: "play", area: saved.area, spawn: "" });
  };

  return {
    start(options?: StartOptions) {
      if (options?.fresh) fresh();
      else resume();
    },
    pause() {
      world()?.persist();
      if (game.scene.isActive("world")) game.scene.pause("world");
    },
    resume() {
      if (game.scene.isPaused("world")) game.scene.resume("world");
    },
    restart() {
      resume();
    },
    alt() {
      fresh();
    },
    setHighScore() {},
    progress() {
      const text = game.registry.get("text") as VacationText | undefined;
      if (!text) return null;
      const saved = loadState();
      const s = saved ?? freshState();
      const sc = score(s);
      const T = text.intro;
      const stats = [
        { label: T.posters, value: `${sc.posters}/${ALL_POSTERS.length}` },
        { label: T.tokens, value: `${sc.tokens}/${ALL_TOKENS.length}` },
        { label: T.secrets, value: `${sc.secrets}/${ALL_SECRETS.length}` },
      ];
      if (saved) stats.push({ label: T.time, value: clock(s.time) });
      return { title: text.areas[s.area], text: mainObjective(s, text).text, stats };
    },
    destroy() {
      world()?.persist();
      game.destroy(true);
    },
  };
}

function clock(ms: number) {
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`;
}

const offAirVacation: GameModule = { mount };

export default offAirVacation;
