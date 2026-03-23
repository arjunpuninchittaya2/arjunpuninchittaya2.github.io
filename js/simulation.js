import {
  WHEEL_BASE_M,
  VEL_SMOOTHING,
  OMEGA_SMOOTHING,
  STOP_ZONE_M,
  DECELERATION_MPS2,
} from "./constants.js";
import { clamp, fmt, wrapAngle } from "./utils.js";
import { buildCanGuide, closestSOnGuide, pointAtS } from "./pathing.js";
import { computeScore } from "./scoring.js";

function solveCruiseSpeedWithDecel(distance, timeBudget, decelRate, vmax) {
  const s = Math.max(0, distance);
  const t = Math.max(0.01, timeBudget);
  const a = Math.max(0.1, decelRate);

  // s = v*t - v^2/(2a)  (cruise then brake to 0 at deadline)
  const disc = t * t - (2 * s) / a;
  if (disc <= 0) return vmax;

  const v = a * (t - Math.sqrt(disc));
  return clamp(v, 0, vmax);
}

function ensureTimingPlan(state, params, guide, hooks) {
  const needsNewPlan =
    !state.timing ||
    state.timing.targetDistance !== params.targetDistance ||
    state.timing.targetTime !== params.targetTime ||
    state.timing.midY !== params.midY ||
    state.timing.vmax !== params.vmax;

  if (!needsNewPlan) return;

  const nominalSpeed = solveCruiseSpeedWithDecel(
    guide.totalLen,
    params.targetTime,
    DECELERATION_MPS2,
    params.vmax * 0.95
  );
  const decelTime = nominalSpeed / DECELERATION_MPS2;
  const typicalPower = clamp(nominalSpeed / Math.max(0.05, params.vmax), 0.05, 1);

  state.timing = {
    targetDistance: params.targetDistance,
    targetTime: params.targetTime,
    midY: params.midY,
    vmax: params.vmax,
    pathLen: guide.totalLen,
    nominalSpeed,
    decelTime,
    typicalPower,
    logged: false,
  };

  if (hooks?.logLine) {
    hooks.logLine(
      `Timing plan: path=${fmt(guide.totalLen, 2)}m target=${fmt(params.targetTime, 2)}s nominal=${fmt(nominalSpeed, 3)}m/s decel=${fmt(decelTime, 2)}s power=${fmt(typicalPower * 100, 0)}%`
    );
    state.timing.logged = true;
  }
}

export function stepSimulation(state, params, hooks) {
  state.guide = buildCanGuide(params.targetDistance, params.midY);
  hooks.updatePathInfo(params.targetDistance, params.midY);

  if (state.running) {
    ensureTimingPlan(state, params, state.guide, hooks);
    const nearestS = closestSOnGuide(state.guide, state.x, state.y);
    const lookaheadS = clamp(nearestS + params.lookahead, 0, state.guide.totalLen);
    const pathLookaheadPt = pointAtS(state.guide, lookaheadS);
    const remaining = state.guide.totalLen - nearestS;
    const targetDx = params.targetDistance - state.x;
    const targetDy = -state.y;
    const endDist = Math.hypot(targetDx, targetDy);
    const nearGoal = remaining < 0.35 || endDist < 0.25;

    const lookaheadPt = nearGoal
      ? { x: params.targetDistance, y: 0 }
      : pathLookaheadPt;

    const speedScale = clamp(remaining / STOP_ZONE_M, 0, 1);
    const distCap = clamp(params.vstop + (params.vmax - params.vstop) * speedScale, 0, params.vmax);

    const timeRemaining = Math.max(0.05, params.targetTime - state.t);
    const requiredSpeed = solveCruiseSpeedWithDecel(
      remaining,
      timeRemaining,
      DECELERATION_MPS2,
      params.vmax
    );

    // Precomputed nominal pace + live required pace correction.
    const nominalSpeed = state.timing?.nominalSpeed ?? requiredSpeed;
    const scheduleSpeed = clamp(0.35 * nominalSpeed + 0.65 * requiredSpeed, 0, params.vmax);
    let vSet = Math.min(scheduleSpeed, distCap);

    // If we are late, allow additional recovery up to vmax.
    if (state.t > params.targetTime) {
      const lateGain = clamp((state.t - params.targetTime) / 2, 0, 1);
      vSet = clamp(vSet + lateGain * 0.3 * params.vmax, 0, params.vmax);
    }

    // If we're at the target location early, hold still until target time.
    const earlyAtGoal = endDist < 0.04 && state.t < params.targetTime;
    if (earlyAtGoal) vSet = 0;

    if (nearGoal) {
      // Terminal mode: direct goal capture with time-aware approach speed.
      const terminalRequired = solveCruiseSpeedWithDecel(
        endDist,
        timeRemaining,
        DECELERATION_MPS2,
        Math.min(params.vmax, 0.7)
      );
      vSet = Math.min(vSet, terminalRequired);
      if (endDist < 0.05) vSet = 0;
    }
    const fwdErr = vSet - state.v;

    const toLookaheadX = lookaheadPt.x - state.x;
    const toLookaheadY = lookaheadPt.y - state.y;
    const lookaheadDist = Math.max(0.1, Math.hypot(toLookaheadX, toLookaheadY));
    const alpha = wrapAngle(Math.atan2(toLookaheadY, toLookaheadX) - state.yaw);
    const curvature = (2 * Math.sin(alpha)) / lookaheadDist;
    const yawErr = alpha;

    if (nearGoal) {
      // Drain integrators near the target to reduce controller hunting.
      state.pid.fwdI *= 0.9;
      state.pid.yawI *= 0.9;
    }

    state.pid.fwdI = clamp(state.pid.fwdI + fwdErr * state.dt, -1.2, 1.2);
    state.pid.yawI = clamp(state.pid.yawI + yawErr * state.dt, -2, 2);

    const fwdD = (fwdErr - state.pid.prevFwdE) / state.dt;
    const yawD = (yawErr - state.pid.prevYawE) / state.dt;
    state.pid.prevFwdE = fwdErr;
    state.pid.prevYawE = yawErr;

    const pidFwd = params.kp * fwdErr + params.ki * state.pid.fwdI + params.kd * fwdD;
    const pidYaw = params.kpyaw * yawErr + params.kiyaw * state.pid.yawI + params.kdyaw * yawD;

    const omegaSet = vSet * curvature + pidYaw;
    const baseCmd = clamp(vSet + pidFwd, -params.vmax, params.vmax);
    const turnCmd = clamp((omegaSet * WHEEL_BASE_M) / 2, -params.vmax * 0.9, params.vmax * 0.9);
    state.leftMotor = clamp(baseCmd - turnCmd, -params.vmax, params.vmax);
    state.rightMotor = clamp(baseCmd + turnCmd, -params.vmax, params.vmax);

    const vCmd = (state.leftMotor + state.rightMotor) * 0.5;
    const omegaCmd = (state.rightMotor - state.leftMotor) / WHEEL_BASE_M;

    state.v += (vCmd - state.v) * VEL_SMOOTHING * state.dt;
    state.omega += (omegaCmd - state.omega) * OMEGA_SMOOTHING * state.dt;

    state.yaw = wrapAngle(state.yaw + state.omega * state.dt);
    state.x += state.v * Math.cos(state.yaw) * state.dt;
    state.y += state.v * Math.sin(state.yaw) * state.dt;
    state.t += state.dt;

    if (
      state.path.length === 0 ||
      Math.hypot(state.x - state.path[state.path.length - 1].x, state.y - state.path[state.path.length - 1].y) > 0.02
    ) {
      state.path.push({ x: state.x, y: state.y });
    }

    const doneByDistance =
      state.t >= params.targetTime &&
      endDist < 0.06 &&
      Math.abs(state.v) < 0.08 &&
      Math.abs(state.omega) < 0.35;
    const timeout = state.t >= params.targetTime + 5;

    if (doneByDistance || timeout) {
      state.running = false;
      state.leftMotor = 0;
      state.rightMotor = 0;
      state.score = computeScore(state, params);
      hooks.renderScoreCard(state.score);
      hooks.logLine(
        `Run complete: x=${fmt(state.x, 3)}m y=${fmt(state.y, 3)}m yaw=${fmt((state.yaw * 180) / Math.PI, 2)}° t=${fmt(state.t, 2)}s`
      );
    }

    hooks.updateTelemetry(state, fwdErr, yawErr);
    return;
  }

  hooks.updateTelemetry(state, 0, -state.yaw);
}
