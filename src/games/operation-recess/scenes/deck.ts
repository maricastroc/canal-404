import * as Phaser from "phaser";
import type { Frame } from "../layout";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";
import type { TouchState } from "./hud";

type Action = keyof TouchState;
type Role = "move" | "jump" | "attack";
type Grip = { role: Role; dir: -1 | 1 };
type Button = { role: "jump" | "attack"; x: number; y: number; r: number; color: number; gfx: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

export type DeckLabels = { move: string; jump: string; attack: string };

const LIP: Record<string, number> = { corridor: 0x7b62c4, yard: 0x93cf4c, office: 0xc4352c };
const SIZE = { rockerW: 150, rockerH: 74, r: 39, gap: 16, margin: 14, label: 12.5, slack: 7, reach: 22 };

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
  private fadeL = 1;
  private fadeR = 1;
  private rockerBox = new Phaser.Geom.Rectangle();
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
    const rw = SIZE.rockerW * k * u;
    const rh = SIZE.rockerH * k * u;
    const margin = SIZE.margin * u;
    const labels = tall && (frame.deck - frame.safe.bottom) / u >= 120;
    const cy = tall ? frame.height - frame.deck + (frame.deck - frame.safe.bottom) / 2 - (labels ? 7 * u : 0) : bottom - margin - Math.max(r, rh / 2) - 4 * u;
    const left = frame.safe.left + margin;
    const right = width - frame.safe.right - margin;
    this.rockerBox.setTo(left, cy - rh / 2, rw, rh);
    const jump = this.buttons[1];
    const attack = this.buttons[0];
    jump.r = r;
    jump.x = right - r - 4 * u;
    jump.y = cy + 6 * u;
    attack.r = r;
    attack.x = jump.x - 2 * r - SIZE.gap * k * u;
    attack.y = cy - 6 * u;
    const ls = (SIZE.label * u) / 30;
    this.moveLabel.setScale(ls).setPosition(left + rw / 2, cy + rh / 2 + 6 * u).setVisible(this.on && labels);
    const labelY = Math.max(cy + rh / 2, jump.y + r, attack.y + r) + 7 * u;
    this.moveLabel.setY(labelY);
    for (const b of this.buttons) {
      b.icon.setScale((r * 1.1) / 128);
      b.label.setScale(ls).setPosition(b.x, labelY).setVisible(this.on && labels);
    }
    this.arrows.forEach((a) => a.setScale((rh * 0.62) / 128));
    this.drawBg();
    this.setVisible(this.on);
    this.redraw();
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
  }

  enable(on: boolean) {
    this.enabled = on && this.on;
    if (!this.enabled) this.release();
    this.applyAlpha();
  }

  private applyAlpha() {
    const a = this.enabled ? 1 : 0.45;
    for (const o of [this.rocker, ...this.arrows]) o.setAlpha(a * this.fadeL);
    for (const o of this.buttons.flatMap((b) => [b.gfx, b.icon])) o.setAlpha(a * this.fadeR);
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
    const radius = box.height / 2;
    const half = box.width / 2;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(box.x + shadow * 0.8, box.y + shadow, box.width, box.height, radius);
    const sides: [-1 | 1, number][] = [
      [-1, box.x],
      [1, box.x + half],
    ];
    for (const [dir, x] of sides) {
      const down = (dir === -1 && this.touch.left) || (dir === 1 && this.touch.right);
      const dy = down ? press : 0;
      const corners = dir === -1 ? { tl: radius, bl: radius, tr: 0, br: 0 } : { tl: 0, bl: 0, tr: radius, br: radius };
      g.fillStyle(down ? 0xffc83d : 0xfbf5e6, 1);
      g.fillRoundedRect(x, box.y + dy, half, box.height, corners);
      g.fillStyle(0xffffff, down ? 0.2 : 0.5);
      g.fillRoundedRect(x + 8 * u, box.y + dy + 6 * u, half - 16 * u, 6 * u, 3 * u);
      g.lineStyle(stroke, INK_HEX, 1);
      g.strokeRoundedRect(x, box.y + dy, half, box.height, corners);
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
