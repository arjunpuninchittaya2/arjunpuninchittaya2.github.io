import { E, sliders, logLine, readParams, refreshSliderLabels, updatePathInfo, updateTelemetry, renderScoreCard, setInitialScoreCard } from "./dom.js";
import { createInitialState, resetRun } from "./state.js";
import { createRenderer } from "./renderer.js";
import { stepSimulation } from "./simulation.js";

const state = createInitialState();
const canvas = E("field");
const drawField = createRenderer(canvas, state);

function step() {
  const params = readParams();

  stepSimulation(state, params, {
    updatePathInfo,
    updateTelemetry,
    renderScoreCard,
    logLine,
  });

  drawField(params);
  requestAnimationFrame(step);
}

sliders.forEach((id) => E(id).addEventListener("input", refreshSliderLabels));
E("runBtn").addEventListener("click", () => {
  resetRun(state);
  state.running = true;
  logLine("Pure pursuit run started on fixed can path using T265 x/y/yaw and 2026 EV-C style scoring.");
});

resetRun(state);
refreshSliderLabels();
setInitialScoreCard();
logLine("Configure pure pursuit and PID gains, then press Run Simulation.");
step();
