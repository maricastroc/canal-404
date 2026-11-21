import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { Locale } from "@/i18n/locales";
import { RACE_COPY, type RaceCopy } from "../copy";
import { CART_IDS, UNLOCKS, type CartId } from "../sim/carts";
import type { CourseId } from "../sim/course";
import { DOWNHILL_SFX } from "../sounds";
import { CartView, INK } from "./cart";
import { H, W } from "./hud";

export type GarageHost = {
  locale: Locale;
  fonts: { display: string; body: string };
  pick: (cart: CartId) => void;
  toggleGhost: () => boolean;
};

export type GarageData = { attract: boolean; course: CourseId; index: number; cart: CartId; ghost: boolean; unlocked: readonly CartId[] };

const CW = 400;
const CH = 560;
const GAP = 40;
const X0 = (W - (CW * 4 + GAP * 3)) / 2;
const Y0 = 236;
const GO = { x: W / 2, y: 900, w: 440, h: 112 };
const CHIP = { x: X0, y: 872, w: 560, h: 60 };
const CREAM = 0xfbf5e6;
const SUN = 0xffcf3f;
const LOCKED = 0xd8d2ea;

type Card = { cart: CartId; x: number; g: Phaser.GameObjects.Graphics; view: CartView; name: Phaser.GameObjects.Text; rider: Phaser.GameObjects.Text; trait: Phaser.GameObjects.Text; lock: Phaser.GameObjects.Graphics | null; shake: number };

export class GarageScene extends Phaser.Scene {
  private host!: GarageHost;
  private copy!: RaceCopy;
  private data0!: GarageData;
  private cards: Card[] = [];
  private selected = 0;
  private goG!: Phaser.GameObjects.Graphics;
  private goText!: Phaser.GameObjects.Text;
  private chipG: Phaser.GameObjects.Graphics | null = null;
  private chipText: Phaser.GameObjects.Text | null = null;
  private ghost = false;
  private goDown = false;
  private t = 0;

  constructor() {
    super("garage");
  }

  init(data: GarageData) {
    this.data0 = { attract: data.attract ?? true, course: data.course ?? "arlindo", index: data.index ?? 0, cart: data.cart ?? "deco", ghost: data.ghost ?? false, unlocked: data.unlocked ?? [] };
    this.cards = [];
    this.chipG = null;
    this.chipText = null;
    this.goDown = false;
    this.t = 0;
  }

  create() {
    this.host = this.registry.get("garage") as GarageHost;
    this.copy = RACE_COPY[this.host.locale];
    const d = this.data0;
    this.ghost = d.ghost;
    this.selected = Math.max(0, CART_IDS.indexOf(d.cart));
    const display = (size: number, color = "#fbf5e6", stroke = 0) => ({ fontFamily: this.host.fonts.display, fontSize: `${size}px`, color, ...(stroke ? { stroke: "#1d1830", strokeThickness: stroke } : {}) });
    const body = (size: number, color = "#1d1830") => ({ fontFamily: this.host.fonts.body, fontSize: `${size}px`, color, fontStyle: "700" });
    this.drawBackdrop();
    this.add.text(W / 2, 92, this.copy.garage.title.toUpperCase(), display(96, "#fbf5e6", 16)).setOrigin(0.5);
    const track = this.add.text(W / 2, 176, this.copy.garage.track(d.index + 1, this.copy.courses[d.course]), body(32)).setOrigin(0.5);
    const pill = this.add.graphics();
    pill.fillStyle(INK, 1);
    pill.fillRoundedRect(W / 2 - track.width / 2 - 30, 176 - 32, track.width + 60, 64, 32);
    pill.fillStyle(SUN, 1);
    pill.fillRoundedRect(W / 2 - track.width / 2 - 24, 176 - 26, track.width + 48, 52, 26);
    track.setDepth(1);
    const layer = this.add.layer();
    layer.setDepth(2);
    CART_IDS.forEach((cart, i) => {
      const x = X0 + i * (CW + GAP);
      const g = this.add.graphics();
      const view = new CartView(this, layer, cart, { scale: 1.12 });
      const locked = !this.unlocked(cart);
      const name = this.add.text(x + CW / 2, Y0 + 372, this.copy.carts[cart].toUpperCase(), display(32, "#1d1830")).setOrigin(0.5, 0).setDepth(3);
      const rider = this.add.text(x + CW / 2, Y0 + 416, this.copy.rivalNames[cart], body(26, "#6a6385")).setOrigin(0.5, 0).setDepth(3);
      const unlock = UNLOCKS[cart];
      const text = locked && unlock ? this.copy.garage.locked[cart === "mila" ? "mila" : "lina"] : this.copy.garage.traits[cart];
      const trait = this.add.text(x + CW / 2, Y0 + 458, text, { ...body(23, locked ? "#a3402c" : "#3d3554"), align: "center", wordWrap: { width: CW - 48 } }).setOrigin(0.5, 0).setDepth(3);
      const lock = locked ? this.drawLock() : null;
      if (locked) view.setAlpha(0.45);
      this.cards.push({ cart, x, g, view, name, rider, trait, lock, shake: 0 });
    });
    this.goG = this.add.graphics().setDepth(5);
    this.goText = this.add.text(GO.x, GO.y, this.copy.garage.go.toUpperCase(), display(60, "#1d1830")).setOrigin(0.5).setDepth(6);
    if (!d.attract) {
      this.chipG = this.add.graphics().setDepth(5);
      this.chipText = this.add.text(CHIP.x + 26, CHIP.y + CHIP.h / 2, "", body(24)).setOrigin(0, 0.5).setDepth(6);
      const touch = window.matchMedia?.("(pointer: coarse)").matches === true;
      const hint = this.add.text(W / 2, 1036, touch ? this.copy.garage.touch : this.copy.garage.keys, body(26)).setOrigin(0.5).setDepth(6);
      const hb = this.add.graphics().setDepth(5);
      hb.fillStyle(CREAM, 0.92);
      hb.fillRoundedRect(W / 2 - hint.width / 2 - 24, 1036 - 26, hint.width + 48, 52, 26);
    }
    this.goG.setVisible(!d.attract);
    this.goText.setVisible(!d.attract);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointer(p, true));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointer(p, false));
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.removeAllListeners();
      for (const c of this.cards) c.view.destroy();
    });
    this.redraw();
  }

  private drawLock() {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(INK, 1);
    g.fillRoundedRect(-30, -8, 60, 48, 10);
    g.lineStyle(10, INK, 1);
    g.beginPath();
    g.arc(0, -8, 18, Math.PI, 0, false);
    g.strokePath();
    g.fillStyle(SUN, 1);
    g.fillCircle(0, 12, 7);
    g.fillRect(-3, 12, 6, 14);
    return g;
  }

  private unlocked(cart: CartId) {
    return !UNLOCKS[cart] || this.data0.unlocked.includes(cart);
  }

  private drawBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x8fd4f7, 0x8fd4f7, 0xd6f0fb, 0xd6f0fb, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xbfe6f7, 1);
    for (let i = 0; i < 9; i += 1) {
      const x = i * 230 - 40;
      const h = 120 + ((i * 53) % 90);
      g.fillRect(x, 820 - h, 190, h);
      g.fillTriangle(x - 12, 820 - h, x + 95, 820 - h - 70, x + 202, 820 - h);
    }
    g.fillStyle(0x6b6585, 1);
    g.fillRect(0, 820, W, H - 820);
    g.fillStyle(0xcfc6e0, 1);
    g.fillRect(0, 812, W, 22);
    g.fillStyle(INK, 1);
    g.fillRect(0, 834, W, 6);
    g.fillStyle(0xfbf5e6, 0.5);
    for (let x = 40; x < W; x += 260) g.fillRect(x, 980, 140, 12);
  }

  private redraw() {
    const attract = this.data0.attract;
    this.cards.forEach((c, i) => {
      const on = i === this.selected && !attract;
      const locked = !this.unlocked(c.cart);
      const lift = on ? -14 : 0;
      const dx = c.shake > 0 ? Math.sin(c.shake * 60) * 10 * c.shake : 0;
      const x = c.x + dx;
      const y = Y0 + lift;
      const g = c.g;
      g.clear();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x - 6, y - 6 + 12, CW + 12, CH + 12, 30);
      g.fillRoundedRect(x - 6, y - 6, CW + 12, CH + 12, 30);
      g.fillStyle(on ? SUN : locked ? LOCKED : CREAM, 1);
      g.fillRoundedRect(x, y, CW, CH, 24);
      g.fillStyle(0xffffff, on ? 0.35 : 0.22);
      g.fillRoundedRect(x + 16, y + 12, CW - 32, 16, 8);
      if (on) {
        g.lineStyle(8, INK, 1);
        g.strokeRoundedRect(x - 18, y - 18, CW + 36, CH + 36, 36);
      }
      c.name.setPosition(x + CW / 2, y + 372);
      c.rider.setPosition(x + CW / 2, y + 416);
      c.trait.setPosition(x + CW / 2, y + 458);
      c.lock?.setPosition(x + CW - 44, y + 46);
    });
    if (!attract) {
      const ready = this.unlocked(CART_IDS[this.selected]);
      const g = this.goG;
      const x = GO.x - GO.w / 2;
      const y = GO.y - GO.h / 2 + (this.goDown ? 4 : 0);
      g.clear();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x - 6, y - 6 + (this.goDown ? 2 : 8), GO.w + 12, GO.h + 12, 28);
      g.fillRoundedRect(x - 6, y - 6, GO.w + 12, GO.h + 12, 28);
      g.fillStyle(ready ? (this.goDown ? 0xf2b92f : SUN) : LOCKED, 1);
      g.fillRoundedRect(x, y, GO.w, GO.h, 22);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(x + 14, y + 10, GO.w - 28, 14, 7);
      this.goText.setY(GO.y + (this.goDown ? 4 : 0));
      this.goText.setAlpha(ready ? 1 : 0.55);
    }
    if (this.chipG && this.chipText) {
      const g = this.chipG;
      g.clear();
      g.fillStyle(INK, 1);
      g.fillRoundedRect(CHIP.x - 5, CHIP.y - 5, CHIP.w + 10, CHIP.h + 10, 22);
      g.fillStyle(this.ghost ? 0x7fe0c4 : CREAM, 1);
      g.fillRoundedRect(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 18);
      this.chipText.setText(this.copy.garage.ghost(this.ghost));
    }
  }

  private move(step: number) {
    this.selected = (this.selected + step + CART_IDS.length) % CART_IDS.length;
    getAudio().play(DOWNHILL_SFX.beep);
    this.redraw();
  }

  private confirm() {
    const cart = CART_IDS[this.selected];
    if (!this.unlocked(cart)) {
      this.cards[this.selected].shake = 0.5;
      return;
    }
    getAudio().play(DOWNHILL_SFX.go);
    this.host.pick(cart);
  }

  private flipGhost() {
    this.ghost = this.host.toggleGhost();
    getAudio().play(DOWNHILL_SFX.beep);
    this.redraw();
  }

  key(code: string) {
    if (this.data0.attract) return false;
    if (code === "ArrowLeft" || code === "KeyA") this.move(-1);
    else if (code === "ArrowRight" || code === "KeyD") this.move(1);
    else if (code === "Space" || code === "Enter" || code === "NumpadEnter") this.confirm();
    else if (code === "KeyG") this.flipGhost();
    else return false;
    return true;
  }

  private inside(px: number, py: number, x: number, y: number, w: number, h: number) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  private pointer(p: Phaser.Input.Pointer, down: boolean) {
    if (this.data0.attract) return;
    const overGo = this.inside(p.x, p.y, GO.x - GO.w / 2, GO.y - GO.h / 2, GO.w, GO.h);
    if (down) {
      if (overGo) {
        this.goDown = true;
        this.redraw();
        return;
      }
      if (this.inside(p.x, p.y, CHIP.x, CHIP.y, CHIP.w, CHIP.h)) {
        this.flipGhost();
        return;
      }
      const index = this.cards.findIndex((c) => this.inside(p.x, p.y, c.x, Y0 - 20, CW, CH + 20));
      if (index >= 0 && index !== this.selected) {
        this.selected = index;
        getAudio().play(DOWNHILL_SFX.beep);
        this.redraw();
      }
      return;
    }
    if (!this.goDown) return;
    this.goDown = false;
    this.redraw();
    if (overGo) this.confirm();
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 100) / 1000;
    this.t += dt;
    let shaking = false;
    this.cards.forEach((c, i) => {
      const on = i === this.selected && !this.data0.attract;
      const x = c.x + CW / 2;
      const y = Y0 + 318 + (on ? -14 : 0) + (on ? Math.sin(this.t * 5) * 4 : 0);
      c.view.update({ x, y, angle: on ? Math.sin(this.t * 3) * 0.02 : 0, speed: 0, crouch: false, charge: 0, air: false, spin: 0, accel: 0, bigAir: false, brace: false, paddling: false, distance: on ? this.t * 120 : 0, crash: 0, time: this.t, countdown: true }, dt);
      if (c.shake > 0) {
        c.shake = Math.max(0, c.shake - dt);
        shaking = true;
      }
    });
    if (shaking) this.redraw();
  }
}
