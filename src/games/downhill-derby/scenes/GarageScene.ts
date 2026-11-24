import * as Phaser from "phaser";
import { getAudio } from "@/lib/audio/engine";
import type { Locale } from "@/i18n/locales";
import { RACE_COPY, type GhostState, type RaceCopy } from "../copy";
import { CART_IDS, UNLOCKS, type CartId } from "../sim/carts";
import type { CourseId } from "../sim/course";
import type { TrackWins } from "../save";
import { DOWNHILL_SFX } from "../sounds";
import type { Frame } from "../layout";
import { CartView, INK } from "./cart";
import { currentFrame, watchFrame } from "./frame";
import { H, W } from "./hud";
import { keyArrows } from "../../kit/keyArrows";

export type GarageHost = {
  locale: Locale;
  fonts: { display: string; body: string };
  reducedMotion: boolean;
  pick: (cart: CartId) => void;
  toggleGhost: () => boolean;
  announce: (message: string) => void;
};

export type GarageData = { attract: boolean; course: CourseId; index: number; cart: CartId; ghost: boolean; ghosts: readonly CartId[]; unlocked: readonly CartId[]; wins: TrackWins };

const CW = 400;
const CH = 560;
const GAP = 40;
const X0 = (W - (CW * 4 + GAP * 3)) / 2;
const Y0 = 220;
const TITLE_Y = 76;
const TRACK_Y = 160;
const STREET = 804;
const ROW_Y = 834;
const GO_Y = 922;
const GO_H = 92;
const GO_MIN_W = 440;
const HINT = { y: 1055, size: 22 };
const CREAM = 0xfbf5e6;
const SUN = 0xffcf3f;
const LOCKED = 0xd8d2ea;
const MINT = 0x7fe0c4;
const TRACK_OFF = 0xc4bbd8;
const TRACK_RATIO = 1.8;

type Badge = { g: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; count: Phaser.GameObjects.Text };

type Card = { cart: CartId; x: number; g: Phaser.GameObjects.Graphics; view: CartView; name: Phaser.GameObjects.Text; rider: Phaser.GameObjects.Text; trait: Phaser.GameObjects.Text; lock: Phaser.GameObjects.Graphics | null; badge: Badge | null; shake: number };

type Box = { x: number; y: number; w: number; h: number };

type Focus = "cart" | "ghost" | "go";

type RowSpec = { h: number; title: number; lead: number; icon: number; pad: number; gap: number; track: number; line: number; drop: number; max: number };

type GhostRow = { box: Box; hit: Box; spec: RowSpec; g: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; glyph: Phaser.GameObjects.Image; title: Phaser.GameObjects.Text; lead: Phaser.GameObjects.Text; shake: number };

type Tile = Box & { cart: CartId; g: Phaser.GameObjects.Graphics; head: Phaser.GameObjects.Image; lock: Phaser.GameObjects.Graphics | null; badge: Badge | null };

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
  private goBox: Box = { x: 0, y: 0, w: 0, h: 0 };
  private row: GhostRow | null = null;
  private ghost = false;
  private knob = 0;
  private focus: Focus = "cart";
  private goDown = false;
  private ghostDown = false;
  private hover = false;
  private t = 0;
  private frame!: Frame;
  private tall: Tall | null = null;

  constructor() {
    super("garage");
  }

  init(data: GarageData) {
    this.data0 = { attract: data.attract ?? true, course: data.course ?? "arlindo", index: data.index ?? 0, cart: data.cart ?? "deco", ghost: data.ghost ?? false, ghosts: data.ghosts ?? [], unlocked: data.unlocked ?? [], wins: data.wins ?? {} };
    this.cards = [];
    this.row = null;
    this.focus = "cart";
    this.goDown = false;
    this.ghostDown = false;
    this.hover = false;
    this.t = 0;
    this.tall = null;
  }

  create() {
    this.host = this.registry.get("garage") as GarageHost;
    this.copy = RACE_COPY[this.host.locale];
    const d = this.data0;
    this.ghost = d.ghost;
    this.selected = Math.max(0, CART_IDS.indexOf(d.cart));
    this.knob = this.ghostState() === "on" ? 1 : 0;
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
      this.input.setDefaultCursor("");
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
    this.add.text(W / 2, TITLE_Y, this.copy.garage.title.toUpperCase(), display(96, "#fbf5e6", 16)).setOrigin(0.5);
    const track = this.add.text(W / 2, TRACK_Y, this.copy.garage.track(d.index + 1, this.copy.courses[d.course]), body(32)).setOrigin(0.5);
    const pill = this.add.graphics();
    pill.fillStyle(INK, 1);
    pill.fillRoundedRect(W / 2 - track.width / 2 - 30, TRACK_Y - 32, track.width + 60, 64, 32);
    pill.fillStyle(SUN, 1);
    pill.fillRoundedRect(W / 2 - track.width / 2 - 24, TRACK_Y - 26, track.width + 48, 52, 26);
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
      this.cards.push({ cart, x, g, view, name, rider, trait, lock, badge: this.makeBadge(cart, 4), shake: 0 });
    });
    if (!d.attract) {
      this.row = this.makeGhostRow({ h: 60, title: 24, lead: 20, icon: 34, pad: 18, gap: 14, track: 34, line: 5, drop: 3, max: 760 }, W / 2, ROW_Y, 14, 22, 12);
      const touch = window.matchMedia?.("(pointer: coarse)").matches === true;
      keyArrows(this.add.text(W / 2, HINT.y, touch ? this.copy.garage.touch : this.copy.garage.keys, body(HINT.size, "#fbf5e6")).setOrigin(0.5).setDepth(6));
    }
    const goW = Math.max(GO_MIN_W, this.row?.box.w ?? 0);
    this.goBox = { x: W / 2 - goW / 2, y: GO_Y, w: goW, h: GO_H };
    this.goG = this.add.graphics().setDepth(5);
    this.goText = this.add.text(W / 2, GO_Y + GO_H / 2, this.copy.garage.go.toUpperCase(), display(60, "#1d1830")).setOrigin(0.5).setDepth(6);
    this.goG.setVisible(!d.attract);
    this.goText.setVisible(!d.attract);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointer(p, true));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointer(p, false));
    this.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.pointer(p, false));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.hoverAt(p));
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
    this.goBox = go;
    if (!d.attract) {
      const rowH = 46 * u * k;
      this.row = this.makeGhostRow({ h: rowH, title: 14.5 * u * k, lead: 12.5 * u * k, icon: 24 * u * k, pad: 12 * u * k, gap: 10 * u * k, track: 26 * u * k, line: 3 * u, drop: 3 * u, max: w }, f.width / 2, go.y - 16 * u - rowH, 4 * u, 9 * u, 6 * u);
    }
    const tileH = 76 * u * k;
    const tilesY = (this.row ? this.row.box.y - 22 * u : bottom) - tileH;
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
      return { cart, x, y: tilesY, w: tw, h: tileH, g, head, lock: tl, badge: this.makeBadge(cart, 3) };
    });
    this.goG = this.add.graphics().setDepth(5);
    this.goText = this.add.text(go.x + go.w / 2, go.y + go.h / 2, this.copy.garage.go.toUpperCase(), display(60, "#1d1830")).setOrigin(0.5).setDepth(6);
    this.goText.setScale(Math.min((28 * u * k) / 60, (go.w - 30 * u) / Math.max(1, this.goText.width)));
    this.goG.setVisible(!d.attract);
    this.goText.setVisible(!d.attract);
    this.tall = { u, card, art, bg, views, name, rider, trait, lock, tiles, go, swipe: null, shake: 0 };
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointerTall(p, true));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointerTall(p, false));
    this.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => this.pointerTall(p, false));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.hoverAt(p));
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
      if (tile.badge) this.placeBadge(tile.badge, tile.x + tile.w + 6 * u, tile.y - 10 * u + lift, 22 * u, on ? CREAM : SUN);
    }
    if (!attract) {
      const ready = !locked;
      const go = t.go;
      const gg = this.goG;
      const y = go.y + (this.goDown ? 4 * u : 0);
      gg.clear();
      if (this.focus === "go") this.focusRing(gg, go.x - 9 * u, go.y - 9 * u, go.w + 18 * u, go.h + 24 * u, 26 * u, 3 * u);
      gg.fillStyle(INK, 1);
      gg.fillRoundedRect(go.x - 4 * u, go.y - 4 * u + (this.goDown ? 2 * u : 6 * u), go.w + 8 * u, go.h + 8 * u, 20 * u);
      gg.fillRoundedRect(go.x - 4 * u, y - 4 * u, go.w + 8 * u, go.h + 8 * u, 20 * u);
      gg.fillStyle(ready ? (this.goDown ? 0xf2b92f : SUN) : LOCKED, 1);
      gg.fillRoundedRect(go.x, y, go.w, go.h, 16 * u);
      gg.fillStyle(0xffffff, 0.3);
      gg.fillRoundedRect(go.x + 12 * u, y + 7 * u, go.w - 24 * u, 9 * u, 4.5 * u);
      this.goText.setY(go.y + go.h / 2 + (this.goDown ? 4 * u : 0)).setAlpha(ready ? 1 : 0.55);
    }
    this.drawGhostRow();
  }

  private pointerTall(p: Phaser.Input.Pointer, down: boolean) {
    const t = this.tall;
    if (!t || this.data0.attract) return;
    const inBox = (b: Box, pad = 0) => this.inside(p.x, p.y, b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
    if (down) {
      this.pointerFocus();
      if (inBox(t.go, 4 * t.u)) {
        this.goDown = true;
        this.redraw();
        return;
      }
      if (this.row && inBox(this.row.hit)) {
        this.ghostDown = true;
        this.drawGhostRow();
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
    if (this.releaseGhost(p)) return;
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

  private makeBadge(cart: CartId, depth: number): Badge | null {
    const wins = this.data0.wins[cart] ?? 0;
    if (wins <= 0 || !this.unlocked(cart)) return null;
    const g = this.add.graphics().setDepth(depth);
    const icon = this.add.image(0, 0, "dd-ico-trophy").setDepth(depth);
    const count = this.add.text(0, 0, `${wins}`, { fontFamily: this.host.fonts.display, fontSize: "64px", color: "#1d1830" }).setOrigin(0, 0.5).setDepth(depth);
    return { g, icon, count };
  }

  private placeBadge(b: Badge, right: number, top: number, h: number, fill: number) {
    const size = h * 0.6;
    const pad = h * 0.3;
    const gap = h * 0.14;
    b.icon.setDisplaySize(size, size);
    b.count.setScale((h * 0.62) / 64);
    const w = pad + size + gap + b.count.width * b.count.scaleX + pad;
    const x = right - w;
    const r = h * 0.3;
    const g = b.g;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x + h * 0.08, top + h * 0.1, w, h, r);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x, top, w, h, r);
    g.lineStyle(Math.max(2, h * 0.08), INK, 1);
    g.strokeRoundedRect(x, top, w, h, r);
    b.icon.setPosition(x + pad + size / 2, top + h / 2);
    b.count.setPosition(x + pad + size + gap, top + h / 2);
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
      g.fillRect(x, STREET - h, 190, h);
      g.fillTriangle(x - 12, STREET - h, x + 95, STREET - h - 70, x + 202, STREET - h);
    }
    g.fillStyle(0x6b6585, 1);
    g.fillRect(0, STREET, W, H - STREET);
    g.fillStyle(0xcfc6e0, 1);
    g.fillRect(0, STREET - 8, W, 22);
    g.fillStyle(INK, 1);
    g.fillRect(0, STREET + 14, W, 6);
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
      if (c.badge) this.placeBadge(c.badge, x + CW - 22, y + 24, 48, on ? CREAM : SUN);
    });
    if (!attract) {
      const ready = this.unlocked(CART_IDS[this.selected]);
      const go = this.goBox;
      const g = this.goG;
      const x = go.x;
      const y = go.y + (this.goDown ? 4 : 0);
      g.clear();
      if (this.focus === "go") this.focusRing(g, x - 17, go.y - 17, go.w + 34, go.h + 42, 40, 5);
      g.fillStyle(INK, 1);
      g.fillRoundedRect(x - 6, y - 6 + (this.goDown ? 2 : 8), go.w + 12, go.h + 12, 28);
      g.fillRoundedRect(x - 6, y - 6, go.w + 12, go.h + 12, 28);
      g.fillStyle(ready ? (this.goDown ? 0xf2b92f : SUN) : LOCKED, 1);
      g.fillRoundedRect(x, y, go.w, go.h, 22);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(x + 14, y + 10, go.w - 28, 14, 7);
      this.goText.setY(go.y + go.h / 2 + (this.goDown ? 4 : 0));
      this.goText.setAlpha(ready ? 1 : 0.55);
    }
    this.drawGhostRow();
  }

  private makeGhostRow(spec: RowSpec, cx: number, y: number, padX: number, padTop: number, padBottom: number): GhostRow {
    const style = (size: number, color: string) => ({ fontFamily: this.host.fonts.body, fontSize: `${Math.round(size)}px`, color, fontStyle: "700" });
    const g = this.add.graphics().setDepth(5);
    const icon = this.add.image(0, 0, "dd-ico-ghost").setDepth(6);
    const glyph = this.add.image(0, 0, "dd-ico-check").setDepth(6);
    const title = this.add.text(0, 0, this.copy.garage.ghostTitle, style(spec.title, "#1d1830")).setDepth(6);
    const lead = this.add.text(0, 0, this.copy.garage.ghostLater, style(spec.lead, "#6a6385")).setDepth(6);
    const later = lead.width;
    lead.setText(this.copy.garage.ghostLead);
    const text = Math.max(title.width, lead.width, later);
    const fixed = spec.pad + spec.icon + spec.gap + spec.gap * 1.5 + spec.track * TRACK_RATIO + spec.pad;
    const w = Math.min(spec.max, fixed + text);
    const fit = Math.min(1, (w - fixed) / Math.max(1, text));
    title.setScale(fit);
    lead.setScale(fit);
    const box = { x: cx - w / 2, y, w, h: spec.h };
    const hit = { x: box.x - padX, y: box.y - padTop, w: box.w + padX * 2, h: box.h + padTop + padBottom };
    return { box, hit, spec, g, icon, glyph, title, lead, shake: 0 };
  }

  private drawGhostRow() {
    const row = this.row;
    if (!row) return;
    const state = this.ghostState();
    const s = row.spec;
    const b = row.box;
    const g = row.g;
    const l = s.line;
    const dx = row.shake > 0 ? Math.sin(row.shake * 60) * s.h * 0.14 * row.shake : 0;
    const x = b.x + dx;
    const y = b.y + (this.ghostDown ? s.drop * 0.75 : 0);
    const r = b.h / 2;
    g.clear();
    if (this.focus === "ghost") {
      const o = l * 2.6;
      this.focusRing(g, b.x - o, b.y - o, b.w + o * 2, b.h + o * 2 + s.drop, r + o, l);
    }
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - l, b.y - l + s.drop, b.w + l * 2, b.h + l * 2, r + l);
    g.fillRoundedRect(x - l, y - l, b.w + l * 2, b.h + l * 2, r + l);
    g.fillStyle(state === "later" ? LOCKED : CREAM, 1);
    g.fillRoundedRect(x, y, b.w, b.h, r);
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(x + r * 0.8, y + b.h * 0.1, b.w - r * 1.6, b.h * 0.12, b.h * 0.06);
    const th = s.track;
    const tw = th * TRACK_RATIO;
    const tx = x + b.w - s.pad - tw;
    const ty = y + (b.h - th) / 2;
    g.fillStyle(INK, 1);
    g.fillRoundedRect(tx - l, ty - l, tw + l * 2, th + l * 2, th / 2 + l);
    g.fillStyle(state === "on" ? MINT : TRACK_OFF, 1);
    g.fillRoundedRect(tx, ty, tw, th, th / 2);
    g.fillStyle(INK, 0.14);
    g.fillRoundedRect(tx + th * 0.25, ty + th * 0.12, tw - th * 0.5, th * 0.2, th * 0.1);
    const kr = th / 2 - l * 0.2;
    const kx = tx + th / 2 + (tw - th) * this.knob;
    const ky = ty + th / 2;
    g.fillStyle(INK, 1);
    g.fillCircle(kx, ky + l * 0.8, kr + l);
    g.fillCircle(kx, ky, kr + l);
    g.fillStyle(CREAM, 1);
    g.fillCircle(kx, ky, kr);
    const glyph = state === "later" ? "dd-ico-lock" : "dd-ico-check";
    row.glyph.setTexture(glyph).setVisible(state === "later" || (state === "on" && this.knob > 0.5)).setPosition(kx, ky).setDisplaySize(kr * 1.3, kr * 1.3);
    row.icon.setPosition(x + s.pad + s.icon / 2, y + b.h / 2).setDisplaySize(s.icon, s.icon).setAlpha(state === "on" ? 1 : state === "off" ? 0.7 : 0.4);
    row.lead.setText(state === "later" ? this.copy.garage.ghostLater : this.copy.garage.ghostLead).setColor(state === "later" ? "#8c3422" : "#6a6385");
    const left = x + s.pad + s.icon + s.gap;
    const h1 = row.title.displayHeight;
    const h2 = row.lead.displayHeight;
    const top = y + (b.h - h1 * 0.94 - h2) / 2;
    row.title.setPosition(left, top);
    row.lead.setPosition(left, top + h1 * 0.94);
  }

  private focusRing(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, line: number) {
    const radius = Math.min(r, h / 2, w / 2);
    g.lineStyle(line * 2.2, INK, 1);
    g.strokeRoundedRect(x, y, w, h, radius);
    g.lineStyle(line * 1.1, SUN, 1);
    g.strokeRoundedRect(x, y, w, h, radius);
  }

  private ghostAvailable() {
    return this.data0.ghosts.includes(CART_IDS[this.selected]);
  }

  private ghostState(): GhostState {
    if (!this.ghostAvailable()) return "later";
    return this.ghost ? "on" : "off";
  }

  private tickGhost(dt: number) {
    const row = this.row;
    if (!row) return;
    const target = this.ghostState() === "on" ? 1 : 0;
    let dirty = false;
    if (this.knob !== target) {
      const step = this.host.reducedMotion ? 1 : dt * 9;
      this.knob = target > this.knob ? Math.min(target, this.knob + step) : Math.max(target, this.knob - step);
      dirty = true;
    }
    if (row.shake > 0) {
      row.shake = Math.max(0, row.shake - dt);
      dirty = true;
    }
    if (dirty) this.drawGhostRow();
  }

  private releaseGhost(p: Phaser.Input.Pointer) {
    if (!this.ghostDown) return false;
    this.ghostDown = false;
    this.drawGhostRow();
    const hit = this.row?.hit;
    if (hit && this.inside(p.x, p.y, hit.x, hit.y, hit.w, hit.h)) this.flipGhost();
    return true;
  }

  private pointerFocus() {
    if (this.focus === "cart") return;
    this.focus = "cart";
    this.redraw();
  }

  private hoverAt(p: Phaser.Input.Pointer) {
    if (this.data0.attract) return;
    const over = (b: Box) => this.inside(p.x, p.y, b.x, b.y, b.w, b.h);
    const t = this.tall;
    const cards = t ? t.tiles.some(over) : this.cards.some((c) => this.inside(p.x, p.y, c.x, Y0 - 20, CW, CH + 20));
    const hover = over(this.goBox) || (!!this.row && over(this.row.hit)) || cards;
    if (hover === this.hover) return;
    this.hover = hover;
    this.input.setDefaultCursor(hover ? "pointer" : "");
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
    if (!this.ghostAvailable()) {
      if (this.row) this.row.shake = 0.4;
      this.host.announce(this.copy.garage.ghost("later"));
      return;
    }
    this.ghost = this.host.toggleGhost();
    getAudio().play(DOWNHILL_SFX.beep);
    this.host.announce(this.copy.garage.ghost(this.ghostState()));
    this.drawGhostRow();
  }

  private stepFocus(dir: number) {
    const order: Focus[] = ["cart", "ghost", "go"];
    const next = order[Phaser.Math.Clamp(order.indexOf(this.focus) + dir, 0, order.length - 1)];
    if (next === this.focus) return;
    this.focus = next;
    getAudio().play(DOWNHILL_SFX.beep);
    if (next === "ghost") this.host.announce(this.copy.garage.ghost(this.ghostState()));
    else if (next === "go") this.host.announce(this.copy.garage.go);
    this.redraw();
  }

  key(code: string) {
    if (this.data0.attract) return false;
    if (code === "ArrowLeft" || code === "KeyA") this.move(-1);
    else if (code === "ArrowRight" || code === "KeyD") this.move(1);
    else if (code === "ArrowDown" || code === "KeyS") this.stepFocus(1);
    else if (code === "ArrowUp" || code === "KeyW") this.stepFocus(-1);
    else if (code === "Space" || code === "Enter" || code === "NumpadEnter") {
      if (this.focus === "ghost") this.flipGhost();
      else this.confirm();
    } else if (code === "KeyG") this.flipGhost();
    else return false;
    return true;
  }

  private inside(px: number, py: number, x: number, y: number, w: number, h: number) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  private pointer(p: Phaser.Input.Pointer, down: boolean) {
    if (this.data0.attract) return;
    const go = this.goBox;
    const overGo = this.inside(p.x, p.y, go.x, go.y, go.w, go.h);
    if (down) {
      this.pointerFocus();
      if (overGo) {
        this.goDown = true;
        this.redraw();
        return;
      }
      const hit = this.row?.hit;
      if (hit && this.inside(p.x, p.y, hit.x, hit.y, hit.w, hit.h)) {
        this.ghostDown = true;
        this.drawGhostRow();
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
    if (this.releaseGhost(p)) return;
    if (!this.goDown) return;
    this.goDown = false;
    this.redraw();
    if (overGo) this.confirm();
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 100) / 1000;
    this.t += dt;
    this.tickGhost(dt);
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
