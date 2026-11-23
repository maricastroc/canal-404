import * as Phaser from "phaser";
import { CREAM_HEX, INK, INK_HEX, cartoonText, fitText, paper } from "@/games/kit/ui";
import type { TalentCopy } from "../copy";
import type { BandMember, SongId } from "../song/notation";
import { C, IconPool, MEMBER_COLOR, RING_GAP, TALLY_GAP, drawBeatLine, drawBurst, drawCall, drawEcho, drawNote, drawRegion, drawRingBase, drawRingFront, drawSparks, drawTail, drawTally, drawTrack, ghostAlpha, ribbon, type Spark } from "./lane";

export type CardButtonId = "primary" | "assist";
export type CardMode = "row" | "stacked" | "phone";
export type DemoKind = "learn" | "tap" | "hold" | "echo" | "offbeat" | "static" | "medley";

export type CardContent = {
  kicker: string;
  title: string;
  lead: string;
  face: string | null;
  demo: DemoKind | null;
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

function wrapLines(text: Phaser.GameObjects.Text, content: string, max: number) {
  text.setWordWrapWidth(max);
  const count = text.getWrappedText(content).length;
  if (count < 2) return content;
  const sentences = content.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [];
  const widthOf = (line: string) => (text.getWrappedText(line).length === 1 ? text.setText(line).width : Infinity);
  const found = { lines: null as string[] | null, width: Infinity };
  const split = (from: number, left: number, lines: string[]) => {
    if (left === 1) {
      const all = [...lines, sentences.slice(from).join(" ")];
      const widest = Math.max(...all.map(widthOf));
      if (widest < found.width) Object.assign(found, { lines: all, width: widest });
      return;
    }
    for (let end = from + 1; end <= sentences.length - left + 1; end += 1) split(end, left - 1, [...lines, sentences.slice(from, end).join(" ")]);
  };
  if (sentences.length >= count && sentences.join(" ") === content.trim()) split(0, count, []);
  if (found.lines) return found.lines.join("\n");
  let lo = max / 2;
  let hi = max;
  while (hi - lo > 4) {
    const mid = (lo + hi) / 2;
    text.setWordWrapWidth(mid);
    if (text.getWrappedText(content).length > count) lo = mid;
    else hi = mid;
  }
  text.setWordWrapWidth(hi);
  const lines = text.getWrappedText(content);
  text.setWordWrapWidth(max);
  return lines.join("\n");
}

type Geometry = { w: number; h: number; hitX: number; laneY: number; r: number; ppb: number };

class DemoLane {
  readonly root: Phaser.GameObjects.Container;
  private g: Phaser.GameObjects.Graphics;
  private icons: IconPool;
  private ghostG: Phaser.GameObjects.Graphics;
  private ghostIcons: IconPool;
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
    private vertical: boolean,
    tagSize: number,
  ) {
    const upright = vertical ? Math.PI / 2 : 0;
    this.g = scene.add.graphics();
    this.noise = scene.add.tileSprite(0, 0, 10, 10, "talent-static").setOrigin(0, 0.5).setTileScale(3).setVisible(false);
    this.ghostG = scene.add.graphics();
    this.front = scene.add.graphics();
    this.hand = scene.add.image(0, 0, "icon-pointer").setOrigin(0.5, 0).setRotation(upright);
    this.ear = scene.add.container(0, 0, [scene.add.image(0, 0, "icon-ear-ink"), scene.add.image(0, 0, "icon-ear")]).setVisible(false).setRotation(upright);
    this.popup = cartoonText(scene, 0, 0, "", { size: Math.round(tagSize * 1.5), color: "#ffc83d", font: fonts.display, stroke: 0.22, shadow: false }).setOrigin(0.5).setRotation(upright);
    for (let i = 0; i < 3; i += 1) this.tags.push(cartoonText(scene, 0, 0, "", { size: tagSize, color: "#f7ecd4", font: fonts.display, stroke: 0.2, shadow: false }).setOrigin(0, 0.5).setVisible(false));
    this.root = scene.add.container(0, 0, [this.g, this.noise, this.ghostG, this.front, this.ear, ...this.tags, this.popup, this.hand]).setRotation(-upright);
    this.icons = new IconPool(() => {
      const icon = scene.add.image(0, 0, "icon-note").setRotation(upright);
      this.root.addAt(icon, this.root.getIndex(this.noise));
      return icon;
    });
    this.ghostIcons = new IconPool(() => {
      const icon = scene.add.image(0, 0, "icon-note").setRotation(upright);
      this.root.addAt(icon, this.root.getIndex(this.front));
      return icon;
    });
  }

  hitFromEnd() {
    return this.geo.hitX;
  }

  place(x: number, y: number, w: number, h: number) {
    this.root.setVisible(true).setPosition(x, this.vertical ? y + h : y);
  }

  setup(kind: DemoKind, w: number, h: number) {
    this.kind = kind;
    if (this.vertical) {
      const r = Math.round(Math.min(44, h * 0.19));
      const hitX = Math.round(r * 3.4);
      this.geo = { w, h, hitX, laneY: Math.round(h / 2), r, ppb: Math.round(Math.min(180, (w - hitX - 10) / 3.3)) };
    } else {
      const r = Math.round(Math.min(34, h * 0.19));
      this.geo = { w, h, hitX: Math.round(r * 3.4), laneY: Math.round(h / 2), r, ppb: Math.round(Math.min(180, (w - r * 4) / 4.4)) };
    }
    this.hand.setOrigin(0.33, 0.06).setScale((this.geo.r * 1.7) / this.hand.height);
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
    this.ghostG.clear();
    this.icons.begin();
    this.ghostIcons.begin();
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
        if (hidden) {
          drawNote(this.ghostG, this.ghostIcons, x, laneY, r, color, ghostAlpha("lost", false, Math.round(at * 4), now, this.reduced, at - beat) * edge(x));
          continue;
        }
        if (item.kind === "echo") drawEcho(g, x, laneY, r, edge(x));
        else drawNote(g, this.icons, x, laneY, r, color, edge(x));
      }
    }
    this.icons.end();
    this.ghostIcons.end();
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
    const ring = { pulse, flash: flashK, flashColor: this.flash.color, shake: 0, holding, listen, press: Math.max(0, 1 - (now - (this.pressUntil - PRESS_MS)) / 110) };
    this.ear.setVisible(listen).setPosition(hitX, laneY).setScale((r * 1.2) / 96);
    drawRingBase(f, hitX, laneY, r, ring);
    drawRingFront(f, hitX, laneY, r, ring);
    if (flashK > 0) drawBurst(f, hitX, laneY, r, this.flash.color, 1 - flashK);
    this.sparks = this.sparks.filter((s) => now - s.born < 380);
    drawSparks(f, hitX, laneY, r, this.sparks, now, 380);
    const pressed = holding || now < this.pressUntil;
    const reach = pressed ? r * 0.2 : r * 0.62;
    this.hand.setPosition(this.vertical ? hitX - reach : hitX + reach, laneY + reach).setAlpha(pressed ? 1 : 0.9);
    const age = (now - this.popupBorn) / 620;
    const rise = this.reduced ? 0 : age * 16;
    if (age >= 0 && age < 1) {
      if (this.vertical) this.popup.setPosition(hitX - r * 0.4 + rise, h + 30 + this.popup.width / 2);
      else this.popup.setPosition(hitX, -10 - rise);
      this.popup.setVisible(true).setAlpha(1 - age * age);
    } else this.popup.setVisible(false);
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
  private buttons: Button[] = [];
  private buttonLayer: Phaser.GameObjects.Container;
  private demoOn = false;
  private stacked: boolean;
  private w: number;
  private x0: number;
  private top: number;

  constructor(
    private scene: Phaser.Scene,
    private copy: TalentCopy,
    private fonts: { display: string; body: string },
    private box: { cx: number; top: number; w: number; maxH: number },
    private sizes: { title: number; body: number; small: number; tag: number },
    private mode: CardMode,
    reduced: boolean,
  ) {
    this.stacked = mode !== "row";
    this.w = box.w;
    this.x0 = box.cx - box.w / 2;
    this.top = box.top;
    this.bg = scene.add.graphics();
    this.kickerBg = scene.add.graphics();
    this.kicker = cartoonText(scene, 0, 0, "", { size: sizes.small, color: INK, font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.title = cartoonText(scene, 0, 0, "", { size: sizes.title, color: "#ffc83d", font: fonts.display, stroke: 0.18 }).setOrigin(0.5);
    this.lead = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.body}px`, color: INK, align: "center", lineSpacing: 4 }).setOrigin(0, 0);
    this.face = scene.add.image(0, 0, "head-deco-happy").setOrigin(0.5).setVisible(false);
    this.demo = new DemoLane(scene, copy, fonts, reduced, mode === "phone", sizes.tag);
    this.how = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: `${sizes.body + 2}px`, color: INK, align: "center", lineSpacing: 2 }).setOrigin(0.5, 0);
    this.note = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.small + 1}px`, color: "#5a4790", align: "center" }).setOrigin(0.5, 0);
    this.buttonLayer = scene.add.container(0, 0);
    this.footerIcon = scene.add.image(0, 0, "icon-sound").setOrigin(0, 0.5);
    this.footer = scene.add.text(0, 0, "", { fontFamily: fonts.body, fontStyle: "700", fontSize: `${sizes.small - 2}px`, color: "#7b62c4", align: "left", lineSpacing: 2 }).setOrigin(0, 0.5);
    this.root = scene.add
      .container(this.x0, this.top, [this.bg, this.kickerBg, this.kicker, this.title, this.face, this.lead, this.demo.root, this.how, this.note, this.buttonLayer, this.footerIcon, this.footer])
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
    const column = this.mode === "phone" && c.demo !== null;
    const demoW = 264;
    const textW = inner - demoW - 34;
    this.lead.setText(wrapLines(this.lead, c.lead, (column ? textW : inner) - (c.face ? 90 : 0)));
    if (column) {
      this.face.setVisible(false);
    } else if (c.face) {
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
    if (column && c.demo) {
      y += 8;
      const textX = pad + demoW + 34 + textW / 2;
      this.how.setText(wrapLines(this.how, c.how, textW));
      this.note.setText(wrapLines(this.note, c.note, textW));
      if (c.face) {
        this.face.setTexture(c.face).setVisible(true);
        this.face.setScale(76 / this.face.height);
      }
      const leadH = c.face ? Math.max(76, this.lead.height) : this.lead.height;
      const textH = leadH + 26 + (c.how ? this.how.height : 0) + (c.note ? this.note.height + 16 : 0);
      const demoH = Math.round(Math.max(textH + 40, Math.min(560, Math.max(460, this.box.maxH * 0.34))));
      this.demo.place(pad, y, demoW, demoH);
      this.demo.setup(c.demo, demoH, demoW);
      const ringY = y + demoH - this.demo.hitFromEnd();
      let ty = y + Math.max(0, Math.min((demoH - textH) / 2, (ringY - 70 - y - textH) / 2));
      if (c.face) {
        const groupW = this.face.displayWidth + 14 + this.lead.width;
        const gx = textX - groupW / 2;
        this.face.setPosition(gx + this.face.displayWidth / 2, ty + leadH / 2);
        this.lead.setPosition(gx + this.face.displayWidth + 14, ty + leadH / 2 - this.lead.height / 2);
      } else {
        this.lead.setPosition(textX - this.lead.width / 2, ty);
      }
      ty += leadH + 26;
      this.how.setPosition(textX, ty);
      ty += c.how ? this.how.height + 16 : 0;
      this.note.setPosition(textX, ty);
      y += demoH + 30;
    } else {
      const demoH = this.stacked ? 184 : 156;
      if (c.demo) {
        y += 18;
        this.demo.place(pad, y, inner, demoH);
        this.demo.setup(c.demo, inner, demoH);
        y += demoH + 22;
      } else {
        this.demo.root.setVisible(false);
      }
      this.how.setText(wrapLines(this.how, c.how, inner)).setPosition(mid, y);
      y += c.how ? this.how.height + 10 : 0;
      this.note.setText(wrapLines(this.note, c.note, inner)).setPosition(mid, y);
      y += c.note ? this.note.height + 18 : 6;
    }
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
    const kh = Math.max(44, Math.round(this.sizes.small * 1.45));
    this.kickerBg.clear();
    this.kickerBg.fillStyle(INK_HEX, 1).fillRoundedRect(mid - kw / 2 + 4, -kh / 2 + 5, kw, kh, 14);
    this.kickerBg.fillStyle(C.mint, 1).fillRoundedRect(mid - kw / 2, -kh / 2, kw, kh, 14);
    this.kickerBg.lineStyle(4, INK_HEX, 1).strokeRoundedRect(mid - kw / 2, -kh / 2, kw, kh, 14);
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
    const primaryH = this.mode === "phone" ? 108 : this.stacked ? 86 : 76;
    const smallH = this.mode === "phone" ? 82 : this.stacked ? 68 : 62;
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
        const w = Math.min(inner, this.mode === "phone" ? 720 : 520);
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
  }

  update(now: number) {
    if (this.root.visible && this.demoOn) this.demo.update(now);
  }

  buttonAt(x: number, y: number): CardButtonId | null {
    if (!this.root.visible) return null;
    return this.buttons.find((b) => b.box.contains(x, y))?.id ?? null;
  }

  press(id: CardButtonId | null) {
    for (const b of this.buttons) b.root.setScale(b.id === id ? 0.96 : 1);
  }
}
