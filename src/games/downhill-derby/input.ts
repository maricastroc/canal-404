import type { SimInput } from "./sim/sim";

export type CameraTuning = { zoomSlow: number; zoomFast: number; lead: number; roadLine: number };

export const DEFAULT_CAMERA: Readonly<CameraTuning> = Object.freeze({ zoomSlow: 1.45, zoomFast: 1.02, lead: 0.42, roadLine: 0.68 });

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
    const input: SimInput = { crouch: this.downHeld, jump: this.spacePressed > 0, spin, hold: this.space.size > 0 };
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
