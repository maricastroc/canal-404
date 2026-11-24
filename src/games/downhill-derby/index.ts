import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { DEFAULT_CAMERA, InputState } from "./input";
import { raceResult } from "./result";
import { addWin, isUnlocked, loadSave, updateSave } from "./save";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { GarageScene, type GarageData, type GarageHost } from "./scenes/GarageScene";
import { RaceScene, type RaceFinish, type RaceForm, type SceneBridge } from "./scenes/RaceScene";
import { CART_IDS, UNLOCKS, type CartId } from "./sim/carts";
import type { CourseId } from "./sim/course";
import { DEFAULT_PARAMS, cloneParams } from "./sim/params";
import { RACE_COURSES } from "./sim/score";
import { loadRivals, type RivalDef } from "./sim/tapes";
import { destroyGame } from "../kit/game";

const RACE_KEYS = new Set(["Space", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "KeyS", "KeyA", "KeyD", "KeyW"]);

function newForm(): RaceForm {
  return { best: Infinity, recent: [], runs: 0, ghost: null };
}

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const input = new InputState();
  const forms = new Map<string, RaceForm>();
  const rivals = new Map<CourseId, Promise<readonly RivalDef[]>>();
  const initial = loadSave();
  let level = 0;
  let cart: CartId = initial.cart;
  let ghost = initial.ghost;
  let chosen = false;
  let unlockedNow: CartId | null = null;
  let token = 0;
  let destroyed = false;

  const course = () => RACE_COURSES[level];

  const rivalsFor = (id: CourseId) => {
    let pending = rivals.get(id);
    if (!pending) {
      pending = loadRivals(id);
      rivals.set(id, pending);
    }
    return pending;
  };

  const formFor = (id: CourseId, rider: CartId) => {
    const key = `${id}:${rider}`;
    let form = forms.get(key);
    if (!form) {
      form = newForm();
      forms.set(key, form);
    }
    return form;
  };

  const bridge: SceneBridge = {
    locale: ctx.locale,
    fonts: { display: ctx.fonts.display, body: ctx.fonts.body },
    reducedMotion: ctx.reducedMotion,
    params: cloneParams(DEFAULT_PARAMS),
    camera: { ...DEFAULT_CAMERA },
    input,
    course: course(),
    cart,
    ghost,
    rivalDefs: [],
    form: newForm(),
    records: {
      load: (id) => loadSave().tracks[id] ?? null,
      save: (id, record) => {
        updateSave((save) => {
          save.tracks[id] = record;
        });
      },
      win: (id, rider) => {
        updateSave((save) => addWin(save, id, rider));
      },
    },
    onBeat: (id, rival) => {
      const target = CART_IDS.find((c) => UNLOCKS[c]?.course === id && UNLOCKS[c]?.beat === rival);
      if (!target || isUnlocked(loadSave(), target)) return;
      updateSave((save) => {
        save.unlocked.push(target);
      });
      unlockedNow = target;
    },
    onShow: (points) => ctx.onEvent({ type: "score", score: points }),
    onFinish: (finish: RaceFinish) => {
      const result = raceResult(finish, ctx.locale, unlockedNow);
      unlockedNow = null;
      ctx.onEvent({ type: "score", score: result.score });
      ctx.onEvent({ type: "finished", result });
    },
  };

  const garageHost: GarageHost = {
    locale: ctx.locale,
    fonts: bridge.fonts,
    pick: (picked) => {
      cart = picked;
      chosen = true;
      updateSave((save) => {
        save.cart = picked;
      });
      void race();
    },
    toggleGhost: () => {
      ghost = !ghost;
      updateSave((save) => {
        save.ghost = ghost;
      });
      return ghost;
    },
  };

  const frame = measureFrame(ctx.parent);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: frame.width,
    height: frame.height,
    backgroundColor: "#8fd4f7",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: { keyboard: false, touch: { capture: true }, activePointers: 4 },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, GarageScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("frame", frame);
        g.registry.set("bridge", bridge);
        g.registry.set("garage", garageHost);
        g.registry.set("attract", { attract: true, course: course(), index: level, cart, ghost, unlocked: initial.unlocked, wins: initial.wins[course()] ?? {} } satisfies GarageData);
      },
      postBoot: () => ctx.onProgress(0.05, "art"),
    },
  });

  const raceScene = () => (game.scene.getScene("race") as RaceScene | null) ?? null;
  const garageScene = () => (game.scene.isActive("garage") || game.scene.isPaused("garage") ? (game.scene.getScene("garage") as GarageScene) : null);
  const racing = () => game.scene.isActive("race") || game.scene.isPaused("race");

  const resumeAll = () => {
    for (const key of ["garage", "race"]) if (game.scene.isPaused(key)) game.scene.resume(key);
  };

  const garage = () => {
    token += 1;
    input.releaseAll();
    resumeAll();
    if (game.scene.getScene("race")) game.scene.remove("race");
    const save = loadSave();
    const data: GarageData = { attract: false, course: course(), index: level, cart, ghost, unlocked: save.unlocked, wins: save.wins[course()] ?? {} };
    if (game.scene.isActive("garage")) game.scene.getScene("garage").scene.restart(data);
    else game.scene.start("garage", data);
  };

  const race = async () => {
    const ticket = (token += 1);
    const id = course();
    const defs = await rivalsFor(id);
    if (destroyed || ticket !== token) return;
    input.releaseAll();
    resumeAll();
    bridge.course = id;
    bridge.cart = cart;
    bridge.ghost = ghost;
    bridge.rivalDefs = defs;
    bridge.form = formFor(id, cart);
    const current = raceScene();
    if (current && racing() && current.matches(id, cart)) {
      current.restartRace();
      return;
    }
    if (game.scene.isActive("garage")) game.scene.stop("garage");
    if (current) game.scene.remove("race");
    game.scene.add("race", new RaceScene(), true);
  };

  const onKey = (event: KeyboardEvent, down: boolean) => {
    const code = event.code;
    if (down && !event.repeat && (code === "Escape" || code === "KeyP")) {
      event.preventDefault();
      ctx.onEvent({ type: "pause-request" });
      return;
    }
    const shed = garageScene();
    if (shed && game.scene.isActive("garage")) {
      if (down && !event.repeat && shed.key(code)) event.preventDefault();
      return;
    }
    if (!racing() || !RACE_KEYS.has(code)) return;
    event.preventDefault();
    if (code === "Space") input.setSpace(down, "key");
    else if (code === "ArrowDown" || code === "KeyS") input.setDown(down, "key");
    else if (code === "ArrowLeft" || code === "KeyA") input.setLeft(down, "key");
    else if (code === "ArrowRight" || code === "KeyD") input.setRight(down, "key");
  };
  const keydown = (event: KeyboardEvent) => onKey(event, true);
  const keyup = (event: KeyboardEvent) => onKey(event, false);
  const blur = () => {
    input.releaseAll();
    raceScene()?.releaseInput();
  };
  const target = ctx.keyboardTarget;
  target.addEventListener("keydown", keydown);
  target.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  const observer = new ResizeObserver(() => {
    game.scale.getParentBounds();
    game.scale.refresh();
  });
  observer.observe(ctx.parent);

  return {
    start(options?: StartOptions) {
      level = Phaser.Math.Clamp(options?.level ?? 0, 0, RACE_COURSES.length - 1);
      void rivalsFor(course());
      if (options?.next && chosen) void race();
      else garage();
    },
    pause() {
      blur();
      for (const key of ["garage", "race"]) if (game.scene.isActive(key)) game.scene.pause(key);
    },
    resume() {
      input.releaseAll();
      resumeAll();
    },
    restart() {
      if (chosen) void race();
      else garage();
    },
    alt() {
      garage();
    },
    setHighScore() {},
    destroy() {
      destroyed = true;
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      observer.disconnect();
      destroyGame(game);
    },
  };
}

const downhillDerby: GameModule = { mount };

export default downhillDerby;
