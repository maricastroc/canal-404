import * as Phaser from "phaser";
import type { Mark } from "../sim/judge";
import type { RoundId } from "../song/notation";
import type { Layout } from "./layout";

export type CrowdMode = "rest" | "live" | "finale" | "cut";
export type Fan = { img: Phaser.GameObjects.Image; y: number };

type Act = "cheer" | "wave" | "hop" | "droop" | "startle";
type Member = Fan & {
  arms: Phaser.GameObjects.Image;
  sign: Phaser.GameObjects.Image | null;
  signUp: number;
  base: number;
  leave: number;
  phase: number;
  energy: number;
  style: number;
  tilt: number;
  side: number;
  act: Act | null;
  actFrom: number;
  actUntil: number;
};

type Style = { idle: number; signs: number; perfect: number; groove: number; ripple: number };

const STYLES: Record<RoundId, Style> = {
  heats: { idle: 0.03, signs: 0, perfect: 0.15, groove: 0, ripple: 0.3 },
  semifinal: { idle: 0.05, signs: 0.04, perfect: 0.22, groove: 0.2, ripple: 0.4 },
  final: { idle: 0.08, signs: 0.09, perfect: 0.3, groove: 0.45, ripple: 0.5 },
};

const HEADS = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10];
const SIGN_MOOD = 0.45;

function jitter(seed: number, salt: number) {
  const n = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function envelope(k: number) {
  const rise = Math.min(1, k / 0.25);
  const fall = k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
  return Math.sin((rise * Math.PI) / 2) * fall;
}

export class Crowd {
  private readonly members: Member[] = [];
  private style: Style = STYLES.heats;
  private holders: Member[] = [];
  private lastBar = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly L: Layout,
    private readonly still: boolean,
  ) {
    let index = 0;
    L.crowd.forEach((row, r) => {
      for (let i = 0; i < row.xs.length; i += 1) {
        const head = HEADS[(i * 7 + r * 3 + (index % 5)) % HEADS.length];
        const x = row.xs[i] + (jitter(index, 1) - 0.5) * 12 * row.scale;
        const y = row.y + (jitter(index, 6) - 0.5) * 14 * row.scale;
        const tilt = (jitter(index, 2) - 0.5) * 0.08;
        const scale = row.scale * (0.92 + jitter(index, 3) * 0.16);
        const depth = 9 + r * 0.04 + i * 0.0005;
        const img = scene.add.image(x, y, `crowd-${head}`).setOrigin(0.5, 1).setScale(scale / 2).setRotation(tilt).setDepth(depth);
        const arms = scene.add.image(x, y, "crowd-arms-up").setVisible(false).setDepth(depth - 0.0002);
        this.members.push({ img, y, arms, sign: null, signUp: 0, base: scale / 2, leave: (index * 7919) % 97, phase: (jitter(index, 4) - 0.5) * 0.16, energy: jitter(index, 5), style: index % 3, tilt, side: x < L.W / 2 ? 1 : -1, act: null, actFrom: 0, actUntil: 0 });
        index += 1;
      }
    });
    const order = [...this.members].sort((a, b) => a.leave - b.leave);
    order.forEach((m, rank) => (m.leave = rank));
  }

  get fans(): readonly Fan[] {
    return this.members;
  }

  setRound(round: RoundId) {
    this.style = STYLES[round];
    const want = this.L.crowd.length > 1 ? Math.round(this.members.length * this.style.signs) : 0;
    const ranked = [...this.members].sort((a, b) => jitter(a.leave, 7) - jitter(b.leave, 7));
    const picked: Member[] = [];
    for (const m of ranked) {
      if (picked.length >= want) break;
      if (picked.some((p) => Math.abs(p.img.x - m.img.x) < m.img.displayWidth * 1.6 && Math.abs(p.y - m.y) < m.img.displayHeight)) continue;
      picked.push(m);
    }
    for (const m of this.members) {
      const holds = picked.includes(m);
      if (holds && !m.sign) m.sign = this.scene.add.image(m.img.x, m.y, picked.indexOf(m) % 2 === 0 ? "crowd-sign-404" : "crowd-sign-heart").setOrigin(0.5, 1).setDepth(m.img.depth - 0.0004);
      if (!holds && m.sign) {
        m.sign.destroy();
        m.sign = null;
      }
      m.signUp = 0;
      m.sign?.setVisible(false);
    }
    this.holders = picked;
  }

  reset() {
    for (const m of this.members) this.calm(m);
    this.lastBar = -Infinity;
  }

  hit(mark: Mark, streak: number, beatMs: number) {
    if (mark === "held") this.react(1, "cheer", beatMs * 1.5);
    else if (mark === "perfect" && Math.random() < this.style.perfect) this.react(1, "hop", 380);
    if ((mark === "perfect" || mark === "good" || mark === "near") && streak > 0 && streak % 10 === 0) {
      if (streak % 20 === 0) this.ripple("cheer", Math.min(this.style.ripple * 1.4, this.style.ripple + streak / 400), beatMs * 2, beatMs);
      else this.react(2 + Math.round(this.style.groove * 4), "cheer", beatMs * 1.5);
    }
  }

  miss(run: number) {
    if (run === 1) {
      if (Math.random() < 0.7) this.react(1, "droop", 760);
    } else if (run === 2) this.react(2, "droop", 820);
    else if (run >= 3) this.react(Math.max(3, Math.round(this.visible().length * 0.18)), "droop", 900);
  }

  noise() {
    this.react(2, "startle", 260);
  }

  section(grade: number, beatMs: number) {
    if (grade >= 9) this.ripple("cheer", 0.6, beatMs * 2.5, beatMs * 1.2);
    else if (grade >= 7) this.react(Math.round(this.visible().length * 0.22), "cheer", beatMs * 2);
    else if (grade >= 5) this.react(Math.round(this.visible().length * 0.1), "wave", beatMs * 2);
    else this.react(Math.round(this.visible().length * 0.25), "droop", 1100);
  }

  finale(stars: number) {
    if (stars >= 3) this.ripple("cheer", 1, 2600, 700);
    else if (stars === 2) this.ripple("cheer", 0.6, 2200, 600);
    else if (stars === 1) this.react(Math.round(this.visible().length * 0.25), "wave", 1800);
    else this.react(Math.round(this.visible().length * 0.4), "droop", 1800);
  }

  update(now: number, beat: number, mode: CrowdMode, level: number, mood: number) {
    const total = this.members.length;
    const present = mode === "cut" ? 0 : Math.round(total * Math.min(1, level * 1.25));
    const live = mode === "live";
    const acting = live || mode === "finale";
    const share = live ? this.style.idle + 0.12 * mood + this.style.groove * 0.1 * mood : mode === "finale" ? 0.25 : 0;
    const amp = 0.6 + 0.8 * mood;
    const bar = Math.floor(beat / 4);
    if (live && bar !== this.lastBar) {
      this.lastBar = bar;
      const chance = mood > 0.75 ? 0.35 + this.style.groove : mood > 0.55 ? this.style.groove * 0.5 : 0;
      if (Math.random() < chance) this.react(1 + (Math.random() < this.style.groove ? 1 : 0), "cheer", 1400);
    }
    const signsUp = acting && mood >= SIGN_MOOD;
    for (const m of this.members) {
      const visible = m.leave < present;
      m.img.setVisible(visible);
      if (m.act && (!visible || !acting || now > m.actUntil)) this.calm(m);
      const t = beat + m.phase;
      let lift = 0;
      let rotation = m.tilt;
      let scale = 1;
      if (visible && !this.still && (live || mode === "finale") && m.energy < share) {
        if (m.style === 0) lift = Math.abs(Math.sin(t * Math.PI)) * 9 * amp;
        else if (m.style === 1) rotation += Math.sin((t * Math.PI) / 2) * 0.07 * amp;
        else lift = Math.max(0, 1 - (t - Math.floor(t)) * 4) * 6 * amp;
      }
      const act = m.act && now >= m.actFrom ? m.act : null;
      if (act) {
        const k = Math.max(0, Math.min(1, (now - m.actFrom) / Math.max(1, m.actUntil - m.actFrom)));
        if (!m.arms.visible && (act === "cheer" || act === "wave")) this.raiseArms(m, act);
        if (!this.still) {
          if (act === "cheer") lift = Math.max(lift, Math.abs(Math.sin(live ? t * Math.PI : now / 120)) * 13);
          else if (act === "wave") lift = Math.max(lift, 4);
          else if (act === "hop") lift = Math.sin(k * Math.PI) * 15;
          else if (act === "startle") {
            lift = Math.sin(k * Math.PI) * 8;
            scale = 1 + 0.05 * Math.sin(k * Math.PI);
          } else if (act === "droop") {
            const e = envelope(k);
            lift = -8 * e;
            rotation += 0.16 * m.side * e;
          }
        }
      }
      m.img.setY(m.y - lift).setRotation(rotation).setScale(m.base * scale);
      if (m.arms.visible) {
        const img = m.img;
        if (m.act === "cheer") m.arms.setPosition(img.x, img.y).setRotation(rotation);
        else {
          const k = img.displayWidth / 120;
          const wave = this.still ? 0.5 : 0.5 + 0.3 * Math.sin(now / 85);
          m.arms.setPosition(img.x + 38 * k, img.y - 34 * k).setRotation(rotation + wave);
        }
      }
      if (m.sign) {
        const up = signsUp && visible && act !== "droop" ? 1 : 0;
        m.signUp += (up - m.signUp) * (this.still ? 1 : 0.12);
        const show = m.signUp > 0.02;
        m.sign.setVisible(show);
        if (show) {
          const drop = (1 - m.signUp) * m.img.displayHeight * 0.9;
          const sway = this.still ? 0 : Math.sin(((t + 0.5) * Math.PI) / 2) * 0.06;
          m.sign.setPosition(m.img.x, m.img.y + drop).setScale(m.base).setRotation(m.tilt * 0.5 + sway);
        }
      }
    }
  }

  private visible() {
    return this.members.filter((m) => m.img.visible);
  }

  private idle() {
    return this.members.filter((m) => m.img.visible && m.act === null && !this.holders.includes(m));
  }

  private react(count: number, act: Act, ms: number, delay = 0) {
    const now = performance.now();
    const idle = this.idle();
    for (let n = 0; n < count && idle.length > 0; n += 1) {
      const m = idle.splice(Math.floor(Math.random() * idle.length), 1)[0];
      this.start(m, act, now + delay, ms);
    }
  }

  private ripple(act: Act, share: number, ms: number, sweep: number) {
    const now = performance.now();
    const W = this.L.W;
    for (const m of this.idle()) {
      if (Math.random() > share) continue;
      this.start(m, act, now + (m.img.x / W) * sweep, ms);
    }
  }

  private start(m: Member, act: Act, from: number, ms: number) {
    m.act = act;
    m.actFrom = from;
    m.actUntil = from + ms;
  }

  private raiseArms(m: Member, act: "cheer" | "wave") {
    m.arms
      .setTexture(act === "cheer" ? "crowd-arms-up" : "crowd-arm-wave")
      .setOrigin(0.5, act === "cheer" ? 1 : 0.87)
      .setScale(m.base)
      .setVisible(true);
  }

  private calm(m: Member) {
    m.arms.setVisible(false);
    m.act = null;
  }
}
