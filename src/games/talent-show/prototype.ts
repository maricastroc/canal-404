import * as Phaser from "phaser";
import { CANVAS } from "./scenes/layout";
import { StageScene, type TalentBridge } from "./scenes/StageScene";
import type { SongId } from "./song/notation";

export type PrototypeHandle = {
  selectSong: (id: SongId) => void;
  calibrate: () => void;
  refresh: () => void;
  destroy: () => void;
};

const IGNORED_KEYS = new Set(["Tab", "MetaLeft", "MetaRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "CapsLock", "F5", "F12"]);

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || target.isContentEditable;
}

export function mountPrototype(parent: HTMLElement, bridge: TalentBridge): PrototypeHandle {
  const size = CANVAS[bridge.orientation];
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
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
  const scene = () => (game.scene.isActive("stage") ? (game.scene.getScene("stage") as StageScene) : null);
  const pointers = new Set<number>();
  const down = (e: PointerEvent) => {
    if (e.button > 0) return;
    e.preventDefault();
    pointers.add(e.pointerId);
    scene()?.press(e.timeStamp, `p${e.pointerId}`);
  };
  const up = (e: PointerEvent) => {
    if (!pointers.delete(e.pointerId)) return;
    e.preventDefault();
    scene()?.release(e.timeStamp, `p${e.pointerId}`);
  };
  const key = (e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || IGNORED_KEYS.has(e.code) || isFormField(e.target)) return;
    e.preventDefault();
    scene()?.key(e.code, e.timeStamp);
  };
  const keyUp = (e: KeyboardEvent) => {
    if (IGNORED_KEYS.has(e.code) || isFormField(e.target)) return;
    scene()?.keyUp(e.code, e.timeStamp);
  };
  const hidden = () => {
    if (document.visibilityState === "hidden") scene()?.hidden();
  };
  parent.addEventListener("pointerdown", down);
  parent.addEventListener("pointerup", up);
  parent.addEventListener("pointercancel", up);
  window.addEventListener("keydown", key);
  window.addEventListener("keyup", keyUp);
  document.addEventListener("visibilitychange", hidden);
  return {
    selectSong: (id) => scene()?.selectSong(id),
    calibrate: () => scene()?.calibrate(),
    refresh: () => {
      game.scale.getParentBounds();
      game.scale.refresh();
    },
    destroy: () => {
      parent.removeEventListener("pointerdown", down);
      parent.removeEventListener("pointerup", up);
      parent.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", keyUp);
      document.removeEventListener("visibilitychange", hidden);
      scene()?.quit();
      game.destroy(true);
    },
  };
}
