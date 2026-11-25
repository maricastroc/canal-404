import { getAudio } from "@/lib/audio/engine";

export type HumState = {
  speed: number;
  accel: number;
  crouch: boolean;
  air: boolean;
  crash: boolean;
};

type Nodes = {
  ctx: AudioContext;
  body: OscillatorNode;
  buzz: OscillatorNode;
  putt: OscillatorNode;
  filter: BiquadFilterNode;
  chug: GainNode;
  level: GainNode;
};

const TOP_SPEED = 2400;
const GLIDE = 0.07;

export class EngineHum {
  private nodes: Nodes | null = null;
  private running = false;

  start() {
    this.running = true;
    if (this.nodes) return;
    const stage = getAudio().stage();
    if (!stage) return;
    const { ctx, out } = stage;
    const body = ctx.createOscillator();
    body.type = "sawtooth";
    body.frequency.value = 70;
    const buzz = ctx.createOscillator();
    buzz.type = "square";
    buzz.frequency.value = 140;
    buzz.detune.value = 8;
    const buzzGain = ctx.createGain();
    buzzGain.gain.value = 0.35;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 2.2;
    const chug = ctx.createGain();
    chug.gain.value = 0.65;
    const putt = ctx.createOscillator();
    putt.type = "square";
    putt.frequency.value = 14;
    const puttDepth = ctx.createGain();
    puttDepth.gain.value = 0.35;
    const level = ctx.createGain();
    level.gain.value = 0;
    body.connect(filter);
    buzz.connect(buzzGain);
    buzzGain.connect(filter);
    filter.connect(chug);
    putt.connect(puttDepth);
    puttDepth.connect(chug.gain);
    chug.connect(level);
    level.connect(out);
    body.start();
    buzz.start();
    putt.start();
    this.nodes = { ctx, body, buzz, putt, filter, chug, level };
  }

  update(state: HumState) {
    const n = this.nodes;
    if (!n) return;
    const now = n.ctx.currentTime;
    const rpm = Math.min(1.2, Math.max(0, state.speed) / TOP_SPEED);
    const pushing = state.crouch || state.accel > 0.15;
    const rev = (pushing ? 0.18 : 0) + (state.air ? 0.3 : 0);
    const freq = 72 + rpm * 150 + rev * 90;
    n.body.frequency.setTargetAtTime(freq, now, GLIDE);
    n.buzz.frequency.setTargetAtTime(freq * 2, now, GLIDE);
    n.putt.frequency.setTargetAtTime(freq / 5, now, GLIDE);
    n.filter.frequency.setTargetAtTime(900 + rpm * 1700 + (pushing ? 600 : 0), now, GLIDE);
    const on = this.running && getAudio().sfxOn && !state.crash;
    const gain = on ? 0.05 + rpm * 0.04 + (pushing ? 0.035 : 0) : 0;
    n.level.gain.setTargetAtTime(gain, now, state.crash ? 0.03 : GLIDE);
  }

  silence() {
    const n = this.nodes;
    if (n) n.level.gain.setTargetAtTime(0, n.ctx.currentTime, 0.04);
  }

  stop() {
    this.running = false;
    const n = this.nodes;
    if (n) n.level.gain.setTargetAtTime(0, n.ctx.currentTime, 0.25);
  }

  destroy() {
    const n = this.nodes;
    this.nodes = null;
    this.running = false;
    if (!n) return;
    n.level.gain.setTargetAtTime(0, n.ctx.currentTime, 0.04);
    const end = n.ctx.currentTime + 0.3;
    n.body.stop(end);
    n.buzz.stop(end);
    n.putt.stop(end);
    n.putt.onended = () => n.level.disconnect();
  }
}
