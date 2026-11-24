import * as Phaser from "phaser";
import { frameOf, measureWith, watchFrameWith, type FrameRules } from "../../kit/frame";
import { FULL_FRAME, frameFor, sameFrame, type Frame } from "../layout";
import type { LevelDef } from "../levels";

function rules(level: LevelDef): FrameRules<Frame> {
  return { frameFor: (cssW, cssH, insets) => frameFor(cssW, cssH, insets, level), fallback: FULL_FRAME, same: sameFrame };
}

export function measureFrame(parent: HTMLElement, level: LevelDef): Frame {
  return measureWith(parent, rules(level));
}

export function currentFrame(scene: Phaser.Scene): Frame {
  return frameOf(scene, FULL_FRAME);
}

export function watchFrame(scene: Phaser.Scene, level: LevelDef, apply: (frame: Frame) => void) {
  watchFrameWith(scene, rules(level), apply);
}
