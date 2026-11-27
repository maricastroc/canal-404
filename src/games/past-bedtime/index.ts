import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, LevelRecord, StartOptions } from "@/games/types";
import { insetsOf } from "../kit/insets";
import { partResult } from "./result";
import { frameFor, sameFrame, type Frame } from "./scenes/layout";
import { NightScene, type Carry, type Command, type NightBridge } from "./scenes/NightScene";
import { NightUiScene } from "./scenes/NightUi";
import { LEVELS } from "./sim/levels";
import { destroyGame } from "../kit/game";

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
const ENDING_HOLD_MS = 9000;

const touchScreen = () => window.matchMedia?.("(pointer: coarse)").matches ?? false;

function measure(parent: HTMLElement): Frame {
  const { width, height } = parent.getBoundingClientRect();
  return frameFor(width, height, insetsOf(parent), touchScreen());
}

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  let records: LevelRecord[] = [];
  let level = 0;
  let paused = false;
  let ready = false;
  let pendingWin: number | null = null;
  let finishPending: (() => void) | null = null;
  let finale = false;
  let game: Phaser.Game | null = null;
  let frame = measure(ctx.parent);
  let carried: Carry | null = null;

  const scene = () => (game && (game.scene.isActive("night") || game.scene.isPaused("night")) ? (game.scene.getScene("night") as NightScene) : null);

  const holdScenes = () => {
    for (const key of ["night", "night-ui"]) if (game?.scene.isActive(key)) game.scene.pause(key);
  };

  const releaseScenes = () => {
    for (const key of ["night", "night-ui"]) if (game?.scene.isPaused(key)) game.scene.resume(key);
  };

  const clearWin = () => {
    if (pendingWin !== null) window.clearTimeout(pendingWin);
    pendingWin = null;
    finishPending = null;
    finale = false;
  };

  const boot = (carry: Carry | null) => {
    const bridge: NightBridge = {
      locale: ctx.locale,
      fonts: { display: ctx.fonts.display, body: ctx.fonts.body, hand: ctx.fonts.hand, round: ctx.fonts.round },
      reducedMotion: ctx.reducedMotion,
      frame,
      touch: touchScreen(),
      art: "final",
      level,
      carry,
      stars: () => Object.fromEntries(LEVELS.map((l, i) => [l.id, records[i]?.stars ?? 0])),
      onLoad: (value) => {
        if (!ready) ctx.onProgress(value, "art");
      },
      onError: (error) => ctx.onError(error),
      onReady: () => {
        carried = null;
        if (paused) window.setTimeout(holdScenes, 0);
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
        const finish = () => {
          clearWin();
          ctx.onEvent({ type: "finished", result });
        };
        finale = report.index === LEVELS.length - 1;
        finishPending = finish;
        pendingWin = window.setTimeout(finish, finale ? ENDING_HOLD_MS : ctx.reducedMotion ? 300 : WIN_HOLD_MS);
      },
      finishWin: () => {
        if (finale) finishPending?.();
      },
    };
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ctx.parent,
      width: frame.W,
      height: frame.H,
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
    if (pendingWin !== null && finale && !paused && (cmd === "next" || cmd === "wait")) finishPending?.();
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
    const next = measure(ctx.parent);
    if (ready && !sameFrame(next, frame)) {
      const night = scene();
      if (next.kind === frame.kind && next.kind !== "full" && night) {
        frame = next;
        game.scale.resize(next.W, next.H);
        night.relayout(next);
        game.scale.getParentBounds();
        game.scale.refresh();
        return;
      }
      const carry = night?.carry() ?? carried;
      carried = carry;
      frame = next;
      destroyGame(game);
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
      releaseScenes();
      if (options?.records) records = options.records;
      level = Math.max(0, Math.min(LEVELS.length - 1, options?.level ?? 0));
      scene()?.loadPart(level);
    },
    pause() {
      paused = true;
      holdScenes();
    },
    resume() {
      paused = false;
      releaseScenes();
    },
    restart() {
      clearWin();
      paused = false;
      releaseScenes();
      scene()?.loadPart(level);
    },
    setHighScore() {},
    destroy() {
      clearWin();
      target.removeEventListener("keydown", keydown);
      observer.disconnect();
      if (game) destroyGame(game);
      game = null;
    },
  };
}

const pastBedtime: GameModule = { mount };

export default pastBedtime;
