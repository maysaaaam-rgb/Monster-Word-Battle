import Phaser from 'phaser';

/**
 * Controls Tray Component
 * 
 * Classic Arcade Cat-vs-Dog inspired battle control panel:
 * - Angle adjustment: [ ◀ ] ANGLE 45° [ ▶ ] (supports click & hold)
 * - Power Meter: Live animated charging meter with color gradient
 * - Ability selectors: Rock, Fireball, Shield, Heal
 * - Press & Hold Action Button: Power charges while held, launches on release!
 */
export default class Controls {
  constructor(scene, initialAngle = 45, initialPower = 65, audioSystem = null, callbacks = {}) {
    this.scene = scene;
    this.angle = initialAngle;
    this.power = initialPower;
    this.audioSystem = audioSystem;
    this.callbacks = callbacks;
    this.isEnabled = true;
    this.activeAction = 'rock'; // 'rock', 'fireball', 'shield', 'heal'
    this.unlockedAbilities = { rock: true, fireball: false, shield: false, heal: false };

    // Charge State
    this.isCharging = false;
    this.chargeDir = 1;
    this.chargeSpeed = 65; // ~1.2s to traverse 20 -> 100
    this.holdingAngleLeft = false;
    this.holdingAngleRight = false;
    this.angleHoldTimer = 0;

    this.container = scene.add.container(640, 665);
    this.container.setDepth(20);

    this.createPanel();
    this.createAngleControls();
    this.createPowerControls();
    this.createAbilitySelectors();
    this.createActionButton();
    this.setupGlobalPointerUp();
  }

  setUnlockedAbilities(abilities) {
    this.unlockedAbilities = { ...this.unlockedAbilities, ...abilities };
    this.updateAbilitySelectors();
  }

  setAction(type) {
    this.activeAction = type;
    this.updateActionButton();
    this.updateAbilitySelectors();
    if (this.callbacks.onActionChange) {
      this.callbacks.onActionChange(type);
    }
  }

  createPanel() {
    const bg = this.scene.add.graphics();
    // Compact floating arcade bar with gold outline
    bg.fillStyle(0x131e3a, 0.94);
    bg.fillRoundedRect(-235, -28, 470, 56, 16);
    bg.lineStyle(3, 0xf39c12, 1);
    bg.strokeRoundedRect(-235, -28, 470, 56, 16);

    bg.lineStyle(1, 0xffffff, 0.2);
    bg.strokeRoundedRect(-231, -24, 462, 48, 12);

    this.container.add(bg);
  }

  createAngleControls() {
    const x = -155;

    // Mini Label
    const label = this.scene.add.text(x, -18, 'ANGLE', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '10px',
      fontStyle: '900',
      color: '#f1c40f'
    }).setOrigin(0.5);
    this.container.add(label);

    // [ ◀ ] Button
    this.leftBtn = this.createButton(x - 38, 5, '◀', () => {
      if (!this.isEnabled) return;
      if (this.audioSystem) this.audioSystem.playClick();
      this.setAngle(this.angle - 5);
    });
    this.leftBtn.on('pointerdown', () => { if (this.isEnabled) this.holdingAngleLeft = true; });
    this.leftBtn.on('pointerup', () => { this.holdingAngleLeft = false; });
    this.leftBtn.on('pointerout', () => { this.holdingAngleLeft = false; });
    this.container.add(this.leftBtn);

    // Angle Display Text
    this.angleText = this.scene.add.text(x, 5, `${this.angle}°`, {
      fontFamily: 'system-ui, monospace',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.angleText);

    // [ ▶ ] Button
    this.rightBtn = this.createButton(x + 38, 5, '▶', () => {
      if (!this.isEnabled) return;
      if (this.audioSystem) this.audioSystem.playClick();
      this.setAngle(this.angle + 5);
    });
    this.rightBtn.on('pointerdown', () => { if (this.isEnabled) this.holdingAngleRight = true; });
    this.rightBtn.on('pointerup', () => { this.holdingAngleRight = false; });
    this.rightBtn.on('pointerout', () => { this.holdingAngleRight = false; });
    this.container.add(this.rightBtn);
  }

  createPowerControls() {
    const x = -20;

    // Mini Label
    this.powerLabel = this.scene.add.text(x, -18, `POWER: ${Math.round(this.power)}%`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '10px',
      fontStyle: '900',
      color: '#f1c40f'
    }).setOrigin(0.5);
    this.container.add(this.powerLabel);

    // Slider Track
    const trackWidth = 110;
    const trackHeight = 14;
    const trackY = 5;

    this.sliderTrack = this.scene.add.graphics();
    this.container.add(this.sliderTrack);

    const hitZone = this.scene.add.rectangle(x, trackY, trackWidth + 16, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.container.add(hitZone);

    this.sliderThumb = this.scene.add.graphics();
    this.container.add(this.sliderThumb);

    this.sliderConfig = { x, y: trackY, w: trackWidth, h: trackHeight };
    this.drawSlider();

    const updateFromPointer = (pointer) => {
      if (!this.isEnabled || this.isCharging) return;
      const localX = pointer.x - (640 + x);
      const ratio = Phaser.Math.Clamp((localX + trackWidth / 2) / trackWidth, 0, 1);
      const newPower = Math.round(20 + ratio * 80);
      this.setPower(newPower);
    };

    hitZone.on('pointerdown', (pointer) => {
      if (!this.isEnabled) return;
      if (this.audioSystem) this.audioSystem.playClick();
      updateFromPointer(pointer);
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (pointer.isDown && this.isEnabled && hitZone.input && hitZone.input.dragState) {
        updateFromPointer(pointer);
      }
    });
  }

  createAbilitySelectors() {
    this.abilityButtons = {};
    const abilities = [
      { key: 'rock', icon: 'ability_rock', x: 62, y: -10 },
      { key: 'fireball', icon: 'ability_fire', x: 86, y: -10 },
      { key: 'shield', icon: 'ability_shield', x: 62, y: 12 },
      { key: 'heal', icon: 'ability_heal', x: 86, y: 12 }
    ];

    abilities.forEach(ab => {
      const container = this.scene.add.container(ab.x, ab.y);

      const bg = this.scene.add.graphics();
      container.add(bg);

      const icon = this.scene.add.image(0, 0, ab.icon).setDisplaySize(18, 18);
      container.add(icon);

      const hit = this.scene.add.rectangle(0, 0, 22, 20, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      container.add(hit);

      hit.on('pointerdown', () => {
        if (!this.isEnabled || this.isCharging) return;
        if (!this.unlockedAbilities[ab.key] && ab.key !== 'rock') return;
        if (this.audioSystem) this.audioSystem.playClick();
        this.setAction(ab.key);
      });

      this.container.add(container);
      this.abilityButtons[ab.key] = { container, bg, icon };
    });

    this.updateAbilitySelectors();
  }

  updateAbilitySelectors() {
    if (!this.abilityButtons) return;

    Object.entries(this.abilityButtons).forEach(([key, btn]) => {
      const isUnlocked = this.unlockedAbilities[key] || key === 'rock';
      const isSelected = this.activeAction === key;

      btn.bg.clear();
      if (isSelected) {
        btn.bg.fillStyle(0xf1c40f, 0.45);
        btn.bg.fillRoundedRect(-11, -10, 22, 20, 5);
        btn.bg.lineStyle(2, 0xffd700, 1);
        btn.bg.strokeRoundedRect(-11, -10, 22, 20, 5);
      } else {
        btn.bg.fillStyle(0x1e272e, 0.6);
        btn.bg.fillRoundedRect(-11, -10, 22, 20, 5);
        btn.bg.lineStyle(1, 0x57606f, 0.7);
        btn.bg.strokeRoundedRect(-11, -10, 22, 20, 5);
      }

      btn.container.setAlpha(isUnlocked ? 1.0 : 0.3);
      btn.icon.setScale(isSelected ? 1.15 : 1.0);
    });
  }

  drawSlider() {
    const { x, y, w, h } = this.sliderConfig;
    const ratio = (this.power - 20) / 80;

    this.sliderTrack.clear();
    // Track Backing
    this.sliderTrack.fillStyle(0x1a2530, 1);
    this.sliderTrack.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
    this.sliderTrack.lineStyle(2, 0x475569, 1);
    this.sliderTrack.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);

    // Dynamic Color Fill: Green -> Gold -> Red
    let fillColor = 0x2ed573;
    if (ratio > 0.7) fillColor = 0xff4757;
    else if (ratio > 0.4) fillColor = 0xf39c12;

    const fillW = Math.max(6, w * ratio);
    this.sliderTrack.fillStyle(fillColor, 1);
    this.sliderTrack.fillRoundedRect(x - w / 2, y - h / 2, fillW, h, 6);

    // Glowing Thumb
    this.sliderThumb.clear();
    const thumbX = x - w / 2 + fillW;
    this.sliderThumb.fillStyle(0xffffff, 1);
    this.sliderThumb.lineStyle(2, fillColor, 1);
    this.sliderThumb.fillCircle(thumbX, y, 8);
    this.sliderThumb.strokeCircle(thumbX, y, 8);

    if (this.powerLabel) {
      this.powerLabel.setText(`POWER: ${Math.round(this.power)}%`);
    }
  }

  createActionButton() {
    const x = 166;
    const y = 0;

    this.actionBtnContainer = this.scene.add.container(x, y);

    const btnWidth = 112;
    const btnHeight = 44;

    this.btnShadow = this.scene.add.graphics();
    this.actionBtnContainer.add(this.btnShadow);

    this.btnBody = this.scene.add.graphics();
    this.actionBtnContainer.add(this.btnBody);

    this.btnText = this.scene.add.text(0, -6, '🪨 THROW!', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffffff',
      shadow: { blur: 4, color: '#000000', fill: true }
    }).setOrigin(0.5);
    this.actionBtnContainer.add(this.btnText);

    this.btnSubText = this.scene.add.text(0, 10, 'HOLD TO CHARGE', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#feca57'
    }).setOrigin(0.5);
    this.actionBtnContainer.add(this.btnSubText);

    this.hitArea = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.actionBtnContainer.add(this.hitArea);

    this.hitArea.on('pointerover', () => {
      if (!this.isEnabled) return;
      this.actionBtnContainer.setScale(1.04);
    });

    this.hitArea.on('pointerout', () => {
      if (!this.isCharging) {
        this.actionBtnContainer.setScale(1.0);
      }
    });

    this.hitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      if (!this.isEnabled) return;

      if (this.activeAction === 'shield' || this.activeAction === 'heal') {
        // Instant actions deploy immediately
        this.setEnabled(false);
        if (this.audioSystem) this.audioSystem.playClick();
        if (this.callbacks.onAction) {
          this.callbacks.onAction(this.activeAction, this.power);
        }
      } else {
        // Classic Cat-vs-Dog: HOLD TO CHARGE POWER!
        this.startCharging();
      }
    });

    this.container.add(this.actionBtnContainer);
    this.updateActionButton();
  }

  setupGlobalPointerUp() {
    // Release anywhere on screen executes the throw!
    this.scene.input.on('pointerup', () => {
      if (this.isCharging) {
        this.stopChargingAndThrow();
      }
    });
  }

  startCharging() {
    if (!this.isEnabled || this.isCharging) return;
    this.isCharging = true;
    this.chargeDir = 1;
    this.power = 20; // Start charge from base
    this.setPower(this.power);
    this.actionBtnContainer.setScale(0.95);

    if (this.audioSystem) this.audioSystem.playClick();

    if (this.callbacks.onChargeStart) {
      this.callbacks.onChargeStart(this.power);
    }
  }

  stopChargingAndThrow() {
    if (!this.isCharging) return;
    this.isCharging = false;
    this.setEnabled(false); // Lock controls during flight
    this.actionBtnContainer.setScale(1.0);

    const finalPower = Math.round(this.power);
    console.log(`[CHARGE] Released at power: ${finalPower}%`);

    if (this.callbacks.onAction) {
      this.callbacks.onAction(this.activeAction, finalPower);
    }
  }

  update(delta) {
    // Handle Angle Hold
    if (this.holdingAngleLeft || this.holdingAngleRight) {
      this.angleHoldTimer += delta;
      if (this.angleHoldTimer > 100) {
        this.angleHoldTimer = 0;
        if (this.holdingAngleLeft) this.setAngle(this.angle - 2);
        if (this.holdingAngleRight) this.setAngle(this.angle + 2);
      }
    } else {
      this.angleHoldTimer = 0;
    }

    // Handle Power Charging (Classic Cat-vs-Dog ping-pong meter)
    if (this.isCharging && this.isEnabled) {
      const step = (this.chargeSpeed * delta) / 1000;
      this.power += step * this.chargeDir;

      if (this.power >= 100) {
        this.power = 100;
        this.chargeDir = -1; // Bounce back down
      } else if (this.power <= 20) {
        this.power = 20;
        this.chargeDir = 1; // Bounce back up
      }

      this.setPower(Math.round(this.power));

      if (this.callbacks.onCharging) {
        this.callbacks.onCharging(this.power);
      }
    }
  }

  updateActionButton() {
    const btnWidth = 112;
    const btnHeight = 44;

    const isFire = this.activeAction === 'fireball';
    const isShield = this.activeAction === 'shield';
    const isHeal = this.activeAction === 'heal';

    let color = 0x3b82f6;
    let shadowColor = 0x1d4ed8;
    let label = '🪨 THROW!';
    let sub = 'HOLD TO CHARGE';

    if (isFire) {
      color = 0xeb3b5a;
      shadowColor = 0x991b1b;
      label = '🔥 THROW!';
      sub = 'HOLD TO CHARGE';
    } else if (isShield) {
      color = 0xf59e0b;
      shadowColor = 0xb45309;
      label = '🛡️ SHIELD!';
      sub = 'INSTANT CAST';
    } else if (isHeal) {
      color = 0x20bf6b;
      shadowColor = 0x0f7940;
      label = '💚 HEAL!';
      sub = 'INSTANT CAST';
    }

    this.btnShadow.clear();
    this.btnShadow.fillStyle(shadowColor, 1);
    this.btnShadow.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 4, btnWidth, btnHeight, 12);

    this.btnBody.clear();
    this.btnBody.fillStyle(color, 1);
    this.btnBody.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
    this.btnBody.lineStyle(2, 0xffffff, 1);
    this.btnBody.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

    this.btnText.setText(label);
    this.btnSubText.setText(sub);
  }

  createButton(x, y, symbol, onClick) {
    const btn = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0984e3, 1);
    bg.fillRoundedRect(-14, -14, 28, 28, 8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-14, -14, 28, 28, 8);
    btn.add(bg);

    const txt = this.scene.add.text(0, 0, symbol, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    btn.add(txt);

    const hit = this.scene.add.rectangle(0, 0, 28, 28, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    btn.add(hit);

    hit.on('pointerover', () => btn.setScale(1.1));
    hit.on('pointerout', () => btn.setScale(1.0));
    hit.on('pointerdown', () => {
      btn.setScale(0.92);
      onClick();
    });
    hit.on('pointerup', () => btn.setScale(1.0));

    return btn;
  }

  setAngle(deg) {
    this.angle = Phaser.Math.Clamp(deg, 10, 85);
    this.angleText.setText(`${this.angle}°`);
    if (this.callbacks.onAngleChange) {
      this.callbacks.onAngleChange(this.angle);
    }
  }

  setPower(pow) {
    this.power = Phaser.Math.Clamp(pow, 20, 100);
    this.drawSlider();
    if (this.callbacks.onPowerChange) {
      this.callbacks.onPowerChange(this.power);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.isCharging = false;
      this.holdingAngleLeft = false;
      this.holdingAngleRight = false;
    }
    this.container.setAlpha(enabled ? 1 : 0.45);
  }
}
