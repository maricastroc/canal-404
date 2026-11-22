import * as Phaser from "phaser";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";
import type { Frame } from "../layout";
import { placeVhs, type VhsLabels, type VhsMode } from "./hud";
import { pinUi } from "./journal";

const PANEL = 0x2b2150;
const WELL = 0x1f1740;
const SUN = 0xffc83d;
const CREAM = 0xfbf5e6;
const DIM = 0x4a3d78;
const DEPTH = { bar: 8000, banner: 8010, toast: 8020, vhs: 7990, prompt: 5950 };

export type DeckText = { action: string; journal: string; map: string; vhs: VhsLabels };

const STICK_ARROWS = ["ui-chev-right", "ui-chev-down", "ui-chev-left", "ui-chev-up"];

type Box = { x: number; y: number; w: number; h: number };
type Toast = { root: Phaser.GameObjects.Container; h: number; w: number };

function raised(g: Phaser.GameObjects.Graphics, b: Box, r: number, fill: number, k: number, alpha = 1) {
  g.fillStyle(INK_HEX, alpha);
  g.fillRoundedRect(b.x + 2 * k, b.y + 3 * k, b.w, b.h, r);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(b.x, b.y, b.w, b.h, r);
  g.lineStyle(2.5 * k, INK_HEX, alpha);
  g.strokeRoundedRect(b.x, b.y, b.w, b.h, r);
}

function inside(b: Box, x: number, y: number, pad = 0) {
  return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
}

function shrink(t: Phaser.GameObjects.Text, max: number, size: number, min: number) {
  let px = size;
  t.setFontSize(px);
  while (t.width > max && px > min) {
    px -= Math.max(0.5, size / 30);
    t.setFontSize(px);
  }
}

export class DeckHud {
  readonly touch = { x: 0, y: 0, active: false, action: false };
  readonly isTouch = true;
  hidden = false;
  private frame: Frame;
  private u = 1;
  private bar: Phaser.GameObjects.Container | null = null;
  private deck: Phaser.GameObjects.Container | null = null;
  private controls: Phaser.GameObjects.Container | null = null;
  private areaText: Phaser.GameObjects.Text | null = null;
  private counts: { posters: Phaser.GameObjects.Text; tokens: Phaser.GameObjects.Text } | null = null;
  private mission: { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; box: Box } | null = null;
  private action: { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; box: Box } | null = null;
  private pills: { id: "journal" | "map"; root: Phaser.GameObjects.Container; box: Box }[] = [];
  private stick: { base: Phaser.GameObjects.Graphics; knob: Phaser.GameObjects.Graphics; arrows: Phaser.GameObjects.Image[]; zone: Box; rest: { x: number; y: number }; r: number; travel: number } | null = null;
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private actionId: number | null = null;
  private banner: Phaser.GameObjects.Container | null = null;
  private toasts: Toast[] = [];
  private vhs: Phaser.GameObjects.Container | null = null;
  private vhsText: Phaser.GameObjects.Text | null = null;
  private vhsIcon: Phaser.GameObjects.Image | null = null;
  private vhsShade: Phaser.GameObjects.Image | null = null;
  private vhsMode: VhsMode = "pause";
  private vhsVisible = false;
  private prompt: Phaser.GameObjects.Container;
  private promptBg: Phaser.GameObjects.Graphics;
  private promptText: Phaser.GameObjects.Text;
  private state = { area: "", objective: "", posters: [0, 5] as [number, number], tokens: [0, 3] as [number, number], verb: null as string | null, controls: false };

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
    private text: DeckText,
    frame: Frame,
  ) {
    this.frame = frame;
    this.promptBg = scene.add.graphics();
    this.promptText = scene.add.text(0, 0, "", { fontFamily: fonts.round ?? fonts.body, fontSize: "28px", fontStyle: "700", color: "#fbf5e6", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
    this.prompt = scene.add.container(0, 0, [this.promptBg, this.promptText]).setDepth(DEPTH.prompt).setVisible(false);
    this.layout(frame);
  }

  enableTouch(on: boolean) {
    void on;
  }

  layout(frame: Frame) {
    this.frame = frame;
    this.u = frame.unit;
    this.releaseStick();
    this.actionId = null;
    this.touch.action = false;
    for (const obj of [this.bar, this.deck, this.banner, this.vhs]) obj?.destroy();
    for (const t of this.toasts) t.root.destroy();
    this.toasts = [];
    this.banner = null;
    this.buildBar();
    this.buildDeck();
    this.buildVhs();
    this.promptText.setFontSize(Math.round((15 * frame.unit) / frame.zoom));
    this.promptText.setText("");
    this.setArea(this.state.area);
    this.setObjective(this.state.objective, false);
    this.setCounts(this.state.posters, this.state.tokens);
    this.setVerb(this.state.verb, true);
    this.setTouchVisible(this.state.controls, true);
    this.vhsOn(this.vhsVisible, this.vhsMode);
    this.hide(this.hidden);
  }

  private buildBar() {
    const s = this.scene;
    const f = this.frame;
    const u = this.u;
    const top = f.top;
    const compact = f.compact;
    const g = s.add.graphics();
    g.fillStyle(PANEL, 1);
    g.fillRect(0, 0, f.width, top.h);
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, top.h - 3 * u, f.width, 3 * u);
    const pad = 12 * u;
    const row1 = f.safe.top + (compact ? 6 : 8) * u;
    const rowH = (compact ? 26 : 28) * u;
    const chipW = 62 * u;
    const chips: Phaser.GameObjects.GameObject[] = [];
    const makeChip = (x: number, icon: string) => {
      const cg = s.add.graphics();
      cg.fillStyle(WELL, 1);
      cg.fillRoundedRect(x, row1, chipW, rowH, rowH / 2);
      cg.lineStyle(2 * u, 0x5a4790, 1);
      cg.strokeRoundedRect(x, row1, chipW, rowH, rowH / 2);
      const img = s.add.image(x + rowH / 2 + 2 * u, row1 + rowH / 2, icon).setDisplaySize(rowH - 2 * u, rowH - 2 * u);
      const t = s.add.text(x + rowH + 4 * u, row1 + rowH / 2, "", { fontFamily: this.fonts.display, fontSize: `${(compact ? 14 : 15) * u}px`, color: "#fbf5e6", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
      chips.push(cg, img, t);
      return t;
    };
    const tokensX = f.width - pad - chipW;
    const postersX = tokensX - 6 * u - chipW;
    const tokens = makeChip(tokensX, "item-token");
    const posters = makeChip(postersX, "item-poster");
    this.counts = { posters, tokens };
    this.areaText = cartoonText(s, pad, row1 + rowH / 2, "", { size: (compact ? 17 : 19) * u, color: "#ffc83d", font: this.fonts.display, stroke: 0.16, shadow: false }).setOrigin(0, 0.5);
    this.areaText.setData("max", postersX - pad - 8 * u);
    const cardY = row1 + rowH + (compact ? 6 : 7) * u;
    const box = { x: pad, y: cardY, w: f.width - pad * 2, h: top.h - 3 * u - cardY - (compact ? 7 : 9) * u };
    const bg = s.add.graphics();
    const icon = s.add.image(-box.w / 2 + 20 * u, 0, "ui-target-l").setDisplaySize(24 * u, 24 * u);
    const text = s.add.text(-box.w / 2 + 38 * u, 0, "", { fontFamily: this.fonts.round ?? this.fonts.body, fontSize: `${(compact ? 13.5 : 14.5) * u}px`, fontStyle: "700", color: "#1d1830", lineSpacing: 0, wordWrap: { width: box.w - 50 * u }, padding: { x: 1, y: 2 } }).setOrigin(0, 0.5);
    const mission = s.add.container(box.x + box.w / 2, box.y + box.h / 2, [bg, icon, text]);
    this.mission = { root: mission, bg, text, box };
    this.paintMission(false);
    this.bar = s.add.container(0, 0, [g, ...chips, this.areaText, mission]).setDepth(DEPTH.bar);
    pinUi(this.bar);
  }

  private paintMission(lit: boolean) {
    const m = this.mission;
    if (!m) return;
    m.bg.clear();
    raised(m.bg, { x: -m.box.w / 2, y: -m.box.h / 2, w: m.box.w, h: m.box.h }, 12 * this.u, lit ? 0xffe39a : CREAM, this.u);
  }

  private buildDeck() {
    const s = this.scene;
    const f = this.frame;
    const u = this.u;
    const d = f.deck;
    const g = s.add.graphics();
    g.fillStyle(PANEL, 1);
    g.fillRect(0, d.y, f.width, d.h);
    g.fillStyle(INK_HEX, 1);
    g.fillRect(0, d.y, f.width, 3 * u);
    const pad = 12 * u;
    const innerTop = d.y + (f.compact ? 10 : 12) * u;
    const innerH = d.h - f.safe.bottom - (f.compact ? 20 : 24) * u;
    const actionW = Math.min(118 * u, f.width * 0.3);
    const action: Box = { x: f.width - pad - actionW, y: innerTop, w: actionW, h: innerH };
    const pillW = Math.min(100 * u, f.width * 0.26);
    const pillGap = 8 * u;
    const pillH = (innerH - pillGap) / 2;
    const pillX = action.x - 10 * u - pillW;
    const zone: Box = { x: pad, y: innerTop, w: pillX - 10 * u - pad, h: innerH };

    const well = s.add.graphics();
    well.fillStyle(WELL, 1);
    well.fillRoundedRect(zone.x, zone.y, zone.w, zone.h, 18 * u);
    well.lineStyle(2 * u, 0x5a4790, 1);
    well.strokeRoundedRect(zone.x, zone.y, zone.w, zone.h, 18 * u);

    const r = Math.min(zone.h / 2 - 6 * u, zone.w / 2 - 6 * u, 50 * u);
    const rest = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 };
    const base = s.add.graphics();
    const knob = s.add.graphics();
    const arrows = STICK_ARROWS.map((key) => s.add.image(0, 0, key).setTint(CREAM).setDisplaySize(22 * u, 22 * u));
    this.stick = { base, knob, arrows, zone, rest, r, travel: r * 0.82 };
    this.drawStick(rest.x, rest.y, rest.x, rest.y, false);

    this.pills = [];
    const pillParts: Phaser.GameObjects.GameObject[] = [];
    const pill = (id: "journal" | "map", y: number, icon: string, label: string) => {
      const box = { x: pillX, y, w: pillW, h: pillH };
      const pg = s.add.graphics();
      raised(pg, { x: -box.w / 2, y: -box.h / 2, w: box.w, h: box.h }, 14 * u, CREAM, u);
      const iconSize = Math.min(26 * u, box.h * 0.56);
      const img = s.add.image(-box.w / 2 + 10 * u + iconSize / 2, 0, icon).setDisplaySize(iconSize, iconSize);
      const t = s.add.text(-box.w / 2 + 16 * u + iconSize, 0, label.toUpperCase(), { fontFamily: this.fonts.display, fontSize: `${13 * u}px`, color: "#1d1830", padding: { x: 2, y: 4 } }).setOrigin(0, 0.5);
      shrink(t, box.w - iconSize - 24 * u, 13 * u, 9.5 * u);
      const root = s.add.container(box.x + box.w / 2, box.y + box.h / 2, [pg, img, t]);
      this.pills.push({ id, root, box });
      pillParts.push(root);
    };
    pill("journal", innerTop, "ui-journal-l", this.text.journal);
    pill("map", innerTop + pillH + pillGap, "ui-map-l", this.text.map);

    const abg = s.add.graphics();
    const iconSize = Math.min(44 * u, action.h * 0.42);
    const aicon = s.add.image(0, -action.h * 0.13, "ui-hand-l").setDisplaySize(iconSize, iconSize);
    const alabel = s.add.text(0, action.h * 0.27, "", { fontFamily: this.fonts.display, fontSize: `${15 * u}px`, color: "#1d1830", align: "center", padding: { x: 2, y: 4 } }).setOrigin(0.5);
    const aroot = s.add.container(action.x + action.w / 2, action.y + action.h / 2, [abg, aicon, alabel]);
    this.action = { root: aroot, bg: abg, icon: aicon, label: alabel, box: action };

    this.controls = s.add.container(0, 0, [well, base, ...arrows, knob, ...pillParts, aroot]);
    this.deck = s.add.container(0, 0, [g, this.controls]).setDepth(DEPTH.bar);
    pinUi(this.deck);
  }

  private drawStick(bx: number, by: number, kx: number, ky: number, active: boolean) {
    const st = this.stick;
    if (!st) return;
    const u = this.u;
    const b = st.base;
    b.clear();
    b.fillStyle(CREAM, active ? 0.2 : 0.12);
    b.fillCircle(bx, by, st.r);
    b.lineStyle(2.5 * u, CREAM, active ? 0.75 : 0.45);
    b.strokeCircle(bx, by, st.r);
    const d = st.r - 7 * u;
    st.arrows.forEach((img, i) => {
      const a = (i * Math.PI) / 2;
      img.setPosition(bx + Math.cos(a) * d, by + Math.sin(a) * d).setAlpha(active ? 0.8 : 0.55);
    });
    const k = st.knob;
    k.clear();
    const kr = st.r * 0.46;
    k.fillStyle(INK_HEX, 1);
    k.fillCircle(kx + 2 * u, ky + 3 * u, kr);
    k.fillStyle(active ? SUN : CREAM, 1);
    k.fillCircle(kx, ky, kr);
    k.lineStyle(2.5 * u, INK_HEX, 1);
    k.strokeCircle(kx, ky, kr);
    k.lineStyle(2 * u, INK_HEX, 0.25);
    k.strokeCircle(kx, ky, kr * 0.55);
  }

  private buildVhs() {
    const s = this.scene;
    const f = this.frame;
    const u = this.u;
    const st = f.stage;
    const scan = s.add.tileSprite(st.x, st.y, st.w, st.h, "scanlines").setOrigin(0, 0).setAlpha(0.35);
    const tint = s.add.rectangle(st.x, st.y, st.w, st.h, 0x5cb9f0, 0.08).setOrigin(0, 0);
    this.vhsText = s.add.text(st.x + st.w - 14 * u, st.y + 10 * u, this.text.vhs[this.vhsMode], { fontFamily: "Courier New, monospace", fontSize: `${22 * u}px`, fontStyle: "bold", color: "#ffffff" }).setOrigin(1, 0);
    this.vhsText.setShadow(2 * u, 2 * u, "#1d1830", 0, true, true);
    this.vhsShade = s.add.image(0, 0, "ui-vhs-pause").setTintFill(INK_HEX);
    this.vhsIcon = s.add.image(0, 0, "ui-vhs-pause");
    this.vhs = s.add.container(0, 0, [tint, scan, this.vhsShade, this.vhsIcon, this.vhsText]).setDepth(DEPTH.vhs).setVisible(false);
    pinUi(this.vhs);
  }

  setArea(title: string) {
    this.state.area = title;
    const t = this.areaText;
    if (!t) return;
    t.setText(title.toUpperCase());
    shrink(t, t.getData("max") as number, (this.frame.compact ? 17 : 19) * this.u, 12 * this.u);
  }

  setObjective(text: string, flash: boolean) {
    this.state.objective = text;
    const m = this.mission;
    if (!m) return;
    const u = this.u;
    const base = (this.frame.compact ? 13.5 : 14.5) * u;
    m.text.setText(text).setFontSize(base);
    let px = base;
    while (m.text.height > m.box.h - 4 * u && px > 11 * u) {
      px -= 0.5 * u;
      m.text.setFontSize(px);
    }
    if (!flash) return;
    this.paintMission(true);
    this.scene.time.delayedCall(this.reduced ? 600 : 1400, () => this.paintMission(false));
    if (!this.reduced) this.scene.tweens.add({ targets: m.root, scale: { from: 1.06, to: 1 }, duration: 320, ease: "Back.easeOut" });
  }

  setCounts(posters: [number, number], tokens: [number, number]) {
    this.state.posters = posters;
    this.state.tokens = tokens;
    if (!this.counts) return;
    this.counts.posters.setText(`${posters[0]}/${posters[1]}`);
    this.counts.tokens.setText(`${tokens[0]}/${tokens[1]}`);
  }

  hide(on: boolean) {
    this.hidden = on;
    this.bar?.setVisible(!on);
    this.deck?.setVisible(!on);
    if (on) {
      this.prompt.setVisible(false);
      this.releaseStick();
    }
  }

  buttonAt(px: number, py: number) {
    if (this.hidden || !this.state.controls) return null;
    for (const p of this.pills) if (inside(p.box, px, py, 4 * this.u)) return p.id;
    if (this.mission && inside(this.mission.box, px, py, 2 * this.u)) return "journal";
    return null;
  }

  pressButton(id: string) {
    if (this.reduced) return;
    const p = this.pills.find((x) => x.id === id);
    if (p) {
      this.scene.tweens.add({ targets: p.root, scale: { from: 0.9, to: 1 }, duration: 180, ease: "Back.easeOut" });
      return;
    }
    if (id === "journal") this.setObjective(this.state.objective, true);
  }

  flashArea(title: string) {
    this.setArea(title);
    const s = this.scene;
    const u = this.u;
    const st = this.frame.stage;
    this.banner?.destroy();
    const label = cartoonText(s, 0, 0, title.toUpperCase(), { size: 22 * u, color: "#1d1830", font: this.fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
    shrink(label, st.w - 80 * u, 22 * u, 14 * u);
    const w = label.width + 44 * u;
    const h = 46 * u;
    const g = s.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(-w / 2 + 3 * u, -h / 2 + 4 * u, w, h, 10 * u);
    g.fillStyle(CREAM, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10 * u);
    g.lineStyle(3 * u, INK_HEX, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10 * u);
    g.fillStyle(SUN, 1);
    g.fillCircle(-w / 2 + 14 * u, 0, 4.5 * u);
    g.fillCircle(w / 2 - 14 * u, 0, 4.5 * u);
    const banner = s.add.container(st.x + st.w / 2, st.y + 46 * u, [g, label]).setDepth(DEPTH.banner).setAngle(-2);
    pinUi(banner);
    this.banner = banner;
    if (!this.reduced) {
      banner.setScale(0.6);
      s.tweens.add({ targets: banner, scale: 1, duration: 260, ease: "Back.easeOut" });
    }
    s.tweens.add({ targets: banner, alpha: 0, delay: 1900, duration: 400, onComplete: () => banner.destroy() });
  }

  private toastTop() {
    return this.frame.stage.y + 8 * this.u + (this.vhsVisible ? 38 * this.u : 0);
  }

  toast(title: string, text: string, icon: string, color = SUN) {
    const s = this.scene;
    const u = this.u;
    const f = this.frame;
    const x = 10 * u;
    const w = f.width - 20 * u;
    const r = 19 * u;
    const textX = 16 * u + r * 2;
    const t1 = s.add.text(textX, 9 * u, title.toUpperCase(), { fontFamily: this.fonts.display, fontSize: `${11.5 * u}px`, color: "#7b62c4", padding: { x: 1, y: 2 } });
    const t2 = s.add.text(textX, 25 * u, text, { fontFamily: this.fonts.round ?? this.fonts.body, fontSize: `${14.5 * u}px`, fontStyle: "700", color: "#1d1830", wordWrap: { width: w - textX - 12 * u }, padding: { x: 1, y: 2 } });
    const h = Math.max(56 * u, t2.y + t2.height + 8 * u);
    const g = s.add.graphics();
    raised(g, { x: 0, y: 0, w, h }, 14 * u, CREAM, u);
    g.fillStyle(color, 1);
    g.fillCircle(10 * u + r, h / 2, r);
    g.lineStyle(2.5 * u, INK_HEX, 1);
    g.strokeCircle(10 * u + r, h / 2, r);
    const img = s.add.image(10 * u + r, h / 2, icon).setDisplaySize(r * 1.4, r * 1.4);
    const y0 = this.toastTop() + this.toasts.reduce((a, t) => a + t.h + 6 * u, 0);
    const root = s.add.container(x, y0, [g, img, t1, t2]).setDepth(DEPTH.toast);
    pinUi(root);
    const entry = { root, h, w };
    this.toasts.push(entry);
    if (!this.reduced) {
      root.y = y0 - 20 * u;
      root.alpha = 0;
      s.tweens.add({ targets: root, y: y0, alpha: 1, duration: 260, ease: "Back.easeOut" });
    }
    s.time.delayedCall(3600, () => {
      if (!root.active) return;
      s.tweens.add({
        targets: root,
        alpha: 0,
        y: root.y - (this.reduced ? 0 : 16 * u),
        duration: 260,
        onComplete: () => {
          root.destroy();
          this.toasts = this.toasts.filter((t) => t !== entry);
          this.restack();
        },
      });
    });
  }

  private restack() {
    let y = this.toastTop();
    for (const t of this.toasts) {
      if (t.root.active) this.scene.tweens.add({ targets: t.root, y, duration: 200 });
      y += t.h + 6 * this.u;
    }
  }

  showPrompt(x: number, y: number, verb: string | null) {
    if (!verb || this.hidden) {
      this.prompt.setVisible(false);
      this.setVerb(null);
      return;
    }
    if (this.promptText.text !== verb) {
      this.promptText.setText(verb);
      const pad = this.promptText.height * 0.55;
      const w = this.promptText.width + pad * 2;
      const h = this.promptText.height + pad * 0.5;
      const g = this.promptBg;
      g.clear();
      g.fillStyle(INK_HEX, 0.92);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      this.promptText.setPosition(-w / 2 + pad, 0);
    }
    this.prompt.setVisible(true).setPosition(x, y);
    this.setVerb(verb.split(" · ")[0]);
  }

  private setVerb(verb: string | null, force = false) {
    if (verb === this.state.verb && !force) return;
    this.state.verb = verb;
    const a = this.action;
    if (!a) return;
    const u = this.u;
    const on = Boolean(verb);
    a.bg.clear();
    raised(a.bg, { x: -a.box.w / 2, y: -a.box.h / 2, w: a.box.w, h: a.box.h }, 20 * u, on ? SUN : DIM, u, 1);
    a.icon.setAlpha(on ? 1 : 0.45);
    a.label.setText((verb ?? this.text.action).toUpperCase()).setColor(on ? "#1d1830" : "#b9a6ef");
    shrink(a.label, a.box.w - 14 * u, 15 * u, 10 * u);
    if (a.label.width > a.box.w - 14 * u) a.label.setWordWrapWidth(a.box.w - 14 * u, true);
  }

  setTouchVisible(on: boolean, force = false) {
    if (on === this.state.controls && !force) return;
    this.state.controls = on;
    this.controls?.setAlpha(on ? 1 : 0.35);
    if (!on) {
      this.releaseStick();
      this.actionId = null;
      this.touch.action = false;
    }
  }

  vhsOn(on: boolean, mode: VhsMode = "pause") {
    const was = this.vhsVisible;
    this.vhsVisible = on;
    this.vhsMode = mode;
    if (this.vhsText && this.vhsIcon && this.vhsShade) {
      this.vhsText.setText(this.text.vhs[mode]);
      placeVhs(this.vhsText, this.vhsIcon, this.vhsShade, mode, 20.5 * this.u, 2 * this.u);
    }
    this.vhs?.setVisible(on);
    if (was !== on) this.restack();
  }

  pointerDown(p: Phaser.Input.Pointer) {
    if (this.hidden || !this.state.controls) return false;
    const a = this.action;
    if (a && inside(a.box, p.x, p.y, 6 * this.u)) {
      if (!this.state.verb) return true;
      this.actionId = p.id;
      this.touch.action = true;
      if (!this.reduced) this.scene.tweens.add({ targets: a.root, scale: { from: 0.9, to: 1 }, duration: 160, ease: "Back.easeOut" });
      return true;
    }
    const st = this.stick;
    if (st && this.stickId === null && p.y >= this.frame.deck.y && p.x <= st.zone.x + st.zone.w + 4 * this.u) {
      this.stickId = p.id;
      const m = st.r * 0.6;
      this.stickOrigin = {
        x: Phaser.Math.Clamp(p.x, st.zone.x + m, st.zone.x + st.zone.w - m),
        y: Phaser.Math.Clamp(p.y, st.zone.y + m * 0.5, st.zone.y + st.zone.h - m * 0.5),
      };
      this.touch.active = true;
      this.pointerMove(p);
      return true;
    }
    return p.y >= this.frame.deck.y || p.y <= this.frame.top.h;
  }

  pointerMove(p: Phaser.Input.Pointer) {
    if (p.id !== this.stickId || !this.stick) return;
    const st = this.stick;
    let dx = p.x - this.stickOrigin.x;
    let dy = p.y - this.stickOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > st.travel) {
      dx = (dx / d) * st.travel;
      dy = (dy / d) * st.travel;
    }
    const m = Math.hypot(dx, dy);
    const dead = 7 * this.u;
    this.touch.x = m < dead ? 0 : dx / st.travel;
    this.touch.y = m < dead ? 0 : dy / st.travel;
    this.drawStick(this.stickOrigin.x, this.stickOrigin.y, this.stickOrigin.x + dx, this.stickOrigin.y + dy, true);
  }

  pointerUp(p: Phaser.Input.Pointer) {
    if (p.id === this.actionId) {
      this.actionId = null;
      this.touch.action = false;
    }
    if (p.id === this.stickId) this.releaseStick();
  }

  releaseStick() {
    this.stickId = null;
    this.touch.x = 0;
    this.touch.y = 0;
    this.touch.active = false;
    const st = this.stick;
    if (st) this.drawStick(st.rest.x, st.rest.y, st.rest.x, st.rest.y, false);
  }

  destroy() {
    for (const obj of [this.bar, this.deck, this.banner, this.vhs, this.prompt]) obj?.destroy();
    for (const t of this.toasts) t.root.destroy();
    this.toasts = [];
  }
}
