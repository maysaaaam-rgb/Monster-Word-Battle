import Phaser from 'phaser';

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

    this.container = scene.add.container(640, 655);
    this.container.setDepth(20);

    this.createPanel();
    this.createAngleControls();
    this.createPowerControls();
    this.createAbilitySelectors();
    this.createActionButton();
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
    // Rounded dark slate tray with gold outline (as in reference image)
    bg.fillStyle(0x131e3a, 0.94);
    bg.fillRoundedRect(-380, -46, 760, 92, 18);
    bg.lineStyle(4, 0xf39c12, 1);
    bg.strokeRoundedRect(-380, -46, 760, 92, 18);

    bg.lineStyle(1, 0xffffff, 0.2);
    bg.strokeRoundedRect(-376, -42, 752, 84, 14);

    this.container.add(bg);
  }

  createAngleControls() {
    const x = -245;

    // Label
    const label = this.scene.add.text(x, -30, 'ANGLE', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#f1c40f'
    }).setOrigin(0.5);
    this.container.add(label);

    // [ ◀ ] Button
    const leftBtn = this.createButton(x - 55, 6, '◀', () => {
      if (!this.isEnabled) return;
      if (this.audioSystem) this.audioSystem.playClick();
      this.setAngle(this.angle - 5);
    });
    this.container.add(leftBtn);

    // Angle Display Text
    this.angleText = this.scene.add.text(x, 6, `${this.angle}°`, {
      fontFamily: 'system-ui, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.angleText);

    // [ ▶ ] Button
    const rightBtn = this.createButton(x + 55, 6, '▶', () => {
      if (!this.isEnabled) return;
      if (this.audioSystem) this.audioSystem.playClick();
      this.setAngle(this.angle + 5);
    });
    this.container.add(rightBtn);
  }

  createPowerControls() {
    const x = -35;

    // Label
    this.powerLabel = this.scene.add.text(x, -30, `POWER`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#f1c40f'
    }).setOrigin(0.5);
    this.container.add(this.powerLabel);

    // Slider Track
    const trackWidth = 170;
    const trackHeight = 16;
    const trackY = 6;

    this.sliderTrack = this.scene.add.graphics();
    this.container.add(this.sliderTrack);

    const hitZone = this.scene.add.rectangle(x, trackY, trackWidth + 24, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.container.add(hitZone);

    this.sliderThumb = this.scene.add.graphics();
    this.container.add(this.sliderThumb);

    this.sliderConfig = { x, y: trackY, w: trackWidth, h: trackHeight };
    this.drawSlider();

    const updateFromPointer = (pointer) => {
      if (!this.isEnabled) return;
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
      { key: 'rock', icon: 'ability_rock', x: 105, y: -16 },
      { key: 'fireball', icon: 'ability_fire', x: 147, y: -16 },
      { key: 'shield', icon: 'ability_shield', x: 105, y: 18 },
      { key: 'heal', icon: 'ability_heal', x: 147, y: 18 }
    ];

    abilities.forEach(ab => {
      const container = this.scene.add.container(ab.x, ab.y);

      const bg = this.scene.add.graphics();
      container.add(bg);

      const icon = this.scene.add.image(0, 0, ab.icon).setDisplaySize(26, 26);
      container.add(icon);

      const hit = this.scene.add.rectangle(0, 0, 36, 30, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      container.add(hit);

      hit.on('pointerdown', () => {
        if (!this.isEnabled) return;
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
        btn.bg.fillRoundedRect(-18, -15, 36, 30, 8);
        btn.bg.lineStyle(2, 0xffd700, 1);
        btn.bg.strokeRoundedRect(-18, -15, 36, 30, 8);
      } else {
        btn.bg.fillStyle(0x1e272e, 0.6);
        btn.bg.fillRoundedRect(-18, -15, 36, 30, 8);
        btn.bg.lineStyle(1, 0x57606f, 0.7);
        btn.bg.strokeRoundedRect(-18, -15, 36, 30, 8);
      }

      btn.container.setAlpha(isUnlocked ? 1.0 : 0.3);
      btn.icon.setScale(isSelected ? 1.15 : 1.0);
    });
  }

  drawSlider() {
    const { x, y, w, h } = this.sliderConfig;
    const ratio = (this.power - 20) / 80;

    this.sliderTrack.clear();
    this.sliderTrack.fillStyle(0x2d3436, 1);
    this.sliderTrack.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    this.sliderTrack.lineStyle(2, 0x636e72, 1);
    this.sliderTrack.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const fillW = Math.max(10, w * ratio);
    this.sliderTrack.fillStyle(0xf39c12, 1);
    this.sliderTrack.fillRoundedRect(x - w / 2, y - h / 2, fillW, h, 8);

    this.sliderThumb.clear();
    const thumbX = x - w / 2 + fillW;
    this.sliderThumb.fillStyle(0xffffff, 1);
    this.sliderThumb.lineStyle(3, 0xd35400, 1);
    this.sliderThumb.fillCircle(thumbX, y, 12);
    this.sliderThumb.strokeCircle(thumbX, y, 12);
  }

  createActionButton() {
    const x = 265;
    const y = -2;

    this.actionBtnContainer = this.scene.add.container(x, y);

    const btnWidth = 145;
    const btnHeight = 56;

    this.btnShadow = this.scene.add.graphics();
    this.actionBtnContainer.add(this.btnShadow);

    this.btnBody = this.scene.add.graphics();
    this.actionBtnContainer.add(this.btnBody);

    this.btnText = this.scene.add.text(0, 0, '🪨 THROW!', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffffff',
      shadow: { blur: 6, color: '#000000', fill: true }
    }).setOrigin(0.5);
    this.actionBtnContainer.add(this.btnText);

    const hitArea = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.actionBtnContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      if (!this.isEnabled) return;
      this.actionBtnContainer.setScale(1.05);
    });

    hitArea.on('pointerout', () => {
      this.actionBtnContainer.setScale(1.0);
    });

    hitArea.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      if (!this.isEnabled) return;
      this.setEnabled(false); // Immediately lock to prevent duplicate throws!
      if (this.audioSystem) this.audioSystem.playClick();
      this.actionBtnContainer.setScale(0.96);
      if (this.callbacks.onAction) {
        this.callbacks.onAction(this.activeAction);
      }
    });

    hitArea.on('pointerup', () => {
      this.actionBtnContainer.setScale(1.0);
    });

    this.container.add(this.actionBtnContainer);
    this.updateActionButton();
  }

  updateActionButton() {
    const btnWidth = 145;
    const btnHeight = 56;

    const isFire = this.activeAction === 'fireball';
    const isShield = this.activeAction === 'shield';
    const isHeal = this.activeAction === 'heal';

    let color = 0x4b6584;
    let shadowColor = 0x2d3436;
    let label = '🪨 THROW!';

    if (isFire) {
      color = 0xeb3b5a;
      shadowColor = 0x991b1b;
      label = '🔥 THROW!';
    } else if (isShield) {
      color = 0xf59e0b;
      shadowColor = 0xb45309;
      label = '🛡️ SHIELD!';
    } else if (isHeal) {
      color = 0x20bf6b;
      shadowColor = 0x0f7940;
      label = '💚 HEAL!';
    }

    this.btnShadow.clear();
    this.btnShadow.fillStyle(shadowColor, 1);
    this.btnShadow.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 5, btnWidth, btnHeight, 18);

    this.btnBody.clear();
    this.btnBody.fillStyle(color, 1);
    this.btnBody.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 18);
    this.btnBody.lineStyle(3, 0xffffff, 1);
    this.btnBody.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 18);

    this.btnText.setText(label);
  }

  createButton(x, y, symbol, onClick) {
    const btn = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0984e3, 1);
    bg.fillRoundedRect(-18, -18, 36, 36, 10);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-18, -18, 36, 36, 10);
    btn.add(bg);

    const txt = this.scene.add.text(0, 0, symbol, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    btn.add(txt);

    const hit = this.scene.add.rectangle(0, 0, 36, 36, 0x000000, 0)
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
    this.container.setAlpha(enabled ? 1 : 0.45);
  }
}
