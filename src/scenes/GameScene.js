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
    console.log("GAME SCENE CREATED: Initializing Bright 2D Cartoon Action-Adventure Arena");

    const width = 1280;
    const height = 720;
    this.groundY = 580;
    this.questionIndex = 0;
    this.isPlayerTurn = true;
    this.isGameOver = false;
    this.activeProjectile = null;

    // 1. Core Systems
    this.audioSystem = new AudioSystem();
    this.windSystem = new WindSystem();
    this.rewardSystem = new RewardSystem();
    this.aimSystem = new AimSystem(this, this.windSystem);

    this.input.once('pointerdown', () => {
      this.audioSystem.init();
    });

    // 2. Rich Bright Parallax Environment & Multi-Elevation Arena
    this.createLivingEnvironment(width, height);

    // 3. Mascots on Stone Cliff Platforms
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
      onActionChange: (actionType) => {
        if (actionType === 'heal' || actionType === 'shield') {
          this.aimSystem.hide();
          this.playerMonster.setHeldItem(null);
        } else {
          this.aimSystem.show();
          this.playerMonster.setHeldItem(actionType);
          this.playerMonster.setAimAngle(this.aimSystem.angle);
        }
      },
      onAction: (actionType) => {
        this.executeAction(actionType);
      }
    });

    // 6. Turn Announcement Banner Ribbon
    this.createTurnBanner();

    // 7. In-Game Educational Challenge Event
    this.questionModal = new QuestionModal(
      this,
      this.audioSystem,
      this.rewardSystem,
      (reward) => {
        this.onRewardGranted(reward);
      },
      (reward) => {
        this.unlockTurnAction(reward);
      }
    );

    // Start First Player Turn
    this.time.delayedCall(400, () => {
      this.startPlayerTurn();
    });
  }

  createTurnBanner() {
    this.turnBannerContainer = this.add.container(640, 95).setDepth(45).setVisible(false);

    this.turnBannerBg = this.add.image(0, 0, 'turn_banner').setOrigin(0.5, 0.5);
    this.turnBannerContainer.add(this.turnBannerBg);

    this.turnBannerText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#78350f',
      strokeThickness: 5,
      shadow: { blur: 6, color: '#000000', fill: true }
    }).setOrigin(0.5);
    this.turnBannerContainer.add(this.turnBannerText);
  }

  showTurnBanner(text, onComplete) {
    this.turnBannerText.setText(text);
    this.turnBannerContainer.setVisible(true);
    this.turnBannerContainer.setScale(0.3);
    this.turnBannerContainer.setAlpha(0);
    this.turnBannerContainer.y = 95;

    this.tweens.add({
      targets: this.turnBannerContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: this.turnBannerContainer,
            y: 45,
            alpha: 0,
            duration: 250,
            ease: 'Quad.easeIn',
            onComplete: () => {
              this.turnBannerContainer.setVisible(false);
              if (onComplete) onComplete();
            }
          });
        });
      }
    });
  }

  startPlayerTurn() {
    if (this.isGameOver) return;
    this.isPlayerTurn = true;

    this.controls.setEnabled(false);
    this.aimSystem.hide();
    this.playerMonster.setHeldItem(null);

    this.showTurnBanner('⚡ YOUR TURN', () => {
      // Present Educational Preposition / Direction Challenge
      const q = questions[this.questionIndex % questions.length];
      this.questionIndex++;
      this.questionModal.showQuestion(q);
    });
  }

  onRewardGranted(reward) {
    const rewardType = reward ? reward.type : 'fireball';
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction(rewardType);

    if (rewardType !== 'heal' && rewardType !== 'shield') {
      this.playerMonster.setHeldItem(rewardType);
      this.playerMonster.setAimAngle(this.aimSystem.angle);
    }
  }

  unlockTurnAction(reward) {
    const rewardType = reward ? reward.type : 'fireball';
    this.controls.setEnabled(true);
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);

    if (rewardType === 'heal' || rewardType === 'shield') {
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

    if (actionType === 'shield') {
      // Deploy Protective Energy Shield
      this.controls.setEnabled(false);
      this.aimSystem.hide();
      this.playerMonster.activateShield();
      this.rewardSystem.consumeReward();
      this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
      this.controls.setAction('rock');

      this.time.delayedCall(1100, () => {
        this.startEnemyTurn();
      });
    } else if (actionType === 'heal') {
      // Heal Action: Restore HP on Player 1
      this.controls.setEnabled(false);
      this.aimSystem.hide();
      this.audioSystem.playHeal();
      this.playerMonster.heal(30);
      this.hud.updateP1Health(this.playerMonster.hp);
      this.rewardSystem.consumeReward();
      this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
      this.controls.setAction('rock');

      this.time.delayedCall(1100, () => {
        this.startEnemyTurn();
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
        (hitMonster, hx, hy, damage, isShieldBlocked) => {
          this.onProjectileFinished(hitMonster, hx, hy, damage, isShieldBlocked);
        },
        { xMin: 560, xMax: 720, yMin: 450 } // Center rock obstacle bounds
      );
    });
  }

  onProjectileFinished(hitMonster, hx, hy, damage, isShieldBlocked) {
    this.activeProjectile = null;
    this.resetCamera();

    if (hitMonster && !isShieldBlocked) {
      this.opponentMonster.takeDamage(damage);
      this.hud.updateP2Health(this.opponentMonster.hp);
    }

    if (this.opponentMonster.hp <= 0) {
      this.isGameOver = true;
      this.time.delayedCall(600, () => {
        this.hud.showVictory('PLAYER 1');
      });
      return;
    }

    this.rewardSystem.consumeReward();
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction('rock');

    this.time.delayedCall(600, () => {
      this.startEnemyTurn();
    });
  }

  // ==========================================
  // ENEMY AI TURN SYSTEM
  // ==========================================
  startEnemyTurn() {
    if (this.isGameOver) return;
    this.isPlayerTurn = false;
    this.controls.setEnabled(false);
    this.aimSystem.hide();

    this.showTurnBanner('👾 ENEMY TURN', () => {
      this.executeEnemyAction();
    });
  }

  executeEnemyAction() {
    if (this.isGameOver) return;

    // Opponent monster plays thinking/anticipation
    this.opponentMonster.playThinkingAnimation();

    this.time.delayedCall(900, () => {
      if (this.isGameOver) return;

      // Opponent winds up throw
      this.opponentMonster.playThrowAnimation(() => {
        this.audioSystem.playThrow();

        const launchPt = this.opponentMonster.getLaunchPoint();
        const gravity = this.aimSystem.gravity;
        const windAcc = this.windSystem.getAcceleration();

        // Calculate ballistic arc towards Player 1 at (180, 490)
        // Distance dx approx -920.
        // Wind compensation
        const targetX = 180;
        const targetY = 490;
        const dx = targetX - launchPt.x; // approx -920
        const dy = targetY - launchPt.y;

        // Angle 56 degrees upwards to left
        const angleRad = Phaser.Math.DegToRad(124); // Facing left-upwards
        // Base launch speed approx 585 with slight variance
        const variance = Phaser.Math.Between(-25, 25);
        const speed = 585 + variance - (windAcc * 0.4);

        const vx = Math.cos(angleRad) * speed;
        const vy = -Math.sin(angleRad) * speed;

        this.activeProjectile = new Projectile(
          this,
          launchPt.x,
          launchPt.y,
          vx,
          vy,
          gravity,
          windAcc,
          this.playerMonster,
          this.groundY,
          this.audioSystem,
          'rock',
          (hitMonster, hx, hy, damage, isShieldBlocked) => {
            this.onEnemyProjectileFinished(hitMonster, hx, hy, damage, isShieldBlocked);
          },
          { xMin: 560, xMax: 720, yMin: 450 }
        );
      });
    });
  }

  onEnemyProjectileFinished(hitMonster, hx, hy, damage, isShieldBlocked) {
    this.activeProjectile = null;
    this.resetCamera();

    if (hitMonster && !isShieldBlocked) {
      this.playerMonster.takeDamage(damage);
      this.hud.updateP1Health(this.playerMonster.hp);
    }

    if (this.playerMonster.hp <= 0) {
      this.isGameOver = true;
      this.time.delayedCall(600, () => {
        this.hud.showVictory('RED MONSTER');
      });
      return;
    }

    // Turn complete, randomize wind and hand back to Player 1
    this.time.delayedCall(800, () => {
      if (this.isGameOver) return;
      this.windSystem.randomize();
      this.hud.updateWind(this.windSystem.getWind());
      this.startPlayerTurn();
    });
  }

  resetCamera() {
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: 0,
      duration: 350,
      ease: 'Quad.easeOut'
    });
  }

  // ==========================================
  // MULTI-LAYER PARALLAX BRIGHT ADVENTURE ENVIRONMENT
  // ==========================================
  createLivingEnvironment(width, height) {
    // Layer 0: Radiant Daytime Cerulean Sky with Sun Rays
    this.sky = this.add.image(width / 2, height / 2, 'bg_sky_bright').setDepth(0);

    // Layer 1: Vibrant Mountains with Turquoise & Snow Accents
    this.mountains = this.add.image(width / 2, 380, 'bg_mountains_bright').setDepth(1);

    // Layer 2: Lush Apple-Green Rolling Village Hills & Windmill
    this.hills = this.add.image(width / 2, 440, 'bg_hills_bright').setDepth(2);

    // Drifting Fluffy Clouds
    this.clouds = [];
    const cloudConfigs = [
      { x: 180, y: 80, scale: 1.1, speed: 10 },
      { x: 620, y: 65, scale: 0.85, speed: 8 },
      { x: 1040, y: 95, scale: 1.25, speed: 12 }
    ];
    cloudConfigs.forEach(c => {
      const cloudGfx = this.add.graphics().setDepth(2);
      cloudGfx.fillStyle(0xffffff, 0.9);
      cloudGfx.fillCircle(0, 0, 30 * c.scale);
      cloudGfx.fillCircle(-25 * c.scale, 6 * c.scale, 22 * c.scale);
      cloudGfx.fillCircle(25 * c.scale, 6 * c.scale, 22 * c.scale);
      cloudGfx.fillRoundedRect(-50 * c.scale, 4 * c.scale, 100 * c.scale, 24 * c.scale, 10 * c.scale);
      cloudGfx.x = c.x;
      cloudGfx.y = c.y;
      cloudGfx.speed = c.speed;
      this.clouds.push(cloudGfx);
    });

    // Soaring Bird in Sky
    this.bird = this.add.image(200, 140, 'bird').setDepth(3).setScale(0.9);
    this.tweens.add({
      targets: this.bird,
      x: 1350,
      y: 110,
      duration: 18000,
      repeat: -1,
      onRepeat: () => {
        this.bird.x = -60;
        this.bird.y = Phaser.Math.Between(100, 180);
      }
    });

    // Layer 3: Center River Canyon & Sparkling Water
    const riverBed = this.add.graphics().setDepth(3);
    riverBed.fillStyle(0x0284c7, 1);
    riverBed.fillRect(0, 560, width, height - 560);

    this.riverWater = this.add.image(width / 2, 650, 'river_water').setDepth(3);

    // Dynamic wave ripples on water surface
    this.waveRipples = this.add.graphics().setDepth(3);

    // Layer 4: Central Tactical Obstacle (Stepping Rock & Wooden Crate Outcrop)
    this.centerRock = this.add.image(640, 520, 'terrain_center_rock').setDepth(4).setScale(1.1);

    // Stacked Wooden Crates around the rock
    const crate1 = this.add.image(490, 545, 'wooden_crate').setDepth(4).setScale(0.75);
    const crate2 = this.add.image(790, 545, 'wooden_crate').setDepth(4).setScale(0.75);

    // Suspension Wooden Rope Bridge spanning above the riverbed
    const bridge = this.add.image(640, 545, 'rope_bridge').setDepth(4).setScale(1.05);

    // Spectator Kitten sitting on the crate in midground!
    this.observerCat = this.add.image(725, 455, 'observer_cat').setDepth(5).setScale(0.75);
    this.tweens.add({
      targets: this.observerCat,
      y: 452,
      scaleY: 0.77,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Layer 5: Left & Right Elevated Stone Cliff Platforms
    const cliffL = this.add.image(180, 600, 'cliff_left').setDepth(5);
    const cliffR = this.add.image(1100, 600, 'cliff_right').setDepth(5);

    // Fluttering Butterflies near cliffs
    this.createButterflies();

    // Layer 6: Lush Foreground Foliage for Depth of Field
    this.forePlants = this.add.image(width / 2, 705, 'foreground_plants').setDepth(19);

    // Floating Ambient Pollen/Sparkles
    this.createAmbientSparkles(width, height);
  }

  createButterflies() {
    this.butterflies = [];
    const positions = [
      { x: 330, y: 500, dur: 3200 },
      { x: 960, y: 510, dur: 3800 }
    ];

    positions.forEach(pos => {
      const b = this.add.image(pos.x, pos.y, 'butterfly').setDepth(6).setScale(0.85);

      // Flapping wings tween
      this.tweens.add({
        targets: b,
        scaleX: 0.45,
        duration: 180,
        yoyo: true,
        repeat: -1,
        ease: 'Linear'
      });

      // Drifting figure-eight flight
      this.tweens.add({
        targets: b,
        x: pos.x + 40,
        y: pos.y - 30,
        duration: pos.dur,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.butterflies.push(b);
    });
  }

  createAmbientSparkles(width, height) {
    this.sparkles = [];
    for (let i = 0; i < 18; i++) {
      const sp = this.add.graphics().setDepth(17);
      sp.fillStyle(0xfffa65, 0.75);
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
    // Left Monster (Player 1 / Blue Mascot) elevated on left cliff
    this.playerMonster = new Monster(this, 180, 485, 'player');
    this.playerMonster.setDepth(6);

    // Right Monster (Player 2 / Red Mascot) elevated on right cliff
    this.opponentMonster = new Monster(this, 1100, 485, 'opponent');
    this.opponentMonster.setDepth(6);
  }

  restartBattle() {
    this.isGameOver = false;
    this.isPlayerTurn = true;
    this.questionIndex = 0;
    this.questionModal.close();
    this.playerMonster.reset();
    this.opponentMonster.reset();
    this.hud.reset();
    this.rewardSystem = new RewardSystem();
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction('rock');
    this.windSystem.randomize();
    this.hud.updateWind(this.windSystem.getWind());
    this.startPlayerTurn();
  }

  update(time, delta) {
    // 1. Update Projectile physics if flying
    if (this.activeProjectile && !this.activeProjectile.isDead) {
      this.activeProjectile.update(delta);

      if (this.activeProjectile && !this.activeProjectile.isDead) {
        // Subtle camera pan following projectile
        const targetScroll = (this.activeProjectile.x - 640) * 0.12;
        this.cameras.main.scrollX = Phaser.Math.Clamp(targetScroll, -40, 40);
      }
    }

    // 2. Animate Water Waves & Shimmer
    this.waterTimer = (this.waterTimer || 0) + delta;
    if (this.waterTimer > 50) {
      this.waterTimer = 0;
      this.waterOffset = ((this.waterOffset || 0) + 1.8) % 120;

      this.waveRipples.clear();
      this.waveRipples.lineStyle(2, 0xffffff, 0.6);
      for (let x = -60; x < 1340; x += 110) {
        const wx = x + (this.waterOffset % 110);
        this.waveRipples.beginPath();
        this.waveRipples.arc(wx, 565, 26, Math.PI * 0.15, Math.PI * 0.85, false);
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
