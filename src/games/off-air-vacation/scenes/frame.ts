import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { insetsOf } from "../../kit/insets";
import { FULL_FRAME, frameFor, sameFrame, type Frame } from "../layout";

export function measureFrame(parent: HTMLElement): Frame {
  const r = parent.getBoundingClientRect();
  return frameFor(r.width, r.height, insetsOf(parent));
}

export function currentFrame(scene: Phaser.Scene): Frame {
  return (scene.registry.get("frame") as Frame | undefined) ?? FULL_FRAME;
}

export function watchFrame(scene: Phaser.Scene, apply: (frame: Frame) => void, swap: (frame: Frame) => void) {
  let live = true;
  const onResize = () => {
    if (!live) return;
    const ctx = scene.registry.get("ctx") as GameHostContext;
    const parent = scene.scale.parentSize;
    const now = currentFrame(scene);
    const next = parent.width > 0 && parent.height > 0 ? frameFor(parent.width, parent.height, insetsOf(ctx.parent)) : now;
    if (next.kind !== now.kind) {
      swap(next);
      return;
    }
    if (!sameFrame(now, next)) scene.registry.set("frame", next);
    const game = scene.scale.gameSize;
    if (next.width !== game.width || next.height !== game.height) {
      scene.scale.setGameSize(next.width, next.height);
      return;
    }
    apply(currentFrame(scene));
  };
  const off = () => {
    live = false;
    scene.scale.off(Phaser.Scale.Events.RESIZE, onResize);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  onResize();
  return off;
}
