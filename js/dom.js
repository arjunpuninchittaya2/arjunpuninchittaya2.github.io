import { clamp, fmt } from "./utils.js";

export const E = (id) => document.getElementById(id);
export const sliders = ["vmax", "lookahead", "midY", "vstop", "kp", "ki", "kd", "kpyaw", "kiyaw", "kdyaw"];

export function logLine(text) {
  const at = new Date().toLocaleTimeString();
  E("log").innerHTML = `[${at}] ${text}<br>` + E("log").innerHTML;
}

export function readParams() {
  const params = {
    targetDistance: parseFloat(E("targetDistance").value),
    targetTime: parseFloat(E("targetTime").value),
    vmax: parseFloat(E("vmax").value),
    lookahead: parseFloat(E("lookahead").value),
    midY: parseFloat(E("midY").value),
    vstop: parseFloat(E("vstop").value),
    kp: parseFloat(E("kp").value),
    ki: parseFloat(E("ki").value),
    kd: parseFloat(E("kd").value),
    kpyaw: parseFloat(E("kpyaw").value),
    kiyaw: parseFloat(E("kiyaw").value),
    kdyaw: parseFloat(E("kdyaw").value),
    insideCanDistance: parseFloat(E("insideCanDistance").value),
    competitionViolation: E("competitionViolation").checked,
    constructionViolation: E("constructionViolation").checked,
  };

  params.targetDistance = Math.max(0.5, params.targetDistance);
  params.targetTime = Math.max(1, params.targetTime);
  params.lookahead = clamp(params.lookahead, 0.2, 2.5);
  params.midY = clamp(params.midY, 0.2, 2.0);
  if (!Number.isFinite(params.insideCanDistance)) params.insideCanDistance = 50;
  params.insideCanDistance = clamp(params.insideCanDistance, 0, 100);

  return params;
}

export function refreshSliderLabels() {
  E("vmaxV").textContent = fmt(E("vmax").value, 2);
  E("lookaheadV").textContent = fmt(E("lookahead").value, 2);
  E("midYV").textContent = fmt(E("midY").value, 2);
  E("vstopV").textContent = fmt(E("vstop").value, 2);
  E("kpV").textContent = fmt(E("kp").value, 2);
  E("kiV").textContent = fmt(E("ki").value, 2);
  E("kdV").textContent = fmt(E("kd").value, 2);
  E("kpyawV").textContent = fmt(E("kpyaw").value, 2);
  E("kiyawV").textContent = fmt(E("kiyaw").value, 2);
  E("kdyawV").textContent = fmt(E("kdyaw").value, 2);
}

export function updatePathInfo(targetDistance, midY) {
  E("pathInfo").textContent = `Path (scaled): (0,0) -> (${fmt(targetDistance * 0.125, 2)},${fmt(midY, 2)}) -> (${fmt(targetDistance * 0.875, 2)},${fmt(midY, 2)}) -> (${fmt(targetDistance, 2)},0)`;
}

export function updateTelemetry(state, fwdErr, yawErr) {
  E("xVal").textContent = fmt(state.x, 3);
  E("yVal").textContent = fmt(state.y, 3);
  E("yawVal").textContent = fmt((state.yaw * 180) / Math.PI, 2);
  E("speedVal").textContent = fmt(state.v, 3);
  E("lMotorVal").textContent = fmt(state.leftMotor, 2);
  E("rMotorVal").textContent = fmt(state.rightMotor, 2);
  E("fwdErrVal").textContent = fmt(fwdErr, 3);
  E("yawErrVal").textContent = fmt((yawErr * 180) / Math.PI, 2);
  E("fwdIntVal").textContent = fmt(state.pid.fwdI, 3);
  E("yawIntVal").textContent = fmt(state.pid.yawI, 3);

  E("topbar").innerHTML =
    `<span class="status-dot ${state.running ? "ready" : ""}"></span>${state.running ? "RUNNING" : "READY"}` +
    ` | T: ${fmt(state.t, 2)}s` +
    ` X: ${fmt(state.x, 3)}m` +
    ` Y: ${fmt(state.y, 3)}m` +
    ` ψ: ${fmt((state.yaw * 180) / Math.PI, 2)}°` +
    ` V: ${fmt(state.v, 3)}m/s`;
}

export function renderScoreCard(score) {
  E("scoreCard").innerHTML =
    `Base <span style="float:right">${fmt(score.base)}</span><br>` +
    `Vehicle Distance (cm) <span style="float:right">${fmt(score.vehicleDistanceCm, 1)}</span><br>` +
    `Final Yaw Error (°) <span style="float:right">${fmt(score.finalYawErrorDeg, 2)}</span><br>` +
    `Distance <span style="float:right">${fmt(score.distanceScore)}</span><br>` +
    `Time <span style="float:right">${fmt(score.timeScore)}</span><br>` +
    `Can Bonus <span style="float:right">${fmt(score.canBonus)}</span><br>` +
    `Run Penalties <span style="float:right">${fmt(score.penalties)}</span><br><hr style="border-color:#253a59"/>` +
    `<b>Run Score (low wins)</b> <span style="float:right"><b>${fmt(score.run)}</b></span>`;
}

export function setInitialScoreCard() {
  E("scoreCard").innerHTML = "Base <span style=\"float:right\">100.00</span><br>Run score appears after simulation.";
}
