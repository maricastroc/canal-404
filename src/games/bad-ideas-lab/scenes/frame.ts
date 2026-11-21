import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { insetsOf } from "../../kit/insets";
import { FULL_FRAME, frameFor, sameFrame, type Frame } from "../layout";
import type { LevelDef } from "../levels";

export function measureFrame(parent: HTMLElement, level: LevelDef): Frame {
  const r = parent.getBoundingClientRect();
  return frameFor(r.width, r.height, insetsOf(parent), level);
}

export function currentFrame(scene: Phaser.Scene): Frame {
  return (scene.registry.get("frame") as Frame | undefined) ?? FULL_FRAME;
}

export function watchFrame(scene: Phaser.Scene, level: LevelDef, apply: (frame: Frame) => void) {
  const onResize = () => {
    const ctx = scene.registry.get("ctx") as GameHostContext;
    const parent = scene.scale.parentSize;
    const game = scene.scale.gameSize;
    const next = parent.width > 0 && parent.height > 0 ? frameFor(parent.width, parent.height, insetsOf(ctx.parent), level) : currentFrame(scene);
    if (!sameFrame(currentFrame(scene), next)) scene.registry.set("frame", next);
    if (next.width !== game.width || next.height !== game.height) {
      scene.scale.setGameSize(next.width, next.height);
      return;
    }
    apply(currentFrame(scene));
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  onResize();
}
