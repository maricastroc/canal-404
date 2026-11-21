import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import type { Locale } from "@/i18n/locales";
import { clearState, freshState, loadState } from "./save";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { WorldScene } from "./scenes/WorldScene";
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
    open({ mode: "play", area: saved.area, spawn: "" });
  };

  return {
    start(options?: StartOptions) {
      if (options?.fresh) fresh();
      else resume();
    },
    pause() {
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
    destroy() {
      game.destroy(true);
    },
  };
}

const offAirVacation: GameModule = { mount };

export default offAirVacation;
