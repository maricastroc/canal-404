import type * as Phaser from "phaser";

export function coarsePointer() {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
}

export function isTouchPointer(p: Phaser.Input.Pointer) {
  return p.wasTouch || (p.event as PointerEvent | undefined)?.pointerType === "touch";
}
