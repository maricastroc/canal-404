import * as Phaser from "phaser";
import type { Frame } from "../layout";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";
import type { TouchState } from "./hud";

type Action = keyof TouchState;
type Role = "move" | "jump" | "attack";
type Grip = { role: Role; dir: -1 | 1 };
type Button = { role: "jump" | "attack"; x: number; y: number; r: number; color: number; gfx: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

export type DeckLabels = { move: string; jump: string; attack: string };

const LIP: Record<string, number> = { corridor: 0x7b62c4, yard: 0x93cf4c, library: 0x3e8f6a, office: 0xc4352c };
const SIZE = { r: 39, gap: 14, margin: 14, lip: 9, label: 12.5, labelGap: 8, slack: 7, reach: 22 };
const glyphs = new Map<string, [number, number]>();

function glyphOrigin(scene: Phaser.Scene, key: string): [number, number] {
  const known = glyphs.get(key);
  if (known) return known;
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
  const origin: [number, number] = x1 < 0 ? [0.5, 0.5] : [(x0 + x1 + 1) / 2 / canvas.width, (y0 + y1 + 1) / 2 / canvas.height];
  glyphs.set(key, origin);
  return origin;
}

export class TouchDeck {
  private bg: Phaser.GameObjects.Graphics;
  private dots: Phaser.GameObjects.TileSprite;
  private rocker: Phaser.GameObjects.Graphics;
  private arrows: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private moveLabel: Phaser.GameObjects.Text;
  private buttons: Button[];
  private grips = new Map<number, Grip>();
  private frame: Frame | null = null;
  private on = false;
  private enabled = false;
  private pulse?: Phaser.Tweens.Tween;
  private coachBox: Phaser.GameObjects.Container;
  private coachBg: Phaser.GameObjects.Graphics;
  private coachText: Phaser.GameObjects.Text;
  private coachRing: Phaser.GameObjects.Graphics;
  private coachRole: Role | null = null;
  private coachPulse?: Phaser.Tweens.Tween;
  private labelY = 0;
  private labelsOn = false;
  private fadeL = 1;
  private fadeR = 1;
  private rockerBox = new Phaser.Geom.Rectangle();
  private split = 0;
  private u = 1;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    labels: DeckLabels,
    private theme: string,
    private touch: TouchState,
    private onPress: (action: Action) => void,
    private reduced: boolean,
  ) {
    this.makeTextures();
    this.bg = scene.add.graphics().setDepth(80).setScrollFactor(0);
    this.dots = scene.add.tileSprite(0, 0, 8, 8, "deck-dots").setOrigin(0, 0).setDepth(80.5).setScrollFactor(0);
    this.rocker = scene.add.graphics().setDepth(81).setScrollFactor(0);
    this.arrows = [scene.add.image(0, 0, "deck-left").setDepth(82).setScrollFactor(0), scene.add.image(0, 0, "deck-right").setDepth(82).setScrollFactor(0)];
    const label = (text: string) => cartoonText(scene, 0, 0, text, { size: 30, color: "#fbf5e6", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5, 0).setDepth(82).setScrollFactor(0).setAlpha(0.72);
    this.moveLabel = label(labels.move);
    const button = (role: "jump" | "attack", icon: string, color: number, text: string): Button => ({
      role,
      x: 0,
      y: 0,
      r: 0,
      color,
      gfx: scene.add.graphics().setDepth(81).setScrollFactor(0),
      icon: scene.add.image(0, 0, icon).setDepth(82).setScrollFactor(0),
      label: label(text),
    });
    this.buttons = [button("attack", "deck-attack", 0xf06ba8, labels.attack), button("jump", "deck-jump", 0xffc83d, labels.jump)];
    this.coachRing = scene.add.graphics().setDepth(80.8).setScrollFactor(0).setVisible(false);
    this.coachBg = scene.add.graphics();
    this.coachText = cartoonText(scene, 0, 0, "", { size: 30, color: "#1d1830", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    this.coachBox = scene.add.container(0, 0, [this.coachBg, this.coachText]).setDepth(83).setScrollFactor(0).setVisible(false);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.down, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.move, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.up, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.down, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.move, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.up, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.up, this);
    });
    this.setVisible(false);
  }

  private makeTextures() {
    if (this.scene.textures.exists("deck-dots")) return;
    const g = this.scene.make.graphics({}, false);
    g.fillStyle(0xfbf5e6, 0.08);
    g.fillCircle(9, 9, 2.6);
    g.generateTexture("deck-dots", 36, 36);
    g.destroy();
  }

  get shown() {
    return this.on;
  }

  get height() {
    return this.frame?.kind === "tall" ? this.frame.deck : 0;
  }

  layout(frame: Frame, on: boolean) {
    this.frame = frame;
    this.on = on && frame.kind !== "full";
    const u = frame.unit;
    this.u = u;
    const tall = frame.kind === "tall";
    const width = frame.width;
    const bottom = frame.height - frame.safe.bottom;
    const room = width - frame.safe.left - frame.safe.right;
    const k = Phaser.Math.Clamp(room / u / 390, 0.82, 1.12);
    const r = SIZE.r * k * u;
    const size = r * 2;
    const gap = SIZE.gap * k * u;
    const margin = SIZE.margin * u;
    const ls = (SIZE.label * u) / 30;
    const labelGap = SIZE.labelGap * u;
    const labelH = this.moveLabel.height * ls;
    const labels = tall && (frame.deck - frame.safe.bottom) / u >= 120;
    const group = size + (labels ? labelGap + labelH : 0);
    const deckTop = frame.height - frame.deck + SIZE.lip * u;
    const deckRoom = frame.height - frame.safe.bottom - deckTop;
    const cy = tall ? deckTop + Math.max(0, (deckRoom - group) / 2) + r : bottom - margin - r - 4 * u;
    const left = frame.safe.left + margin;
    const right = width - frame.safe.right - margin;
    const arrowW = size;
    this.split = gap;
    this.rockerBox.setTo(left, cy - r, arrowW * 2 + gap, size);
    const [attack, jump] = this.buttons;
    jump.r = r;
    jump.x = right - r;
    attack.r = r;
    attack.x = jump.x - size - gap;
    for (const b of this.buttons) b.y = cy;
    const labelY = cy + r + labelGap;
    this.labelY = labelY;
    this.labelsOn = this.on && labels;
    this.moveLabel.setScale(ls).setPosition(this.rockerBox.centerX, labelY).setVisible(this.on && labels);
    for (const b of this.buttons) {
      b.icon.setOrigin(...glyphOrigin(this.scene, b.icon.texture.key)).setScale((r * 1.1) / 128);
      b.label.setScale(ls).setPosition(b.x, labelY).setVisible(this.on && labels);
    }
    for (const a of this.arrows) a.setOrigin(...glyphOrigin(this.scene, a.texture.key));
    this.arrows.forEach((a) => a.setScale((size * 0.62) / 128));
    this.drawBg();
    this.setVisible(this.on);
    this.redraw();
    this.placeCoach();
  }

  coach(role: Role | null, text = "") {
    this.coachRole = role;
    this.coachPulse?.stop();
    this.coachPulse = undefined;
    if (role) this.coachText.setText(text);
    this.placeCoach();
    this.applyAlpha();
    if (!role || !this.on || this.reduced) return;
    this.coachRing.setAlpha(1);
    this.coachPulse = this.scene.tweens.add({ targets: this.coachRing, alpha: 0.25, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private coachTarget(role: Role) {
    if (role === "move") return { x: this.rockerBox.centerX, top: this.rockerBox.y, bottom: this.rockerBox.bottom };
    const b = this.buttons.find((btn) => btn.role === role)!;
    return { x: b.x, top: b.y - b.r, bottom: b.y + b.r };
  }

  private placeCoach() {
    const f = this.frame;
    const role = this.coachRole;
    const show = Boolean(f && role && this.on);
    this.coachBox.setVisible(show);
    this.coachRing.setVisible(show);
    const coaching = show && f?.kind === "tall";
    this.moveLabel.setVisible(this.labelsOn && !coaching);
    for (const b of this.buttons) b.label.setVisible(this.labelsOn && !coaching);
    if (!show || !f || !role) return;
    const u = this.u;
    const k = (13.5 * u) / 30;
    this.coachText.setScale(k);
    const w = this.coachText.width * k + 22 * u;
    const h = 26 * u;
    const at = this.coachTarget(role);
    const minX = f.safe.left + 6 * u + w / 2;
    const maxX = f.width - f.safe.right - 6 * u - w / 2;
    const x = Phaser.Math.Clamp(at.x, minX, maxX);
    const below = f.kind === "tall";
    const y = below ? this.labelY - 4 * u + h / 2 : at.top - 14 * u - h / 2;
    const tip = Phaser.Math.Clamp(at.x - x, -w / 2 + 14 * u, w / 2 - 14 * u);
    const g = this.coachBg;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 3 * u, -h / 2 + 3 * u, w, h, 9 * u);
    const ty = below ? -h / 2 : h / 2;
    const dir = below ? -1 : 1;
    g.fillTriangle(tip - 9 * u, ty, tip + 9 * u, ty, tip, ty + dir * 10 * u);
    g.fillStyle(0xffc83d, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 9 * u);
    g.fillTriangle(tip - 6 * u, ty - dir * 1.5 * u, tip + 6 * u, ty - dir * 1.5 * u, tip, ty + dir * 6.5 * u);
    g.lineStyle(Math.max(2, 1.6 * u), INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 9 * u);
    this.coachBox.setPosition(x, y);
    const ring = this.coachRing;
    ring.clear();
    ring.lineStyle(4 * u, 0xffc83d, 1);
    if (role === "move") {
      const box = Phaser.Geom.Rectangle.Clone(this.rockerBox);
      Phaser.Geom.Rectangle.Inflate(box, 8 * u, 8 * u);
      ring.strokeRoundedRect(box.x, box.y + 3 * u, box.width, box.height, 30 * u);
    } else {
      const b = this.buttons.find((btn) => btn.role === role)!;
      ring.strokeCircle(b.x, b.y + 3 * u, b.r + 9 * u);
    }
  }

  private drawBg() {
    const f = this.frame;
    const g = this.bg;
    g.clear();
    if (!f || f.kind !== "tall") {
      this.dots.setVisible(false);
      return;
    }
    const u = f.unit;
    const top = f.height - f.deck;
    const lip = 9 * u;
    g.fillStyle(0x1d1830, 1);
    g.fillRect(0, top, f.width, f.deck + 4);
    g.fillStyle(LIP[this.theme] ?? 0x7b62c4, 1);
    g.fillRect(0, top, f.width, lip);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(0, top + 2 * u, f.width, 2 * u);
    g.fillStyle(0x140f26, 0.55);
    g.fillRect(0, top + lip, f.width, 6 * u);
    g.lineStyle(Math.max(3, 1.6 * u), INK_HEX, 1);
    g.lineBetween(0, top, f.width, top);
    g.lineBetween(0, top + lip, f.width, top + lip);
    this.dots.setPosition(0, top + lip).setSize(f.width, f.deck - lip + 4).setTileScale(u / 2.6);
  }

  private setVisible(on: boolean) {
    const deck = on && this.frame?.kind === "tall";
    this.bg.setVisible(Boolean(this.frame?.kind === "tall"));
    this.dots.setVisible(Boolean(this.frame?.kind === "tall"));
    this.rocker.setVisible(on);
    for (const a of this.arrows) a.setVisible(on);
    for (const b of this.buttons) {
      b.gfx.setVisible(on);
      b.icon.setVisible(on);
    }
    if (!deck) {
      this.moveLabel.setVisible(false);
      for (const b of this.buttons) b.label.setVisible(false);
    }
    if (!on) {
      this.coachBox.setVisible(false);
      this.coachRing.setVisible(false);
    }
  }

  enable(on: boolean) {
    this.enabled = on && this.on;
    if (!this.enabled) this.release();
    this.applyAlpha();
  }

  private applyAlpha() {
    const a = this.enabled ? 1 : 0.45;
    const left = this.coachRole === "move" ? 1 : this.fadeL;
    const right = this.coachRole && this.coachRole !== "move" ? 1 : this.fadeR;
    for (const o of [this.rocker, ...this.arrows]) o.setAlpha(a * left);
    for (const o of this.buttons.flatMap((b) => [b.gfx, b.icon])) o.setAlpha(a * right);
  }

  private role(x: number, y: number): Role | null {
    const f = this.frame;
    if (!f || !this.on) return null;
    const u = this.u;
    if (f.kind === "tall") {
      if (y < f.height - f.deck - SIZE.reach * u) return null;
      if (x < f.width / 2) return "move";
      const [attack, jump] = this.buttons;
      return Phaser.Math.Distance.Between(x, y, attack.x, attack.y) < Phaser.Math.Distance.Between(x, y, jump.x, jump.y) ? "attack" : "jump";
    }
    const box = Phaser.Geom.Rectangle.Clone(this.rockerBox);
    Phaser.Geom.Rectangle.Inflate(box, 30 * u, 30 * u);
    if (box.contains(x, y)) return "move";
    let best: Button | null = null;
    let bestD = Infinity;
    for (const b of this.buttons) {
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < b.r + 26 * u && d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best?.role ?? null;
  }

  private dirAt(x: number, prev: -1 | 1 | 0) {
    const mid = this.rockerBox.centerX;
    const slack = SIZE.slack * this.u;
    if (prev === -1 && x < mid + slack) return -1;
    if (prev === 1 && x > mid - slack) return 1;
    return x < mid ? -1 : 1;
  }

  private down(p: Phaser.Input.Pointer) {
    if (!this.enabled) return;
    const role = this.role(p.x, p.y);
    if (!role) return;
    const grip: Grip = { role, dir: role === "move" ? (this.dirAt(p.x, 0) as -1 | 1) : 1 };
    this.grips.set(p.id, grip);
    if (role !== "move") this.onPress(role);
    this.sync();
  }

  private move(p: Phaser.Input.Pointer) {
    const grip = this.grips.get(p.id);
    if (!grip || grip.role !== "move" || !p.isDown) return;
    const dir = this.dirAt(p.x, grip.dir) as -1 | 1;
    if (dir === grip.dir) return;
    grip.dir = dir;
    this.sync();
  }

  private up(p: Phaser.Input.Pointer) {
    if (!this.grips.delete(p.id)) return;
    this.sync();
  }

  release() {
    this.grips.clear();
    this.sync();
  }

  private sync() {
    const grips = [...this.grips.values()];
    const moves = grips.filter((g) => g.role === "move");
    const last = moves[moves.length - 1];
    this.touch.left = last?.dir === -1;
    this.touch.right = last?.dir === 1;
    this.touch.jump = grips.some((g) => g.role === "jump");
    this.touch.attack = grips.some((g) => g.role === "attack");
    this.redraw();
  }

  pulseJump(on: boolean) {
    this.pulse?.stop();
    this.pulse = undefined;
    const jump = this.buttons[1];
    const base = (jump.r * 1.1) / 128;
    jump.icon.setScale(base);
    if (on && this.on && !this.reduced) this.pulse = this.scene.tweens.add({ targets: jump.icon, scale: base * 1.22, duration: 360, yoyo: true, repeat: -1 });
  }

  fade(left: number, right: number) {
    if (this.frame?.kind === "tall") return;
    if (Math.abs(left - this.fadeL) < 0.01 && Math.abs(right - this.fadeR) < 0.01) return;
    this.fadeL = left;
    this.fadeR = right;
    this.applyAlpha();
  }

  zones(): [Phaser.Geom.Rectangle, Phaser.Geom.Rectangle] | null {
    if (!this.on) return null;
    const [attack, jump] = this.buttons;
    const right = new Phaser.Geom.Rectangle(attack.x - attack.r, Math.min(attack.y, jump.y) - attack.r, jump.x + jump.r - (attack.x - attack.r), Math.abs(jump.y - attack.y) + attack.r * 2);
    return [this.rockerBox, right];
  }

  sideRoom() {
    const f = this.frame;
    if (!f || f.kind !== "band" || !this.on) return 0;
    const [attack] = this.buttons;
    return Math.max(this.rockerBox.right - f.safe.left, f.width - f.safe.right - (attack.x - attack.r)) + 34 * this.u;
  }

  private redraw() {
    if (!this.frame) return;
    const u = this.u;
    const g = this.rocker;
    const box = this.rockerBox;
    const press = 4 * u;
    const shadow = 6 * u;
    const stroke = Math.max(3, 2.2 * u);
    const half = (box.width - this.split) / 2;
    const radius = Math.min(half, box.height) * 0.36;
    g.clear();
    const sides: [-1 | 1, number][] = [
      [-1, box.x],
      [1, box.x + half + this.split],
    ];
    for (const [dir, x] of sides) {
      const down = (dir === -1 && this.touch.left) || (dir === 1 && this.touch.right);
      const dy = down ? press : 0;
      g.fillStyle(INK_HEX, 1);
      g.fillRoundedRect(x + shadow * 0.8, box.y + shadow, half, box.height, radius);
      g.fillStyle(down ? 0xffc83d : 0xfbf5e6, 1);
      g.fillRoundedRect(x, box.y + dy, half, box.height, radius);
      g.fillStyle(0xffffff, down ? 0.2 : 0.5);
      g.fillRoundedRect(x + 9 * u, box.y + dy + 6 * u, half - 18 * u, 6 * u, 3 * u);
      g.lineStyle(stroke, INK_HEX, 1);
      g.strokeRoundedRect(x, box.y + dy, half, box.height, radius);
      this.arrows[dir === -1 ? 0 : 1].setPosition(x + half / 2, box.centerY + dy);
    }
    for (const b of this.buttons) {
      const down = this.touch[b.role];
      const dy = down ? press : 0;
      const bg = b.gfx;
      bg.clear();
      bg.fillStyle(INK_HEX, 1);
      bg.fillCircle(b.x + shadow * 0.8, b.y + shadow, b.r);
      bg.fillStyle(down ? Phaser.Display.Color.ValueToColor(b.color).lighten(12).color : b.color, 1);
      bg.fillCircle(b.x, b.y + dy, b.r);
      bg.fillStyle(0xffffff, down ? 0.18 : 0.38);
      bg.fillEllipse(b.x - b.r * 0.2, b.y + dy - b.r * 0.52, b.r * 0.9, b.r * 0.32);
      bg.lineStyle(stroke, INK_HEX, 1);
      bg.strokeCircle(b.x, b.y + dy, b.r);
      b.icon.setPosition(b.x, b.y + dy);
    }
  }
}
