import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { Locale } from "@/i18n/locales";
import { RACE_COPY, type RaceCopy } from "../copy";
import { CART_IDS, UNLOCKS, type CartId } from "../sim/carts";
import type { CourseId } from "../sim/course";
import { DOWNHILL_SFX } from "../sounds";
import type { Frame } from "../layout";
import { CartView, INK } from "./cart";
import { currentFrame, watchFrame } from "./frame";
import { H, W } from "./hud";
import { keyArrows } from "../../kit/keyArrows";

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

type Box = { x: number; y: number; w: number; h: number };

type Tile = Box & { cart: CartId; g: Phaser.GameObjects.Graphics; head: Phaser.GameObjects.Image; lock: Phaser.GameObjects.Graphics | null };

type Tall = {
  u: number;
  card: Box;
  art: { x: number; y: number; scale: number };
  bg: Phaser.GameObjects.Graphics;
  views: Map<CartId, CartView>;
  name: Phaser.GameObjects.Text;
  rider: Phaser.GameObjects.Text;
  trait: Phaser.GameObjects.Text;
  lock: Phaser.GameObjects.Graphics;
  tiles: Tile[];
  go: Box;
  chip: Box;
  swipe: { id: number; x: number } | null;
  shake: number;
};

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
  private frame!: Frame;
  private tall: Tall | null = null;

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
    this.tall = null;
  }

  create() {
    this.host = this.registry.get("garage") as GarageHost;
    this.copy = RACE_COPY[this.host.locale];
    const d = this.data0;
    this.ghost = d.ghost;
    this.selected = Math.max(0, CART_IDS.indexOf(d.cart));
    let first = true;
    watchFrame(this, () => {
      if (first) {
        first = false;
        return;
      }
      this.scene.restart({ ...this.data0, cart: CART_IDS[this.selected] });
    });
    this.frame = currentFrame(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.removeAllListeners();
      for (const c of this.cards) c.view.destroy();
      for (const v of this.tall?.views.values() ?? []) v.destroy();
    });
    if (this.frame.kind === "tall") {
      this.createTall();
      return;
    }
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
      const hint = keyArrows(this.add.text(W / 2, 1036, touch ? this.copy.garage.touch : this.copy.garage.keys, body(26)).setOrigin(0.5).setDepth(6));
      const hb = this.add.graphics().setDepth(5);
      hb.fillStyle(CREAM, 0.92);
      hb.fillRoundedRect(W / 2 - hint.width / 2 - 24, 1036 - 26, hint.width + 48, 52, 26);
    }
    this.goG.setVisible(!d.attract);
    this.goText.setVisible(!d.attract);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointer(p, true));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointer(p, false));
    this.redraw();
  }

  private createTall() {
    const f = this.frame;
    const u = f.unit;
    const d = this.data0;
    const k = Phaser.Math.Clamp(f.css.w / 390, 0.86, 1.14);
    const left = f.safe.left + 12 * u;
    const right = f.width - f.safe.right - 12 * u;
    const w = right - left;
    const display = (size: number, color = "#fbf5e6", stroke = 0) => ({ fontFamily: this.host.fonts.display, fontSize: `${size}px`, color, ...(stroke ? { stroke: "#1d1830", strokeThickness: stroke } : {}) });
    const body = (size: number, color = "#1d1830") => ({ fontFamily: this.host.fonts.body, fontSize: `${size}px`, color, fontStyle: "700" });
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x8fd4f7, 0x8fd4f7, 0xd6f0fb, 0xd6f0fb, 1);
    sky.fillRect(0, 0, f.width, f.height);
    const street = f.height * 0.8;
    sky.fillStyle(0xbfe6f7, 1);
    for (let i = 0; i < 7; i += 1) {
      const x = i * 90 * u - 20 * u;
      const h = (60 + ((i * 53) % 50)) * u;
      sky.fillRect(x, street - h, 74 * u, h);
      sky.fillTriangle(x - 6 * u, street - h, x + 37 * u, street - h - 30 * u, x + 80 * u, street - h);
    }
    sky.fillStyle(0x6b6585, 1);
    sky.fillRect(0, street, f.width, f.height - street);
    sky.fillStyle(0xcfc6e0, 1);
    sky.fillRect(0, street - 8 * u, f.width, 9 * u);
    sky.fillStyle(INK, 1);
    sky.fillRect(0, street + 1 * u, f.width, 3 * u);
    const top = f.safe.top + 10 * u;
    const title = this.add.text(f.width / 2, top + 22 * u * k, this.copy.garage.title.toUpperCase(), display(60, "#fbf5e6", 12)).setOrigin(0.5);
    title.setScale(Math.min((34 * u * k) / 60, w / Math.max(1, title.width)));
    const track = this.add.text(f.width / 2, top + 60 * u * k, this.copy.garage.track(d.index + 1, this.copy.courses[d.course]), body(30)).setOrigin(0.5).setDepth(1);
    track.setScale(Math.min((14 * u * k) / 30, (w - 40 * u) / Math.max(1, track.width)));
    const pw = track.width * track.scaleX + 32 * u;
    const ph = 30 * u * k;
    const pill = this.add.graphics();
    pill.fillStyle(INK, 1);
    pill.fillRoundedRect(f.width / 2 - pw / 2 - 3 * u, track.y - ph / 2 - 3 * u, pw + 6 * u, ph + 6 * u, ph / 2 + 3 * u);
    pill.fillStyle(SUN, 1);
    pill.fillRoundedRect(f.width / 2 - pw / 2, track.y - ph / 2, pw, ph, ph / 2);
    const bottom = f.height - f.safe.bottom - 14 * u;
    const goH = 58 * u * k;
    const go = { x: left, y: bottom - goH, w, h: goH };
    const chipH = 40 * u * k;
    const chip = { x: left, y: go.y - 10 * u - chipH, w, h: chipH };
    const tileH = 76 * u * k;
    const tilesY = (d.attract ? bottom : chip.y - 10 * u) - tileH;
    const cardY = track.y + ph / 2 + 14 * u;
    const card = { x: left, y: cardY, w, h: Math.max(150 * u, tilesY - 20 * u - cardY) };
    const bg = this.add.graphics().setDepth(1);
    const layer = this.add.layer();
    layer.setDepth(2);
    const artH = card.h * 0.52;
    const scale = Math.min((w * 0.62) / 300, (artH * 0.86) / 270);
    const art = { x: card.x + card.w / 2 + 20 * scale, y: card.y + 18 * u + artH, scale };
    const views = new Map<CartId, CartView>();
    for (const cart of CART_IDS) {
      const view = new CartView(this, layer, cart, { scale });
      view.setVisible(false);
      views.set(cart, view);
    }
    const textW = card.w - 36 * u;
    const name = this.add.text(card.x + card.w / 2, art.y + 18 * u, "", display(60, "#1d1830")).setOrigin(0.5, 0).setDepth(3);
    name.setData("base", (22 * u * k) / 60).setData("room", textW);
    const rider = this.add.text(card.x + card.w / 2, 0, "", body(30, "#6a6385")).setOrigin(0.5, 0).setDepth(3).setScale((15 * u * k) / 30);
    const traitScale = (14 * u * k) / 30;
    const trait = this.add.text(card.x + card.w / 2, 0, "", { ...body(30, "#3d3554"), align: "center", wordWrap: { width: textW / traitScale } }).setOrigin(0.5, 0).setDepth(3).setScale(traitScale);
    const lock = this.drawLock().setScale(0.8 * u * k).setPosition(card.x + card.w - 34 * u, card.y + 34 * u);
    const gap = 8 * u;
    const tw = (w - gap * 3) / 4;
    const tiles: Tile[] = CART_IDS.map((cart, i) => {
      const x = left + i * (tw + gap);
      const g = this.add.graphics().setDepth(1);
      const head = this.add.image(x + tw / 2, tilesY + tileH * 0.5 + 4 * u, `${cart}-head-normal`).setOrigin(0.5, 0.62).setScale((50 * u * k) / 190).setDepth(2);
      const locked = !this.unlocked(cart);
      if (locked) head.setAlpha(0.45);
      const tl = locked ? this.drawLock().setScale(0.42 * u * k).setPosition(x + tw - 15 * u, tilesY + 17 * u) : null;
      return { cart, x, y: tilesY, w: tw, h: tileH, g, head, lock: tl };
    });
    this.goG = this.add.graphics().setDepth(5);
    this.goText = this.add.text(go.x + go.w / 2, go.y + go.h / 2, this.copy.garage.go.toUpperCase(), display(60, "#1d1830")).setOrigin(0.5).setDepth(6);
    this.goText.setScale(Math.min((28 * u * k) / 60, (go.w - 30 * u) / Math.max(1, this.goText.width)));
    if (!d.attract) {
      this.chipG = this.add.graphics().setDepth(5);
      this.chipText = this.add.text(chip.x + 18 * u, chip.y + chip.h / 2, "", body(30)).setOrigin(0, 0.5).setDepth(6);
      this.chipText.setScale((13.5 * u * k) / 30);
    }
    this.goG.setVisible(!d.attract);
    this.goText.setVisible(!d.attract);
    this.tall = { u, card, art, bg, views, name, rider, trait, lock, tiles, go, chip, swipe: null, shake: 0 };
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointerTall(p, true));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointerTall(p, false));
    this.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.pointerTall(p, false));
    this.redraw();
  }

  private redrawTall(t: Tall) {
    const attract = this.data0.attract;
    const cart = CART_IDS[this.selected];
    const locked = !this.unlocked(cart);
    const u = t.u;
    const c = t.card;
    const dx = t.shake > 0 ? Math.sin(t.shake * 60) * 8 * u * t.shake : 0;
    const g = t.bg;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(c.x - 4 * u + dx, c.y - 4 * u + 8 * u, c.w + 8 * u, c.h + 8 * u, 22 * u);
    g.fillRoundedRect(c.x - 4 * u + dx, c.y - 4 * u, c.w + 8 * u, c.h + 8 * u, 22 * u);
    g.fillStyle(locked ? LOCKED : CREAM, 1);
    g.fillRoundedRect(c.x + dx, c.y, c.w, c.h, 18 * u);
    g.fillStyle(0xffffff, 0.26);
    g.fillRoundedRect(c.x + 12 * u + dx, c.y + 9 * u, c.w - 24 * u, 10 * u, 5 * u);
    for (const [id, view] of t.views) {
      view.setVisible(id === cart);
      view.setAlpha(locked ? 0.45 : 1);
    }
    const room = t.name.getData("room") as number;
    t.name.setText(this.copy.carts[cart].toUpperCase()).setScale(1);
    t.name.setScale(Math.min(t.name.getData("base") as number, room / Math.max(1, t.name.width)));
    t.rider.setText(this.copy.rivalNames[cart]);
    const unlock = UNLOCKS[cart];
    t.trait.setText(locked && unlock ? this.copy.garage.locked[cart === "mila" ? "mila" : "lina"] : this.copy.garage.traits[cart]).setColor(locked ? "#a3402c" : "#3d3554");
    const artH = 250 * t.art.scale;
    const nameH = t.name.height * t.name.scaleY;
    const riderH = t.rider.height * t.rider.scaleY;
    const textH = nameH + 2 * u + riderH + 6 * u + t.trait.height * t.trait.scaleY;
    const total = artH + 16 * u + textH;
    t.art.y = c.y + Math.max(14 * u, (c.h - total) / 2) + artH;
    t.name.setPosition(c.x + c.w / 2 + dx, t.art.y + 16 * u);
    t.rider.setPosition(c.x + c.w / 2 + dx, t.name.y + nameH + 2 * u);
    t.trait.setPosition(c.x + c.w / 2 + dx, t.rider.y + riderH + 6 * u);
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(t.art.x - 20 * t.art.scale + dx, t.art.y + 4 * u, 300 * t.art.scale, 26 * t.art.scale);
    t.lock.setVisible(locked).setX(c.x + c.w - 34 * u + dx);
    for (const tile of t.tiles) {
      const on = tile.cart === cart && !attract;
      const off = !this.unlocked(tile.cart);
      const lift = on ? -5 * u : 0;
      const tg = tile.g;
      tg.clear();
      tg.fillStyle(INK, 1);
      tg.fillRoundedRect(tile.x - 3 * u, tile.y - 3 * u + 6 * u, tile.w + 6 * u, tile.h + 6 * u, 16 * u);
      tg.fillRoundedRect(tile.x - 3 * u, tile.y - 3 * u + lift, tile.w + 6 * u, tile.h + 6 * u, 16 * u);
      tg.fillStyle(on ? SUN : off ? LOCKED : CREAM, 1);
      tg.fillRoundedRect(tile.x, tile.y + lift, tile.w, tile.h, 13 * u);
      tg.fillStyle(0xffffff, on ? 0.35 : 0.22);
      tg.fillRoundedRect(tile.x + 8 * u, tile.y + 6 * u + lift, tile.w - 16 * u, 7 * u, 3.5 * u);
      if (on) {
        tg.lineStyle(4 * u, INK, 1);
        tg.strokeRoundedRect(tile.x - 8 * u, tile.y - 8 * u + lift, tile.w + 16 * u, tile.h + 16 * u, 20 * u);
      }
      tile.head.setY(tile.y + tile.h * 0.5 + 4 * u + lift).setTexture(`${tile.cart}-head-${on ? "happy" : "normal"}`);
      tile.lock?.setY(tile.y + 17 * u + lift);
    }
    if (!attract) {
      const ready = !locked;
      const go = t.go;
      const gg = this.goG;
      const y = go.y + (this.goDown ? 4 * u : 0);
      gg.clear();
      gg.fillStyle(INK, 1);
      gg.fillRoundedRect(go.x - 4 * u, go.y - 4 * u + (this.goDown ? 2 * u : 6 * u), go.w + 8 * u, go.h + 8 * u, 20 * u);
      gg.fillRoundedRect(go.x - 4 * u, y - 4 * u, go.w + 8 * u, go.h + 8 * u, 20 * u);
      gg.fillStyle(ready ? (this.goDown ? 0xf2b92f : SUN) : LOCKED, 1);
      gg.fillRoundedRect(go.x, y, go.w, go.h, 16 * u);
      gg.fillStyle(0xffffff, 0.3);
      gg.fillRoundedRect(go.x + 12 * u, y + 7 * u, go.w - 24 * u, 9 * u, 4.5 * u);
      this.goText.setY(go.y + go.h / 2 + (this.goDown ? 4 * u : 0)).setAlpha(ready ? 1 : 0.55);
    }
    if (this.chipG && this.chipText) {
      const ch = t.chip;
      const cg = this.chipG;
      cg.clear();
      cg.fillStyle(INK, 1);
      cg.fillRoundedRect(ch.x - 3 * u, ch.y - 3 * u, ch.w + 6 * u, ch.h + 6 * u, 15 * u);
      cg.fillStyle(this.ghost ? 0x7fe0c4 : CREAM, 1);
      cg.fillRoundedRect(ch.x, ch.y, ch.w, ch.h, 12 * u);
      this.chipText.setText(this.copy.garage.ghost(this.ghost));
      const base = this.chipText.getData("base") as number | undefined;
      const s0 = base ?? this.chipText.scaleX;
      if (base === undefined) this.chipText.setData("base", s0);
      this.chipText.setScale(Math.min(s0, (ch.w - 30 * u) / Math.max(1, this.chipText.width)));
    }
  }

  private pointerTall(p: Phaser.Input.Pointer, down: boolean) {
    const t = this.tall;
    if (!t || this.data0.attract) return;
    const inBox = (b: Box, pad = 0) => this.inside(p.x, p.y, b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
    if (down) {
      if (inBox(t.go, 4 * t.u)) {
        this.goDown = true;
        this.redraw();
        return;
      }
      if (inBox(t.chip, 4 * t.u)) {
        this.flipGhost();
        return;
      }
      const index = t.tiles.findIndex((tile) => inBox(tile, 4 * t.u));
      if (index >= 0) {
        if (index !== this.selected) {
          this.selected = index;
          getAudio().play(DOWNHILL_SFX.beep);
          this.redraw();
        }
        return;
      }
      if (inBox(t.card)) t.swipe = { id: p.id, x: p.x };
      return;
    }
    if (t.swipe && t.swipe.id === p.id) {
      const dx = p.x - t.swipe.x;
      t.swipe = null;
      if (Math.abs(dx) > 36 * t.u) this.move(dx < 0 ? 1 : -1);
      return;
    }
    if (!this.goDown) return;
    this.goDown = false;
    this.redraw();
    if (inBox(t.go, 10 * t.u)) this.confirm();
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
    if (this.tall) {
      this.redrawTall(this.tall);
      return;
    }
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
      if (this.tall) this.tall.shake = 0.5;
      else this.cards[this.selected].shake = 0.5;
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
    const t = this.tall;
    if (t) {
      const view = t.views.get(CART_IDS[this.selected]);
      const bob = this.data0.attract ? 0 : Math.sin(this.t * 5) * 3 * t.u;
      const dx = t.shake > 0 ? Math.sin(t.shake * 60) * 8 * t.u * t.shake : 0;
      view?.update({ x: t.art.x + dx, y: t.art.y + bob, angle: Math.sin(this.t * 3) * 0.02, speed: 0, crouch: false, charge: 0, air: false, spin: 0, accel: 0, bigAir: false, brace: false, paddling: false, distance: this.t * 120, crash: 0, time: this.t, countdown: true }, dt);
      if (t.shake > 0) {
        t.shake = Math.max(0, t.shake - dt);
        this.redraw();
      }
      return;
    }
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
