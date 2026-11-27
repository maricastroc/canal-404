import * as Phaser from "phaser";
import { INK_HEX, type Fonts } from "../../kit/ui";
import { MAP_POS, type AreaId } from "../config";
import type { Frame } from "../layout";
import { ALL_POSTERS, ALL_SECRETS, ALL_TOKENS, type State } from "../save";
import { ITEM_ICON, POSTER_AREA, foundText, mainObjective, sideQuests } from "../story";
import type { VacationText } from "../text/pt-BR";
import { FACE, FOLKS, FOLK_COLOR, TABS, pinUi, type Tab } from "./journal";

const PAPER = 0xfbf5e6;
const LEATHER = 0x7c4527;
const TAN = 0xecd9b2;
const TAB_ICON: Record<Tab, string> = { missions: "ui-target-l", found: "ui-bulb-l", collection: "ui-star-l", people: "ui-people-l", map: "ui-map-l" };

type Box = { x: number; y: number; w: number; h: number };
type Snapshot = { s: State; area: AreaId; ax: number; ay: number };

function roundFace(scene: Phaser.Scene, key: string) {
  const out = `${key}-round`;
  if (scene.textures.exists(out)) return out;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const size = 160;
  const tex = scene.textures.createCanvas(out, size, size);
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const k = size / Math.max(1, Math.min(src.width, src.height));
  ctx.drawImage(src, (size - src.width * k) / 2, (size - src.height * k) / 2 + size * 0.02, src.width * k, src.height * k);
  ctx.restore();
  tex.refresh();
  return out;
}

export class PhoneJournal {
  readonly root: Phaser.GameObjects.Container;
  tab: Tab = "missions";
  open = false;
  private frame: Frame;
  private u = 1;
  private back: Phaser.GameObjects.Container | null = null;
  private front: Phaser.GameObjects.Container | null = null;
  private content: Phaser.GameObjects.Container;
  private bar: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text | null = null;
  private tabs: { id: Tab; box: Box; g: Phaser.GameObjects.Graphics; img: Phaser.GameObjects.Image; t: Phaser.GameObjects.Text }[] = [];
  private close: { x: number; y: number; r: number } = { x: 0, y: 0, r: 0 };
  private view: Box = { x: 0, y: 0, w: 0, h: 0 };
  private sheet: Box = { x: 0, y: 0, w: 0, h: 0 };
  private scroll = 0;
  private maxScroll = 0;
  private drag: { id: number; y0: number; s0: number; lastY: number; lastT: number } | null = null;
  private velocity = 0;
  private lastTime = 0;
  private clip: Phaser.GameObjects.Graphics;
  private pin: Phaser.GameObjects.Image | null = null;
  private snap: Snapshot | null = null;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
    private text: VacationText,
    frame: Frame,
  ) {
    this.frame = frame;
    this.content = scene.add.container(0, 0);
    this.bar = scene.add.graphics();
    this.root = scene.add.container(0, 0, [this.content, this.bar]).setDepth(9500).setVisible(false);
    this.clip = scene.make.graphics({}, false);
    this.content.setMask(this.clip.createGeometryMask());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clip.destroy());
    this.layout(frame);
  }

  layout(frame: Frame) {
    this.frame = frame;
    this.u = frame.unit;
    this.back?.destroy();
    this.front?.destroy();
    this.buildChrome();
    this.root.removeAll(false);
    this.root.add([this.back!, this.content, this.front!, this.bar]);
    pinUi(this.root);
    if (this.open && this.snap) this.render();
  }

  private buildChrome() {
    const s = this.scene;
    const f = this.frame;
    const u = this.u;
    const sheet = { x: 8 * u + f.safe.left, y: 10 * u + f.safe.top, w: f.width - 16 * u - f.safe.left - f.safe.right, h: f.height - 18 * u - f.safe.top - f.safe.bottom };
    this.sheet = sheet;
    const dim = s.add.rectangle(0, 0, f.width, f.height, 0x140f26, 0.72).setOrigin(0, 0);
    const g = s.add.graphics();
    const b = 6 * u;
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(sheet.x + 3 * u, sheet.y + 4 * u, sheet.w, sheet.h, 18 * u);
    g.fillStyle(LEATHER, 1);
    g.fillRoundedRect(sheet.x - b, sheet.y - b, sheet.w + b * 2, sheet.h + b * 2, 20 * u);
    g.lineStyle(2.5 * u, INK_HEX, 1);
    g.strokeRoundedRect(sheet.x - b, sheet.y - b, sheet.w + b * 2, sheet.h + b * 2, 20 * u);
    g.fillStyle(PAPER, 1);
    g.fillRoundedRect(sheet.x, sheet.y, sheet.w, sheet.h, 14 * u);
    g.lineStyle(2.5 * u, INK_HEX, 1);
    g.strokeRoundedRect(sheet.x, sheet.y, sheet.w, sheet.h, 14 * u);
    this.back = s.add.container(0, 0, [dim, g]);

    const headH = 58 * u;
    const tabH = 60 * u;
    const tabY = sheet.y + sheet.h - tabH - 10 * u;
    this.view = { x: sheet.x + 16 * u, y: sheet.y + headH + 6 * u, w: sheet.w - 32 * u, h: tabY - 8 * u - (sheet.y + headH + 6 * u) };
    this.clip.clear();
    this.clip.fillStyle(0xffffff, 1);
    this.clip.fillRect(sheet.x, this.view.y, sheet.w, this.view.h);

    const fg = s.add.graphics();
    fg.fillStyle(PAPER, 1);
    fg.fillRect(sheet.x + 2 * u, sheet.y + 14 * u, sheet.w - 4 * u, headH - 8 * u);
    fg.fillRoundedRect(sheet.x + 2 * u, sheet.y + 2 * u, sheet.w - 4 * u, 20 * u, { tl: 12 * u, tr: 12 * u, bl: 0, br: 0 });
    fg.fillRect(sheet.x + 2 * u, tabY - 8 * u, sheet.w - 4 * u, sheet.y + sheet.h - (tabY - 8 * u) - 14 * u);
    fg.fillRoundedRect(sheet.x + 2 * u, sheet.y + sheet.h - 22 * u, sheet.w - 4 * u, 20 * u, { tl: 0, tr: 0, bl: 12 * u, br: 12 * u });
    fg.lineStyle(2 * u, 0xef8f86, 1);
    fg.lineBetween(sheet.x + 10 * u, sheet.y + headH + 2 * u, sheet.x + sheet.w - 10 * u, sheet.y + headH + 2 * u);
    fg.lineStyle(1.5 * u, 0xd9c39a, 1);
    fg.lineBetween(sheet.x + 10 * u, tabY - 6 * u, sheet.x + sheet.w - 10 * u, tabY - 6 * u);
    const rings = Math.max(5, Math.floor(sheet.w / (40 * u)));
    for (let i = 0; i < rings; i += 1) {
      const x = sheet.x + ((i + 0.5) * sheet.w) / rings;
      fg.fillStyle(0x3a3157, 1);
      fg.fillCircle(x, sheet.y + 10 * u, 4.5 * u);
      fg.lineStyle(3 * u, 0x9aa6b8, 1);
      fg.beginPath();
      fg.arc(x, sheet.y + 2 * u, 9 * u, Math.PI * 0.15, Math.PI * 0.85);
      fg.strokePath();
    }
    const cr = 20 * u;
    const cx = sheet.x + sheet.w - cr - 12 * u;
    const cy = sheet.y + headH / 2 + 6 * u;
    this.close = { x: cx, y: cy, r: cr + 8 * u };
    fg.fillStyle(INK_HEX, 1);
    fg.fillCircle(cx + 2 * u, cy + 3 * u, cr);
    fg.fillStyle(0xef4f43, 1);
    fg.fillCircle(cx, cy, cr);
    fg.lineStyle(2.5 * u, INK_HEX, 1);
    fg.strokeCircle(cx, cy, cr);
    const xi = s.add.image(cx, cy, "ui-close-l").setDisplaySize(cr * 1.1, cr * 1.1);
    this.title = s.add.text(sheet.x + 18 * u, cy, "", { fontFamily: this.fonts.display, fontSize: `${21 * u}px`, color: "#1d1830", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
    this.title.setData("max", cx - cr - 12 * u - (sheet.x + 18 * u));

    this.tabs = [];
    const parts: Phaser.GameObjects.GameObject[] = [fg, xi, this.title];
    const gap = 5 * u;
    const tw = (sheet.w - 16 * u - gap * (TABS.length - 1)) / TABS.length;
    TABS.forEach((id, i) => {
      const box = { x: sheet.x + 8 * u + i * (tw + gap), y: tabY, w: tw, h: tabH };
      const tg = s.add.graphics();
      const img = s.add.image(box.x + box.w / 2, box.y + 21 * u, TAB_ICON[id]).setDisplaySize(24 * u, 24 * u);
      const t = s.add.text(box.x + box.w / 2, box.y + 45 * u, this.text.journal.tabs[id], { fontFamily: this.fonts.round ?? this.fonts.body, fontSize: `${11 * u}px`, fontStyle: "800", color: "#1d1830", padding: { x: 1, y: 2 } }).setOrigin(0.5);
      let px = 11 * u;
      while (t.width > box.w - 6 * u && px > 8 * u) {
        px -= 0.25 * u;
        t.setFontSize(px);
      }
      this.tabs.push({ id, box, g: tg, img, t });
      parts.push(tg, img, t);
    });
    this.front = s.add.container(0, 0, parts);
    this.paintTabs();
  }

  private paintTabs() {
    const u = this.u;
    for (const t of this.tabs) {
      const on = t.id === this.tab;
      const lift = on ? 4 * u : 0;
      t.g.clear();
      t.g.fillStyle(INK_HEX, 1);
      t.g.fillRoundedRect(t.box.x + 2 * u, t.box.y + 3 * u, t.box.w, t.box.h, 12 * u);
      t.g.fillStyle(on ? 0xffc83d : TAN, 1);
      t.g.fillRoundedRect(t.box.x, t.box.y - lift, t.box.w, t.box.h, 12 * u);
      t.g.lineStyle(2.5 * u, INK_HEX, 1);
      t.g.strokeRoundedRect(t.box.x, t.box.y - lift, t.box.w, t.box.h, 12 * u);
      t.img.setY(t.box.y + 21 * u - lift).setAlpha(on ? 1 : 0.8);
      t.t.setY(t.box.y + 45 * u - lift);
    }
    const title = this.title;
    if (title) {
      title.setText(this.text.journal.tabs[this.tab].toUpperCase()).setFontSize(21 * u);
      const max = title.getData("max") as number;
      let px = 21 * u;
      while (title.width > max && px > 13 * u) {
        px -= 0.5 * u;
        title.setFontSize(px);
      }
    }
  }

  show(tab: Tab, s: State, area: AreaId, ax: number, ay: number) {
    this.open = true;
    this.tab = tab;
    this.snap = { s, area, ax, ay };
    this.scroll = 0;
    this.render();
    this.root.setVisible(true);
    if (!this.reduced) {
      this.root.setAlpha(0).setY(24 * this.u);
      this.scene.tweens.add({ targets: this.root, alpha: 1, y: 0, duration: 180, ease: "Quad.easeOut" });
    }
  }

  hide() {
    this.open = false;
    this.drag = null;
    this.velocity = 0;
    this.root.setVisible(false);
  }

  switchTo(tab: Tab, s: State, area: AreaId, ax: number, ay: number) {
    this.tab = tab;
    this.snap = { s, area, ax, ay };
    this.scroll = 0;
    this.velocity = 0;
    this.render();
  }

  step(dir: number, s: State, area: AreaId, ax: number, ay: number) {
    const i = TABS.indexOf(this.tab);
    this.switchTo(TABS[(i + dir + TABS.length) % TABS.length], s, area, ax, ay);
  }

  overButton(px: number, py: number) {
    if (Math.hypot(px - this.close.x, py - this.close.y) < this.close.r) return true;
    return this.tabs.some((t) => px >= t.box.x && px <= t.box.x + t.box.w && py >= t.box.y - 8 * this.u && py <= t.box.y + t.box.h + 6 * this.u);
  }

  hit(px: number, py: number, id = 0): Tab | "close" | null {
    if (Math.hypot(px - this.close.x, py - this.close.y) < this.close.r) return "close";
    for (const t of this.tabs) if (px >= t.box.x && px <= t.box.x + t.box.w && py >= t.box.y - 8 * this.u && py <= t.box.y + t.box.h + 6 * this.u) return t.id;
    const v = this.view;
    if (px >= this.sheet.x && px <= this.sheet.x + this.sheet.w && py >= v.y && py <= v.y + v.h) {
      this.drag = { id, y0: py, s0: this.scroll, lastY: py, lastT: this.scene.time.now };
      this.velocity = 0;
    }
    return null;
  }

  pointerMove(p: Phaser.Input.Pointer) {
    const d = this.drag;
    if (!d || p.id !== d.id) return;
    const now = this.scene.time.now;
    const dt = Math.max(1, now - d.lastT);
    this.velocity = this.velocity * 0.4 + (((d.lastY - p.y) / dt) * 0.6);
    d.lastY = p.y;
    d.lastT = now;
    this.setScroll(d.s0 - (p.y - d.y0));
  }

  pointerUp(p: Phaser.Input.Pointer) {
    if (!this.drag || p.id !== this.drag.id) return;
    if (this.scene.time.now - this.drag.lastT > 90) this.velocity = 0;
    this.drag = null;
  }

  scrollBy(dy: number) {
    this.velocity = 0;
    this.setScroll(this.scroll + dy * this.u);
  }

  private setScroll(v: number) {
    this.scroll = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.content.setY(-this.scroll);
    this.paintBar();
  }

  private paintBar() {
    const g = this.bar;
    g.clear();
    if (this.maxScroll <= 1) return;
    const v = this.view;
    const u = this.u;
    const total = v.h + this.maxScroll;
    const h = Math.max(36 * u, (v.h * v.h) / total);
    const y = v.y + ((v.h - h) * this.scroll) / this.maxScroll;
    g.fillStyle(0x7b62c4, 0.55);
    g.fillRoundedRect(this.sheet.x + this.sheet.w - 8 * u, y, 4 * u, h, 2 * u);
  }

  private render() {
    const snap = this.snap;
    if (!snap) return;
    this.content.removeAll(true);
    this.pin = null;
    this.paintTabs();
    const end = this.fill(snap.s, snap.area, snap.ax, snap.ay);
    this.maxScroll = Math.max(0, end - (this.view.y + this.view.h) + 12 * this.u);
    pinUi(this.content);
    this.setScroll(this.scroll);
  }

  private txt(x: number, y: number, text: string, size: number, color = "#1d1830", opts: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    const t = this.scene.add.text(x, y, text, { fontFamily: this.fonts.round ?? this.fonts.body, fontSize: `${size * this.u}px`, fontStyle: "700", color, padding: { x: 1, y: 2 }, ...opts });
    this.content.add(t);
    return t;
  }

  private head(y: number, text: string) {
    const t = this.scene.add.text(this.view.x, y, text.toUpperCase(), { fontFamily: this.fonts.display, fontSize: `${15 * this.u}px`, color: "#1d1830", padding: { x: 2, y: 3 }, wordWrap: { width: this.view.w } });
    this.content.add(t);
    const g = this.scene.add.graphics();
    g.lineStyle(1.5 * this.u, 0xd9c39a, 1);
    g.lineBetween(this.view.x, y + t.height + 2 * this.u, this.view.x + this.view.w, y + t.height + 2 * this.u);
    this.content.add(g);
    return y + t.height + 10 * this.u;
  }

  private check(x: number, y: number, done: boolean) {
    const u = this.u;
    const s = 24 * u;
    const g = this.scene.add.graphics();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(x, y, s, s, 6 * u);
    g.lineStyle(2.5 * u, INK_HEX, 1);
    g.strokeRoundedRect(x, y, s, s, 6 * u);
    if (done) {
      g.lineStyle(4 * u, 0x2fa996, 1);
      g.beginPath();
      g.moveTo(x + 5 * u, y + 13 * u);
      g.lineTo(x + 10 * u, y + 19 * u);
      g.lineTo(x + 20 * u, y + 5 * u);
      g.strokePath();
    }
    this.content.add(g);
  }

  private card(b: Box, fill: number) {
    const u = this.u;
    const g = this.scene.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(b.x + 2 * u, b.y + 3 * u, b.w, b.h, 12 * u);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(b.x, b.y, b.w, b.h, 12 * u);
    g.lineStyle(2.5 * u, INK_HEX, 1);
    g.strokeRoundedRect(b.x, b.y, b.w, b.h, 12 * u);
    this.content.add(g);
    return g;
  }

  private img(key: string, x: number, y: number, size: number) {
    const img = this.scene.add.image(x, y, key).setDisplaySize(size, size);
    this.content.add(img);
    return img;
  }

  private fill(s: State, area: AreaId, ax: number, ay: number) {
    const u = this.u;
    const v = this.view;
    const T = this.text.journal;
    let y = v.y + 4 * u;
    if (this.tab === "missions") {
      const main = mainObjective(s, this.text);
      y = this.head(y, T.mainHead);
      const label = this.txt(v.x + 48 * u, 0, T.mainGoal, 11.5, "#7b62c4", { wordWrap: { width: v.w - 92 * u } });
      const body = this.txt(v.x + 48 * u, 0, main.text, 16, "#1d1830", { wordWrap: { width: v.w - 92 * u } });
      const h = Math.max(70 * u, label.height + body.height + 24 * u);
      const box = { x: v.x, y, w: v.w, h };
      const g = this.card(box, main.done ? 0xc9f2e4 : 0xffe39a);
      this.content.sendToBack(g);
      label.setY(y + (h - label.height - body.height) / 2);
      body.setY(label.y + label.height);
      this.img("ui-star-l", v.x + 24 * u, y + h / 2, 28 * u);
      this.check(v.x + v.w - 36 * u, y + (h - 24 * u) / 2, main.done);
      y += h + 18 * u;
      y = this.head(y, T.sideHead);
      for (const q of sideQuests(s, this.text)) {
        this.check(v.x, y + 1 * u, q.done);
        const t = this.txt(v.x + 34 * u, y, q.text, 15, q.done ? "#2fa996" : "#1d1830", { wordWrap: { width: v.w - 34 * u } });
        y += Math.max(28 * u, t.height) + 10 * u;
      }
      y += 8 * u;
      y = this.head(y, T.bagHead);
      if (!s.items.length) {
        const t = this.txt(v.x, y, T.bagEmpty, 14.5, "#7d6fb0");
        y += t.height + 8 * u;
      }
      const cw = (v.w - 10 * u) / 2;
      const ch = 58 * u;
      s.items.forEach((it, i) => {
        const bx = v.x + (i % 2) * (cw + 10 * u);
        const by = y + Math.floor(i / 2) * (ch + 10 * u);
        this.card({ x: bx, y: by, w: cw, h: ch }, TAN);
        this.img(ITEM_ICON[it], bx + 28 * u, by + ch / 2, 40 * u);
        const name = this.txt(bx + 54 * u, 0, this.text.items[it], 13, "#1d1830", { wordWrap: { width: cw - 60 * u }, lineSpacing: 0 });
        name.setY(by + (ch - name.height) / 2);
      });
      if (s.items.length) y += Math.ceil(s.items.length / 2) * (ch + 10 * u);
      return y;
    }
    if (this.tab === "found") {
      y = this.head(y, T.foundHead);
      const found = s.found.filter((f) => foundText(this.text, f));
      if (!found.length) {
        const t = this.txt(v.x, y, T.foundEmpty, 14.5, "#7d6fb0", { wordWrap: { width: v.w } });
        return y + t.height;
      }
      for (const f of found) {
        this.img("ui-bulb-l", v.x + 11 * u, y + 11 * u, 20 * u);
        const t = this.txt(v.x + 30 * u, y, foundText(this.text, f) ?? f, 14.5, "#1d1830", { wordWrap: { width: v.w - 30 * u } });
        y += Math.max(24 * u, t.height) + 6 * u;
        const g = this.scene.add.graphics();
        g.lineStyle(1 * u, 0xe2cc9f, 1);
        g.lineBetween(v.x + 30 * u, y - 3 * u, v.x + v.w, y - 3 * u);
        this.content.add(g);
        y += 4 * u;
      }
      return y;
    }
    if (this.tab === "collection") {
      y = this.head(y, T.posters(s.posters.length, ALL_POSTERS.length));
      const gap = 8 * u;
      const cw = (v.w - gap * 2) / 3;
      const iw = cw - 18 * u;
      const ih = (iw * 187) / 142;
      const ch = ih + 52 * u;
      ALL_POSTERS.forEach((p, i) => {
        const bx = v.x + (i % 3) * (cw + gap);
        const by = y + Math.floor(i / 3) * (ch + gap);
        const got = s.posters.includes(p);
        this.card({ x: bx, y: by, w: cw, h: ch }, got ? 0xfffaf0 : 0xd9c39a);
        if (got) this.content.add(this.scene.add.image(bx + cw / 2, by + 9 * u + ih / 2, `poster-${p}`).setDisplaySize(iw, ih));
        else this.content.add(this.scene.add.text(bx + cw / 2, by + 9 * u + ih / 2, "?", { fontFamily: this.fonts.display, fontSize: `${40 * u}px`, color: "#a8822f" }).setOrigin(0.5));
        const title = this.txt(bx + cw / 2, 0, got ? this.text.posters[p].title : this.text.areas[POSTER_AREA[p]], 11, "#1d1830", { align: "center", wordWrap: { width: cw - 10 * u }, lineSpacing: 0 }).setOrigin(0.5, 0);
        title.setY(by + ih + 12 * u + Math.max(0, (36 * u - title.height) / 2));
      });
      y += Math.ceil(ALL_POSTERS.length / 3) * (ch + gap) + 12 * u;
      y = this.head(y, T.tokens(s.tokens.length, ALL_TOKENS.length));
      ALL_TOKENS.forEach((tk, i) => {
        const img = this.img("item-token", v.x + 24 * u + i * 56 * u, y + 22 * u, 44 * u);
        if (!s.tokens.includes(tk)) img.setTintFill(0xd9c39a);
      });
      y += 56 * u;
      y = this.head(y, T.secrets(s.secrets.length, ALL_SECRETS.length));
      for (const sec of ALL_SECRETS) {
        const got = s.secrets.includes(sec);
        this.img(got ? "ui-star-l" : "ui-dot-l", v.x + 11 * u, y + 11 * u, 20 * u);
        const t = this.txt(v.x + 30 * u, y, got ? this.text.secrets[sec] : "???", 14.5, got ? "#1d1830" : "#7d6fb0", { wordWrap: { width: v.w - 30 * u } });
        y += Math.max(26 * u, t.height) + 6 * u;
      }
      return y;
    }
    if (this.tab === "people") {
      y = this.head(y, T.people(s.met.length, FOLKS.length));
      const gap = 10 * u;
      const cw = (v.w - gap) / 2;
      const ch = 66 * u;
      const r = 24 * u;
      FOLKS.forEach((id, i) => {
        const bx = v.x + (i % 2) * (cw + gap);
        const by = y + Math.floor(i / 2) * (ch + 6 * u);
        const cx = bx + r + 2 * u;
        const cy = by + 6 * u + r;
        const met = s.met.includes(id);
        const g = this.scene.add.graphics();
        g.fillStyle(met ? FOLK_COLOR[id] : 0xd9c39a, 1);
        g.fillCircle(cx, cy, r);
        this.content.add(g);
        if (met) this.content.add(this.scene.add.image(cx, cy, roundFace(this.scene, FACE[id])).setDisplaySize(r * 2 - 3 * u, r * 2 - 3 * u));
        else this.content.add(this.scene.add.text(cx, cy, "?", { fontFamily: this.fonts.display, fontSize: `${24 * u}px`, color: "#a8822f" }).setOrigin(0.5));
        const ring = this.scene.add.graphics();
        ring.lineStyle(2.5 * u, INK_HEX, 1);
        ring.strokeCircle(cx, cy, r);
        this.content.add(ring);
        const tx = cx + r + 8 * u;
        const tw = bx + cw - tx;
        const name = this.txt(tx, by + 2 * u, met ? this.text.speakers[id] : "???", 13.5, "#1d1830", { wordWrap: { width: tw } });
        this.txt(tx, name.y + name.height - 1 * u, met ? this.text.folks[id] : T.notMet, 11, "#3a3157", { wordWrap: { width: tw }, lineSpacing: 0 });
      });
      return y + Math.ceil(FOLKS.length / 2) * (ch + 6 * u);
    }
    const scale = v.w / 1200;
    const mh = 760 * scale;
    const map = this.scene.add.image(v.x, y, "map-island").setOrigin(0, 0).setScale(scale);
    const frame = this.scene.add.graphics();
    frame.lineStyle(2.5 * u, INK_HEX, 1);
    frame.strokeRoundedRect(v.x, y, v.w, mh, 6 * u);
    this.content.add([map, frame]);
    const at = (px: number, py: number): [number, number] => [v.x + px * scale, y + py * scale];
    const areas: AreaId[] = ["lobby", "pool", "arcade", "beach", "forest", "station"];
    for (const a of areas) {
      if (a === "station" && !s.visited.includes("station")) continue;
      const [px, py] = MAP_POS[a];
      const known = s.visited.includes(a);
      const label = this.scene.add.text(0, 0, known ? this.text.areas[a].toUpperCase() : "???", { fontFamily: this.fonts.display, fontSize: `${10.5 * u}px`, color: "#1d1830", padding: { x: 1, y: 2 } }).setOrigin(0.5);
      const w = label.width + 12 * u;
      const lg = this.scene.add.graphics();
      lg.fillStyle(INK_HEX, 1);
      lg.fillRoundedRect(-w / 2 + 1.5 * u, -10 * u + 2 * u, w, 20 * u, 6 * u);
      lg.fillStyle(0xfffaf0, 1);
      lg.fillRoundedRect(-w / 2, -10 * u, w, 20 * u, 6 * u);
      lg.lineStyle(2 * u, INK_HEX, 1);
      lg.strokeRoundedRect(-w / 2, -10 * u, w, 20 * u, 6 * u);
      const [lx, ly] = at(px, py + 60);
      this.content.add(this.scene.add.container(Phaser.Math.Clamp(lx, v.x + w / 2 + 2 * u, v.x + v.w - w / 2 - 2 * u), ly, [lg, label]));
    }
    const main = mainObjective(s, this.text);
    if (main.area && main.area !== "station") {
      const [tx, ty] = MAP_POS[main.area];
      this.img("ui-target-l", ...at(tx + 70, ty - 20), 26 * u);
    } else if (main.area === "station") {
      const [tx, ty] = MAP_POS.forest;
      this.img("ui-target-l", ...at(tx - 90, ty - 90), 26 * u);
    }
    for (const p of ALL_POSTERS) {
      const a = POSTER_AREA[p];
      if (s.posters.includes(p) || !s.visited.includes(a)) continue;
      const [sx, sy] = MAP_POS[a];
      this.img("ui-star-l", ...at(sx - 70, sy - 30), 20 * u);
    }
    const pa = area === "room404" ? "lobby" : area;
    const [bx, by] = MAP_POS[pa];
    const [pinX, pinY] = at(bx + ax * 70, by + ay * 40);
    this.pin = this.scene.add.image(pinX, pinY, "ui-pin-l").setOrigin(0.5, 0.95).setDisplaySize(32 * u, 32 * u);
    this.content.add(this.pin);
    y += mh + 14 * u;
    const legend: [string, string][] = [
      ["ui-pin-l", T.here],
      ["ui-target-l", T.main],
      ["ui-star-l", T.poster],
    ];
    for (const [icon, label] of legend) {
      this.img(icon, v.x + 12 * u, y + 12 * u, 22 * u);
      const t = this.txt(v.x + 32 * u, y, label, 14.5, "#1d1830", { wordWrap: { width: v.w - 32 * u } });
      y += Math.max(26 * u, t.height) + 6 * u;
    }
    return y;
  }

  update(time: number) {
    const dt = this.lastTime ? Math.min(50, time - this.lastTime) : 16;
    this.lastTime = time;
    if (!this.open) return;
    if (this.pin && !this.reduced) {
      const k = 32 * this.u * (1 + Math.sin(time / 220) * 0.08);
      this.pin.setDisplaySize(k, k);
    }
    if (!this.drag && Math.abs(this.velocity) > 0.02) {
      this.setScroll(this.scroll + this.velocity * dt);
      this.velocity *= Math.exp(-dt * 0.004);
      if (this.scroll <= 0 || this.scroll >= this.maxScroll) this.velocity = 0;
    }
  }
}
