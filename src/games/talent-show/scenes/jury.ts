import * as Phaser from "phaser";
import type { JuryId } from "../copy";
import type { Mark } from "../sim/judge";
import { JURY_ART, type PaddleHold } from "./figure";
import { C } from "./lane";
import { DESK_LIP, type Layout } from "./layout";

export type JuryFace = "neutral" | "happy" | "angry" | "shock" | "frown" | "nod" | "oops" | "wow";
type Motion = "shake" | "nod" | "hop" | "bounce" | "pop" | "take";
type Badge = "heart" | "up" | "down";
type Reaction = { face: JuryFace; ms: number; motion?: Motion; badge?: Badge; strong?: boolean; plate?: { grade: number; ms: number } };
type Judge = {
  id: JuryId;
  root: Phaser.GameObjects.Container;
  baseY: number;
  img: Phaser.GameObjects.Image;
  plate: Phaser.GameObjects.Container;
  plateText: Phaser.GameObjects.Text;
  arm: Phaser.GameObjects.Graphics;
  badge: Phaser.GameObjects.Image;
  badgeY: number;
  face: JuryFace;
  faceUntil: number;
  badgeFrom: number;
  badgeUntil: number;
  plateUntil: number;
  motion: Motion | null;
  motionFrom: number;
  motionMs: number;
  busyUntil: number;
  queue: { at: number; r: Reaction }[];
};

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;
export type JuryStyles = { name: (size: number) => TextStyle; grade: TextStyle; shh: TextStyle };

const ORDER: JuryId[] = ["inspector", "arlindo", "lunch"];
const BIAS: Record<JuryId, number> = { inspector: -1, arlindo: 0, lunch: 1 };
const ART: Record<JuryId, Partial<Record<JuryFace, string>>> = {
  inspector: { neutral: "jury-inspector-neutral", angry: "jury-inspector-angry", shock: "jury-inspector-shock", frown: "jury-inspector-frown", nod: "jury-inspector-nod" },
  arlindo: { neutral: "jury-arlindo-neutral", angry: "jury-arlindo-angry", happy: "jury-arlindo-happy", oops: "jury-arlindo-oops" },
  lunch: { neutral: "jury-lunch-neutral", angry: "jury-lunch-angry", happy: "jury-lunch-happy", wow: "jury-lunch-wow" },
};
const BADGE_ART: Record<Badge, string> = { heart: "icon-heart", up: "icon-thumbs-up", down: "icon-thumbs-down" };
const BADGE_SIZE = 58;
const PLATE_STAGGER: Record<JuryId, number> = { inspector: 0, arlindo: 220, lunch: 110 };

function between(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export class Jury {
  private readonly judges = new Map<JuryId, Judge>();
  private readonly shh: Phaser.GameObjects.Text;
  private shhUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly L: Layout,
    names: Record<JuryId, string>,
    shh: string,
    styles: JuryStyles,
    private readonly still: boolean,
  ) {
    const J = L.jury;
    const desk = scene.add.image(J.x0, 0, L.art.desk).setOrigin(0, 0);
    const s = (J.x1 - J.x0) / (desk.width / 2);
    desk.setScale(s / 2).setY(J.deskTop - DESK_LIP * s).setDepth(6);
    const plateY = J.deskTop + (97 - DESK_LIP) * s;
    const landscape = L.kind === "landscape" || L.kind === "wide";
    const nameSize = Math.round((landscape ? 26 : 28) * s);
    ORDER.forEach((id, i) => {
      const art = JURY_ART[id];
      const img = scene.add.image(0, 0, ART[id].neutral!).setOrigin(art.originX, art.crop / art.h).setScale(art.scale / 2);
      img.setCrop(0, 0, art.w * 2, art.crop * 2);
      const local = (x: number, y: number) => ({ x: (x - art.originX * art.w) * art.scale, y: (y - art.crop) * art.scale });
      const fist = local(art.hold.fist[0], art.hold.fist[1]);
      const plateImg = scene.add.image(0, 0, "plate").setOrigin(0.5, 1).setScale(0.4);
      const plateText = scene.add.text(0, -116 * 0.8, "", styles.grade).setOrigin(0.5);
      const plate = scene.add.container(fist.x, fist.y + 8, [plateImg, plateText]).setVisible(false);
      const arm = scene.add.graphics().setVisible(false);
      this.drawHold(arm, art.hold, local, art.scale);
      const spot = local(art.badge[0], art.badge[1]);
      const badgeY = spot.y;
      const badge = scene.add.image(spot.x, badgeY, "icon-heart").setDisplaySize(BADGE_SIZE, BADGE_SIZE).setVisible(false);
      const baseY = J.deskTop + 16;
      const root = scene.add.container(J.xs[i], baseY, art.hold.front ? [img, plate, arm, badge] : [plate, img, arm, badge]).setScale(J.scale).setDepth(5);
      const name = scene.add.text(J.xs[i], plateY, names[id], styles.name(nameSize)).setOrigin(0.5).setDepth(6.5);
      if (name.width > 146 * s) name.setScale((146 * s) / name.width);
      this.judges.set(id, { id, root, baseY, img, plate, plateText, arm, badge, badgeY, face: "neutral", faceUntil: 0, badgeFrom: 0, badgeUntil: 0, plateUntil: 0, motion: null, motionFrom: 0, motionMs: 0, busyUntil: 0, queue: [] });
    });
    const inspector = JURY_ART.inspector;
    this.shh = scene.add
      .text(J.xs[0] - 50 * J.scale, J.deskTop + 16 - inspector.crop * inspector.scale * J.scale + 10, shh, styles.shh)
      .setOrigin(1, 0.5)
      .setDepth(16)
      .setVisible(false);
  }

  reset() {
    this.judges.forEach((j) => {
      j.queue = [];
      j.plate.setVisible(false);
      j.arm.setVisible(false);
      j.badge.setVisible(false);
      j.motion = null;
      j.busyUntil = 0;
      this.setFace(j, "neutral");
      j.faceUntil = 0;
    });
  }

  miss(run: number) {
    const now = performance.now();
    if (run >= 3) {
      this.say("inspector", { face: "angry", ms: 1100, motion: "shake", strong: true }, 0);
      this.say("arlindo", { face: "oops", ms: 900, motion: "take", strong: true }, between(140, 240));
      this.say("lunch", { face: "wow", ms: 850, motion: "pop", badge: run >= 4 ? "down" : undefined, strong: true }, between(60, 130));
      return;
    }
    const picks: JuryId[] = [];
    if (Math.random() < 0.55) picks.push("inspector");
    if (Math.random() < 0.45) picks.push("arlindo");
    if (Math.random() < 0.35) picks.push("lunch");
    const free = picks.filter((id) => (this.judges.get(id)?.busyUntil ?? 0) < now);
    if (free.length === 0) {
      const idle = ORDER.filter((id) => (this.judges.get(id)?.busyUntil ?? 0) < now);
      if (idle.length > 0) free.push(idle.includes("arlindo") ? "arlindo" : idle[0]);
    }
    for (const id of free) {
      if (id === "inspector") this.say(id, { face: "frown", ms: 850, motion: "shake" }, between(0, 70));
      else if (id === "arlindo") this.say(id, { face: "oops", ms: 760, motion: "take" }, between(140, 260));
      else this.say(id, { face: "wow", ms: 680, motion: "pop" }, between(60, 150));
    }
  }

  noise() {
    this.say("inspector", { face: "angry", ms: 1100, motion: "shake", strong: true }, 0);
    if (performance.now() > this.shhUntil) {
      this.shh.setVisible(true);
      this.shhUntil = performance.now() + 900;
    }
    if (Math.random() < 0.4) this.say("lunch", { face: "wow", ms: 600, motion: "pop" }, between(90, 160));
  }

  hit(mark: Mark, streak: number) {
    if (mark === "held") {
      this.say("lunch", { face: "happy", ms: 1000, motion: "hop", badge: "heart" }, between(40, 120));
      if (Math.random() < 0.3) this.say("arlindo", { face: "happy", ms: 700, motion: "bounce" }, between(180, 300));
      return;
    }
    if (streak <= 0) return;
    if (streak % 20 === 0) this.say("inspector", { face: "nod", ms: 1300, motion: "nod" }, between(260, 380));
    if (streak % 10 === 0) this.say("arlindo", { face: "happy", ms: 1100, motion: "bounce" }, between(120, 220));
    if (streak % 8 === 0) this.say("lunch", { face: "happy", ms: 1000, motion: "hop", badge: "heart" }, between(30, 110));
    else if (streak % 10 === 0) this.say("lunch", { face: "happy", ms: 900, motion: "pop", badge: "up" }, between(30, 110));
  }

  plates(base: number, ms: number, gap = 0) {
    return ORDER.map((id, i) => {
      const grade = Math.max(0, Math.min(10, base + BIAS[id]));
      this.say(id, { ...this.verdictOf(id, grade, ms), strong: true, plate: { grade, ms } }, gap > 0 ? i * gap : PLATE_STAGGER[id]);
      return grade;
    });
  }

  cut() {
    this.say("inspector", { face: "shock", ms: 2600, strong: true }, 0);
    this.say("arlindo", { face: "oops", ms: 2600, motion: "take", strong: true }, 200);
    this.say("lunch", { face: "wow", ms: 2600, motion: "pop", badge: "down", strong: true }, 90);
  }

  update(now: number, beat: number, moving: boolean, mood: number, streak: number) {
    if (this.shh.visible && now > this.shhUntil) this.shh.setVisible(false);
    this.judges.forEach((j) => {
      for (let i = 0; i < j.queue.length; ) {
        if (j.queue[i].at > now) {
          i += 1;
          continue;
        }
        this.apply(j, j.queue.splice(i, 1)[0].r);
      }
      if (j.face !== "neutral" && now > j.faceUntil) this.setFace(j, "neutral");
      if (j.badge.visible && now > j.badgeUntil) j.badge.setVisible(false);
      if (j.plate.visible && now > j.plateUntil) {
        j.plate.setVisible(false);
        j.arm.setVisible(false);
      }
      let y = 0;
      let rotation = 0;
      let scale = 1;
      if (!this.still) {
        const groove = moving ? mood : 0;
        if (j.id === "arlindo" && groove > 0.25) {
          y -= Math.abs(Math.sin(beat * Math.PI)) * 2.6 * (0.5 + groove);
          rotation += Math.sin((beat * Math.PI) / 2) * 0.03 * groove;
        } else if (j.id === "lunch" && moving && streak >= 10) rotation += Math.sin((beat * Math.PI) / 2 + Math.PI) * 0.028;
        if (j.motion) {
          const k = (now - j.motionFrom) / j.motionMs;
          if (k >= 1) j.motion = null;
          else {
            const m = this.motionAt(j.motion, k);
            y += m.y;
            rotation += m.rotation;
            scale *= m.scale;
          }
        }
        if (j.badge.visible) {
          const k = Math.min(1, (now - j.badgeFrom) / 220);
          const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
          j.badge.setDisplaySize(BADGE_SIZE * back, BADGE_SIZE * back).setY(j.badgeY - 18 * Math.min(1, (now - j.badgeFrom) / 600));
        }
      }
      j.root.setY(j.baseY + y).setRotation(rotation).setScale(this.L.jury.scale * scale);
    });
  }

  private verdictOf(id: JuryId, grade: number, ms: number): Reaction {
    const good = grade >= 8;
    const bad = grade <= 4;
    if (id === "inspector") return good ? { face: "nod", ms, motion: "nod" } : bad ? { face: "angry", ms, motion: "shake" } : { face: "frown", ms: Math.min(ms, 1200) };
    if (id === "arlindo") return good ? { face: "happy", ms, motion: "bounce" } : bad ? { face: "angry", ms } : { face: "neutral", ms };
    return good ? { face: "happy", ms, motion: "hop", badge: "heart" } : bad ? { face: "angry", ms, badge: "down" } : { face: "neutral", ms, badge: grade >= 6 ? "up" : undefined };
  }

  private say(id: JuryId, r: Reaction, delay: number) {
    const j = this.judges.get(id);
    if (!j) return;
    const now = performance.now();
    if (!r.strong && j.busyUntil > now) return;
    j.queue.push({ at: now + (this.still ? 0 : delay), r });
  }

  private apply(j: Judge, r: Reaction) {
    const now = performance.now();
    j.busyUntil = now + Math.min(r.ms, 900) + 250;
    j.faceUntil = now + r.ms;
    this.setFace(j, r.face);
    if (r.motion) {
      j.motion = r.motion;
      j.motionFrom = now;
      j.motionMs = r.motion === "shake" ? 520 : r.motion === "nod" ? 700 : r.motion === "hop" ? 620 : r.motion === "take" ? 560 : r.motion === "pop" ? 420 : 760;
    }
    if (r.badge) {
      j.badge.setTexture(BADGE_ART[r.badge]).setDisplaySize(BADGE_SIZE, BADGE_SIZE).setY(j.badgeY).setVisible(true);
      j.badgeFrom = now;
      j.badgeUntil = now + Math.min(r.ms, 1400);
    }
    if (r.plate) {
      j.plateText.setText(String(r.plate.grade));
      j.plate.setVisible(true).setScale(1);
      j.arm.setVisible(true);
      j.plateUntil = now + r.plate.ms;
      if (!this.still) this.scene.tweens.add({ targets: j.plate, scale: { from: 0.7, to: 1 }, duration: 260, ease: "Back.easeOut" });
    }
  }

  private setFace(j: Judge, face: JuryFace) {
    const key = ART[j.id][face] ?? ART[j.id].neutral!;
    j.face = face;
    if (j.img.texture.key === key) return;
    const art = JURY_ART[j.id];
    j.img.setTexture(key).setCrop(0, 0, art.w * 2, art.crop * 2);
  }

  private motionAt(motion: Motion, k: number) {
    const s = Math.sin(k * Math.PI);
    if (motion === "shake") return { y: 0, rotation: Math.sin(k * Math.PI * 6) * 0.045 * (1 - k), scale: 1 };
    if (motion === "nod") return { y: s * 6, rotation: 0, scale: 1 };
    if (motion === "hop") return { y: -Math.abs(Math.sin(k * Math.PI * 2)) * 10, rotation: 0, scale: 1 + 0.03 * Math.abs(Math.sin(k * Math.PI * 2)) };
    if (motion === "bounce") return { y: -Math.abs(Math.sin(k * Math.PI * 3)) * 7, rotation: Math.sin(k * Math.PI * 3) * 0.02, scale: 1 };
    if (motion === "pop") return { y: -s * 4, rotation: -0.05 * s, scale: 1 + 0.07 * s };
    return { y: -Math.sin(Math.min(1, k * 2.5) * Math.PI) * 9, rotation: Math.sin(k * Math.PI * 3) * 0.035 * (1 - k), scale: 1 };
  }

  private drawHold(g: Phaser.GameObjects.Graphics, hold: PaddleHold, local: (x: number, y: number) => { x: number; y: number }, scale: number) {
    const ink = 4 * scale;
    const curves = hold.arm.map((s) => {
      const [a, b, c] = [s.from, s.via, s.to].map(([x, y]) => local(x, y));
      return { points: new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2(b.x, b.y), new Phaser.Math.Vector2(c.x, c.y)).getPoints(18), color: s.color, width: s.width * scale };
    });
    const stroke = (points: Phaser.Math.Vector2[], color: number, width: number) => {
      g.lineStyle(width, color, 1).strokePoints(points, false, false);
      g.fillStyle(color, 1).fillCircle(points[0].x, points[0].y, width / 2).fillCircle(points[points.length - 1].x, points[points.length - 1].y, width / 2);
    };
    for (const c of curves) stroke(c.points, C.ink, c.width + ink * 2);
    for (const c of curves) stroke(c.points, c.color, c.width);
    if (hold.skin === null) return;
    const f = local(hold.fist[0], hold.fist[1]);
    const w = 26 * scale;
    const h = 30 * scale;
    g.fillStyle(hold.skin, 1).fillRoundedRect(f.x - w / 2, f.y - h / 2, w, h, 9 * scale);
    g.lineStyle(ink, C.ink, 1).strokeRoundedRect(f.x - w / 2, f.y - h / 2, w, h, 9 * scale);
    g.lineStyle(2.5 * scale, C.ink, 1).lineBetween(f.x - w * 0.32, f.y - h * 0.08, f.x + w * 0.32, f.y - h * 0.08).lineBetween(f.x - w * 0.32, f.y + h * 0.18, f.x + w * 0.32, f.y + h * 0.18);
  }
}
