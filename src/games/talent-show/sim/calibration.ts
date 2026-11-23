export const CALIBRATION_EARLY = 150;
export const CALIBRATION_LATE = 450;
export const CALIBRATION_MIN_OFFSET = -100;
export const CALIBRATION_SPREAD = 120;
export const CALIBRATION_MIN_TAPS = 5;

export type CalibrationFailure = "few" | "uneven" | "off";
export type Calibration = { ok: true; offset: number } | { ok: false; reason: CalibrationFailure };

export function clickFor(heardMs: number, clicksMs: readonly number[]) {
  return clicksMs.findIndex((t) => heardMs - t >= -CALIBRATION_EARLY && heardMs - t < CALIBRATION_LATE);
}

export function isPlausibleOffset(ms: number, max: number) {
  return Number.isInteger(ms) && ms >= CALIBRATION_MIN_OFFSET && ms <= max;
}

export function calibrate(errors: readonly number[], max: number): Calibration {
  if (errors.length < CALIBRATION_MIN_TAPS) return { ok: false, reason: "few" };
  const sorted = [...errors].sort((a, b) => a - b);
  const quantile = (q: number) => {
    const at = (sorted.length - 1) * q;
    const low = Math.floor(at);
    return sorted[low] + (sorted[Math.ceil(at)] - sorted[low]) * (at - low);
  };
  if (quantile(0.75) - quantile(0.25) > CALIBRATION_SPREAD) return { ok: false, reason: "uneven" };
  const offset = Math.round(quantile(0.5));
  if (!isPlausibleOffset(offset, max)) return { ok: false, reason: "off" };
  return { ok: true, offset };
}
