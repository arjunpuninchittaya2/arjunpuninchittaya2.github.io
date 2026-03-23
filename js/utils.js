export const fmt = (n, d = 2) => Number(n).toFixed(d);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const wrapAngle = (a) => {
  let angle = a;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};
