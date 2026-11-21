import * as Phaser from "phaser";
import type { Frame } from "../layout";
import { INK_HEX, cartoonText, type Fonts } from "../../kit/ui";

export type MarkTone = "warn" | "boss" | "shot";
export type Mark = { side: -1 | 1; y: number; tone: MarkTone };

type Pin = { root: Phaser.GameObjects.Container; disc: Phaser.GameObjects.Graphics; arrow: Phaser.GameObjects.Graphics; bang: Phaser.GameObjects.Text; tone: MarkTone | null; side: number };

const COLOR: Record<MarkTone, number> = { warn: 0xef4f43, boss: 0xf06ba8, shot: 0x9df0dc };
const RANK: Record<MarkTone, number> = { warn: 3, boss: 2, shot: 1 };
const R = 34;

export class EdgeMarkers {
  private pins: Pin[] = [];
  private pulse = 0;

  constructor(
    private scene: Phaser.Scene,
    fonts: Fonts,
    private reduced: boolean,
    count = 4,
  ) {
    for (let i = 0; i < count; i += 1) {
      const arrow = scene.add.graphics();
      const disc = scene.add.graphics();
      const bang = cartoonText(scene, 0, 2, "!", { size: 46, color: "#1d1830", font: fonts.display, stroke: 0, shadow: false }).setOrigin(0.5);
      const root = scene.add.container(0, 0, [arrow, disc, bang]).setDepth(58).setScrollFactor(0).setVisible(false);
      this.pins.push({ root, disc, arrow, bang, tone: null, side: 0 });
    }
  }

  update(marks: Mark[], frame: Frame, top: number, bottom: number, dt: number) {
    this.pulse += dt;
    const u = frame.unit;
    const picked: Mark[] = [];
    for (const m of [...marks].sort((a, b) => RANK[b.tone] - RANK[a.tone])) {
      if (picked.some((p) => p.side === m.side && Math.abs(p.y - m.y) < 70 * u)) continue;
      picked.push(m);
      if (picked.length === this.pins.length) break;
    }
    const k = (17 * u) / R;
    this.pins.forEach((pin, i) => {
      const m = picked[i];
      if (!m || frame.kind === "full") {
        pin.root.setVisible(false);
        return;
      }
      if (pin.tone !== m.tone || pin.side !== m.side) this.draw(pin, m);
      const x = m.side < 0 ? frame.safe.left + 24 * u : frame.width - frame.safe.right - 24 * u;
      const y = Phaser.Math.Clamp(m.y, top + 30 * u, bottom - 30 * u);
      const beat = this.reduced ? 1 : 1 + Math.max(0, Math.sin(this.pulse * (m.tone === "warn" ? 14 : 7))) * 0.14;
      pin.root.setVisible(true).setPosition(x, y).setScale(k * beat);
    });
  }

  private draw(pin: Pin, m: Mark) {
    pin.tone = m.tone;
    pin.side = m.side;
    const g = pin.disc;
    g.clear();
    g.fillStyle(INK_HEX, 1);
    g.fillCircle(3, 4, R);
    g.fillStyle(COLOR[m.tone], 1);
    g.fillCircle(0, 0, R);
    g.lineStyle(6, INK_HEX, 1);
    g.strokeCircle(0, 0, R);
    const a = pin.arrow;
    a.clear();
    const s = m.side;
    a.fillStyle(INK_HEX, 1);
    a.fillTriangle(s * (R + 22), 0, s * (R - 6), -20, s * (R - 6), 20);
    a.fillStyle(COLOR[m.tone], 1);
    a.fillTriangle(s * (R + 12), 0, s * (R - 4), -12, s * (R - 4), 12);
    pin.bang.setText(m.tone === "shot" ? "~" : "!");
  }

  hide() {
    for (const pin of this.pins) pin.root.setVisible(false);
  }
}
