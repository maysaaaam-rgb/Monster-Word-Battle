import Phaser from 'phaser';
import Monster from '../entities/Monster.js';
import Projectile from '../entities/Projectile.js';
import AimSystem from '../systems/AimSystem.js';
import WindSystem from '../systems/WindSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import RewardSystem from '../systems/RewardSystem.js';
import HUD from '../ui/HUD.js';
import Controls from '../ui/Controls.js';
import QuestionModal from '../ui/QuestionModal.js';
import { questions } from '../data/questions.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    console.log("GAME SCENE CREATED: Initializing Premium 2D Cartoon Action-Adventure");

    const width = 1280;
    const height = 720;
    this.groundY = 540;
    this.questionIndex = 0;

    // 1. Core Systems
    this.audioSystem = new AudioSystem();
    this.windSystem = new WindSystem();
    this.rewardSystem = new RewardSystem();
    this.aimSystem = new AimSystem(this, this.windSystem);

    this.input.once('pointerdown', () => {
      this.audioSystem.init();
    });

    // 2. Rich Multi-Layer Parallax Environment
    this.createLivingEnvironment(width, height);

    // 3. Characters on Stone Cliff Platforms
    this.createCharacters();

    // 4. Setup Aim System Launch Point & monster sync
    const launchPt = this.playerMonster.getLaunchPoint();
    this.aimSystem.setLaunchPoint(launchPt.x, launchPt.y);

    // 5. HUD & Controls
    this.hud = new HUD(this, this.audioSystem, () => {
      this.restartBattle();
    });
    this.hud.updateWind(this.windSystem.getWind());

    this.controls = new Controls(this, this.aimSystem.angle, this.aimSystem.power, this.audioSystem, {
      onAngleChange: (angle) => {
        this.aimSystem.setAngle(angle);
        this.playerMonster.setAimAngle(angle);
      },
      onPowerChange: (power) => {
        this.aimSystem.setPower(power);
      },
      onAction: (actionType) => {
        this.executeAction(actionType);
      }
    });

    // 6. In-Game Educational Challenge Event
    this.questionModal = new QuestionModal(
      this,
      this.audioSystem,
      this.rewardSystem,
      (reward) => {
        this.onRewardGranted(reward);
      },
      (reward) => {
        this.unlockAttack(reward);
      }
    );

    this.activeProjectile = null;
    this.isGameOver = false;

    // Start Player 1 Turn
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    if (this.isGameOver) return;

    this.controls.setEnabled(false);
    this.aimSystem.hide();
    this.playerMonster.setHeldItem(null);

    // Select next question
    const q = questions[this.questionIndex % questions.length];
    this.questionIndex++;

    this.time.delayedCall(450, () => {
      this.questionModal.showQuestion(q);
    });
  }

  onRewardGranted(reward) {
    const rewardType = reward ? reward.type : 'fireball';
    this.controls.setAction(rewardType);
    if (rewardType !== 'heal') {
      this.playerMonster.setHeldItem(rewardType);
      this.playerMonster.setAimAngle(this.aimSystem.angle);
    }
  }

  unlockAttack(reward) {
    const rewardType = reward ? reward.type : 'fireball';
    this.controls.setEnabled(true);

    if (rewardType === 'heal') {
      this.aimSystem.hide();
      this.playerMonster.setHeldItem(null);
    } else {
      this.aimSystem.show();
      this.playerMonster.setHeldItem(rewardType);
      this.playerMonster.setAimAngle(this.aimSystem.angle);
    }
  }

  executeAction(actionType) {
    if (this.activeProjectile || this.isGameOver) return;

    if (actionType === 'heal') {
      // Heal Action: Restore HP on Player 1
      this.controls.setEnabled(false);
      this.audioSystem.playHeal();
      this.playerMonster.heal(30);
      this.hud.updateP1Health(this.playerMonster.hp);

      // Finish turn and pass to opponent
      this.time.delayedCall(1200, () => {
        this.rewardSystem.consumeReward();
        this.onTurnFinished();
      });
    } else {
      // Throw Action (Rock or Fireball)
      this.executeThrow(actionType);
    }
  }

  executeThrow(weaponType = 'fireball') {
    this.controls.setEnabled(false);
    this.aimSystem.hide();

    // 1. Play Monster Throw Squash & Stretch Animation
    this.playerMonster.playThrowAnimation(() => {
      // 2. Play Throw Sound
      if (weaponType === 'fireball') {
        this.audioSystem.playFireballThrow();
      } else {
        this.audioSystem.playThrow();
      }

      // 3. Launch Projectile
      const launchPt = this.playerMonster.getLaunchPoint();
      const { vx, vy } = this.aimSystem.getVelocity();
      const gravity = this.aimSystem.gravity;
      const windAcc = this.windSystem.getAcceleration();

      this.activeProjectile = new Projectile(
        this,
        launchPt.x,
        launchPt.y,
        vx,
        vy,
        gravity,
        windAcc,
        this.opponentMonster,
        this.groundY,
        this.audioSystem,
        weaponType,
        (hitMonster, hx, hy, damage) => {
          this.onProjectileFinished(hitMonster, hx, hy, damage);
        }
      );
    });
  }

  onProjectileFinished(hitMonster, hx, hy, damage) {
    this.activeProjectile = null;

    if (hitMonster) {
      this.opponentMonster.takeDamage(damage);
      this.hud.updateP2Health(this.opponentMonster.hp);
    }

    if (this.opponentMonster.hp <= 0) {
      this.isGameOver = true;
      this.time.delayedCall(700, () => {
        this.hud.showVictory('PLAYER 1');
      });
      return;
    }

    this.rewardSystem.consumeReward();
    this.onTurnFinished();
  }

  onTurnFinished() {
    this.time.delayedCall(800, () => {
      this.opponentMonster.playThinkingAnimation();

      this.time.delayedCall(1600, () => {
        if (this.isGameOver) return;

        this.windSystem.randomize();
        this.hud.updateWind(this.windSystem.getWind());
        this.startPlayerTurn();
      });
    });
  }

  // ==========================================
  // MULTI-LAYER PARALLAX ADVENTURE ENVIRONMENT
  // ==========================================
  createLivingEnvironment(width, height) {
    // Layer 0: Sky with Warm Sun
    const sky = this.add.image(width / 2, height / 2, 'bg_sky').setDepth(0);

    // Layer 1: Distant Mountains
    const mountains = this.add.image(width / 2, 380, 'bg_mountains').setDepth(1);

    // Layer 2: Rolling Village Hills & Windmill
    const hills = this.add.image(width / 2, 450, 'bg_hills_village').setDepth(2);

    // Drifting Fluffy Clouds
    this.clouds = [];
    const cloudConfigs = [
      { x: 180, y: 90, scale: 1.1, speed: 12 },
      { x: 620, y: 70, scale: 0.85, speed: 9 },
      { x: 1040, y: 110, scale: 1.25, speed: 14 }
    ];
    cloudConfigs.forEach(c => {
      const cloudGfx = this.add.graphics().setDepth(2);
      cloudGfx.fillStyle(0xffffff, 0.88);
      cloudGfx.fillCircle(0, 0, 30 * c.scale);
      cloudGfx.fillCircle(-25 * c.scale, 6 * c.scale, 22 * c.scale);
      cloudGfx.fillCircle(25 * c.scale, 6 * c.scale, 22 * c.scale);
      cloudGfx.fillRoundedRect(-50 * c.scale, 4 * c.scale, 100 * c.scale, 24 * c.scale, 10 * c.scale);
      cloudGfx.x = c.x;
      cloudGfx.y = c.y;
      cloudGfx.speed = c.speed;
      this.clouds.push(cloudGfx);
    });

    // Layer 3: Center River Canyon & Water
    const riverBed = this.add.graphics().setDepth(3);
    riverBed.fillStyle(0x0c2461, 1);
    riverBed.fillRect(0, 530, width, height - 530);

    this.riverWater = this.add.image(width / 2, 630, 'river_water').setDepth(3);

    // Dynamic wave ripples on water surface
    this.waveRipples = this.add.graphics().setDepth(3);

    // Layer 4: Stepping Stones, Wooden Crates & Suspension Bridge in Center
    // Center Stepping Rocks
    const rockPositions = [
      { x: 380, y: 565, r: 24 },
      { x: 440, y: 575, r: 18 },
      { x: 860, y: 570, r: 22 },
      { x: 910, y: 580, r: 16 }
    ];
    const rockGfx = this.add.graphics().setDepth(4);
    rockPositions.forEach(r => {
      rockGfx.fillStyle(0x718093, 1);
      rockGfx.lineStyle(2, 0x2f3640, 1);
      rockGfx.fillCircle(r.x, r.y, r.r);
      rockGfx.strokeCircle(r.x, r.y, r.r);
      rockGfx.fillStyle(0xa4b0be, 1);
      rockGfx.fillCircle(r.x - r.r * 0.3, r.y - r.r * 0.3, r.r * 0.4);
    });

    // Stacked Wooden Crates
    const crate1 = this.add.image(490, 520, 'wooden_crate').setDepth(4).setScale(0.85);
    const crate2 = this.add.image(770, 520, 'wooden_crate').setDepth(4).setScale(0.85);
    const crate3 = this.add.image(725, 480, 'wooden_crate').setDepth(4).setScale(0.65);

    // Spectator Kitten sitting on the crate in midground!
    this.observerCat = this.add.image(725, 442, 'observer_cat').setDepth(5).setScale(0.75);
    // Subtle idle tail flick & breath
    this.tweens.add({
      targets: this.observerCat,
      y: 440,
      scaleY: 0.77,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Suspension Wooden Rope Bridge spanning the canyon
    const bridge = this.add.image(630, 532, 'rope_bridge').setDepth(4).setScale(0.95);

    // Layer 5: Left & Right Stone Cliff Platforms
    const cliffL = this.add.image(170, 620, 'cliff_left').setDepth(5);
    const cliffR = this.add.image(1110, 620, 'cliff_right').setDepth(5);

    // Layer 6: Lush Foreground Foliage for Depth of Field
    this.forePlants = this.add.image(width / 2, 700, 'foreground_plants').setDepth(19);

    // Floating Ambient Pollen/Sparkles
    this.createAmbientSparkles(width, height);
  }

  createAmbientSparkles(width, height) {
    this.sparkles = [];
    for (let i = 0; i < 16; i++) {
      const sp = this.add.graphics().setDepth(17);
      sp.fillStyle(0xfffa65, 0.7);
      sp.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      sp.x = Phaser.Math.Between(40, width - 40);
      sp.y = Phaser.Math.Between(150, 650);
      sp.baseY = sp.y;
      sp.speedX = Phaser.Math.FloatBetween(8, 22);
      sp.driftSpeed = Phaser.Math.FloatBetween(1.2, 2.5);
      this.sparkles.push(sp);
    }
  }

  createCharacters() {
    // Left Monster (Player 1 / Blue Monster) positioned on left cliff
    this.playerMonster = new Monster(this, 170, 520, 'player');
    this.playerMonster.setDepth(6);

    // Right Monster (Player 2 / Red Monster) positioned on right cliff
    this.opponentMonster = new Monster(this, 1110, 520, 'opponent');
    this.opponentMonster.setDepth(6);
  }

  restartBattle() {
    this.isGameOver = false;
    this.questionIndex = 0;
    this.questionModal.close();
    this.playerMonster.reset();
    this.opponentMonster.reset();
    this.hud.reset();
    this.windSystem.randomize();
    this.hud.updateWind(this.windSystem.getWind());
    this.startPlayerTurn();
  }

  update(time, delta) {
    // 1. Update Projectile physics if flying
    if (this.activeProjectile) {
      this.activeProjectile.update(delta);
    }

    // 2. Animate Water Waves & Shimmer
    this.waterTimer = (this.waterTimer || 0) + delta;
    if (this.waterTimer > 50) {
      this.waterTimer = 0;
      this.waterOffset = ((this.waterOffset || 0) + 1.6) % 120;

      this.waveRipples.clear();
      this.waveRipples.lineStyle(2, 0xffffff, 0.55);
      for (let x = -60; x < 1340; x += 110) {
        const wx = x + (this.waterOffset % 110);
        this.waveRipples.beginPath();
        this.waveRipples.arc(wx, 550, 26, Math.PI * 0.15, Math.PI * 0.85, false);
        this.waveRipples.strokePath();
      }
    }

    // 3. Drifting Clouds
    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.x += (cloud.speed * delta) / 1000;
        if (cloud.x > 1400) {
          cloud.x = -150;
        }
      });
    }

    // 4. Ambient Sparkles Drift
    if (this.sparkles) {
      const dt = delta / 1000;
      this.sparkles.forEach(sp => {
        sp.x += sp.speedX * dt;
        sp.y = sp.baseY + Math.sin(time * 0.002 * sp.driftSpeed) * 14;
        if (sp.x > 1300) {
          sp.x = -20;
          sp.baseY = Phaser.Math.Between(150, 650);
        }
      });
    }

    // 5. Gentle Wind Swaying on Foreground Plants
    if (this.forePlants) {
      this.forePlants.x = 640 + Math.sin(time * 0.0018) * 4;
    }
  }
}
