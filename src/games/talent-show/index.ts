import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { isPlausibleOffset } from "./sim/calibration";
import { MAX_OFFSET } from "./sim/judge";
import { songResult } from "./result";
import { CANVAS, type Orientation } from "./scenes/layout";
import { StageScene, type TalentBridge } from "./scenes/StageScene";
import { SONG_ORDER } from "./song/songs";

const CALIBRATION_KEY = "canal404:talent-show:calibration:v1";
const ASSIST_KEY = "canal404:talent-show:assist:v1";
const FINALE_ACHIEVEMENT = "talent-finale";
const RESULT_HOLD_MS = 1800;
const IGNORED_KEYS = new Set(["Tab", "MetaLeft", "MetaRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "CapsLock", "F5", "F12"]);

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function loadCalibration() {
  const raw = read(CALIBRATION_KEY);
  if (raw === null) return null;
  const n = Number(raw);
  return isPlausibleOffset(n, MAX_OFFSET) ? n : null;
}

function orientationOf(parent: HTMLElement): Orientation {
  const { width, height } = parent.getBoundingClientRect();
  return height > width * 1.15 && width < 900 ? "portrait" : "landscape";
}

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  let game: Phaser.Game | null = null;
  let ready = false;
  let level = 0;
  let started = false;
  let pending: number | null = null;
  let orientation = orientationOf(ctx.parent);
  const pointers = new Set<number>();

  const scene = () => (game && game.scene.isActive("stage") ? (game.scene.getScene("stage") as StageScene) : null);

  const clearPending = () => {
    if (pending !== null) window.clearTimeout(pending);
    pending = null;
  };

  const boot = () => {
    const size = CANVAS[orientation];
    const bridge: TalentBridge = {
      locale: ctx.locale,
      fonts: { display: ctx.fonts.display, body: ctx.fonts.body },
      orientation,
      touch: window.matchMedia?.("(pointer: coarse)").matches ?? false,
      reducedMotion: ctx.reducedMotion,
      assist: { get: () => read(ASSIST_KEY) === "1", set: (on) => write(ASSIST_KEY, on ? "1" : "0") },
      calibration: { load: loadCalibration, save: (ms) => write(CALIBRATION_KEY, String(ms)) },
      onLoad: (value) => {
        if (!ready) ctx.onProgress(value, "art");
      },
      onReady: () => {
        if (ready) {
          if (started) scene()?.prepare(SONG_ORDER[level]);
          return;
        }
        ready = true;
        ctx.onProgress(1, "scene");
        ctx.onReady();
      },
      onRun: (report) => {
        clearPending();
        const result = songResult(report, ctx.locale);
        ctx.onEvent({ type: "score", score: result.score });
        if (report.song === "medley" && result.won) ctx.onEvent({ type: "achievement", id: FINALE_ACHIEVEMENT });
        pending = window.setTimeout(
          () => {
            pending = null;
            ctx.onEvent({ type: "finished", result });
          },
          ctx.reducedMotion ? 400 : RESULT_HOLD_MS,
        );
      },
      onPauseRequest: () => ctx.onEvent({ type: "pause-request" }),
    };
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ctx.parent,
      width: size.W,
      height: size.H,
      backgroundColor: "#1f1839",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      banner: false,
      audio: { noAudio: true },
      disableContextMenu: true,
      scene: [StageScene],
      callbacks: {
        preBoot: (g) => {
          g.registry.set("bridge", bridge);
        },
      },
    });
  };

  const down = (event: PointerEvent) => {
    if (event.button > 0) return;
    event.preventDefault();
    pointers.add(event.pointerId);
    scene()?.press(event.timeStamp, `p${event.pointerId}`, event.pageX, event.pageY);
  };

  const up = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    event.preventDefault();
    scene()?.release(event.timeStamp, `p${event.pointerId}`, event.pageX, event.pageY);
  };

  const keydown = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || IGNORED_KEYS.has(event.code)) return;
    event.preventDefault();
    scene()?.key(event.code, event.timeStamp);
  };

  const keyup = (event: KeyboardEvent) => {
    if (IGNORED_KEYS.has(event.code)) return;
    scene()?.keyUp(event.code, event.timeStamp);
  };

  const target = ctx.keyboardTarget;
  ctx.parent.addEventListener("pointerdown", down);
  ctx.parent.addEventListener("pointerup", up);
  ctx.parent.addEventListener("pointercancel", up);
  target.addEventListener("keydown", keydown);
  target.addEventListener("keyup", keyup);

  const observer = new ResizeObserver(() => {
    if (!game) return;
    const next = orientationOf(ctx.parent);
    if (next !== orientation && ready && !scene()?.live()) {
      orientation = next;
      game.destroy(true);
      boot();
      return;
    }
    game.scale.getParentBounds();
    game.scale.refresh();
  });
  observer.observe(ctx.parent);

  boot();

  return {
    start(options?: StartOptions) {
      clearPending();
      started = true;
      level = Math.max(0, Math.min(SONG_ORDER.length - 1, options?.level ?? 0));
      scene()?.prepare(SONG_ORDER[level]);
    },
    pause() {
      scene()?.pause();
    },
    resume() {
      scene()?.resume();
    },
    restart() {
      clearPending();
      scene()?.restartSong();
    },
    setHighScore() {},
    destroy() {
      clearPending();
      ctx.parent.removeEventListener("pointerdown", down);
      ctx.parent.removeEventListener("pointerup", up);
      ctx.parent.removeEventListener("pointercancel", up);
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      observer.disconnect();
      scene()?.quit();
      game?.destroy(true);
      game = null;
    },
  };
}

const talentShow: GameModule = { mount };

export default talentShow;
