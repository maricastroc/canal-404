export const PI = 3.141592653589793;
export const TAU = 6.283185307179586;
export const HALF_PI = 1.5707963267948966;
export const DEG = PI / 180;

const QUARTER_PI = 0.7853981633974483;
const TAN_PI_8 = 0.41421356237309503;
const COEF = [1, -1 / 3, 1 / 5, -1 / 7, 1 / 9, -1 / 11, 1 / 13, -1 / 15, 1 / 17, -1 / 19, 1 / 21, -1 / 23];

function atanSmall(x: number) {
  const z = x * x;
  let acc = COEF[COEF.length - 1];
  for (let i = COEF.length - 2; i >= 0; i -= 1) acc = acc * z + COEF[i];
  return x * acc;
}

function atanPositive(a: number): number {
  if (a > 1) return HALF_PI - atanPositive(1 / a);
  if (a > TAN_PI_8) return QUARTER_PI + atanSmall((a - 1) / (a + 1));
  return atanSmall(a);
}

export function atan(x: number) {
  return x < 0 ? -atanPositive(-x) : atanPositive(x);
}

export function atan2(y: number, x: number) {
  if (x > 0) return atan(y / x);
  if (x < 0) return y < 0 ? atan(y / x) - PI : atan(y / x) + PI;
  if (y > 0) return HALF_PI;
  if (y < 0) return -HALF_PI;
  return 0;
}

export function wrapAngle(a: number) {
  let r = a;
  while (r > PI) r -= TAU;
  while (r < -PI) r += TAU;
  return r;
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
