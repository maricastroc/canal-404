import * as Phaser from "phaser";
import { CREAM_HEX, INK, INK_HEX, cartoonText, fitText, paper } from "@/games/kit/ui";

const CREAM_TEXT = "#f7ecd4";
import type { TalentCopy } from "../copy";
import type { BandMember, SongId } from "../song/notation";
import { C, IconPool, MEMBER_COLOR, RING_GAP, TALLY_GAP, drawBeatLine, drawBurst, drawCall, drawEcho, drawNote, drawRegion, drawRingBase, drawRingFront, drawSparks, drawTail, drawTally, drawTrack, ribbon, type Spark } from "./lane";

export type CardButtonId = "primary" | "assist" | "calibrate";
export type DemoKind = "learn" | "tap" | "hold" | "echo" | "offbeat" | "static" | "medley";
export type BeatMark = "pending" | "now" | "done" | "missed";
export type PadPhase = "idle" | "count" | "taps" | "done" | "retry";
export type PadState = { phase: PadPhase; count: number; beat: number; beatAt: number; hitAt: number; pressAt: number; marks: BeatMark[] };

export type CardContent = {
  kicker: string;
  title: string;
  lead: string;
  face: string | null;
  demo: DemoKind | null;
  pad: "preview" | "live" | null;
  how: string;
  note: string;
  primary: { label: string; icon: string } | null;
  secondary: { id: Exclude<CardButtonId, "primary">; label: string; on: boolean }[];
  footer: string;
  footerIcon?: string;
};

export const DEMO_OF: Record<SongId, DemoKind> = { theme: "tap", signoff: "hold", recess: "echo", street: "offbeat", static: "static", medley: "medley" };

type DemoItem = { beat: number; kind: "tap" | "hold" | "call" | "echo"; end?: number; who: BandMember };
type DemoSpec = { loop: number; items: DemoItem[]; regions?: { from: number; to: number; kind: "call" | "echo" | "static" }[]; strongBeats?: boolean; listen?: [number, number]; tapHere?: boolean };

const DEMOS: Record<DemoKind, DemoSpec> = {
  learn: { loop: 2, items: [{ beat: 0, kind: "tap", who: "deco" }], tapHere: true },
  tap: { loop: 4, items: [0, 1, 2, 3].map((beat) => ({ beat, kind: "tap", who: "deco" })) },
  hold: {
    loop: 6,
    items: [
      { beat: 0, kind: "hold", end: 2.5, who: "lina" },
      { beat: 4, kind: "tap", who: "lina" },
    ],
  },
  echo: {
    loop: 8,
    items: [
      { beat: 0, kind: "call", who: "mila" },
      { beat: 1, kind: "call", who: "mila" },
      { beat: 2, kind: "call", who: "mila" },
      { beat: 4, kind: "echo", who: "mila" },
      { beat: 5, kind: "echo", who: "mila" },
      { beat: 6, kind: "echo", who: "mila" },
    ],
    regions: [
      { from: 0, to: 4, kind: "call" },
      { from: 4, to: 8, kind: "echo" },
    ],
    listen: [-0.5, 2.3],
  },
  offbeat: { loop: 4, items: [0.5, 1.5, 2.5, 3.5].map((beat) => ({ beat, kind: "tap", who: "bruno" })), strongBeats: true },
  static: { loop: 8, items: [0, 1, 2, 3, 4, 5, 6, 7].map((beat) => ({ beat, kind: "tap", who: "404" })), regions: [{ from: 3, to: 7, kind: "static" }] },
  medley: {
    loop: 6,
    items: [
      { beat: 0, kind: "tap", who: "deco" },
      { beat: 1, kind: "tap", who: "bruno" },
      { beat: 2, kind: "hold", end: 3.5, who: "lina" },
      { beat: 4.5, kind: "tap", who: "mila" },
    ],
  },
};

const BEAT_MS = 540;
const PRESS_MS = 150;

type Geometry = { w: number; h: number; hitX: number; laneY: number; r: number; ppb: number };

class DemoLane {
  readonly root: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private icons: IconPool;
  private front: Phaser.GameObjects.Graphics;
  private hand: Phaser.GameObjects.Image;
  private ear: Phaser.GameObjects.Container;
  private popup: Phaser.GameObjects.Text;
  private tags: Phaser.GameObjects.Text[] = [];
  private noise: Phaser.GameObjects.TileSprite;
  private kind: DemoKind = "tap";
  private t0 = 0;
  private last = 0;
  private sparks: Spark[] = [];
  private flash = { born: -Infinity, color: C.sun };
  private popupBorn = -Infinity;
  private pressUntil = -Infinity;
  private geo: Geometry = { w: 0, h: 0, hitX: 0, laneY: 0, r: 0, ppb: 0 };

  constructor(
    private scene: Phaser.Scene,
    private copy: TalentCopy,
    private fonts: { display: string; body: string },
    private reduced: boolean,
  ) {
    this.g = scene.add.graphics();
    this.noise = scene.add.tileSprite(0, 0, 10, 10, "talent-static").setOrigin(0, 0.5).setTileScale(3).setVisible(false);
    this.front = scene.add.graphics();
    this.hand = scene.add.image(0, 0, "icon-pointer").setOrigin(0.5, 0);
    this.ear = scene.add.container(0, 0, [scene.add.image(0, 0, "icon-ear-ink"), scene.add.image(0, 0, "icon-ear")]).setVisible(false);
    this.popup = cartoonText(scene, 0, 0, "", { size: 30, color: "#ffc83d", font: fonts.display, stroke: 0.22, shadow: false }).setOrigin(0.5);
    for (let i = 0; i < 3; i += 1) this.tags.push(cartoonText(scene, 0, 0, "", { size: 20, color: "#f7ecd4", font: fonts.display, stroke: 0.2, shadow: false }).setOrigin(0, 0.5).setVisible(false));
    this.root = scene.add.container(0, 0, [this.g, this.noise, this.front, this.ear, ...this.tags, this.popup, this.hand]);
    this.icons = new IconPool(() => {
      const icon = scene.add.image(0, 0, "icon-note");
      this.root.addAt(icon, this.root.getIndex(this.noise));
      return icon;
    });
  }

  setup(kind: DemoKind, w: number, h: number) {
    this.kind = kind;
    const r = Math.round(Math.min(34, h * 0.19));
    this.geo = { w, h, hitX: Math.round(r * 3.4), laneY: Math.round(h / 2), r, ppb: Math.round(Math.min(180, (w - r * 4) / 4.4)) };
    this.hand.setOrigin(0.33, 0.06).setScale((r * 1.7) / this.hand.height);
    this.t0 = performance.now() - BEAT_MS * 1.6;
    this.last = -Infinity;
    this.sparks = [];
    this.popup.setVisible(false);
  }

  update(now: number) {
    const { w, h, hitX, laneY, r, ppb } = this.geo;
    const spec = DEMOS[this.kind];
    const beat = (now - this.t0) / BEAT_MS;
    const g = this.g;
    const f = this.front;
    g.clear();
    f.clear();
    this.icons.begin();
    g.fillStyle(INK_HEX, 1).fillRoundedRect(4, 6, w, h, 22);
    g.fillStyle(C.plum700, 1).fillRoundedRect(0, 0, w, h, 22);
    g.lineStyle(5, INK_HEX, 1).strokeRoundedRect(0, 0, w, h, 22);
    const track = { x: 10, y: 10, w: w - 20, h: h - 20 };
    drawTrack(g, track, laneY, r);
    const left = track.x + 6;
    const right = track.x + track.w - 6;
    const loopStart = Math.floor(beat / spec.loop) * spec.loop;
    const xOf = (b: number) => hitX + (b - beat) * ppb;
    const edge = (x: number) => Math.max(0, Math.min(1, (right - x) / (r * 1.6)));
    let tag = 0;
    let staticSpan: [number, number] | null = null;
    for (let k = -1; k <= 2; k += 1) {
      const base = loopStart + k * spec.loop;
      for (const region of spec.regions ?? []) {
        const x0 = Math.max(left, xOf(base + region.from));
        const x1 = Math.min(right, xOf(base + region.to));
        if (x1 <= x0) continue;
        if (region.kind === "static") {
          staticSpan = [x0, x1];
          continue;
        }
        const call = region.kind === "call";
        drawRegion(g, x0, x1, laneY, r, call ? C.plum600 : C.sun, call ? 0.75 : 0.3, call ? null : xOf(base + region.from));
        const text = this.tags[tag];
        const marks = spec.items.filter((item) => item.kind === region.kind && item.beat >= region.from && item.beat < region.to);
        const gap = TALLY_GAP * 0.8;
        if (text) text.setText(call ? this.copy.milaTurn : this.copy.yourTurn);
        const floor = x0 < hitX + r + RING_GAP + 30 ? hitX + r + RING_GAP + 30 : x0 + 8;
        const tx = text ? Math.min(x1 - text.width - marks.length * gap - 12, Math.max(floor, xOf(base + region.from) + 8)) : 0;
        if (text && tx >= floor - 1) {
          tag += 1;
          text.setColor(call ? "#b9a6ef" : "#ffc83d").setPosition(tx, track.y + 16).setVisible(true);
          marks.forEach((item, i) => {
            const x = text.x + text.width + 4 + gap / 2 + i * gap;
            if (x > left + 8 && x < x1 - 8) drawTally(g, x, track.y + 16, call ? "call" : "echo", base + item.beat <= beat ? "done" : "waiting");
          });
        }
      }
    }
    for (let b = Math.floor(beat - 3); b <= beat + 8; b += 1) {
      const x = xOf(b);
      if (x > left + 4 && x < right - 4) drawBeatLine(g, x, laneY, r, spec.strongBeats === true || b % 4 === 0);
    }
    let holding = false;
    for (let k = -1; k <= 2; k += 1) {
      const base = loopStart + k * spec.loop;
      for (const item of spec.items) {
        const at = base + item.beat;
        const x = xOf(at);
        const color = MEMBER_COLOR[item.who];
        if (item.kind === "hold" && item.end !== undefined) {
          const end = base + item.end;
          const xEnd = xOf(end);
          if (xEnd < left - r || x > right + r) continue;
          if (at <= beat && end > beat) {
            holding = true;
            drawTail(g, hitX, xEnd, laneY, r, color, 0.9, left, right);
            drawNote(g, this.icons, hitX, laneY, r, color, 1, false);
          } else if (at > beat) {
            drawTail(g, x, xEnd, laneY, r, color, 0.75 * edge(x), left, right);
            if (x < right) drawNote(g, this.icons, x, laneY, r, color, edge(x), false);
          }
          continue;
        }
        if (x < left - r || x > right) continue;
        if (item.kind === "call") {
          const alpha = x < hitX ? Math.max(0, 1 - (hitX - x) / 90) : edge(x);
          drawCall(g, x, laneY, r, alpha);
          continue;
        }
        if (at <= beat) continue;
        const hidden = staticSpan !== null && x >= staticSpan[0] - r * 0.4 && x <= staticSpan[1] + r * 0.4;
        if (hidden) continue;
        if (item.kind === "echo") drawEcho(g, x, laneY, r, edge(x));
        else drawNote(g, this.icons, x, laneY, r, color, edge(x));
      }
    }
    this.icons.end();
    if (staticSpan) {
      const [x0, x1] = staticSpan;
      const half = ribbon(r) - 3;
      this.noise.setVisible(true).setPosition(x0, laneY).setSize(x1 - x0, half * 2);
      this.noise.tilePositionX = beat * 30;
      this.noise.tilePositionY = this.reduced ? 0 : now * 0.01;
      const text = this.tags[tag];
      if (text && x1 - x0 > 100) {
        tag += 1;
        text.setText(this.copy.noSignal).setColor("#f7ecd4");
        text.setPosition((x0 + x1) / 2 - text.width / 2, track.y + 16).setVisible(true);
      }
    } else {
      this.noise.setVisible(false);
    }
    if (spec.tapHere && this.tags[tag]) {
      this.tags[tag].setText(this.copy.tapHere.toUpperCase()).setColor("#ffc83d").setPosition(hitX + r + RING_GAP + 28, track.y + 16).setVisible(true);
      tag += 1;
    }
    for (let i = tag; i < this.tags.length; i += 1) this.tags[i].setVisible(false);
    this.fireEvents(spec, beat, now);
    const flashK = Math.max(0, 1 - (now - this.flash.born) / 260);
    const pulse = this.reduced ? 0 : Math.max(0, 1 - (((beat % 1) + 1) % 1) * 4);
    const phase = beat - loopStart;
    const listen = spec.listen !== undefined && ((phase >= spec.listen[0] && phase < spec.listen[1]) || phase - spec.loop >= spec.listen[0]);
    const ring = { pulse, flash: flashK, flashColor: this.flash.color, lit: this.reduced ? 0 : -Math.floor(beat), shake: 0, holding, listen };
    this.ear.setVisible(listen).setPosition(hitX, laneY).setScale((r * 1.2) / 96);
    drawRingBase(f, hitX, laneY, r, ring);
    drawRingFront(f, hitX, laneY, r, ring);
    if (flashK > 0) drawBurst(f, hitX, laneY, r, this.flash.color, 1 - flashK);
    this.sparks = this.sparks.filter((s) => now - s.born < 380);
    drawSparks(f, hitX, laneY, r, this.sparks, now, 380);
    const pressed = holding || now < this.pressUntil;
    const reach = pressed ? r * 0.2 : r * 0.62;
    this.hand.setPosition(hitX + reach, laneY + reach).setAlpha(pressed ? 1 : 0.9);
    const age = (now - this.popupBorn) / 620;
    if (age >= 0 && age < 1) this.popup.setVisible(true).setPosition(hitX, -10 - (this.reduced ? 0 : age * 16)).setAlpha(1 - age * age);
    else this.popup.setVisible(false);
    this.last = beat;
  }

  private fireEvents(spec: DemoSpec, beat: number, now: number) {
    if (!Number.isFinite(this.last) || beat <= this.last) return;
    const base = Math.floor(this.last / spec.loop) * spec.loop;
    for (let k = 0; k <= 1; k += 1) {
      for (const item of spec.items) {
        const at = base + k * spec.loop + item.beat;
        if (item.kind === "call") {
          if (at > this.last && at <= beat) this.flash = { born: now, color: C.plum300 };
          continue;
        }
        if (at > this.last && at <= beat) this.hit(item.kind === "hold" ? null : "perfect", MEMBER_COLOR[item.who], now, item.kind === "hold");
        if (item.kind === "hold" && item.end !== undefined) {
          const end = base + k * spec.loop + item.end;
          if (end > this.last && end <= beat) this.hit("held", C.sun, now, false);
        }
      }
    }
  }

  private hit(mark: "perfect" | "held" | null, color: number, now: number, hold: boolean) {
    this.pressUntil = now + PRESS_MS;
    this.flash = { born: now, color: hold ? color : C.sun };
    this.sparks.push({ born: now, color: hold ? color : C.sun, seed: now % 7 });
    if (mark) {
      this.popup.setText(this.copy.marks[mark]);
      this.popupBorn = now;
    }
  }
}

const PAD_BEAT_MS = 600;
const PAD_LOOP = 16;
const PAD_SPARK_MS = 380;

class CalibPad {
  readonly root: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private front: Phaser.GameObjects.Graphics;
  private row: Phaser.GameObjects.Graphics;
  private number: Phaser.GameObjects.Text;
  private caption: Phaser.GameObjects.Text;
  private counter: Phaser.GameObjects.Text;
  private ear: Phaser.GameObjects.Container;
  private hand: Phaser.GameObjects.Image;
  private tick: Phaser.GameObjects.Image;
  private checks: IconPool;
  private sparks: Spark[] = [];
  private lastHit = -Infinity;
  private t0 = 0;
  private geo = { w: 0, h: 0, cx: 0, cy: 0, r: 0, x0: 0, x1: 0, rowY: 0, capY: 0 };

  constructor(
    scene: Phaser.Scene,
    private copy: TalentCopy,
    fonts: { display: string; body: string },
    private sizes: { title: number; body: number; small: number },
    private reduced: boolean,
  ) {
    this.g = scene.add.graphics();
    this.front = scene.add.graphics();
    this.row = scene.add.graphics();
    this.number = cartoonText(scene, 0, 0, "", { size: 72, color: CREAM_TEXT, font: fonts.display, stroke: 0.16, shadow: false }).setOrigin(0.5);
    this.caption = cartoonText(scene, 0, 0, "", { size: sizes.body + 8, color: "#ffc83d", font: fonts.display, stroke: 0.2, shadow: false }).setOrigin(0, 0.5);
    this.counter = cartoonText(scene, 0, 0, "", { size: sizes.body, color: CREAM_TEXT, font: fonts.display, stroke: 0.2, shadow: false }).setOrigin(1, 0.5);
    this.ear = scene.add.container(0, 0, [scene.add.image(0, 0, "icon-ear-ink"), scene.add.image(0, 0, "icon-ear")]);
    this.hand = scene.add.image(0, 0, "icon-pointer").setOrigin(0.33, 0.06);
    this.tick = scene.add.image(0, 0, "icon-check");
    this.root = scene.add.container(0, 0, [this.g, this.row, this.front, this.number, this.ear, this.tick, this.hand, this.caption, this.counter]);
    this.checks = new IconPool(() => {
      const icon = scene.add.image(0, 0, "icon-check");
      this.root.addAt(icon, this.root.getIndex(this.row) + 1);
      return icon;
    });
  }

  setup(w: number, h: number) {
    const r = Math.round(Math.min(44, h * 0.25));
    const cx = r + RING_GAP + 40;
    const x0 = cx + r + RING_GAP + 64;
    this.geo = { w, h, cx, cy: h / 2, r, x0, x1: w - 30, rowY: h * 0.68, capY: h * 0.3 };
    this.number.setFontSize(Math.round(r * 1.25));
    this.hand.setScale((r * 1.5) / this.hand.height);
    this.t0 = performance.now();
    this.sparks = [];
    this.lastHit = -Infinity;
  }

  preview(now: number) {
    const beat = (now - this.t0) / PAD_BEAT_MS;
    const b = beat % PAD_LOOP;
    const i = Math.floor(b);
    const start = now - (b - i) * PAD_BEAT_MS;
    const phase: PadPhase = b < 1 ? "idle" : b < 5 ? "count" : b < 13 ? "taps" : "done";
    const done = phase === "taps" ? i - 5 + (b - i > 0.06 ? 1 : 0) : phase === "done" ? 8 : 0;
    const hitAt = phase === "taps" ? start + 0.06 * PAD_BEAT_MS : -Infinity;
    const marks: BeatMark[] = Array.from({ length: 8 }, (_, k) => (k < done ? "done" : phase === "taps" && k === done ? "now" : "pending"));
    this.draw({ phase, count: phase === "count" ? i : 0, beat: i, beatAt: phase === "count" || phase === "taps" ? start : -Infinity, hitAt, pressAt: hitAt, marks }, now);
  }

  draw(state: PadState, now: number) {
    const { w, h, cx, cy, r, x0, x1, rowY, capY } = this.geo;
    const g = this.g;
    const f = this.front;
    const row = this.row;
    g.clear();
    f.clear();
    row.clear();
    this.checks.begin();
    g.fillStyle(INK_HEX, 1).fillRoundedRect(4, 6, w, h, 22);
    g.fillStyle(C.plum700, 1).fillRoundedRect(0, 0, w, h, 22);
    g.lineStyle(5, INK_HEX, 1).strokeRoundedRect(0, 0, w, h, 22);
    const listen = state.phase === "idle" || state.phase === "count";
    const pulse = this.reduced ? 0 : Math.max(0, 1 - (now - state.beatAt) / 260);
    const hitK = Math.max(0, 1 - (now - state.hitAt) / 280);
    const pressK = Math.max(0, 1 - (now - state.pressAt) / 200);
    if (state.hitAt !== this.lastHit && now - state.hitAt < 100) this.sparks.push({ born: now, color: C.sun, seed: (now % 1000) / 160 });
    this.lastHit = state.hitAt;
    const ring = { pulse, flash: Math.max(hitK, pressK * 0.4), flashColor: hitK > 0 ? C.sun : C.cream, lit: this.reduced ? 0 : -state.beat, shake: 0, holding: false, listen };
    drawRingBase(g, cx, cy, r, ring);
    const finished = state.phase === "done";
    if (finished) g.fillStyle(C.mint, 1).fillCircle(cx, cy, r);
    drawRingFront(f, cx, cy, r, ring);
    if (hitK > 0) drawBurst(f, cx, cy, r, C.sun, 1 - hitK);
    this.sparks = this.sparks.filter((s) => now - s.born < PAD_SPARK_MS);
    drawSparks(f, cx, cy, r, this.sparks, now, PAD_SPARK_MS);
    this.number.setVisible(state.phase === "count" && state.count > 0).setText(String(state.count)).setPosition(cx, cy).setScale(1 + 0.25 * pulse);
    this.ear.setVisible(state.phase === "idle").setPosition(cx, cy).setScale((r * 1.2) / 96);
    this.tick.setVisible(finished).setPosition(cx, cy).setScale((r * 1.3) / this.tick.height);
    const pressed = now - state.pressAt < 150;
    const reach = pressed ? r * 0.15 : r * 0.55;
    this.hand.setVisible(state.phase === "taps" || state.phase === "retry").setPosition(cx + reach, cy + reach).setAlpha(state.phase === "retry" ? 0.6 : 1);
    const caption = { idle: this.copy.padListen, count: this.copy.padListen, taps: this.copy.padTap, done: this.copy.padDone, retry: this.copy.padRetry }[state.phase];
    const color = { idle: "#b9a6ef", count: "#b9a6ef", taps: "#ffc83d", done: "#63d6c1", retry: CREAM_TEXT }[state.phase];
    this.caption.setText(caption.toUpperCase()).setColor(color).setPosition(x0, capY);
    const count = state.marks.filter((m) => m === "done").length;
    this.counter.setText(this.copy.calibCount(count, state.marks.length).toUpperCase()).setPosition(x1, capY);
    const n = state.marks.length;
    const a = x0 + 20;
    const b = x1 - 20;
    const gap = (b - a) / Math.max(1, n - 1);
    row.lineStyle(5, C.plum500, 1).lineBetween(a, rowY, b, rowY);
    state.marks.forEach((mark, k) => {
      const x = a + k * gap;
      if (mark === "done") {
        const pop = 1 + 0.35 * Math.max(0, 1 - (now - state.hitAt) / 220) * (k === count - 1 ? 1 : 0);
        const rr = 17 * (this.reduced ? 1 : pop);
        row.fillStyle(INK_HEX, 1).fillCircle(x + 2, rowY + 3, rr);
        row.fillStyle(C.mint, 1).fillCircle(x, rowY, rr);
        row.lineStyle(4, INK_HEX, 1).strokeCircle(x, rowY, rr);
        this.checks.place(x, rowY + 1, rr * 1.35, 1);
      } else if (mark === "now") {
        const halo = 25 + 6 * pulse;
        row.lineStyle(4, C.sunPale, 0.9).strokeCircle(x, rowY, halo);
        row.fillStyle(C.sun, 1).fillCircle(x, rowY, 19);
        row.lineStyle(5, INK_HEX, 1).strokeCircle(x, rowY, 19);
        row.fillStyle(INK_HEX, 1).fillCircle(x, rowY, 5);
      } else if (mark === "missed") {
        row.fillStyle(C.plum800, 1).fillCircle(x, rowY, 13);
        row.lineStyle(3, C.gray, 1).strokeCircle(x, rowY, 13);
        row.lineStyle(4, C.cream3, 1).lineBetween(x - 6, rowY - 6, x + 6, rowY + 6).lineBetween(x - 6, rowY + 6, x + 6, rowY - 6);
      } else {
        row.fillStyle(C.plum950, 1).fillCircle(x, rowY, 13);
        row.lineStyle(3, C.plum300, 1).strokeCircle(x, rowY, 13);
      }
    });
    this.checks.end();
  }
}

type Button = { id: CardButtonId; root: Phaser.GameObjects.Container; box: Phaser.Geom.Rectangle };

export class ShowCard {
  readonly root: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private kickerBg: Phaser.GameObjects.Graphics;
  private kicker: Phaser.GameObjects.Text;
  private title: Phaser.GameObjects.Text;
  private lead: Phaser.GameObjects.Text;
  private face: Phaser.GameObjects.Image;
  private how: Phaser.GameObjects.Text;
  private note: Phaser.GameObjects.Text;
  private footer: Phaser.GameObjects.Text;
  private footerIcon: Phaser.GameObjects.Image;
  private demo: DemoLane;
  private pad: CalibPad;
  private buttons: Button[] = [];
  private buttonLayer: Phaser.GameObjects.Container;
  private demoOn = false;
  private padMode: CardContent["pad"] = null;
  private w: number;
  private x0: number;
  private top: number;

  constructor(
    private scene: Phaser.Scene,
    private copy: TalentCopy,
    private fonts: { display: string; body: string },
    private box: { cx: number; top: number; w: number; maxH: number },
    private sizes: { title: number; body: number; small: number },
    private stacked: boolean,
    reduced: boolean,
  ) {
    this.w = box.w;
    this.x0 = box.cx - box.w / 2;
    this.top = box.top;
    this.bg = scene.add.graphics();
    this.kickerBg = scene.add.graphics();
    this.kicker = cartoonText(scene, 0, 0, "", { size: sizes.small, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.title = cartoonText(scene, 0, 0, "", { size: sizes.title, color: "#ffc83d", font: fonts.display, stroke: 0.18 }).setOrigin(0.5);
    this.lead = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.body}px`, color: INK, align: "center", lineSpacing: 4 }).setOrigin(0, 0);
    this.face = scene.add.image(0, 0, "head-deco-happy").setOrigin(0.5).setVisible(false);
    this.demo = new DemoLane(scene, copy, fonts, reduced);
    this.pad = new CalibPad(scene, copy, fonts, sizes, reduced);
    this.how = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: `${sizes.body + 2}px`, color: INK, align: "center", lineSpacing: 2 }).setOrigin(0.5, 0);
    this.note = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.small + 1}px`, color: "#5a4790", align: "center" }).setOrigin(0.5, 0);
    this.buttonLayer = scene.add.container(0, 0);
    this.footerIcon = scene.add.image(0, 0, "icon-sound").setOrigin(0, 0.5);
    this.footer = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.small - 2}px`, color: "#7b62c4", align: "left", lineSpacing: 2 }).setOrigin(0, 0.5);
    this.root = scene.add
      .container(this.x0, this.top, [this.bg, this.kickerBg, this.kicker, this.title, this.face, this.lead, this.demo.root, this.pad.root, this.how, this.note, this.buttonLayer, this.footerIcon, this.footer])
      .setDepth(30)
      .setVisible(false);
  }

  get visible() {
    return this.root.visible;
  }

  show(c: CardContent) {
    const pad = 44;
    const inner = this.w - pad * 2;
    const mid = this.w / 2;
    let y = 38;
    this.kicker.setText(c.kicker.toUpperCase());
    this.title.setText(c.title.toUpperCase()).setFontSize(this.sizes.title);
    fitText(this.title, inner, this.sizes.title, 36);
    this.title.setPosition(mid, y + this.title.height / 2);
    y += this.title.height + 6;
    this.lead.setText(c.lead).setWordWrapWidth(inner - (c.face ? 90 : 0));
    if (c.face) {
      this.face.setTexture(c.face).setVisible(true);
      this.face.setScale(66 / this.face.height);
      const groupW = this.face.displayWidth + 14 + this.lead.width;
      const gx = mid - groupW / 2;
      const rowH = Math.max(66, this.lead.height);
      this.face.setPosition(gx + this.face.displayWidth / 2, y + rowH / 2);
      this.lead.setPosition(gx + this.face.displayWidth + 14, y + rowH / 2 - this.lead.height / 2);
      y += rowH + 10;
    } else {
      this.face.setVisible(false);
      this.lead.setPosition(mid - this.lead.width / 2, y);
      y += this.lead.height + 18;
    }
    this.demoOn = c.demo !== null;
    const demoH = this.stacked ? 184 : 156;
    if (c.demo) {
      y += 18;
      this.demo.root.setVisible(true).setPosition(pad, y);
      this.demo.setup(c.demo, inner, demoH);
      y += demoH + 22;
    } else {
      this.demo.root.setVisible(false);
    }
    this.padMode = c.pad;
    if (c.pad) {
      const padH = this.stacked ? 200 : 176;
      y += c.demo ? 0 : 14;
      this.pad.root.setVisible(true).setPosition(pad, y);
      this.pad.setup(inner, padH);
      y += padH + 26;
    } else {
      this.pad.root.setVisible(false);
    }
    this.how.setText(c.how).setWordWrapWidth(inner).setPosition(mid, y);
    y += c.how ? this.how.height + 10 : 0;
    this.note.setText(c.note).setWordWrapWidth(inner).setPosition(mid, y);
    y += c.note ? this.note.height + 18 : 6;
    y = this.layoutButtons(c, y, pad, inner);
    this.footer.setText(c.footer).setWordWrapWidth(inner - 44).setVisible(c.footer !== "");
    this.footerIcon.setTexture(c.footerIcon ?? "icon-sound").setVisible(c.footer !== "");
    this.footerIcon.setScale(Math.min(1, 40 / this.footerIcon.height));
    if (c.footer) {
      const fw = this.footerIcon.displayWidth + 10 + this.footer.width;
      const fy = y + Math.max(this.footer.height, 30) / 2 + 4;
      this.footerIcon.setPosition(mid - fw / 2, fy);
      this.footer.setPosition(mid - fw / 2 + this.footerIcon.displayWidth + 10, fy);
      y += Math.max(this.footer.height, 30) + 24;
    } else {
      y += 12;
    }
    const h = y;
    this.bg.clear();
    paper(this.bg, 0, 0, this.w, h, 34, CREAM_HEX, 10);
    this.bg.lineStyle(4, C.sun, 1).strokeRoundedRect(12, 12, this.w - 24, h - 24, 26);
    const kw = this.kicker.width + 40;
    this.kickerBg.clear();
    this.kickerBg.fillStyle(INK_HEX, 1).fillRoundedRect(mid - kw / 2 + 4, -22 + 5, kw, 44, 14);
    this.kickerBg.fillStyle(C.mint, 1).fillRoundedRect(mid - kw / 2, -22, kw, 44, 14);
    this.kickerBg.lineStyle(4, INK_HEX, 1).strokeRoundedRect(mid - kw / 2, -22, kw, 44, 14);
    this.kicker.setPosition(mid, 0);
    const top = Math.max(16, this.box.top + (this.box.maxH - h) / 2);
    this.top = top;
    this.root.setPosition(this.x0, top).setVisible(true);
    for (const b of this.buttons) b.box.setPosition(this.x0 + (b.root.x - b.box.width / 2), top + (b.root.y - b.box.height / 2));
  }

  private layoutButtons(c: CardContent, y: number, pad: number, inner: number) {
    this.buttonLayer.removeAll(true);
    this.buttons = [];
    const mid = this.w / 2;
    const primaryH = this.stacked ? 86 : 76;
    const smallH = this.stacked ? 68 : 62;
    const make = (id: CardButtonId, label: string, x: number, cy: number, w: number, h: number, fill: number, icon: string | null, size: number) => {
      const g = this.scene.add.graphics();
      g.fillStyle(INK_HEX, 1).fillRoundedRect(-w / 2 + 5, -h / 2 + 7, w, h, 18);
      g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      g.lineStyle(5, INK_HEX, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
      const text = cartoonText(this.scene, 0, 0, label.toUpperCase(), { size, color: INK, font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
      fitText(text, w - (icon ? 86 : 36), size, Math.round(size * 0.6));
      const parts: Phaser.GameObjects.GameObject[] = [g, text];
      if (icon) {
        const img = this.scene.add.image(0, 0, icon).setOrigin(0.5);
        img.setScale((size * 1.05) / img.height);
        const total = img.displayWidth + 12 + text.width;
        img.setPosition(-total / 2 + img.displayWidth / 2, 0);
        text.setX(-total / 2 + img.displayWidth + 12 + text.width / 2);
        parts.push(img);
      }
      const root = this.scene.add.container(x, cy, parts);
      this.buttonLayer.add(root);
      this.buttons.push({ id, root, box: new Phaser.Geom.Rectangle(0, 0, w, h) });
    };
    const small = c.secondary;
    if (!c.primary && small.length === 0) return y;
    if (this.stacked || small.length === 0) {
      if (c.primary) {
        const w = Math.min(inner, 520);
        make("primary", c.primary.label, mid, y + primaryH / 2, w, primaryH, C.sun, c.primary.icon, this.sizes.body + 6);
        y += primaryH + 18;
      }
      if (small.length) {
        const gap = 22;
        const w = (inner - gap * (small.length - 1)) / small.length;
        small.forEach((s, i) => make(s.id, s.label, pad + w / 2 + i * (w + gap), y + smallH / 2, w, smallH, s.on ? C.sun : C.cream2, null, this.sizes.small));
        y += smallH + 18;
      }
      return y;
    }
    const gap = 20;
    const primaryW = 330;
    const smallW = (inner - primaryW - gap * small.length) / small.length;
    small.forEach((s, i) => make(s.id, s.label, pad + smallW / 2 + i * (smallW + gap), y + primaryH / 2, smallW, smallH, s.on ? C.sun : C.cream2, null, this.sizes.small));
    if (c.primary) make("primary", c.primary.label, pad + inner - primaryW / 2, y + primaryH / 2, primaryW, primaryH, C.sun, c.primary.icon, this.sizes.body + 6);
    return y + primaryH + 18;
  }

  hide() {
    this.root.setVisible(false);
    this.demoOn = false;
    this.padMode = null;
  }

  update(now: number) {
    if (!this.root.visible) return;
    if (this.demoOn) this.demo.update(now);
    if (this.padMode === "preview") this.pad.preview(now);
  }

  drawPad(state: PadState, now: number) {
    if (this.root.visible && this.padMode === "live") this.pad.draw(state, now);
  }

  buttonAt(x: number, y: number): CardButtonId | null {
    if (!this.root.visible) return null;
    return this.buttons.find((b) => b.box.contains(x, y))?.id ?? null;
  }

  press(id: CardButtonId | null) {
    for (const b of this.buttons) b.root.setScale(b.id === id ? 0.96 : 1);
  }
}
