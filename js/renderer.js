import { M_TO_PX } from "./constants.js";

export function createRenderer(canvas, state) {
  const ctx = canvas.getContext("2d");

  return function drawField(params) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = 80;
    const cy = h * 0.65;

    ctx.fillStyle = "#020905";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#0e2818";
    for (let x = 0; x < w; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#1d5a22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + params.targetDistance * M_TO_PX, cy);
    ctx.stroke();

    ctx.strokeStyle = "#19477d";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx + state.x * M_TO_PX, cy - 80);
    ctx.lineTo(cx + state.x * M_TO_PX, cy + 80);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#adff1f";
    ctx.fillText("START", cx - 18, cy - 18);
    ctx.fillStyle = "#ff3c42";
    ctx.fillText("TARGET", cx + params.targetDistance * M_TO_PX - 18, cy - 18);

    const bonusX = cx + params.targetDistance * 0.5 * M_TO_PX;
    ctx.strokeStyle = "#3c79b8";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(bonusX, cy - 130);
    ctx.lineTo(bonusX, cy + 130);
    ctx.stroke();
    ctx.setLineDash([]);

    const topCanYWorldM = 1.0;
    const bottomCanYWorldM = topCanYWorldM - params.insideCanDistance / 100;
    const can1y = cy - topCanYWorldM * M_TO_PX;
    const can2y = cy - bottomCanYWorldM * M_TO_PX;
    ctx.fillStyle = "#f4a035";
    ctx.strokeStyle = "#8c5414";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bonusX, can1y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bonusX, can2y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (state.guide) {
      ctx.strokeStyle = "#45b6ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      state.guide.points.forEach((pt, i) => {
        const gx = cx + pt.x * M_TO_PX;
        const gy = cy - pt.y * M_TO_PX;
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = "#95ff1a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < state.path.length; i++) {
      const pt = state.path[i];
      const x = cx + pt.x * M_TO_PX;
      const y = cy - pt.y * M_TO_PX;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const rx = cx + state.x * M_TO_PX;
    const ry = cy - state.y * M_TO_PX;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-state.yaw);
    ctx.fillStyle = "#10d9ff";
    ctx.strokeStyle = "#0aa6c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -7, 20, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f6ff3a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    ctx.restore();
  };
}
