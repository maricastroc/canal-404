import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { FULL_FRAME, frameFor, sameFrame, type Frame, type Insets } from "../layout";

let probe: HTMLDivElement | null = null;

function envInsets(): Insets {
  if (typeof document === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;inset:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.appendChild(probe);
  }
  const style = getComputedStyle(probe);
  return { top: parseFloat(style.paddingTop) || 0, right: parseFloat(style.paddingRight) || 0, bottom: parseFloat(style.paddingBottom) || 0, left: parseFloat(style.paddingLeft) || 0 };
}

export function insetsOf(parent: HTMLElement): Insets {
  const env = envInsets();
  const r = parent.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.round(Math.max(0, env.top - r.top)),
    right: Math.round(Math.max(0, env.right - (vw - r.right))),
    bottom: Math.round(Math.max(0, env.bottom - (vh - r.bottom))),
    left: Math.round(Math.max(0, env.left - r.left)),
  };
}

export function measureFrame(parent: HTMLElement): Frame {
  const r = parent.getBoundingClientRect();
  return frameFor(r.width, r.height, insetsOf(parent));
}

export function currentFrame(scene: Phaser.Scene): Frame {
  return (scene.registry.get("frame") as Frame | undefined) ?? FULL_FRAME;
}

export function watchFrame(scene: Phaser.Scene, apply: (frame: Frame) => void) {
  const onResize = () => {
    const ctx = scene.registry.get("ctx") as GameHostContext;
    const parent = scene.scale.parentSize;
    const game = scene.scale.gameSize;
    const next = parent.width > 0 && parent.height > 0 ? frameFor(parent.width, parent.height, insetsOf(ctx.parent)) : currentFrame(scene);
    const prev = currentFrame(scene);
    if (!sameFrame(prev, next)) scene.registry.set("frame", next);
    if (next.width !== game.width || next.height !== game.height) {
      scene.scale.setGameSize(next.width, next.height);
      return;
    }
    apply(next);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  onResize();
}
