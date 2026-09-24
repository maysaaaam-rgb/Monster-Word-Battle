/**
 * Unified Physics Engine Configuration
 * 
 * Used identically by:
 * - AimSystem (dotted trajectory preview)
 * - Projectile (flight simulation and collision)
 * - Enemy AI (ballistic trajectory solver)
 */
export const PHYSICS = {
  gravity: 480, // px/s^2 (clean, predictable cartoon artillery gravity)
  speedMultiplier: 10.0, // speed = power * speedMultiplier (power 20..100 -> speed 200..1000)
  windScale: 12.0, // windAcc = wind * windScale
  groundY: 580, // Elevation of canyon floor/water
  playerHitbox: {
    offsetX: 0,
    offsetY: -75,
    radius: 70
  },
  obstacle: {
    xMin: 570,
    xMax: 710,
    yMin: 490
  }
};

/**
 * Closed-form analytical kinematics formula
 * Evaluates projectile position at flight time t (seconds)
 */
export function calculateKinematics(x0, y0, vx, vy, windAcc, gravity, t) {
  return {
    x: x0 + vx * t + 0.5 * windAcc * t * t,
    y: y0 + vy * t + 0.5 * gravity * t * t,
    vxAtT: vx + windAcc * t,
    vyAtT: vy + gravity * t
  };
}
