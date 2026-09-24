export default class WindSystem {
  constructor() {
    this.wind = 8; // Default initial wind
    this.windMultiplier = 15; // Translates wind units to horizontal acceleration (px/s^2)
  }

  randomize() {
    // Pick wind between -20 and 20 (excluding -2 to 2 for more noticeable effect)
    let newWind = 0;
    while (Math.abs(newWind) < 3) {
      newWind = Phaser.Math.Between(-20, 20);
    }
    this.wind = newWind;
    return this.wind;
  }

  getWind() {
    return this.wind;
  }

  getAcceleration() {
    return this.wind * this.windMultiplier;
  }
}
