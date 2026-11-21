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

export function watchFrame(scene: Phaser.Scene, apply: (frame: Frame) => void) {
  let applied: Frame | null = null;
  const onResize = () => {
    const ctx = scene.registry.get("ctx") as GameHostContext;
    const parent = scene.scale.parentSize;
    const game = scene.scale.gameSize;
    const next = parent.width > 0 && parent.height > 0 ? frameFor(parent.width, parent.height, insetsOf(ctx.parent)) : currentFrame(scene);
    if (!sameFrame(currentFrame(scene), next)) scene.registry.set("frame", next);
    if (next.width !== game.width || next.height !== game.height) {
      scene.scale.setGameSize(next.width, next.height);
      return;
    }
    const frame = currentFrame(scene);
    if (applied && sameFrame(applied, frame)) return;
    applied = frame;
    apply(frame);
  };
  const stop = () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stop);
    scene.events.off(Phaser.Scenes.Events.DESTROY, stop);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  scene.events.once(Phaser.Scenes.Events.DESTROY, stop);
  onResize();
}
