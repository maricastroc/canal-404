import * as Phaser from "phaser";
import type { Locale } from "@/i18n/locales";
import { formatNumber } from "@/i18n/format";
import type { Frame } from "../layout";
import type { CourseId } from "../sim/course";
import { INK } from "./cart";

export type DeckState = { left: boolean; right: boolean; crouch: boolean; jump: boolean };

export type DeckCopy = { spin: string; crouch: string; jump: string; kmh: string; tiers: readonly string[] };

type Pad = "crouch" | "jump";

type Grip = { role: "spin"; dir: -1 | 1 } | { role: "pad"; over: Pad; latched: boolean };

type Round = { id: Pad; x: number; y: number; r: number; color: number; gfx: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

export const DECK_THEME: Record<CourseId, number> = { arlindo: 0xff9a3d, feira: 0x93cf4c, antena: 0xa98bef };

const SIZE = { square: 64, gap: 9, crouch: 31, jump: 36, padGap: 12, margin: 12, lip: 8, label: 12, labelGap: 6, reach: 32, slack: 10, gauge: 29, tierGap: 11, tierPad: 6, tierMin: 7.2 };
const F = 64;
const TIER_COLORS = [0x7fe0c4, 0x7fe0c4, 0xffcf3f, 0xff7a4a];
const CREAM = 0xfbf5e6;

function glyphOrigin(scene: Phaser.Scene, key: string): [number, number] {
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement("canvas");
  canvas.width = src.width;
  canvas.height = src.height;
  const g = canvas.getContext("2d");
  if (!g || !canvas.width || !canvas.height) return [0.5, 0.5];
  g.drawImage(src, 0, 0);
  const data = g.getImageData(0, 0, canvas.width, canvas.height).data;
  let x0 = canvas.width;
  let y0 = canvas.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] < 40) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? [0.5, 0.5] : [(x0 + x1 + 1) / 2 / canvas.width, (y0 + y1 + 1) / 2 / canvas.height];
}

const origins = new Map<string, [number, number]>();

function originOf(scene: Phaser.Scene, key: string) {
  let o = origins.get(key);
  if (!o) {
    o = glyphOrigin(scene, key);
    origins.set(key, o);
  }
  return o;
}

export class PhoneDeck {
  private readonly owned: Phaser.GameObjects.GameObject[] = [];
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly dots: Phaser.GameObjects.TileSprite;
  private readonly rocker: Phaser.GameObjects.Graphics;
  private readonly arrows: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private readonly spinLabel: Phaser.GameObjects.Text;
  private readonly rounds: [Round, Round];
  private readonly gauge: Phaser.GameObjects.Graphics;
  private readonly speedText: Phaser.GameObjects.Text;
  private readonly unitText: Phaser.GameObjects.Text;
  private readonly tierText: Phaser.GameObjects.Text;
  private readonly deltaText: Phaser.GameObjects.Text;
  private readonly box = new Phaser.Geom.Rectangle();
  private readonly grips = new Map<number, Grip>();
  private frame!: Frame;
  private u = 1;
  private split = 0;
  private gaugeX = 0;
  private gaugeY = 0;
  private gaugeR = 0;
  private top = 0;
  private enabled = true;
  private state: DeckState = { left: false, right: false, crouch: false, jump: false };
  private shownTier = -1;
  private tierPop = 0;
  private deltaLife = 0;
  private deltaColor = 0x7fe0c4;
  private speedShown = -1;
  private labelScale = 1;
  private tierRoom = 0;
  private tierBase = 1;
  private tierY = 0;
  private tierOn = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Layer,
    frame: Frame,
    private readonly copy: DeckCopy,
    private readonly fonts: { display: string; body: string },
    private readonly locale: Locale,
    private readonly theme: number,
    private readonly apply: (state: DeckState) => void,
  ) {
    if (!scene.textures.exists("dd-deck-dots")) {
      const g = scene.make.graphics({}, false);
      g.fillStyle(CREAM, 0.08);
      g.fillCircle(9, 9, 2.6);
      g.generateTexture("dd-deck-dots", 36, 36);
      g.destroy();
    }
    this.bg = this.add(scene.add.graphics());
    this.dots = this.add(scene.add.tileSprite(0, 0, 8, 8, "dd-deck-dots").setOrigin(0, 0));
    this.rocker = this.add(scene.add.graphics());
    this.arrows = [this.add(scene.add.image(0, 0, "dd-ico-ccw")), this.add(scene.add.image(0, 0, "dd-ico-cw"))];
    const label = (text: string) => this.add(scene.add.text(0, 0, text, { fontFamily: fonts.display, fontSize: `${F}px`, color: "#fbf5e6" }).setOrigin(0.5, 0).setAlpha(0.74));
    this.spinLabel = label(copy.spin);
    const round = (id: Pad, color: number, icon: string, text: string): Round => ({ id, x: 0, y: 0, r: 0, color, gfx: this.add(scene.add.graphics()), icon: this.add(scene.add.image(0, 0, icon)), label: label(text) });
    this.rounds = [round("crouch", 0x63d6c1, "dd-ico-crouch", copy.crouch), round("jump", 0xffc83d, "dd-ico-jump", copy.jump)];
    this.gauge = this.add(scene.add.graphics());
    this.speedText = this.add(scene.add.text(0, 0, "0", { fontFamily: fonts.display, fontSize: `${F}px`, color: "#fbf5e6" }).setOrigin(0.5, 0.5));
    this.unitText = this.add(scene.add.text(0, 0, copy.kmh, { fontFamily: fonts.body, fontSize: `${F}px`, color: "#cfc8e8", fontStyle: "700" }).setOrigin(0.5, 0.5));
    this.tierText = this.add(scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: `${F}px`, color: "#ffcf3f" }).setOrigin(0.5, 0.5));
    this.deltaText = this.add(scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: `${F}px`, color: "#7fe0c4", stroke: "#1d1830", strokeThickness: 15 }).setOrigin(0.5, 1).setAlpha(0));
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.down, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.move, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.up, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
    this.layout(frame);
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T) {
    this.layer.add(obj);
    this.owned.push(obj);
    return obj;
  }

  destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.down, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.move, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.up, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
    this.grips.clear();
    for (const obj of this.owned) obj.destroy();
    this.owned.length = 0;
  }

  get height() {
    return this.frame.deck.h;
  }

  layout(frame: Frame) {
    this.frame = frame;
    const u = frame.unit;
    this.u = u;
    const room = (frame.width - frame.safe.left - frame.safe.right) / u;
    const k = Phaser.Math.Clamp(room / 390, 0.84, 1.14) * u;
    const deck = frame.deck;
    this.top = deck.y;
    const lip = SIZE.lip * u;
    const labelScale = (SIZE.label * Math.min(k / u, 1.06) * u) / F;
    this.labelScale = labelScale;
    const labelH = this.spinLabel.height * labelScale;
    const contentTop = deck.y + lip;
    const contentBottom = frame.height - frame.safe.bottom;
    const group = Math.max(SIZE.square, SIZE.jump * 2) * k + SIZE.labelGap * u + labelH;
    const cy = contentTop + Math.max(4 * u, (contentBottom - contentTop - group) / 2) + Math.max(SIZE.square, SIZE.jump * 2) * k * 0.5;
    const left = frame.safe.left + SIZE.margin * u;
    const right = frame.width - frame.safe.right - SIZE.margin * u;
    const square = SIZE.square * k;
    const gap = SIZE.gap * k;
    this.box.setTo(left, cy - square / 2, square * 2 + gap, square);
    const [crouch, jump] = this.rounds;
    jump.r = SIZE.jump * k;
    jump.x = right - jump.r;
    jump.y = cy;
    crouch.r = SIZE.crouch * k;
    crouch.x = jump.x - jump.r - SIZE.padGap * k - crouch.r;
    crouch.y = cy + (jump.r - crouch.r) * 0.6;
    const labelY = cy + Math.max(square / 2, jump.r) + SIZE.labelGap * u;
    this.spinLabel.setScale(labelScale).setPosition(this.box.centerX, labelY);
    for (const r of this.rounds) {
      r.label.setScale(labelScale).setPosition(r.x, labelY);
      r.icon.setOrigin(...originOf(this.scene, r.icon.texture.key)).setScale((r.r * 1.08) / 128);
    }
    this.arrows.forEach((a) => a.setOrigin(...originOf(this.scene, a.texture.key)).setScale((square * 0.56) / 128));
    const free = crouch.x - crouch.r - this.box.right;
    this.gaugeR = Math.min(SIZE.gauge * k, free / 2 - 6 * u);
    this.gaugeX = this.box.right + free / 2;
    this.gaugeY = cy - 2 * u;
    this.split = this.gaugeX;
    const showGauge = this.gaugeR >= 20 * u;
    const gs = this.gaugeR / (SIZE.gauge * u);
    this.speedText.setVisible(showGauge).setScale((18 * gs * u) / F).setPosition(this.gaugeX, this.gaugeY - 3 * gs * u);
    this.unitText.setVisible(showGauge).setScale((8.5 * gs * u) / F).setPosition(this.gaugeX, this.gaugeY + 12 * gs * u);
    const spinRight = this.box.centerX + (this.spinLabel.width * labelScale) / 2;
    const crouchLeft = crouch.x - (crouch.label.width * labelScale) / 2;
    this.tierRoom = 2 * Math.min(this.gaugeX - spinRight, crouchLeft - this.gaugeX) - 2 * (SIZE.tierGap + SIZE.tierPad) * u;
    this.tierY = labelY + labelH / 2;
    this.tierOn = showGauge && this.gaugeR >= 24 * u;
    this.fitTier();
    this.tierText.setPosition(this.gaugeX, this.tierY).setScale(this.tierBase);
    this.deltaText.setScale((12 * u) / F).setPosition(this.gaugeX, this.gaugeY - this.gaugeR - 1 * u);
    this.drawBg();
    this.redraw();
  }

  private drawBg() {
    const f = this.frame;
    const u = this.u;
    const g = this.bg;
    const top = f.deck.y;
    const lip = SIZE.lip * u;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRect(0, top, f.width, f.deck.h + 4);
    g.fillStyle(this.theme, 1);
    g.fillRect(0, top, f.width, lip);
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(0, top + 2 * u, f.width, 2 * u);
    g.fillStyle(0x140f26, 0.55);
    g.fillRect(0, top + lip, f.width, 6 * u);
    g.lineStyle(Math.max(3, 1.6 * u), INK, 1);
    g.lineBetween(0, top, f.width, top);
    g.lineBetween(0, top + lip, f.width, top + lip);
    this.dots.setPosition(0, top + lip).setSize(f.width, f.deck.h - lip + 4).setTileScale(u / 2.6);
  }

  enable(on: boolean) {
    this.enabled = on;
    if (!on) this.release();
    const a = on ? 1 : 0.5;
    for (const o of [this.rocker, ...this.arrows, ...this.rounds.flatMap((r) => [r.gfx, r.icon])]) o.setAlpha(a);
  }

  release() {
    this.grips.clear();
    this.sync();
  }

  private padAt(x: number, y: number, prev: Pad | null): Pad {
    const [crouch, jump] = this.rounds;
    const dc = Phaser.Math.Distance.Between(x, y, crouch.x, crouch.y) / crouch.r;
    const dj = Phaser.Math.Distance.Between(x, y, jump.x, jump.y) / jump.r;
    const slack = (SIZE.slack * this.u) / ((crouch.r + jump.r) / 2);
    if (prev === "crouch" && dc < dj + slack) return "crouch";
    if (prev === "jump" && dj < dc + slack) return "jump";
    return dc < dj ? "crouch" : "jump";
  }

  private dirAt(x: number, prev: -1 | 1 | 0): -1 | 1 {
    const mid = this.box.centerX;
    const slack = SIZE.slack * this.u;
    if (prev === -1 && x < mid + slack) return -1;
    if (prev === 1 && x > mid - slack) return 1;
    return x < mid ? -1 : 1;
  }

  private down(p: Phaser.Input.Pointer) {
    if (!this.enabled) return;
    if (p.y < this.top - SIZE.reach * this.u) return;
    if (p.x < this.split) this.grips.set(p.id, { role: "spin", dir: this.dirAt(p.x, 0) });
    else {
      const over = this.padAt(p.x, p.y, null);
      this.grips.set(p.id, { role: "pad", over, latched: over === "crouch" });
    }
    this.sync();
  }

  private move(p: Phaser.Input.Pointer) {
    const grip = this.grips.get(p.id);
    if (!grip || !p.isDown) return;
    if (grip.role === "spin") {
      const dir = this.dirAt(p.x, grip.dir);
      if (dir === grip.dir) return;
      grip.dir = dir;
    } else {
      const over = this.padAt(p.x, p.y, grip.over);
      if (over === grip.over) return;
      grip.over = over;
      if (over === "crouch") grip.latched = true;
    }
    this.sync();
  }

  private up(p: Phaser.Input.Pointer) {
    if (!this.grips.delete(p.id)) return;
    this.sync();
  }

  private sync() {
    const grips = [...this.grips.values()];
    const spins = grips.filter((g) => g.role === "spin");
    const last = spins[spins.length - 1];
    const next: DeckState = {
      left: last?.role === "spin" && last.dir === -1,
      right: last?.role === "spin" && last.dir === 1,
      crouch: grips.some((g) => g.role === "pad" && (g.latched || g.over === "crouch")),
      jump: grips.some((g) => g.role === "pad" && g.over === "jump"),
    };
    const s = this.state;
    if (next.left === s.left && next.right === s.right && next.crouch === s.crouch && next.jump === s.jump) return;
    this.state = next;
    this.apply(next);
    this.redraw();
  }

  flash(text: string, gain: boolean) {
    this.deltaText.setText(text).setColor(gain ? "#7fe0c4" : "#ff9a72");
    this.deltaColor = gain ? 0x7fe0c4 : 0xff7a4a;
    this.deltaLife = 1.3;
  }

  private fitTier() {
    this.tierBase = Math.min(this.labelScale * 0.86, this.tierRoom / Math.max(1, this.tierText.width));
    this.tierText.setVisible(this.tierOn && this.tierBase * F >= SIZE.tierMin * this.u);
  }

  setSpeed(dt: number, speed: number, tier: number, trend: number) {
    const kmh = Math.round(speed * 0.036);
    if (kmh !== this.speedShown) {
      this.speedShown = kmh;
      this.speedText.setText(formatNumber(kmh, this.locale));
    }
    if (tier !== this.shownTier) {
      if (tier > this.shownTier && this.shownTier >= 0) this.tierPop = 1;
      this.shownTier = tier;
      this.tierText.setText(this.copy.tiers[tier].toUpperCase()).setColor(["#cfc8e8", "#7fe0c4", "#ffcf3f", "#ff7a4a"][tier]);
      this.fitTier();
    }
    this.tierPop = Math.max(0, this.tierPop - dt * 2.5);
    this.deltaLife = Math.max(0, this.deltaLife - dt);
    this.deltaText.setAlpha(Math.min(1, this.deltaLife * 2)).setY(this.gaugeY - this.gaugeR - 1 * this.u - (1.3 - this.deltaLife) * 4 * this.u);
    const u = this.u;
    const r = this.gaugeR;
    const g = this.gauge;
    g.clear();
    if (r < 20 * u) return;
    const x = this.gaugeX;
    const y = this.gaugeY;
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(x + 3 * u, y + 4 * u, r);
    g.fillStyle(0x2b2150, 1);
    g.fillCircle(x, y, r);
    if (this.deltaLife > 0) {
      g.fillStyle(this.deltaColor, 0.3 * Math.min(1, this.deltaLife));
      g.fillCircle(x, y, r);
    }
    g.lineStyle(Math.max(3, 1.6 * u), INK, 1);
    g.strokeCircle(x, y, r);
    const ar = r - 7 * u * (r / (SIZE.gauge * u));
    const w = Math.max(4, 5.5 * u * (r / (SIZE.gauge * u)));
    g.lineStyle(w, 0x3a3358, 1);
    g.beginPath();
    g.arc(x, y, ar, Math.PI * 0.8, Math.PI * 2.2, false);
    g.strokePath();
    const frac = Math.min(1, speed / 2600);
    g.lineStyle(w, TIER_COLORS[tier], 1);
    g.beginPath();
    g.arc(x, y, ar, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * Math.max(0.01, frac), false);
    g.strokePath();
    if (Math.abs(trend) > 0.04) {
      const up = trend > 0;
      const s = 5 * u * (r / (SIZE.gauge * u));
      const ty = y + r * 0.62;
      g.fillStyle(up ? 0x7fe0c4 : 0xff7a4a, Math.min(1, Math.abs(trend) * 2));
      if (up) g.fillTriangle(x - s, ty + s * 0.7, x + s, ty + s * 0.7, x, ty - s);
      else g.fillTriangle(x - s, ty - s * 0.7, x + s, ty - s * 0.7, x, ty + s);
    }
    this.tierText.setScale(this.tierBase * (1 + this.tierPop * 0.2));
    if (!this.tierText.visible) return;
    const pw = this.tierText.width * this.tierBase + SIZE.tierPad * 2 * u;
    const ph = this.tierText.height * this.tierBase + 3 * u;
    g.fillStyle(0x2b2150, 1);
    g.fillRoundedRect(x - pw / 2, this.tierY - ph / 2, pw, ph, ph / 2);
    g.lineStyle(Math.max(2, 1.2 * u), TIER_COLORS[tier], 0.55);
    g.strokeRoundedRect(x - pw / 2, this.tierY - ph / 2, pw, ph, ph / 2);
  }

  private redraw() {
    const u = this.u;
    const g = this.rocker;
    const box = this.box;
    const press = 4 * u;
    const shadow = 6 * u;
    const stroke = Math.max(3, 2.2 * u);
    const gap = SIZE.gap * (box.width / (SIZE.square * 2 + SIZE.gap));
    const half = (box.width - gap) / 2;
    const radius = Math.min(half, box.height) * 0.3;
    g.clear();
    const sides: [-1 | 1, number][] = [
      [-1, box.x],
      [1, box.x + half + gap],
    ];
    for (const [dir, x] of sides) {
      const on = dir === -1 ? this.state.left : this.state.right;
      const dy = on ? press : 0;
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x + shadow * 0.8, box.y + shadow, half, box.height, radius);
      g.fillStyle(on ? 0xffc83d : CREAM, 1);
      g.fillRoundedRect(x, box.y + dy, half, box.height, radius);
      g.fillStyle(0xffffff, on ? 0.2 : 0.5);
      g.fillRoundedRect(x + 9 * u, box.y + dy + 6 * u, half - 18 * u, 6 * u, 3 * u);
      g.lineStyle(stroke, INK, 1);
      g.strokeRoundedRect(x, box.y + dy, half, box.height, radius);
      this.arrows[dir === -1 ? 0 : 1].setPosition(x + half / 2, box.centerY + dy);
    }
    for (const b of this.rounds) {
      const on = this.state[b.id];
      const dy = on ? press : 0;
      const bg = b.gfx;
      bg.clear();
      if (on) {
        bg.fillStyle(b.color, 0.28);
        bg.fillCircle(b.x, b.y + dy, b.r + 9 * u);
      }
      bg.fillStyle(INK, 1);
      bg.fillCircle(b.x + shadow * 0.8, b.y + shadow, b.r);
      bg.fillStyle(on ? Phaser.Display.Color.ValueToColor(b.color).lighten(14).color : b.color, 1);
      bg.fillCircle(b.x, b.y + dy, b.r);
      bg.fillStyle(0xffffff, on ? 0.18 : 0.38);
      bg.fillEllipse(b.x - b.r * 0.2, b.y + dy - b.r * 0.52, b.r * 0.9, b.r * 0.32);
      bg.lineStyle(stroke, INK, 1);
      bg.strokeCircle(b.x, b.y + dy, b.r);
      b.icon.setPosition(b.x, b.y + dy);
    }
  }
}
