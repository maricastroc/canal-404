import type { CourseId } from "./sim/course";
import type { SimInput } from "./sim/sim";

export type TouchSetting = "auto" | "on" | "off";

export type RivalPace = "adaptive" | "fast";

export type InteractionSetting = "off" | "dust" | "kick";

export type ArtSetting = "current" | "sample";

export type PrototypeSettings = {
  course: CourseId;
  art: ArtSetting;
  indicator: boolean;
  rivals: boolean;
  ghost: boolean;
  touch: TouchSetting;
  rivalPace: RivalPace;
  interaction: InteractionSetting;
};

export const DEFAULT_SETTINGS: Readonly<PrototypeSettings> = Object.freeze({ course: "arlindo", art: "sample", indicator: true, rivals: true, ghost: false, touch: "auto", rivalPace: "adaptive", interaction: "off" });

export type CameraTuning = { zoomSlow: number; zoomFast: number; lead: number; roadLine: number };

export const DEFAULT_CAMERA: Readonly<CameraTuning> = Object.freeze({ zoomSlow: 1.45, zoomFast: 1.02, lead: 0.42, roadLine: 0.68 });

export type CameraSpec = { key: keyof CameraTuning; min: number; max: number; step: number; unit: "×" | "s" | "%" };

export const CAMERA_SPECS: readonly CameraSpec[] = [
  { key: "zoomSlow", min: 0.8, max: 2, step: 0.02, unit: "×" },
  { key: "zoomFast", min: 0.6, max: 1.6, step: 0.02, unit: "×" },
  { key: "lead", min: 0, max: 0.8, step: 0.02, unit: "s" },
  { key: "roadLine", min: 0.5, max: 0.8, step: 0.01, unit: "%" },
];

export type Source = "key" | "touch";

export class InputState {
  private space = new Set<Source>();
  private down = new Set<Source>();
  private left = new Set<Source>();
  private right = new Set<Source>();
  private spacePressed = 0;
  lastActivity = 0;

  setSpace(on: boolean, source: Source) {
    const was = this.space.size > 0;
    if (on) this.space.add(source);
    else this.space.delete(source);
    const now = this.space.size > 0;
    if (!was && now) this.spacePressed += 1;
    this.lastActivity += 1;
  }

  setDown(on: boolean, source: Source) {
    if (on) this.down.add(source);
    else this.down.delete(source);
    this.lastActivity += 1;
  }

  setLeft(on: boolean, source: Source) {
    if (on) this.left.add(source);
    else this.left.delete(source);
    this.lastActivity += 1;
  }

  setRight(on: boolean, source: Source) {
    if (on) this.right.add(source);
    else this.right.delete(source);
    this.lastActivity += 1;
  }

  get downHeld() {
    return this.down.size > 0;
  }

  get leftHeld() {
    return this.left.size > 0;
  }

  get rightHeld() {
    return this.right.size > 0;
  }

  sample(): SimInput {
    const spin = this.leftHeld === this.rightHeld ? 0 : this.leftHeld ? -1 : 1;
    const input: SimInput = { crouch: this.downHeld, jump: this.spacePressed > 0, spin };
    this.spacePressed = 0;
    return input;
  }

  discardEdges() {
    this.spacePressed = 0;
  }

  releaseSource(source: Source) {
    this.setSpace(false, source);
    this.setDown(false, source);
    this.setLeft(false, source);
    this.setRight(false, source);
    this.discardEdges();
  }

  releaseAll() {
    this.space.clear();
    this.down.clear();
    this.left.clear();
    this.right.clear();
    this.discardEdges();
  }
}

export type RunSummary = {
  time: number;
  best: number;
  place: number;
  total: number;
  perfect: number;
  ok: number;
  crashes: number;
  hits: number;
  shortcut: boolean;
  topSpeed: number;
  air: number;
};
