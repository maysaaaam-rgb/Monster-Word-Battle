import Phaser from 'phaser';
import { PHYSICS, calculateKinematics } from './PhysicsConfig.js';

export default class AimSystem {
  constructor(scene, windSystem) {
    this.scene = scene;
    this.windSystem = windSystem;
    this.angle = 45; // Degrees from horizontal (pointing right)
    this.power = 65; // Range: 20 - 100
    this.gravity = PHYSICS.gravity;
    this.speedMultiplier = PHYSICS.speedMultiplier;

    this.trajectoryGraphics = scene.add.graphics().setDepth(15);
    this.arrowGraphics = scene.add.graphics().setDepth(16);
    this.launchPoint = { x: 240, y: 400 };
  }

  setLaunchPoint(x, y) {
    this.launchPoint.x = x;
    this.launchPoint.y = y;
    this.drawAimGuide();
  }

  setAngle(deg) {
    this.angle = Phaser.Math.Clamp(deg, 10, 85);
    this.drawAimGuide();
  }

  setPower(pow) {
    this.power = Phaser.Math.Clamp(pow, 20, 100);
    this.drawAimGuide();
  }

  getVelocity() {
    const rad = Phaser.Math.DegToRad(this.angle);
    const speed = this.power * this.speedMultiplier;
    return {
      vx: speed * Math.cos(rad),
      vy: -speed * Math.sin(rad)
    };
  }

  drawAimGuide() {
    this.trajectoryGraphics.clear();
    this.arrowGraphics.clear();

    const { x, y } = this.launchPoint;
    const { vx, vy } = this.getVelocity();
    const windAcc = this.windSystem.getAcceleration();
    const g = this.gravity;

    // 1. Visible Launch Point Reticle
    this.arrowGraphics.fillStyle(0xf1c40f, 0.4);
    this.arrowGraphics.fillCircle(x, y, 12);
    this.arrowGraphics.lineStyle(2, 0xffffff, 0.9);
    this.arrowGraphics.strokeCircle(x, y, 12);
    this.arrowGraphics.fillStyle(0xffffff, 1);
    this.arrowGraphics.fillCircle(x, y, 4);

    // 2. Aim Arrow
    const rad = Phaser.Math.DegToRad(this.angle);
    const arrowLen = 50 + (this.power / 100) * 45;
    const endX = x + Math.cos(rad) * arrowLen;
    const endY = y - Math.sin(rad) * arrowLen;

    this.arrowGraphics.lineStyle(6, 0xffffff, 0.95);
    this.arrowGraphics.lineBetween(x, y, endX, endY);
    this.arrowGraphics.lineStyle(3, 0xf39c12, 1);
    this.arrowGraphics.lineBetween(x, y, endX, endY);

    // Arrowhead
    const headLen = 14;
    const headAngle = Math.PI / 6;
    const dir = -rad;
    const p1X = endX - headLen * Math.cos(dir - headAngle);
    const p1Y = endY + headLen * Math.sin(dir - headAngle);
    const p2X = endX - headLen * Math.cos(dir + headAngle);
    const p2Y = endY + headLen * Math.sin(dir + headAngle);

    this.arrowGraphics.fillStyle(0xf39c12, 1);
    this.arrowGraphics.fillTriangle(endX, endY, p1X, p1Y, p2X, p2Y);
    this.arrowGraphics.lineStyle(2, 0xffffff, 1);
    this.arrowGraphics.strokeTriangle(endX, endY, p1X, p1Y, p2X, p2Y);

    // 3. Exact Kinematic Dotted Trajectory Arc
    const totalPoints = 35;
    const dt = 0.05; // 50ms time step

    for (let i = 1; i <= totalPoints; i++) {
      const t = i * dt;
      const { x: px, y: py } = calculateKinematics(x, y, vx, vy, windAcc, g, t);

      // Stop trajectory if below ground or out of horizontal bounds
      if (py > PHYSICS.groundY || px > 1240 || px < 40) break;

      const alpha = 1 - (i / totalPoints) * 0.6;
      const radius = Math.max(2.5, 5.5 - i * 0.08);

      // Glow dot
      this.trajectoryGraphics.fillStyle(0xffffff, alpha * 0.8);
      this.trajectoryGraphics.fillCircle(px, py, radius + 1.5);

      // Blue dot
      this.trajectoryGraphics.fillStyle(0x38bdf8, alpha);
      this.trajectoryGraphics.fillCircle(px, py, radius);
    }
  }

  show() {
    this.trajectoryGraphics.setVisible(true);
    this.arrowGraphics.setVisible(true);
    this.drawAimGuide();
  }

  hide() {
    this.trajectoryGraphics.setVisible(false);
    this.arrowGraphics.setVisible(false);
  }
}
