import Phaser from 'phaser';
import Monster from '../entities/Monster.js';
import Projectile from '../entities/Projectile.js';
import AimSystem from '../systems/AimSystem.js';
import WindSystem from '../systems/WindSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import RewardSystem from '../systems/RewardSystem.js';
import { PHYSICS, calculateKinematics } from '../systems/PhysicsConfig.js';
import HUD from '../ui/HUD.js';
import Controls from '../ui/Controls.js';
import QuestionModal from '../ui/QuestionModal.js';
import { questions } from '../data/questions.js';

export const GAME_STATE = {
  QUESTION: 'QUESTION',
  AIM: 'AIM',
  FLYING: 'FLYING',
  RESULT: 'RESULT',
  ENEMY_TURN: 'ENEMY_TURN',
  PLAYER_QUESTION: 'QUESTION',
  PLAYER_AIM: 'AIM',
  PLAYER_FLYING: 'FLYING',
  PLAYER_RESULT: 'RESULT'
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    console.log("GAME SCENE CREATED: Engine V2 with Authoritative State Machine & Unified Physics");

    const width = 1280;
    const height = 720;
    this.groundY = PHYSICS.groundY;
    this.questionIndex = 0;
    this.gameState = null;
    this.isGameOver = false;
    this.activeProjectile = null;
    this.debugMode = false; // Set to true for collision/physics debugging

    // 1. Core Systems
    this.audioSystem = new AudioSystem();
    this.windSystem = new WindSystem();
    this.rewardSystem = new RewardSystem();
    this.aimSystem = new AimSystem(this, this.windSystem);

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
        if (this.gameState !== GAME_STATE.AIM) return;
        this.aimSystem.setAngle(angle);
        this.playerMonster.setAimAngle(angle);
      },
      onPowerChange: (power) => {
        if (this.gameState !== GAME_STATE.AIM) return;
        this.aimSystem.setPower(power);
      },
      onActionChange: (actionType) => {
        if (this.gameState !== GAME_STATE.AIM) return;
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
        this.executePlayerAction(actionType);
      }
    });

    // 6. Turn Announcement Banner Ribbon
    this.createTurnBanner();

    // 7. Debug Graphics Layer
    this.debugGraphics = this.add.graphics().setDepth(99);
    this.debugText = this.add.text(12, 12, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 4 }
    }).setDepth(100).setVisible(false);

    // Optional debug toggle key (D)
    this.input.keyboard?.on('keydown-D', () => {
      this.setDebugMode(!this.debugMode);
    });

    // 8. In-Game Educational Challenge Event
    this.questionModal = new QuestionModal(
      this,
      this.audioSystem,
      (reward) => {
        this.onRewardGranted(reward);
      },
      (reward) => {
        this.onModalClosed(reward);
      }
    );

    // Start First Player Turn via State Machine
    this.time.delayedCall(300, () => {
      this.setGameState(GAME_STATE.QUESTION);
    });
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.debugGraphics.setVisible(enabled);
    this.debugText.setVisible(enabled);
    if (!enabled) {
      this.debugGraphics.clear();
      this.debugText.setText('');
    }
  }

  // ==========================================
  // AUTHORITATIVE STATE MACHINE
  // ==========================================
  setGameState(newState) {
    console.log(`[STATE] ${this.gameState} -> ${newState}`);
    this.gameState = newState;

    switch (newState) {
      case GAME_STATE.QUESTION:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.playerMonster.setHeldItem(null);

        // Announce Player Turn then display question
        this.showTurnBanner('⚡ YOUR TURN', () => {
          const q = questions[this.questionIndex % questions.length];
          this.questionIndex++;
          this.questionModal.showQuestion(q);
        });
        break;

      case GAME_STATE.AIM:
        this.controls.setEnabled(true);
        this.controls.setUnlockedAbilities(this.rewardSystem.inventory);

        const currentAction = this.rewardSystem.getReward();
        this.controls.setAction(currentAction);

        if (currentAction === 'heal' || currentAction === 'shield') {
          this.aimSystem.hide();
          this.playerMonster.setHeldItem(null);
        } else {
          this.aimSystem.show();
          this.playerMonster.setHeldItem(currentAction);
          this.playerMonster.setAimAngle(this.aimSystem.angle);
        }
        break;

      case GAME_STATE.FLYING:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        break;

      case GAME_STATE.RESULT:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.resetCamera();
        break;

      case GAME_STATE.ENEMY_TURN:
        this.controls.setEnabled(false);
        this.aimSystem.hide();

        this.showTurnBanner('👾 ENEMY TURN', () => {
          this.executeEnemyTurn();
        });
        break;
    }
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
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(550, () => {
          this.tweens.add({
            targets: this.turnBannerContainer,
            y: 45,
            alpha: 0,
            duration: 220,
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

  onRewardGranted(rewardName) {
    const type = (rewardName || 'fireball').toLowerCase();
    this.rewardSystem.unlockReward(type);
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction(type);

    if (type !== 'heal' && type !== 'shield') {
      this.playerMonster.setHeldItem(type);
      this.playerMonster.setAimAngle(this.aimSystem.angle);
    }
  }

  onModalClosed(rewardName) {
    // Challenge is closed, now transition to AIM state
    this.setGameState(GAME_STATE.AIM);
  }

  executePlayerAction(actionType) {
    // Verify player is in AIM state
    if (this.gameState !== GAME_STATE.AIM) {
      console.warn("Cannot execute action outside AIM state!");
      return;
    }

    if (actionType === 'shield') {
      // Deploy Shield immediately
      this.setGameState(GAME_STATE.RESULT);
      this.playerMonster.activateShield();
      this.rewardSystem.consumeReward();
      this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
      this.controls.setAction('rock');

      this.time.delayedCall(900, () => {
        this.setGameState(GAME_STATE.ENEMY_TURN);
      });
    } else if (actionType === 'heal') {
      // Heal immediately
      this.setGameState(GAME_STATE.RESULT);
      this.audioSystem.playHeal();
      this.playerMonster.heal(30);
      this.hud.updateP1Health(this.playerMonster.hp);
      this.rewardSystem.consumeReward();
      this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
      this.controls.setAction('rock');

      this.time.delayedCall(900, () => {
        this.setGameState(GAME_STATE.ENEMY_TURN);
      });
    } else {
      // Throw Projectile (Rock or Fireball)
      this.executePlayerThrow(actionType);
    }
  }

  executePlayerThrow(weaponType = 'fireball') {
    // Transition to FLYING state
    this.setGameState(GAME_STATE.FLYING);

    // 1. Play Monster Throw Squash & Stretch Animation
    this.playerMonster.playThrowAnimation(() => {
      // 2. Play Audio Throw
      if (weaponType === 'fireball') {
        this.audioSystem.playFireballThrow();
      } else {
        this.audioSystem.playThrow();
      }

      // 3. Launch Projectile from exact launch point with exact kinematics
      const launchPt = this.playerMonster.getLaunchPoint();
      const { vx, vy } = this.aimSystem.getVelocity();
      const gravity = PHYSICS.gravity;
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
          this.onPlayerProjectileResult(hitMonster, hx, hy, damage, isShieldBlocked);
        },
        PHYSICS.obstacle
      );
    });
  }

  onPlayerProjectileResult(hitMonster, hx, hy, damage, isShieldBlocked) {
    this.activeProjectile = null;
    this.setGameState(GAME_STATE.RESULT);

    if (hitMonster && !isShieldBlocked) {
      this.opponentMonster.takeDamage(damage);
      this.hud.updateP2Health(this.opponentMonster.hp);
    }

    // Check Victory
    if (this.opponentMonster.hp <= 0) {
      this.isGameOver = true;
      this.time.delayedCall(600, () => {
        this.hud.showVictory('PLAYER 1');
      });
      return;
    }

    // Consume single-use reward and reset action to rock
    this.rewardSystem.consumeReward();
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction('rock');

    // Transition to Enemy Turn after impact animation settles
    this.time.delayedCall(800, () => {
      if (this.isGameOver) return;
      this.setGameState(GAME_STATE.ENEMY_TURN);
    });
  }

  // ==========================================
  // ENEMY AI TURN SYSTEM
  // ==========================================
  executeEnemyTurn() {
    if (this.isGameOver) return;

    this.opponentMonster.playThinkingAnimation();

    this.time.delayedCall(800, () => {
      if (this.isGameOver) return;

      this.opponentMonster.playThrowAnimation(() => {
        this.audioSystem.playThrow();

        const launchPt = this.opponentMonster.getLaunchPoint();
        const gravity = PHYSICS.gravity;
        const windAcc = this.windSystem.getAcceleration();

        // Calculate accurate ballistic trajectory toward Player 1 at (180, 485)
        // dx = -860, dy = 0.
        // At angle 55° (125° towards left): speed ~ 640 px/s
        const angleRad = Phaser.Math.DegToRad(125);
        const baseSpeed = 640;
        // Minor human-like variance (-20 to +20)
        const variance = Phaser.Math.Between(-18, 18);
        const speed = baseSpeed + variance - (windAcc * 0.35);

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
            this.onEnemyProjectileResult(hitMonster, hx, hy, damage, isShieldBlocked);
          },
          PHYSICS.obstacle
        );
      });
    });
  }

  onEnemyProjectileResult(hitMonster, hx, hy, damage, isShieldBlocked) {
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

    // Wait for enemy attack reaction, randomize wind, then transition back to QUESTION!
    this.time.delayedCall(700, () => {
      if (this.isGameOver) return;
      this.windSystem.randomize();
      this.hud.updateWind(this.windSystem.getWind());
      this.setGameState(GAME_STATE.QUESTION);
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
  // MULTI-LAYER PARALLAX BRIGHT ENVIRONMENT
  // ==========================================
  createLivingEnvironment(width, height) {
    // Layer 0: Sky with Warm Sun
    this.sky = this.add.image(width / 2, height / 2, 'bg_sky_bright').setDepth(0);

    // Layer 1: Mountains
    this.mountains = this.add.image(width / 2, 380, 'bg_mountains_bright').setDepth(1);

    // Layer 2: Rolling Hills & Cottages
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

    // Soaring Bird
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

    // Layer 3: Center River Canyon & Water
    const riverBed = this.add.graphics().setDepth(3);
    riverBed.fillStyle(0x0284c7, 1);
    riverBed.fillRect(0, 560, width, height - 560);

    this.riverWater = this.add.image(width / 2, 650, 'river_water').setDepth(3);
    this.waveRipples = this.add.graphics().setDepth(3);

    // Layer 4: Central Tactical Obstacle
    this.centerRock = this.add.image(640, 520, 'terrain_center_rock').setDepth(4).setScale(1.1);

    const crate1 = this.add.image(490, 545, 'wooden_crate').setDepth(4).setScale(0.75);
    const crate2 = this.add.image(790, 545, 'wooden_crate').setDepth(4).setScale(0.75);

    const bridge = this.add.image(640, 545, 'rope_bridge').setDepth(4).setScale(1.05);

    // Observer Kitten
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

    // Layer 5: Left & Right Elevated Cliff Platforms
    const cliffL = this.add.image(180, 600, 'cliff_left').setDepth(5);
    const cliffR = this.add.image(1100, 600, 'cliff_right').setDepth(5);

    // Butterflies
    this.createButterflies();

    // Foreground Foliage
    this.forePlants = this.add.image(width / 2, 705, 'foreground_plants').setDepth(19);

    // Ambient Sparkles
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

      this.tweens.add({
        targets: b,
        scaleX: 0.45,
        duration: 180,
        yoyo: true,
        repeat: -1,
        ease: 'Linear'
      });

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
    // Left Mascot (Player 1 / Blue) at (180, 485)
    this.playerMonster = new Monster(this, 180, 485, 'player');
    this.playerMonster.setDepth(6);

    // Right Mascot (Player 2 / Red) at (1100, 485)
    this.opponentMonster = new Monster(this, 1100, 485, 'opponent');
    this.opponentMonster.setDepth(6);
  }

  restartBattle() {
    this.isGameOver = false;
    this.questionIndex = 0;
    this.questionModal.close();
    this.playerMonster.reset();
    this.opponentMonster.reset();
    this.hud.reset();
    this.rewardSystem = new RewardSystem();
    this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
    this.controls.setAction('rock');
    this.windSystem.setWind(0);
    this.hud.updateWind(0);
    this.setGameState(GAME_STATE.QUESTION);
  }

  update(time, delta) {
    // 1. Update Projectile physics if flying
    if (this.activeProjectile && !this.activeProjectile.isDead) {
      this.activeProjectile.update(delta);

      if (this.activeProjectile && !this.activeProjectile.isDead) {
        const targetScroll = (this.activeProjectile.x - 640) * 0.12;
        this.cameras.main.scrollX = Phaser.Math.Clamp(targetScroll, -40, 40);
      }
    }

    // 2. Debug Overlay Rendering (if enabled)
    if (this.debugMode) {
      this.renderDebugOverlay();
    }

    // 3. Animate Water Waves & Shimmer
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

    // 4. Drifting Clouds
    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.x += (cloud.speed * delta) / 1000;
        if (cloud.x > 1400) cloud.x = -150;
      });
    }

    // 5. Ambient Sparkles Drift
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

    // 6. Foreground Foliage
    if (this.forePlants) {
      this.forePlants.x = 640 + Math.sin(time * 0.0018) * 4;
    }
  }

  renderDebugOverlay() {
    this.debugGraphics.clear();

    // Player position
    this.debugGraphics.lineStyle(2, 0xffff00, 1);
    this.debugGraphics.strokeCircle(this.playerMonster.x, this.playerMonster.y, 10);
    this.debugGraphics.lineBetween(this.playerMonster.x - 14, this.playerMonster.y, this.playerMonster.x + 14, this.playerMonster.y);
    this.debugGraphics.lineBetween(this.playerMonster.x, this.playerMonster.y - 14, this.playerMonster.x, this.playerMonster.y + 14);

    // Launch point
    const lp = this.playerMonster.getLaunchPoint();
    this.debugGraphics.lineStyle(2, 0xff9900, 1);
    this.debugGraphics.strokeCircle(lp.x, lp.y, 14);

    // Target Monster Hitbox
    const targetBounds = this.opponentMonster.getHitBounds();
    this.debugGraphics.lineStyle(3, 0x00ff00, 1);
    this.debugGraphics.strokeCircle(targetBounds.x, targetBounds.y, targetBounds.radius);

    // Center Obstacle Hitbox
    this.debugGraphics.lineStyle(2, 0xff3300, 1);
    this.debugGraphics.strokeRect(
      PHYSICS.obstacle.xMin,
      PHYSICS.obstacle.yMin,
      PHYSICS.obstacle.xMax - PHYSICS.obstacle.xMin,
      PHYSICS.groundY - PHYSICS.obstacle.yMin
    );

    // Debug Text HUD
    this.debugText.setText([
      `STATE: ${this.gameState}`,
      `P1: (${Math.round(this.playerMonster.x)}, ${Math.round(this.playerMonster.y)}) HP: ${this.playerMonster.hp}`,
      `P2: (${Math.round(this.opponentMonster.x)}, ${Math.round(this.opponentMonster.y)}) HP: ${this.opponentMonster.hp}`,
      `LAUNCH: (${Math.round(lp.x)}, ${Math.round(lp.y)})`,
      `AIM: ${this.aimSystem.angle}° | POWER: ${this.aimSystem.power} | WIND: ${this.windSystem.getWind()}`,
      this.activeProjectile ? `PROJ: (${Math.round(this.activeProjectile.x)}, ${Math.round(this.activeProjectile.y)})` : 'PROJ: None'
    ]);
  }
}
