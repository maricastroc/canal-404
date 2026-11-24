import * as Phaser from "phaser";
import { frameOf, measureWith, watchFrameWith, type FrameRules } from "../../kit/frame";
import { FULL_FRAME, frameFor, sameFrame, type Frame } from "../layout";

const RULES: FrameRules<Frame> = { frameFor, fallback: FULL_FRAME, same: sameFrame };

export function measureFrame(parent: HTMLElement): Frame {
  return measureWith(parent, RULES);
}

export function currentFrame(scene: Phaser.Scene): Frame {
  return frameOf(scene, FULL_FRAME);
}

export function watchFrame(scene: Phaser.Scene, apply: (frame: Frame) => void, swap: (frame: Frame) => void) {
  return watchFrameWith(scene, RULES, apply, {
    swap: (next, now) => {
      if (next.kind === now.kind) return false;
      swap(next);
      return true;
    },
  });
}
