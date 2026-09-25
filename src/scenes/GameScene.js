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
  PLAYER_QUESTION: 'PLAYER_QUESTION',
  PLAYER_AIM: 'PLAYER_AIM',
  PLAYER_CHARGE: 'PLAYER_CHARGE',
  PLAYER_FLYING: 'PLAYER_FLYING',
  PLAYER_RESULT: 'PLAYER_RESULT',
  ENEMY_TURN: 'ENEMY_TURN',
  // Short aliases
  QUESTION: 'PLAYER_QUESTION',
  AIM: 'PLAYER_AIM',
  CHARGE: 'PLAYER_CHARGE',
  FLYING: 'PLAYER_FLYING',
  RESULT: 'PLAYER_RESULT'
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
        if (this.gameState !== GAME_STATE.PLAYER_AIM && this.gameState !== GAME_STATE.PLAYER_CHARGE) return;
        this.aimSystem.setAngle(angle);
        this.playerMonster.setAimAngle(angle);
      },
      onPowerChange: (power) => {
        if (this.gameState !== GAME_STATE.PLAYER_AIM && this.gameState !== GAME_STATE.PLAYER_CHARGE) return;
        this.aimSystem.setPower(power);
      },
      onChargeStart: (power) => {
        if (this.gameState === GAME_STATE.PLAYER_AIM) {
          this.setGameState(GAME_STATE.PLAYER_CHARGE);
          this.playerMonster.setCharging(true);
        }
      },
      onCharging: (power) => {
        if (this.gameState === GAME_STATE.PLAYER_CHARGE) {
          const ratio = (power - 20) / 80;
          this.playerMonster.updateChargingPose(ratio);
          this.aimSystem.setPower(power);
        }
      },
      onActionChange: (actionType) => {
        if (this.gameState !== GAME_STATE.PLAYER_AIM) return;
        if (actionType === 'heal' || actionType === 'shield') {
          this.aimSystem.hide();
          this.playerMonster.setHeldItem(null);
        } else {
          this.aimSystem.show();
          this.playerMonster.setHeldItem(actionType);
          this.playerMonster.setAimAngle(this.aimSystem.angle);
        }
      },
      onAction: (actionType, power) => {
        this.executePlayerAction(actionType, power);
      }
    });

    // Make Player Monster interactive for classic Cat-vs-Dog press & hold charging
    this.playerMonster.setSize(130, 160);
    this.playerMonster.setInteractive(new Phaser.Geom.Rectangle(-65, -130, 130, 160), Phaser.Geom.Rectangle.Contains);
    this.playerMonster.on('pointerdown', (pointer, localX, localY, event) => {
      if (this.gameState === GAME_STATE.PLAYER_AIM && this.controls.isEnabled) {
        if (event && event.stopPropagation) event.stopPropagation();
        this.controls.startCharging();
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
      case GAME_STATE.PLAYER_QUESTION:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.playerMonster.setHeldItem(null);
        this.playerMonster.setCharging(false);

        // Announce Player Turn then display question
        this.showTurnBanner('⚡ YOUR TURN', () => {
          const q = questions[this.questionIndex % questions.length];
          this.questionIndex++;
          this.questionModal.showQuestion(q);
        });
        break;

      case GAME_STATE.PLAYER_AIM:
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

      case GAME_STATE.PLAYER_CHARGE:
        // Charging: Trajectory remains visible and dynamically updates with charging power
        this.aimSystem.show();
        break;

      case GAME_STATE.PLAYER_FLYING:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.playerMonster.setCharging(false);
        break;

      case GAME_STATE.PLAYER_RESULT:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.playerMonster.setCharging(false);
        this.resetCamera();
        break;

      case GAME_STATE.ENEMY_TURN:
        this.controls.setEnabled(false);
        this.aimSystem.hide();
        this.playerMonster.setCharging(false);

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
    // Challenge is closed, now transition to PLAYER_AIM state
    this.setGameState(GAME_STATE.PLAYER_AIM);
  }

  executePlayerAction(actionType, power = null) {
    // Verify player is in AIM or CHARGE state
    if (this.gameState !== GAME_STATE.PLAYER_AIM && this.gameState !== GAME_STATE.PLAYER_CHARGE) {
      console.warn("Cannot execute action outside AIM or CHARGE state!");
      return;
    }

    if (actionType === 'shield') {
      // Deploy Shield immediately
      this.setGameState(GAME_STATE.PLAYER_RESULT);
      this.playerMonster.activateShield();
      this.rewardSystem.consumeReward();
      this.controls.setUnlockedAbilities(this.rewardSystem.inventory);
      this.controls.setAction('rock');

      this.time.delayedCall(900, () => {
        this.setGameState(GAME_STATE.ENEMY_TURN);
      });
    } else if (actionType === 'heal') {
      // Heal immediately
      this.setGameState(GAME_STATE.PLAYER_RESULT);
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
      // Throw Projectile with charged power (Rock or Fireball)
      if (power !== null) {
        this.aimSystem.setPower(power);
      }
      this.executePlayerThrow(actionType);
    }
  }

  executePlayerThrow(weaponType = 'fireball') {
    // Transition to FLYING state
    this.setGameState(GAME_STATE.PLAYER_FLYING);

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
    this.setGameState(GAME_STATE.PLAYER_RESULT);

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

        // Calculate accurate ballistic trajectory toward Player Cat at (230, 550)
        // dx = -820, dy = 0.
        // At angle 55° (125° towards left): speed ~ 648 px/s
        const angleRad = Phaser.Math.DegToRad(125);
        const baseSpeed = 648;
        // Minor human-like variance (-14 to +14)
        const variance = Phaser.Math.Between(-14, 14);
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
      this.setGameState(GAME_STATE.PLAYER_QUESTION);
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
  // BRIGHT CARTOON BACKYARD ENVIRONMENT
  // ==========================================
  createLivingEnvironment(width, height) {
    // Layer 0: Sunny Outdoor Backyard Sky
    this.sky = this.add.image(width / 2, height / 2, 'bg_sky_bright').setDepth(0);

    // Subtle Warm Sunburst Glow
    const sunGlow = this.add.graphics().setDepth(0);
    sunGlow.fillStyle(0xfff9e6, 0.45);
    sunGlow.fillCircle(640, 75, 75);
    sunGlow.fillStyle(0xffffff, 0.7);
    sunGlow.fillCircle(640, 75, 45);

    // Layer 1: Simple Distant Rolling Green Hills
    this.hills = this.add.image(width / 2, 450, 'bg_hills_bright').setDepth(1).setAlpha(0.85);

    // Layer 2: 3 Soft White Drifting Clouds
    this.clouds = [];
    const cloudConfigs = [
      { x: 180, y: 75, scale: 1.1, speed: 10 },
      { x: 640, y: 55, scale: 0.85, speed: 8 },
      { x: 1080, y: 85, scale: 1.25, speed: 12 }
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

    // Layer 2.5: Simple Backyard Bushes along the Horizon
    this.bushesGfx = this.add.graphics().setDepth(2);
    const bushPositions = [110, 420, 860, 1190];
    bushPositions.forEach(bx => {
      this.bushesGfx.fillStyle(0x10ac84, 0.85);
      this.bushesGfx.fillCircle(bx, 546, 22);
      this.bushesGfx.fillStyle(0x1dd1a1, 0.9);
      this.bushesGfx.fillCircle(bx - 12, 550, 16);
      this.bushesGfx.fillCircle(bx + 12, 550, 16);
    });

    // Layer 3: Continuous Vibrant Green Backyard Lawn & Warm Soil
    this.groundGfx = this.add.graphics().setDepth(3);
    // Warm natural earth/soil base
    this.groundGfx.fillStyle(0x8c531b, 1);
    this.groundGfx.fillRect(0, 574, width, height - 574);
    // Earth-grass transition line
    this.groundGfx.fillStyle(0x704214, 1);
    this.groundGfx.fillRect(0, 570, width, 4);
    // Bright vibrant green grass lawn
    this.groundGfx.fillStyle(0x2ed573, 1);
    this.groundGfx.fillRect(0, 550, width, 22);
    // Scalloped lawn edge
    this.groundGfx.fillStyle(0x26af61, 1);
    for (let gx = 0; gx < width; gx += 20) {
      this.groundGfx.fillCircle(gx + 10, 550, 4);
    }

    // Layer 4: Central Tactical Obstacle - Classic Wooden Backyard Fence
    // Matches PHYSICS.obstacle: xMin 570, xMax 710, yMin 490
    this.createCenterFence();
  }

  createCenterFence() {
    const fenceGfx = this.add.graphics().setDepth(4);
    // 5 vertical wooden fence pickets spanning 575 to 705
    const pickets = [585, 612, 640, 668, 695];
    pickets.forEach(px => {
      // Picket shadow
      fenceGfx.fillStyle(0x3e2723, 0.3);
      fenceGfx.fillRect(px - 9, 497, 20, 63);
      // Wood picket body
      fenceGfx.fillStyle(0xd38d49, 1);
      fenceGfx.fillRect(px - 10, 495, 20, 65);
      // Pointed picket top
      fenceGfx.beginPath();
      fenceGfx.moveTo(px - 10, 495);
      fenceGfx.lineTo(px, 482);
      fenceGfx.lineTo(px + 10, 495);
      fenceGfx.closePath();
      fenceGfx.fillPath();
      // Picket outline
      fenceGfx.lineStyle(2, 0x8c531b, 1);
      fenceGfx.strokeRect(px - 10, 495, 20, 65);
      fenceGfx.beginPath();
      fenceGfx.moveTo(px - 10, 495);
      fenceGfx.lineTo(px, 482);
      fenceGfx.lineTo(px + 10, 495);
      fenceGfx.strokePath();
    });

    // 2 horizontal wooden cross-rails
    const rails = [512, 540];
    rails.forEach(ry => {
      fenceGfx.fillStyle(0xcd7f32, 1);
      fenceGfx.fillRoundedRect(572, ry, 136, 14, 4);
      fenceGfx.lineStyle(2, 0x8c531b, 1);
      fenceGfx.strokeRoundedRect(572, ry, 136, 14, 4);

      // Wood grain highlight
      fenceGfx.lineStyle(1, 0xf5cd79, 0.6);
      fenceGfx.lineBetween(576, ry + 3, 704, ry + 3);

      // Dark nail studs on pickets
      pickets.forEach(px => {
        fenceGfx.fillStyle(0x2f3542, 1);
        fenceGfx.fillCircle(px, ry + 7, 2);
      });
    });
  }

  createCharacters() {
    // Left Combatant (Blue Cat) at (230, 550) - 18% from left edge, feet planted on grass
    this.playerMonster = new Monster(this, 230, 550, 'player');
    this.playerMonster.setDepth(6);

    // Right Combatant (Orange Dog) at (1050, 550) - 82% from left edge, feet planted on grass
    this.opponentMonster = new Monster(this, 1050, 550, 'opponent');
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
    this.setGameState(GAME_STATE.PLAYER_QUESTION);
  }

  update(time, delta) {
    // 0. Update Controls (continuous angle hold and power charging)
    if (this.controls) {
      this.controls.update(delta);
    }

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

    // 3. Drifting Clouds
    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.x += (cloud.speed * delta) / 1000;
        if (cloud.x > 1400) cloud.x = -150;
      });
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
