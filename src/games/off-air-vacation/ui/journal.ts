import * as Phaser from "phaser";
import { AREA_TITLES, MAP_POS, W, type AreaId } from "../config";
import { ALL_POSTERS, ALL_SECRETS, ALL_TOKENS, type FolkKey, type State } from "../save";
import { FOLK_LINE, FOUND_TEXT, ITEM_INFO, POSTER_INFO, mainObjective, sideQuests } from "../story";
import { INK_HEX, type Fonts } from "../../kit/ui";

export type Tab = "missions" | "found" | "collection" | "people" | "map";
const TABS: { id: Tab; label: string }[] = [
  { id: "missions", label: "Missões" },
  { id: "found", label: "Descobertas" },
  { id: "collection", label: "Coleção" },
  { id: "people", label: "Personagens" },
  { id: "map", label: "Mapa" },
];
const BOOK = { x: 170, y: 110, w: 1580, h: 900 };
const RULE0 = BOOK.y + 150;
const RULE = 52;
const RULES = 14;
const ruleY = (k: number) => RULE0 + k * RULE;
const SECRET_NAMES: Record<string, string> = { room404: "O hóspede do quarto 404", machine: "A máquina escondida", lento: "Seu Lento chegou" };
const FOLKS: FolkKey[] = ["bigodes", "marola", "capi", "tilt", "placar", "marisa", "clique", "lento", "psiu", "cavuca", "chiado", "mascot"];
const FACE: Record<FolkKey, string> = Object.fromEntries(FOLKS.map((id) => [id, `face-${id}-normal`])) as Record<FolkKey, string>;
const FOLK_COLOR: Record<FolkKey, number> = {
  bigodes: 0xef4f43,
  marola: 0x5cb9f0,
  tilt: 0xb9a6ef,
  marisa: 0xffc83d,
  psiu: 0x63d6c1,
  lento: 0x93cf4c,
  mascot: 0x9df0dc,
  capi: 0x63d6c1,
  clique: 0xff8a3d,
  cavuca: 0xffc83d,
  chiado: 0x5cb9f0,
  placar: 0xef4f43,
};

export function pinUi(obj: Phaser.GameObjects.GameObject) {
  const o = obj as Phaser.GameObjects.GameObject & { setScrollFactor?: (x: number, y?: number) => unknown; list?: Phaser.GameObjects.GameObject[] };
  o.setScrollFactor?.(0, 0);
  if (o.list) for (const c of o.list) pinUi(c);
}

export class Journal {
  readonly root: Phaser.GameObjects.Container;
  private content: Phaser.GameObjects.Container;
  private tabs: { id: Tab; g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; x: number; w: number }[] = [];
  tab: Tab = "missions";
  open = false;
  private pin: Phaser.GameObjects.Container | null = null;
  private masks: Phaser.GameObjects.Graphics[] = [];
  private cleanup = false;

  constructor(
    private scene: Phaser.Scene,
    private fonts: Fonts,
    private reduced: boolean,
  ) {
    const dim = scene.add.rectangle(0, 0, W, 1080, 0x140f26, 0.6).setOrigin(0, 0);
    const g = scene.add.graphics();
    g.fillStyle(INK_HEX, 1);
    g.fillRoundedRect(BOOK.x + 10, BOOK.y + 12, BOOK.w, BOOK.h, 34);
    g.fillStyle(0x7c4527, 1);
    g.fillRoundedRect(BOOK.x - 14, BOOK.y - 14, BOOK.w + 28, BOOK.h + 28, 38);
    g.fillStyle(0xfbf5e6, 1);
    g.fillRoundedRect(BOOK.x, BOOK.y, BOOK.w, BOOK.h, 28);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeRoundedRect(BOOK.x - 14, BOOK.y - 14, BOOK.w + 28, BOOK.h + 28, 38);
    g.strokeRoundedRect(BOOK.x, BOOK.y, BOOK.w, BOOK.h, 28);
    g.lineStyle(2, 0xd9c39a, 1);
    for (let k = 0; k < RULES; k += 1) g.lineBetween(BOOK.x + 90, ruleY(k), BOOK.x + BOOK.w - 40, ruleY(k));
    g.lineStyle(3, 0xef8f86, 1);
    g.lineBetween(BOOK.x + 80, BOOK.y + 100, BOOK.x + 80, BOOK.y + BOOK.h - 20);
    for (let i = 0; i < 9; i += 1) {
      const y = BOOK.y + 70 + i * 92;
      g.fillStyle(0x3a3157, 1);
      g.fillCircle(BOOK.x + 36, y, 13);
      g.lineStyle(6, 0x9aa6b8, 1);
      g.beginPath();
      g.arc(BOOK.x + 10, y, 26, -0.9, 0.9);
      g.strokePath();
    }
    const parts: Phaser.GameObjects.GameObject[] = [dim, g];
    let x = BOOK.x + 110;
    for (const t of TABS) {
      const label = scene.add.text(0, 0, t.label.toUpperCase(), { fontFamily: fonts.display, fontSize: "26px", color: "#1d1830", padding: { x: 2, y: 4 } }).setOrigin(0.5);
      const w = label.width + 56;
      const tg = scene.add.graphics();
      label.setPosition(x + w / 2, BOOK.y + 48);
      this.tabs.push({ id: t.id, g: tg, t: label, x, w });
      parts.push(tg, label);
      x += w + 14;
    }
    const close = scene.add.graphics();
    close.fillStyle(INK_HEX, 1);
    close.fillCircle(BOOK.x + BOOK.w - 46 + 4, BOOK.y + 46 + 5, 34);
    close.fillStyle(0xef4f43, 1);
    close.fillCircle(BOOK.x + BOOK.w - 46, BOOK.y + 46, 34);
    close.lineStyle(5, INK_HEX, 1);
    close.strokeCircle(BOOK.x + BOOK.w - 46, BOOK.y + 46, 34);
    const xi = scene.add.image(BOOK.x + BOOK.w - 46, BOOK.y + 46, "ui-close").setScale(0.8);
    parts.push(close, xi);
    this.content = scene.add.container(0, 0);
    parts.push(this.content);
    this.root = scene.add.container(0, 0, parts).setDepth(9500).setScrollFactor(0, 0, true).setVisible(false);
  }

  show(tab: Tab, s: State, area: AreaId, ax: number, ay: number) {
    this.open = true;
    this.tab = tab;
    this.render(s, area, ax, ay);
    this.root.setVisible(true);
    if (!this.reduced) {
      this.root.setAlpha(0).setY(30);
      this.scene.tweens.add({ targets: this.root, alpha: 1, y: 0, duration: 180, ease: "Quad.easeOut" });
    }
  }

  hide() {
    this.open = false;
    this.root.setVisible(false);
  }

  switchTo(tab: Tab, s: State, area: AreaId, ax: number, ay: number) {
    this.tab = tab;
    this.render(s, area, ax, ay);
  }

  step(dir: number, s: State, area: AreaId, ax: number, ay: number) {
    const i = TABS.findIndex((t) => t.id === this.tab);
    this.switchTo(TABS[(i + dir + TABS.length) % TABS.length].id, s, area, ax, ay);
  }

  hit(px: number, py: number): Tab | "close" | null {
    if (Math.hypot(px - (BOOK.x + BOOK.w - 46), py - (BOOK.y + 46)) < 42) return "close";
    for (const t of this.tabs) if (px >= t.x && px <= t.x + t.w && py >= BOOK.y + 8 && py <= BOOK.y + 90) return t.id;
    if (px < BOOK.x - 20 || px > BOOK.x + BOOK.w + 20 || py < BOOK.y - 20 || py > BOOK.y + BOOK.h + 20) return "close";
    return null;
  }

  private paintTabs() {
    for (const t of this.tabs) {
      const on = t.id === this.tab;
      t.g.clear();
      t.g.fillStyle(INK_HEX, 1);
      t.g.fillRoundedRect(t.x + 4, BOOK.y + 18, t.w, 66, 16);
      t.g.fillStyle(on ? 0xffc83d : 0xecd9b2, 1);
      t.g.fillRoundedRect(t.x, BOOK.y + (on ? 10 : 16), t.w, on ? 72 : 64, 16);
      t.g.lineStyle(5, INK_HEX, 1);
      t.g.strokeRoundedRect(t.x, BOOK.y + (on ? 10 : 16), t.w, on ? 72 : 64, 16);
      t.t.setY(BOOK.y + (on ? 46 : 49));
    }
  }

  private txt(x: number, y: number, text: string, size: number, color = "#1d1830", opts: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    const t = this.scene.add.text(x, y, text, { fontFamily: this.fonts.round ?? this.fonts.body, fontSize: `${size}px`, fontStyle: "600", color, padding: { x: 2, y: 4 }, ...opts });
    this.content.add(t);
    return t;
  }

  private onRule(t: Phaser.GameObjects.Text, k: number) {
    const m = t.getTextMetrics();
    t.setLineSpacing(RULE - m.fontSize);
    t.setY(ruleY(k) - 3 - m.ascent - 4);
    return t;
  }

  private line(x: number, k: number, text: string, size: number, color = "#1d1830", opts: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    return this.onRule(this.txt(x, 0, text, size, color, opts), k);
  }

  private icon(key: string, x: number, k: number, size: number, scale: number) {
    const img = this.scene.add.image(x, ruleY(k) - 3 - size * 0.36, key).setScale(scale);
    this.content.add(img);
    return img;
  }

  private head(x: number, k: number, text: string) {
    const t = this.scene.add.text(x, 0, text.toUpperCase(), { fontFamily: this.fonts.display, fontSize: "32px", color: "#1d1830", padding: { x: 2, y: 4 } });
    this.content.add(t);
    return this.onRule(t, k);
  }

  private check(x: number, y: number, done: boolean) {
    const g = this.scene.add.graphics();
    g.fillStyle(0xfffaf0, 1);
    g.fillRoundedRect(x, y, 38, 38, 8);
    g.lineStyle(4, INK_HEX, 1);
    g.strokeRoundedRect(x, y, 38, 38, 8);
    if (done) {
      g.lineStyle(7, 0x2fa996, 1);
      g.beginPath();
      g.moveTo(x + 7, y + 20);
      g.lineTo(x + 16, y + 30);
      g.lineTo(x + 32, y + 8);
      g.strokePath();
    }
    this.content.add(g);
  }

  private render(s: State, area: AreaId, ax: number, ay: number) {
    this.content.removeAll(true);
    this.masks.forEach((m) => m.destroy());
    this.masks = [];
    if (!this.cleanup) {
      this.cleanup = true;
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.masks.forEach((m) => m.destroy()));
    }
    this.pin = null;
    this.paintTabs();
    this.fill(s, area, ax, ay);
    pinUi(this.content);
  }

  private fill(s: State, area: AreaId, ax: number, ay: number) {
    const L = BOOK.x + 120;
    if (this.tab === "missions") {
      const main = mainObjective(s);
      this.head(L, 0, "Missão principal");
      const top = ruleY(0) + 12;
      const h = RULE * 2 - 20;
      const g = this.scene.add.graphics();
      g.fillStyle(main.done ? 0xc9f2e4 : 0xffe39a, 1);
      g.fillRoundedRect(L, top, 1340, h, 18);
      g.lineStyle(5, INK_HEX, 1);
      g.strokeRoundedRect(L, top, 1340, h, 18);
      this.content.add(g);
      this.content.add(this.scene.add.image(L + 46, top + h / 2, "ui-star").setScale(1));
      this.txt(L + 92, top + 6, "Descobrir por que o resort continua ligado", 20, "#7b62c4");
      this.txt(L + 92, top + 34, main.text, 30);
      this.check(L + 1282, top + (h - 38) / 2, main.done);
      this.head(L, 3, "Missões secundárias");
      const side = sideQuests(s);
      side.forEach((q, i) => {
        this.line(L + 8, 4 + i, q.text, 30, q.done ? "#2fa996" : "#1d1830");
        this.check(L + 1282, ruleY(4 + i) - 44, q.done);
      });
      const kb = 5 + side.length;
      this.head(L, kb, "Na mochila");
      if (!s.items.length) this.line(L + 8, kb + 1, "Vazia. Por enquanto.", 28, "#7d6fb0");
      s.items.forEach((it, i) => {
        const x = L + i * 270;
        const y = ruleY(kb) + 12;
        const bh = RULE * 2 - 20;
        const box = this.scene.add.graphics();
        box.fillStyle(0xecd9b2, 1);
        box.fillRoundedRect(x, y, 250, bh, 16);
        box.lineStyle(4, INK_HEX, 1);
        box.strokeRoundedRect(x, y, 250, bh, 16);
        this.content.add(box);
        this.content.add(this.scene.add.image(x + 46, y + bh / 2, ITEM_INFO[it].icon).setDisplaySize(64, 64));
        const name = this.txt(x + 88, 0, ITEM_INFO[it].name, 22, "#1d1830", { wordWrap: { width: 150 }, lineSpacing: 0 });
        name.setY(y + (bh - name.height) / 2);
      });
      return;
    }
    if (this.tab === "found") {
      this.head(L, 0, "Descobertas importantes");
      const found = s.found.filter((f) => FOUND_TEXT[f]);
      if (!found.length) this.line(L + 8, 1, "Nada ainda. Explore e examine as coisas!", 28, "#7d6fb0");
      const two = found.length > RULES - 1;
      const per = two ? Math.ceil(found.length / 2) : found.length;
      const size = two ? 23 : 28;
      found.forEach((f, i) => {
        const x = L + (two ? Math.floor(i / per) * 690 : 0);
        const k = 1 + (i % per);
        this.icon("ui-bulb", x + 20, k, size, two ? 0.7 : 0.85);
        this.line(x + 52, k, FOUND_TEXT[f], size);
      });
      return;
    }
    if (this.tab === "collection") {
      this.head(L, 0, `Pôsteres perdidos (${s.posters.length}/${ALL_POSTERS.length})`);
      const top = ruleY(0) + 14;
      const ch = ruleY(6) - 8 - top;
      ALL_POSTERS.forEach((p, i) => {
        const x = L + i * 270;
        const got = s.posters.includes(p);
        const card = this.scene.add.graphics();
        card.fillStyle(got ? 0xfffaf0 : 0xd9c39a, 1);
        card.fillRoundedRect(x, top, 240, ch, 16);
        card.lineStyle(5, INK_HEX, 1);
        card.strokeRoundedRect(x, top, 240, ch, 16);
        this.content.add(card);
        if (got) this.content.add(this.scene.add.image(x + 120, top + 112, `poster-${p}`).setDisplaySize(142, 187));
        else this.content.add(this.scene.add.text(x + 120, top + 112, "?", { fontFamily: this.fonts.display, fontSize: "90px", color: "#a8822f" }).setOrigin(0.5));
        const title = this.txt(x + 120, 0, got ? POSTER_INFO[p].title : AREA_TITLES[POSTER_INFO[p].area], 21, "#1d1830", { align: "center", wordWrap: { width: 216 }, lineSpacing: 0 }).setOrigin(0.5, 0);
        title.setY(top + ch - 14 - title.height);
      });
      this.head(L, 7, `Fichas douradas (${s.tokens.length}/${ALL_TOKENS.length})`);
      ALL_TOKENS.forEach((tk, i) => {
        const img = this.scene.add.image(L + 50 + i * 110, (ruleY(8) + ruleY(9)) / 2, "item-token").setDisplaySize(84, 84);
        if (!s.tokens.includes(tk)) img.setTintFill(0xd9c39a);
        this.content.add(img);
      });
      this.head(L + 700, 7, `Segredos (${s.secrets.length}/${ALL_SECRETS.length})`);
      ALL_SECRETS.forEach((sec, i) => {
        const got = s.secrets.includes(sec);
        this.icon(got ? "ui-star" : "ui-dot", L + 722, 8 + i, 28, 0.75);
        this.line(L + 756, 8 + i, got ? SECRET_NAMES[sec] : "???", 28, got ? "#1d1830" : "#7d6fb0");
      });
      return;
    }
    if (this.tab === "people") {
      this.head(L, 0, `Personagens (${s.met.length}/${FOLKS.length})`);
      FOLKS.forEach((id, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = L + col * 460;
        const k = 1 + row * 3;
        const cx = x + 56;
        const cy = ruleY(k) + 40;
        const met = s.met.includes(id);
        const g = this.scene.add.graphics();
        g.fillStyle(met ? FOLK_COLOR[id] : 0xd9c39a, 1);
        g.fillCircle(cx, cy, 52);
        g.lineStyle(5, INK_HEX, 1);
        g.strokeCircle(cx, cy, 52);
        this.content.add(g);
        if (met) {
          const face = this.scene.add.image(cx, cy + 4, FACE[id]).setDisplaySize(100, 100);
          const m = this.scene.make.graphics({}, false);
          m.fillStyle(0xffffff, 1);
          m.fillCircle(cx, cy, 49);
          m.setScrollFactor(0);
          this.masks.push(m);
          face.setMask(m.createGeometryMask());
          this.content.add(face);
          const ring = this.scene.add.graphics();
          ring.lineStyle(5, INK_HEX, 1);
          ring.strokeCircle(cx, cy, 52);
          this.content.add(ring);
        } else this.content.add(this.scene.add.text(cx, cy, "?", { fontFamily: this.fonts.display, fontSize: "56px", color: "#a8822f" }).setOrigin(0.5));
        this.line(x + 124, k, met ? FOLK_LINE[id].name : "???", 27);
        this.line(x + 124, k + 1, met ? FOLK_LINE[id].line : "Ainda não conheceu.", 22, "#3a3157", { wordWrap: { width: 318 } });
      });
      return;
    }
    const mx = BOOK.x + 120;
    const my = BOOK.y + 120;
    const scale = 0.98;
    const map = this.scene.add.image(mx, my, "map-island").setOrigin(0, 0).setScale(scale);
    const frame = this.scene.add.graphics();
    frame.lineStyle(6, INK_HEX, 1);
    frame.strokeRoundedRect(mx, my, 1200 * scale, 760 * scale, 12);
    this.content.add([map, frame]);
    const areas: AreaId[] = ["lobby", "pool", "arcade", "beach", "forest", "station"];
    for (const a of areas) {
      if (a === "station" && !s.visited.includes("station")) continue;
      const [px, py] = MAP_POS[a];
      const known = s.visited.includes(a);
      const label = this.scene.add.text(0, 0, known ? AREA_TITLES[a].toUpperCase() : "???", { fontFamily: this.fonts.display, fontSize: "24px", color: "#1d1830", padding: { x: 2, y: 4 } }).setOrigin(0.5);
      const w = label.width + 28;
      const lg = this.scene.add.graphics();
      lg.fillStyle(INK_HEX, 1);
      lg.fillRoundedRect(-w / 2 + 3, -22 + 4, w, 44, 12);
      lg.fillStyle(0xfffaf0, 1);
      lg.fillRoundedRect(-w / 2, -22, w, 44, 12);
      lg.lineStyle(4, INK_HEX, 1);
      lg.strokeRoundedRect(-w / 2, -22, w, 44, 12);
      this.content.add(this.scene.add.container(mx + px * scale, my + (py + 60) * scale, [lg, label]));
    }
    const main = mainObjective(s);
    if (main.area && main.area !== "station") {
      const [tx, ty] = MAP_POS[main.area];
      this.content.add(this.scene.add.image(mx + (tx + 70) * scale, my + (ty - 20) * scale, "ui-target").setScale(1.1));
    } else if (main.area === "station") {
      const [tx, ty] = MAP_POS.forest;
      this.content.add(this.scene.add.image(mx + (tx - 90) * scale, my + (ty - 90) * scale, "ui-target").setScale(1.1));
    }
    for (const p of ALL_POSTERS) {
      const a = POSTER_INFO[p].area;
      if (s.posters.includes(p) || !s.visited.includes(a)) continue;
      const [sx, sy] = MAP_POS[a];
      this.content.add(this.scene.add.image(mx + (sx - 70) * scale, my + (sy - 30) * scale, "ui-star").setScale(0.75));
    }
    const pa = area === "room404" ? "lobby" : area;
    const [bx, by] = MAP_POS[pa];
    const pin = this.scene.add.container(mx + (bx + ax * 70) * scale, my + (by + ay * 40) * scale, [this.scene.add.image(0, -30, "ui-pin").setScale(1.3)]);
    this.content.add(pin);
    this.pin = pin;
    const lx = mx + 1200 * scale + 30;
    const legend: [string, string][] = [
      ["ui-pin", "Você está aqui"],
      ["ui-target", "Missão principal"],
      ["ui-star", "Pôster por achar"],
    ];
    legend.forEach(([icon, label], i) => {
      this.icon(icon, lx + 20, 1 + i * 3, 24, 0.85);
      this.line(lx + 50, 1 + i * 3, label, 23, "#1d1830", { wordWrap: { width: 150 } });
    });
  }

  update(time: number) {
    if (this.pin && !this.reduced) this.pin.setScale(1 + Math.sin(time / 220) * 0.08);
  }
}
