export function createInitialState() {
  return {
    running: false,
    t: 0,
    dt: 1 / 60,
    x: 0,
    y: 0,
    yaw: 0,
    v: 0,
    omega: 0,
    leftMotor: 0,
    rightMotor: 0,
    guide: null,
    pid: {
      fwdI: 0,
      yawI: 0,
      prevFwdE: 0,
      prevYawE: 0,
    },
    path: [],
    score: null,
    timing: null,
  };
}

export function resetRun(state) {
  state.running = false;
  state.t = 0;
  state.x = 0;
  state.y = 0;
  state.yaw = 0;
  state.v = 0;
  state.omega = 0;
  state.leftMotor = 0;
  state.rightMotor = 0;
  state.guide = null;
  state.pid.fwdI = 0;
  state.pid.yawI = 0;
  state.pid.prevFwdE = 0;
  state.pid.prevYawE = 0;
  state.path = [{ x: 0, y: 0 }];
  state.score = null;
  state.timing = null;
}
