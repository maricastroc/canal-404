import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, LevelRecord, StartOptions } from "@/games/types";
import { partResult } from "./result";
import { CANVAS, type Orientation } from "./scenes/layout";
import { NightScene, type Carry, type Command, type NightBridge } from "./scenes/NightScene";
import { NightUiScene } from "./scenes/NightUi";
import { LEVELS } from "./sim/levels";

const KEYS: Record<string, Command> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowRight: "right",
  KeyD: "right",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  Space: "wait",
  Period: "wait",
  KeyZ: "undo",
  Backspace: "undo",
  KeyR: "restart",
  KeyH: "hint",
  KeyL: "rules",
  KeyV: "view",
  Enter: "next",
  NumpadEnter: "next",
};

const ONCE = new Set<Command>(["undo", "restart", "hint", "rules", "view"]);

const WIN_HOLD_MS = 1700;

function orientationOf(parent: HTMLElement): Orientation {
  const { width, height } = parent.getBoundingClientRect();
  return height > width * 1.15 && width < 900 ? "portrait" : "landscape";
}

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  let records: LevelRecord[] = [];
  let level = 0;
  let paused = false;
  let ready = false;
  let pendingWin: number | null = null;
  let game: Phaser.Game | null = null;
  let orientation = orientationOf(ctx.parent);

  const touch = () => window.matchMedia?.("(pointer: coarse)").matches ?? false;

  const scene = () => (game && game.scene.isActive("night") ? (game.scene.getScene("night") as NightScene) : null);

  const clearWin = () => {
    if (pendingWin !== null) window.clearTimeout(pendingWin);
    pendingWin = null;
  };

  const boot = (carry: Carry | null) => {
    const size = CANVAS[orientation];
    const bridge: NightBridge = {
      locale: ctx.locale,
      fonts: { display: ctx.fonts.display, body: ctx.fonts.body, hand: ctx.fonts.hand, round: ctx.fonts.round },
      reducedMotion: ctx.reducedMotion,
      orientation,
      touch: touch(),
      art: "final",
      level,
      carry,
      stars: () => Object.fromEntries(LEVELS.map((l, i) => [l.id, records[i]?.stars ?? 0])),
      onLoad: (value) => {
        if (!ready) ctx.onProgress(value, "art");
      },
      onReady: () => {
        if (ready) return;
        ready = true;
        ctx.onProgress(1, "scene");
        ctx.onReady();
      },
      onLevel: (index) => {
        level = index;
      },
      onWin: (report) => {
        clearWin();
        const result = partResult(report, ctx.locale);
        const stars = records[report.index]?.stars ?? 0;
        records = LEVELS.map((_l, i) => (i === report.index ? { stars: Math.max(stars, report.stars), score: Math.max(records[i]?.score ?? 0, result.score) } : (records[i] ?? { stars: 0, score: 0 })));
        ctx.onEvent({ type: "score", score: result.score });
        pendingWin = window.setTimeout(
          () => {
            pendingWin = null;
            ctx.onEvent({ type: "finished", result });
          },
          ctx.reducedMotion ? 300 : WIN_HOLD_MS,
        );
      },
    };
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ctx.parent,
      width: size.W,
      height: size.H,
      backgroundColor: "#0d0a1c",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      input: { keyboard: false, touch: { capture: true }, activePointers: 2 },
      banner: false,
      audio: { noAudio: true },
      disableContextMenu: true,
      scene: [NightUiScene, NightScene],
      callbacks: {
        preBoot: (g) => {
          g.registry.set("bridge", bridge);
        },
      },
    });
  };

  const command = (cmd: Command) => {
    if (paused || pendingWin !== null) return;
    scene()?.command(cmd);
  };

  const keydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault();
      if (!event.repeat) ctx.onEvent({ type: "pause-request" });
      return;
    }
    const cmd = KEYS[event.code];
    if (!cmd) return;
    event.preventDefault();
    if (event.repeat && ONCE.has(cmd)) return;
    command(cmd);
  };

  const target = ctx.keyboardTarget;
  target.addEventListener("keydown", keydown);

  const observer = new ResizeObserver(() => {
    if (!game) return;
    const next = orientationOf(ctx.parent);
    if (next !== orientation && ready) {
      const carry = scene()?.carry() ?? null;
      orientation = next;
      game.destroy(true);
      boot(carry);
      return;
    }
    game.scale.getParentBounds();
    game.scale.refresh();
  });
  observer.observe(ctx.parent);

  boot(null);

  return {
    start(options?: StartOptions) {
      clearWin();
      paused = false;
      if (options?.records) records = options.records;
      level = Math.max(0, Math.min(LEVELS.length - 1, options?.level ?? 0));
      scene()?.loadPart(level);
    },
    pause() {
      paused = true;
      for (const key of ["night", "night-ui"]) if (game?.scene.isActive(key)) game.scene.pause(key);
    },
    resume() {
      paused = false;
      for (const key of ["night", "night-ui"]) if (game?.scene.isPaused(key)) game.scene.resume(key);
    },
    restart() {
      clearWin();
      paused = false;
      scene()?.loadPart(level);
    },
    setHighScore() {},
    destroy() {
      clearWin();
      target.removeEventListener("keydown", keydown);
      observer.disconnect();
      game?.destroy(true);
      game = null;
    },
  };
}

const pastBedtime: GameModule = { mount };

export default pastBedtime;
