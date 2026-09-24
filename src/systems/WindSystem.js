import Phaser from 'phaser';
import { PHYSICS } from './PhysicsConfig.js';

export default class WindSystem {
  constructor() {
    this.wind = 0; // Starts at 0 for initial predictability
    this.windScale = PHYSICS.windScale;
  }

  randomize() {
    // Wind between -10 and 10 (excluding 0)
    let newWind = 0;
    while (newWind === 0) {
      newWind = Phaser.Math.Between(-8, 8);
    }
    this.wind = newWind;
    return this.wind;
  }

  setWind(val) {
    this.wind = val;
  }

  getWind() {
    return this.wind;
  }

  getAcceleration() {
    return this.wind * this.windScale;
  }
}
