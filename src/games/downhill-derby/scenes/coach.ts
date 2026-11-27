import * as Phaser from "phaser";
import type { RaceCopy } from "../copy";
import type { Course } from "../sim/course";
import type { Landing } from "../sim/sim";
import { INK } from "./cart";
import type { TouchButton } from "./hud";

export type CoachBeat = { kind: "hold" | "jump" | "spin"; pressed: boolean; ring: number; now: boolean; dir: -1 | 1 };

export type CoachInput = {
  mode: string;
  surface: number;
  x: number;
  speed: number;
  crouch: boolean;
  angle: number;
  land: Landing | null;
  air: number;
  perfectTol: number;
};

type Lip = { x: number; surface: number };

const LEAD = 0.9;
const AIM = 40;
const WINDOW = 80;
const HOLD_LEARNED = 0.7;
const HOLD_REST = 0.5;
const SLOW = 0.35;
const SLOW_MAX = 6;

function wrap(a: number) {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function coachButton(beat: CoachBeat | null): TouchButton | null {
  if (!beat || beat.pressed) return null;
  if (beat.kind === "hold") return "crouch";
  if (beat.kind === "jump") return "jump";
  return beat.dir < 0 ? "left" : "right";
}

export class CoachPlan {
  private readonly lips: Lip[] = [];
  private readonly hold: { x0: number; x1: number } | null = null;
  private readonly done = new Set<number>();
  private current = -1;
  private held = 0;
  private learned = false;
  private rest = 0;
  private slowState: "off" | "wait" | "on" | "done";
  private slowReal = 0;
  private flew = false;
  scale = 1;

  constructor(track: Course, slowmo: boolean) {
    for (const mark of track.chalk) {
      if (mark.kind !== "jump") continue;
      let best: Lip | null = null;
      for (const lip of track.lips) {
        if (lip.surface !== mark.surface || lip.x < mark.x) continue;
        if (!best || lip.x < best.x) best = lip;
      }
      if (best) this.lips.push({ x: best.x, surface: best.surface });
    }
    this.lips.sort((a, b) => a.x - b.x);
    const holds = track.chalk.filter((m) => m.kind === "hold" && m.surface === 0).map((m) => m.x);
    if (holds.length) {
      const last = Math.max(...holds);
      const next = track.sections.find((s) => s.x > last);
      this.hold = { x0: Math.min(...holds) - 500, x1: next ? next.x : last + 600 };
    }
    this.slowState = slowmo && this.lips.length ? "wait" : "off";
  }

  jumped() {
    if (this.current < 0) return;
    this.done.add(this.current);
    this.current = -1;
  }

  tick(dt: number, realDt: number, s: CoachInput): CoachBeat | null {
    const beat = this.pick(dt, s);
    this.updateSlow(realDt, s, beat);
    return beat;
  }

  private pick(dt: number, s: CoachInput): CoachBeat | null {
    this.current = -1;
    if (s.mode === "air" && s.land && s.air >= 0.6) {
      const diff = wrap(s.angle - s.land.slope);
      if (Math.abs(diff) * (180 / Math.PI) > s.perfectTol) return { kind: "spin", pressed: false, ring: 0, now: false, dir: diff > 0 ? -1 : 1 };
      return null;
    }
    if (s.mode !== "ground") return null;
    const v = Math.max(200, s.speed);
    for (let i = 0; i < this.lips.length; i += 1) {
      if (this.done.has(i)) continue;
      const lip = this.lips[i];
      if (lip.surface !== s.surface) continue;
      const d = lip.x - s.x;
      if (d < -6) {
        this.done.add(i);
        continue;
      }
      const tt = (d - AIM) / v;
      if (tt > LEAD) break;
      this.current = i;
      return { kind: "jump", pressed: false, ring: Phaser.Math.Clamp(tt / LEAD, 0, 1), now: d <= WINDOW, dir: 1 };
    }
    if (!this.hold || s.surface !== 0 || s.x < this.hold.x0 || s.x > this.hold.x1) return null;
    if (s.crouch) {
      this.held += dt;
      this.rest = 0;
      if (this.held >= HOLD_LEARNED) this.learned = true;
      return this.learned && this.held >= HOLD_LEARNED ? null : { kind: "hold", pressed: true, ring: 0, now: false, dir: 1 };
    }
    this.held = 0;
    this.rest += dt;
    if (this.learned && this.rest < HOLD_REST) return null;
    return { kind: "hold", pressed: false, ring: 0, now: false, dir: 1 };
  }

  private updateSlow(realDt: number, s: CoachInput, beat: CoachBeat | null) {
    let target = 1;
    if (this.slowState === "wait" && beat?.kind === "jump" && this.current === 0 && beat.ring <= 0.8) this.slowState = "on";
    if (this.slowState === "on") {
      this.slowReal += realDt;
      if (s.mode === "air") this.flew = true;
      const landed = this.flew && s.mode !== "air";
      const aligned = this.flew && s.mode === "air" && !!s.land && beat === null;
      const passed = !this.flew && s.x > this.lips[0].x + 40 && s.mode === "ground";
      if (landed || aligned || passed || this.slowReal > SLOW_MAX) this.slowState = "done";
      else target = SLOW;
    }
    this.scale += (target - this.scale) * (1 - Math.exp(-(target < this.scale ? 10 : 5) * realDt));
    if (Math.abs(this.scale - target) < 0.01) this.scale = target;
  }
}

type Style = { w: number; h: number; round: boolean; fill: number; icon: string | null; text: string | null };

export class CoachView {
  private readonly box: Phaser.GameObjects.Container;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly key: Phaser.GameObjects.Text;
  private readonly verb: Phaser.GameObjects.Text;
  private alpha = 0;
  private last: CoachBeat | null = null;
  private clock = 0;

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Layer,
    private readonly copy: RaceCopy["coach"],
    fonts: { display: string; body: string },
  ) {
    this.g = scene.add.graphics();
    this.icon = scene.add.image(0, 0, "dd-ico-key-down");
    this.key = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "40px", color: "#1d1830" }).setOrigin(0.5, 0.5);
    this.verb = scene.add.text(0, 0, "", { fontFamily: fonts.display, fontSize: "40px", color: "#fbf5e6", stroke: "#1d1830", strokeThickness: 10 }).setOrigin(0.5, 1);
    this.box = scene.add.container(0, 0, [this.g, this.icon, this.key, this.verb]);
    this.box.setAlpha(0).setVisible(false);
    layer.add(this.box);
  }

  destroy() {
    this.box.destroy();
  }

  private style(beat: CoachBeat, touch: boolean): Style {
    if (touch) {
      if (beat.kind === "hold") return { w: 104, h: 104, round: true, fill: 0x63d6c1, icon: "dd-ico-crouch", text: null };
      if (beat.kind === "jump") return { w: 116, h: 116, round: true, fill: 0xffc83d, icon: "dd-ico-jump", text: null };
      return { w: 100, h: 88, round: false, fill: 0xfbf5e6, icon: beat.dir < 0 ? "dd-ico-ccw" : "dd-ico-cw", text: null };
    }
    if (beat.kind === "hold") return { w: 100, h: 88, round: false, fill: 0xfbf5e6, icon: "dd-ico-key-down", text: null };
    if (beat.kind === "jump") return { w: 236, h: 88, round: false, fill: 0xfbf5e6, icon: null, text: this.copy.space };
    return { w: 100, h: 88, round: false, fill: 0xfbf5e6, icon: beat.dir < 0 ? "dd-ico-key-left" : "dd-ico-key-right", text: null };
  }

  update(dt: number, beat: CoachBeat | null, x: number, y: number, scale: number, touch: boolean) {
    this.clock += dt;
    if (!beat && this.last?.kind === "jump") this.alpha = 0;
    if (beat) this.last = beat;
    this.alpha = Phaser.Math.Clamp(this.alpha + (beat ? dt * 8 : -dt * 5), 0, 1);
    const shown = this.last;
    if (!shown || this.alpha <= 0) {
      this.box.setVisible(false);
      return;
    }
    const st = this.style(shown, touch);
    const pressed = shown.pressed;
    const hot = shown.kind === "jump" && shown.now;
    const pulse = pressed ? 1 : 1 + Math.sin(this.clock * (hot ? 22 : 9)) * (hot ? 0.07 : 0.045);
    this.box.setVisible(true).setAlpha(this.alpha).setPosition(x, y).setScale(scale * pulse);
    const g = this.g;
    g.clear();
    const dy = pressed ? 7 : 0;
    const fill = pressed || hot ? 0xffcf3f : st.fill;
    const r = Math.min(st.w, st.h) * 0.28;
    if (shown.kind === "jump" && !pressed) {
      const m = 12 + shown.ring * 110;
      const a = 0.35 + (1 - shown.ring) * 0.65;
      const ring = (width: number, color: number, alpha: number) => {
        g.lineStyle(width, color, alpha);
        if (st.round) g.strokeCircle(0, 0, st.w / 2 + m);
        else g.strokeRoundedRect(-st.w / 2 - m, -st.h / 2 - m, st.w + m * 2, st.h + m * 2, r + m);
      };
      ring(hot ? 16 : 12, INK, a * 0.8);
      ring(hot ? 9 : 6, hot ? 0xffcf3f : 0xfbf5e6, a);
    }
    if (st.round) {
      g.fillStyle(INK, 1);
      g.fillCircle(4, 7, st.w / 2);
      g.fillStyle(fill, 1);
      g.fillCircle(0, dy, st.w / 2);
      g.fillStyle(0xffffff, pressed ? 0.18 : 0.38);
      g.fillEllipse(-st.w * 0.1, dy - st.w * 0.26, st.w * 0.45, st.w * 0.16);
      g.lineStyle(5, INK, 1);
      g.strokeCircle(0, dy, st.w / 2);
    } else {
      g.fillStyle(INK, 1);
      g.fillRoundedRect(-st.w / 2 + 4, -st.h / 2 + 8, st.w, st.h, r);
      g.fillStyle(fill, 1);
      g.fillRoundedRect(-st.w / 2, -st.h / 2 + dy, st.w, st.h, r);
      g.fillStyle(0xffffff, pressed ? 0.2 : 0.5);
      g.fillRoundedRect(-st.w / 2 + 12, -st.h / 2 + dy + 8, st.w - 24, 7, 3);
      g.lineStyle(5, INK, 1);
      g.strokeRoundedRect(-st.w / 2, -st.h / 2 + dy, st.w, st.h, r);
    }
    if (st.icon) this.icon.setVisible(true).setTexture(st.icon).setPosition(0, dy).setDisplaySize(st.round ? st.w * 0.56 : 54, st.round ? st.w * 0.56 : 54);
    else this.icon.setVisible(false);
    if (st.text) this.key.setVisible(true).setText(st.text).setPosition(0, dy + 2);
    else this.key.setVisible(false);
    const word = shown.kind === "hold" ? this.copy.hold : shown.kind === "spin" ? this.copy.spin : shown.now || pressed ? this.copy.jump : this.copy.ready;
    const ringRoom = shown.kind === "jump" && !pressed ? 12 + shown.ring * 110 : 0;
    this.verb.setText(word).setColor(hot || pressed ? "#ffcf3f" : "#fbf5e6").setPosition(0, -st.h / 2 - 12 - ringRoom);
  }
}
