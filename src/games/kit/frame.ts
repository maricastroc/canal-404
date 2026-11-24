import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { insetsOf, type Insets } from "./insets";

type Sized = { width: number; height: number };

export type FrameRules<F extends Sized> = {
  frameFor: (cssW: number, cssH: number, insets: Insets) => F;
  fallback: F;
  same: (a: F, b: F) => boolean;
};

export type WatchOptions<F> = {
  swap?: (next: F, now: F) => boolean;
  skipSame?: boolean;
  fresh?: boolean;
};

export function frameOf<F>(scene: Phaser.Scene, fallback: F): F {
  return (scene.registry.get("frame") as F | undefined) ?? fallback;
}

export function measureWith<F extends Sized>(parent: HTMLElement, rules: FrameRules<F>): F {
  const r = parent.getBoundingClientRect();
  return rules.frameFor(r.width, r.height, insetsOf(parent));
}

export function watchFrameWith<F extends Sized>(scene: Phaser.Scene, rules: FrameRules<F>, apply: (frame: F) => void, options: WatchOptions<F> = {}) {
  let live = true;
  let applied: F | null = null;
  const onResize = () => {
    if (!live) return;
    const ctx = scene.registry.get("ctx") as GameHostContext;
    const parent = scene.scale.parentSize;
    const size = scene.scale.gameSize;
    const now = frameOf(scene, rules.fallback);
    const next = parent.width > 0 && parent.height > 0 ? rules.frameFor(parent.width, parent.height, insetsOf(ctx.parent)) : now;
    if (options.swap?.(next, now)) return;
    if (!rules.same(now, next)) scene.registry.set("frame", next);
    if (next.width !== size.width || next.height !== size.height) {
      scene.scale.setGameSize(next.width, next.height);
      return;
    }
    const frame = options.fresh ? next : frameOf(scene, rules.fallback);
    if (options.skipSame && applied && rules.same(applied, frame)) return;
    applied = frame;
    apply(frame);
  };
  const stop = () => {
    live = false;
    scene.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stop);
    scene.events.off(Phaser.Scenes.Events.DESTROY, stop);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  scene.events.once(Phaser.Scenes.Events.DESTROY, stop);
  onResize();
  return stop;
}
