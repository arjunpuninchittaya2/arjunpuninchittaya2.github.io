import {
  DISTANCE_POINTS_PER_CM,
  CAN_BONUS_REFERENCE_CM,
  CAN_BONUS_SCALE,
} from "./constants.js";

export function computeScore(state, params) {
  const finalDistanceError = Math.hypot(params.targetDistance - state.x, state.y);
  const vehicleDistanceCm = finalDistanceError * 100;
  const finalYawErrorDeg = Math.abs((state.yaw * 180) / Math.PI);
  const timeError = Math.abs(state.t - params.targetTime);

  const distanceScore = DISTANCE_POINTS_PER_CM * vehicleDistanceCm;
  const timeScore = timeError;
  const canBonus = Math.min(0, CAN_BONUS_SCALE * (CAN_BONUS_REFERENCE_CM - params.insideCanDistance));
  const penalties = (params.competitionViolation ? 150 : 0) + (params.constructionViolation ? 300 : 0);
  const base = 100;
  const run = base + distanceScore + timeScore + canBonus + penalties;

  return {
    base,
    vehicleDistanceCm,
    finalYawErrorDeg,
    distanceScore,
    timeScore,
    canBonus,
    penalties,
    run,
  };
}
