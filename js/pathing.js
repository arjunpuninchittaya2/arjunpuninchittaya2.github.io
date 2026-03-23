import { clamp } from "./utils.js";

export function buildCanGuide(targetDistance, midY = 1) {
  const d = Math.max(1.5, targetDistance);
  const y = clamp(midY, 0, 3);
  const points = [
    { x: 0, y: 0 },
    { x: d * 0.125, y },
    { x: d * 0.875, y },
    { x: d, y: 0 },
  ];

  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    cumulative.push(cumulative[i - 1] + Math.hypot(cur.x - prev.x, cur.y - prev.y));
  }

  return {
    points,
    cumulative,
    totalLen: cumulative[cumulative.length - 1],
  };
}

export function pointAtS(guide, s) {
  const ss = clamp(s, 0, guide.totalLen);
  for (let i = 1; i < guide.cumulative.length; i++) {
    const segStart = guide.cumulative[i - 1];
    const segEnd = guide.cumulative[i];
    if (ss <= segEnd || i === guide.cumulative.length - 1) {
      const span = Math.max(1e-6, segEnd - segStart);
      const u = clamp((ss - segStart) / span, 0, 1);
      const a = guide.points[i - 1];
      const b = guide.points[i];
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
      };
    }
  }

  return guide.points[guide.points.length - 1];
}

export function closestSOnGuide(guide, px, py) {
  let bestDistSq = Infinity;
  let bestS = 0;

  for (let i = 1; i < guide.points.length; i++) {
    const a = guide.points[i - 1];
    const b = guide.points[i];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = px - a.x;
    const wy = py - a.y;
    const vv = vx * vx + vy * vy;
    const u = vv > 1e-9 ? clamp((wx * vx + wy * vy) / vv, 0, 1) : 0;
    const qx = a.x + vx * u;
    const qy = a.y + vy * u;
    const dsq = (px - qx) * (px - qx) + (py - qy) * (py - qy);

    if (dsq < bestDistSq) {
      bestDistSq = dsq;
      bestS = guide.cumulative[i - 1] + Math.sqrt(vv) * u;
    }
  }

  return bestS;
}
