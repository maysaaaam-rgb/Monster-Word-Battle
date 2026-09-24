import Phaser from 'phaser';

/**
 * AnswerCard Component
 * 
 * Reusable interactive picture card component for ESL challenges.
 * - Entire card area is interactive (image, text, and card background).
 * - Full pointer events: pointerover, pointerout, pointerdown, pointerup.
 * - States: normal, hover, selected, correct, incorrect, disabled.
 * - Synchronous click-lockout to prevent rapid duplicate events.
 */
export default class AnswerCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width = 160, height = 142, choice = {}, index = 0, onClick = null) {
    super(scene, x, y);

    this.cardWidth = width;
    this.cardHeight = height;
    this.choice = choice;
    this.index = index;
    this.letter = ['A', 'B', 'C'][index] || `${index + 1}`;
    this.onClick = onClick;
    this.baseX = x;
    this.baseY = y;
    this.isLocked = false;
    this.currentState = 'normal';

    // 1. Card Background Graphics (Body, shadow, border)
    this.cardBg = scene.add.graphics();
    this.add(this.cardBg);

    // 2. Letter Badge in top-left (A, B, or C)
    this.badgeBg = scene.add.graphics();
    this.add(this.badgeBg);

    this.letterBadge = scene.add.text(-width / 2 + 16, -height / 2 + 16, this.letter, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#718093'
    }).setOrigin(0.5);
    this.add(this.letterBadge);

    // 3. Illustrated Picture Mini-Scene (Upper area)
    if (choice.image && scene.textures.exists(choice.image)) {
      this.sceneImg = scene.add.image(0, -18, choice.image).setOrigin(0.5, 0.5);
      this.sceneImg.setScale(0.92);
      this.add(this.sceneImg);
    } else {
      this.sceneImg = null;
    }

    // 4. Label Pill Button (Bottom area)
    this.pillBg = scene.add.graphics();
    this.add(this.pillBg);

    this.pillTxt = scene.add.text(0, height / 2 - 24, choice.label || '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.add(this.pillTxt);

    // 5. Emerald Checkmark Badge (Hidden initially)
    if (scene.textures.exists('card_checkmark')) {
      this.checkSprite = scene.add.image(width / 2 - 14, -height / 2 + 14, 'card_checkmark')
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      this.add(this.checkSprite);
    } else {
      this.checkSprite = null;
    }

    // 6. Interactive Hit Area
    // Interactivity set on Container AND an explicit top transparent hitZone
    this.setSize(width, height);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    this.hitZone = scene.add.rectangle(0, 0, width, height, 0x000000, 0.0001)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    // Initial Appearance
    this.setStateNormal();

    // Setup Pointer Event Listeners
    this.setupInteractivity();
  }

  setupInteractivity() {
    // Hover: Enter
    const onOver = () => {
      if (this.isLocked || this.currentState === 'disabled' || this.currentState === 'correct') return;
      this.setStateHover();
    };

    // Hover: Exit
    const onOut = () => {
      if (this.isLocked || this.currentState === 'disabled' || this.currentState === 'correct') return;
      this.setStateNormal();
    };

    // Pointer Down (Click / Tap)
    const onDown = (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      if (this.isLocked || this.currentState === 'disabled' || this.currentState === 'correct') return;
      this.triggerClick(pointer);
    };

    // Pointer Up
    const onUp = () => {
      if (this.isLocked || this.currentState === 'disabled' || this.currentState === 'correct') return;
      this.setStateHover();
    };

    // Attach to hitZone
    this.hitZone.on('pointerover', onOver);
    this.hitZone.on('pointerout', onOut);
    this.hitZone.on('pointerdown', onDown);
    this.hitZone.on('pointerup', onUp);

    // Also attach to Container as fallback
    this.on('pointerover', onOver);
    this.on('pointerout', onOut);
    this.on('pointerdown', onDown);
    this.on('pointerup', onUp);
  }

  triggerClick(pointer) {
    if (this.isLocked || this.currentState === 'disabled' || this.currentState === 'correct') return;
    this.isLocked = true; // Synchronous lockout prevents rapid duplicate events
    this.setStateSelected();

    if (this.onClick) {
      this.onClick(this.index, this);
    }
  }

  setStateNormal() {
    this.currentState = 'normal';
    this.isLocked = false;
    this.drawCard(0xdcdde1, 3, 0xffffff);
    this.drawLetterBadge(0xecf0f1, '#718093');
    this.drawPill(0x0984e3);
    this.pillTxt.setText(this.choice.label || '');
    this.pillTxt.setColor('#ffffff');
    if (this.checkSprite) this.checkSprite.setVisible(false);
    this.setScale(1.0);
    this.setAlpha(1.0);
  }

  setStateHover() {
    this.currentState = 'hover';
    this.drawCard(0x0984e3, 3, 0xf8f9fa);
    this.setScale(1.04);
  }

  setStateSelected() {
    this.currentState = 'selected';
    this.drawCard(0x0984e3, 4, 0xf1f2f6);
    this.setScale(0.97);
  }

  setStateCorrect() {
    this.currentState = 'correct';
    this.isLocked = true;
    this.drawCard(0x2ed573, 4, 0xf0fff4);
    this.drawLetterBadge(0x2ed573, '#ffffff');
    this.drawPill(0x2ed573);
    this.pillTxt.setText('CORRECT! 🎉');
    this.pillTxt.setColor('#ffffff');

    if (this.checkSprite) {
      this.checkSprite.setVisible(true);
      this.checkSprite.setScale(0.2);
      this.scene.tweens.add({
        targets: this.checkSprite,
        scale: 1,
        duration: 250,
        ease: 'Back.easeOut'
      });
    }

    this.setScale(1.05);
  }

  setStateIncorrect(onResetComplete) {
    this.currentState = 'incorrect';
    this.isLocked = true;
    this.drawCard(0xff4757, 4, 0xfff0f0);
    this.drawLetterBadge(0xff4757, '#ffffff');
    this.drawPill(0xff4757);
    this.pillTxt.setText('TRY AGAIN!');
    this.pillTxt.setColor('#ffffff');

    // Shake animation
    const originX = this.baseX;
    this.scene.tweens.add({
      targets: this,
      x: originX + 8,
      duration: 35,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
      onComplete: () => {
        this.x = originX;
        // Wait ~250ms, then restore normal state and unlock (total duration ~530ms)
        this.scene.time.delayedCall(250, () => {
          this.setStateNormal();
          if (onResetComplete) onResetComplete();
        });
      }
    });
  }

  setDisabled(disabled) {
    this.isLocked = disabled;
    if (disabled) {
      this.currentState = 'disabled';
      this.setAlpha(0.45);
      this.setScale(1.0);
    } else {
      this.setStateNormal();
    }
  }

  drawCard(borderColor, borderWidth, fillColor) {
    const w = this.cardWidth;
    const h = this.cardHeight;
    this.cardBg.clear();

    // Drop shadow
    this.cardBg.fillStyle(0x000000, 0.12);
    this.cardBg.fillRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, 14);

    // Card Surface
    this.cardBg.fillStyle(fillColor, 1);
    this.cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);

    // Outline Border
    this.cardBg.lineStyle(borderWidth, borderColor, 1);
    this.cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  }

  drawLetterBadge(bgColor, textColor) {
    const x = -this.cardWidth / 2 + 16;
    const y = -this.cardHeight / 2 + 16;
    this.badgeBg.clear();
    this.badgeBg.fillStyle(bgColor, 1);
    this.badgeBg.fillCircle(x, y, 11);
    this.letterBadge.setColor(textColor);
  }

  drawPill(fillColor) {
    const w = this.cardWidth - 24;
    const h = 28;
    const y = this.cardHeight / 2 - 24;
    this.pillBg.clear();
    this.pillBg.fillStyle(fillColor, 1);
    this.pillBg.fillRoundedRect(-w / 2, y - h / 2, w, h, 8);
  }
}
