import * as Phaser from "phaser";
import type { Vec } from "../geometry";
import { BAND, RAIL_FIT, type Frame } from "../layout";
import { INK_HEX } from "../../kit/ui";
import type { HudSetup } from "./hud";
import { DEPTH, PANEL_FILL, TouchHud } from "./touchHud";

const SIZE = { gap: 6, pad: RAIL_FIT.pad, chip: RAIL_FIT.chip, stats: RAIL_FIT.stats, slotMin: RAIL_FIT.slot, slotMax: 74, btnMin: RAIL_FIT.button, btnMax: 50, runMin: RAIL_FIT.run, runMax: 66, colMax: 120 };

export class RailHud extends TouchHud {
  readonly kind = "band";
  private leftBg: Phaser.GameObjects.Graphics;
  private rightBg: Phaser.GameObjects.Graphics;

  constructor(setup: HudSetup) {
    super(setup);
    this.leftBg = this.fix(setup.scene.add.graphics().setDepth(DEPTH.panel));
    this.rightBg = this.fix(setup.scene.add.graphics().setDepth(DEPTH.panel));
    this.runArrow.setAngle(-90);
  }

  layout(frame: Frame) {
    this.useFrame(frame);
    const k = this.k;
    const L = frame.left;
    const R = frame.right;
    const st = frame.stage;
    const gap = SIZE.gap * k;
    const widest = (cols: number) => (cols === 1 ? SIZE.colMax : SIZE.colMax * 2 + SIZE.gap) * k;
    const lx = Math.max(frame.safe.left, BAND.edge * k);
    const lw = Math.min(L.w - lx - BAND.gap * k, widest(frame.cols.left));
    const rEdge = frame.width - Math.max(frame.safe.right, BAND.edge * k);
    const rw = Math.min(rEdge - R.x - BAND.gap * k, widest(frame.cols.right));
    const rx = rEdge - rw;
    const top = SIZE.pad * k;
    const bottom = frame.height - Math.max(frame.safe.bottom, SIZE.pad * k);

    const lg = this.leftBg;
    lg.clear();
    lg.fillStyle(PANEL_FILL, 1);
    lg.fillRect(L.x, 0, L.w, frame.height);
    if (st.y > 0) {
      lg.fillRect(st.x, 0, st.w, st.y);
      lg.fillRect(st.x, st.y + st.h, st.w, frame.height - st.y - st.h);
    }
    lg.fillStyle(INK_HEX, 1);
    lg.fillRect(L.x + L.w - 1.5 * k, 0, 3 * k, frame.height);
    const rg = this.rightBg;
    rg.clear();
    rg.fillStyle(PANEL_FILL, 1);
    rg.fillRect(R.x, 0, R.w, frame.height);
    rg.fillStyle(INK_HEX, 1);
    rg.fillRect(R.x - 1.5 * k, 0, 3 * k, frame.height);

    const chipH = SIZE.chip * k;
    this.sizeButton(this.chip, lw, chipH);
    this.chip.root.setPosition(lx + lw / 2, top + chipH / 2);

    const n = this.slots.length;
    const cols = frame.cols.left;
    const rows = Math.ceil(n / cols);
    const cw = cols === 1 ? lw : (lw - gap) / 2;
    const slotTop = top + chipH + gap * 2;
    const sh = Phaser.Math.Clamp((bottom - slotTop - 6 * k - (rows - 1) * gap * 1.6) / Math.max(1, rows), SIZE.slotMin * k, SIZE.slotMax * k);
    this.slots.forEach((slot, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      this.sizeSlot(slot, cw, sh);
      slot.root.setPosition(lx + c * (cw + gap) + cw / 2, slotTop + 6 * k + sh / 2 + r * (sh + gap * 1.6));
    });
    const boxTop = slotTop - gap;
    this.layoutBox(lx + lw / 2, boxTop + (bottom - boxTop) / 2, lw + 6 * k, bottom - boxTop);

    const runH = Phaser.Math.Clamp((bottom - top) * 0.22, SIZE.runMin * k, SIZE.runMax * k);
    this.sizeButton(this.runBtn, rw, runH);
    this.runBtn.root.setPosition(rx + rw / 2, bottom - runH / 2);
    this.sizeRunLabel();
    const small = [this.hintBtn, this.undoBtn, this.clearBtn];
    if (frame.cols.right === 1) {
      this.placeStats(rx + rw / 2, top + (SIZE.stats * k) / 2, rw);
      const statsBottom = top + SIZE.stats * k;
      const room = bottom - runH - gap * 2 - statsBottom;
      const bh = Phaser.Math.Clamp((room - gap * 2) / 3, SIZE.btnMin * k, SIZE.btnMax * k);
      small.forEach((b, i) => {
        this.sizeButton(b, rw, bh);
        b.root.setPosition(rx + rw / 2, statsBottom + bh / 2 + i * (bh + gap));
      });
    } else {
      const bw = (rw - gap) / 2;
      const bh = Phaser.Math.Clamp((bottom - runH - gap * 2 - top - gap) / 2, SIZE.btnMin * k, SIZE.btnMax * k);
      const cell = (i: number) => ({ x: rx + (i % 2) * (bw + gap) + bw / 2, y: top + Math.floor(i / 2) * (bh + gap) + bh / 2 });
      small.forEach((b, i) => {
        this.sizeButton(b, bw, bh);
        const c = cell(i);
        b.root.setPosition(c.x, c.y);
      });
      const c = cell(3);
      this.placeStats(c.x, c.y, bw);
    }
    this.finishLayout();
  }

  protected runArrowPose() {
    const r = this.runBtn.root;
    const x = r.x - this.runBtn.w / 2 - 20 * this.k;
    return { x, y: r.y, angle: -90, dx: -10 * this.k, dy: 0 };
  }

  isOverTray(_part: Vec, pointer: Vec) {
    return pointer.x <= this.frame.left.w;
  }

  covers(x: number) {
    return x <= this.frame.left.w || x >= this.frame.right.x;
  }
}
