import Phaser from 'phaser';

export default class QuestionModal {
  constructor(scene, audioSystem, onRewardGranted, onModalClosed) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.onRewardGranted = onRewardGranted;
    this.onModalClosed = onModalClosed;
    this.currentQuestion = null;
    this.isLocked = false;

    // Root Container
    this.container = scene.add.container(0, 0).setDepth(40);
    this.container.setVisible(false);

    // 1. Full-screen Interactive Input Blocker (Prevents ANY pointer events passing to arena)
    this.blocker = scene.add.rectangle(0, 0, 1280, 720, 0x050f1e, 0.42)
      .setOrigin(0, 0)
      .setInteractive();

    this.blocker.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
    });
    this.container.add(this.blocker);

    // 2. Floating Plaque Box (Upper center at x: 640, y: 195)
    this.modalBox = scene.add.container(640, 195);
    this.container.add(this.modalBox);

    this.createEventFrame();
  }

  createEventFrame() {
    // Ornate Wooden Plaque Frame
    this.scrollFrame = this.scene.add.image(0, 0, 'challenge_scroll').setOrigin(0.5, 0.5);
    this.modalBox.add(this.scrollFrame);

    // Question Prompt Text in Plaque Banner Ribbon
    this.promptText = this.scene.add.text(0, -96, 'Where is the cat?', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#3d2005'
    }).setOrigin(0.5);
    this.modalBox.add(this.promptText);

    // Container for 3 Picture Cards
    this.cardsContainer = this.scene.add.container(0, 18);
    this.modalBox.add(this.cardsContainer);

    // Status / Feedback Banner below cards
    this.feedbackBanner = this.scene.add.container(0, 134);
    this.feedbackBg = this.scene.add.graphics();
    this.feedbackBanner.add(this.feedbackBg);

    this.feedbackText = this.scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.feedbackBanner.add(this.feedbackText);

    this.feedbackBanner.setVisible(false);
    this.modalBox.add(this.feedbackBanner);
  }

  showQuestion(question) {
    this.currentQuestion = question;
    this.isLocked = false;
    this.feedbackBanner.setVisible(false);

    this.promptText.setText(question.prompt);
    this.cardsContainer.removeAll(true);
    this.cardObjects = [];

    const choices = question.choices || [];
    const cardW = 160;
    const cardH = 142;
    const spacing = 175;
    const startX = -spacing;

    choices.forEach((choice, i) => {
      const cardX = startX + i * spacing;
      const card = this.scene.add.container(cardX, 0);
      card.setSize(cardW, cardH);

      // Card Background
      const cardBg = this.scene.add.graphics();
      this.drawCardBorder(cardBg, cardW, cardH, 0xdcdde1, 0xffffff);
      card.add(cardBg);

      // Illustrated Picture Scene
      const sceneImg = this.scene.add.image(0, -20, choice.image).setOrigin(0.5, 0.5);
      sceneImg.setScale(0.92);
      card.add(sceneImg);

      // Label Pill Button at bottom of card
      const pillBg = this.scene.add.graphics();
      pillBg.fillStyle(0x0984e3, 1);
      pillBg.fillRoundedRect(-cardW / 2 + 12, cardH / 2 - 36, cardW - 24, 28, 8);
      card.add(pillBg);

      const pillTxt = this.scene.add.text(0, cardH / 2 - 22, choice.label, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);
      card.add(pillTxt);

      // Checkmark Icon (Initially hidden)
      const checkSprite = this.scene.add.image(cardW / 2 - 12, -cardH / 2 + 12, 'card_checkmark')
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      card.add(checkSprite);

      // Interactive Click Handling on the card container
      card.setInteractive({ useHandCursor: true });

      card.on('pointerover', () => {
        if (!this.isLocked) card.setScale(1.04);
      });
      card.on('pointerout', () => {
        if (!this.isLocked) card.setScale(1.0);
      });
      card.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        if (this.isLocked) return;
        this.selectChoice(i);
      });

      this.cardsContainer.add(card);
      this.cardObjects.push({
        container: card,
        cardBg,
        pillBg,
        pillTxt,
        checkSprite,
        baseX: cardX
      });
    });

    // Animate Entrance
    this.container.setVisible(true);
    this.modalBox.setScale(0.7);
    this.modalBox.setAlpha(0);

    this.scene.tweens.add({
      targets: this.modalBox,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut'
    });
  }

  drawCardBorder(graphics, w, h, borderColor, fillColor) {
    graphics.clear();
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    graphics.lineStyle(3, borderColor, 1);
    graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  }

  selectChoice(selectedIndex) {
    if (this.isLocked) return;
    this.isLocked = true; // Lock immediately to prevent duplicate clicks

    const isCorrect = selectedIndex === this.currentQuestion.correctIndex;
    const cardObj = this.cardObjects[selectedIndex];

    if (isCorrect) {
      this.handleCorrect(cardObj);
    } else {
      this.handleIncorrect(cardObj);
    }
  }

  handleCorrect(cardObj) {
    if (this.audioSystem) this.audioSystem.playCorrect();

    // 1. Highlight selected card with green border & emerald checkmark
    this.drawCardBorder(cardObj.cardBg, 160, 142, 0x2ed573, 0xffffff);

    cardObj.pillBg.clear();
    cardObj.pillBg.fillStyle(0x2ed573, 1);
    cardObj.pillBg.fillRoundedRect(-160 / 2 + 12, 142 / 2 - 36, 160 - 24, 28, 8);

    cardObj.checkSprite.setVisible(true);
    cardObj.checkSprite.setScale(0.2);
    this.scene.tweens.add({
      targets: cardObj.checkSprite,
      scale: 1,
      duration: 250,
      ease: 'Back.easeOut'
    });

    // 2. Confetti Burst Shower
    this.spawnConfetti();

    // 3. Show Celebratory Reward Banner
    const rewardName = this.currentQuestion.reward || 'FIREBALL';
    let bannerColor = 0xeb3b5a; // Red/Fire
    let bannerText = `🎉 CORRECT! 🔥 ${rewardName} UNLOCKED!`;

    if (rewardName === 'SHIELD') {
      bannerColor = 0xf59e0b;
      bannerText = `🎉 CORRECT! 🛡️ SHIELD UNLOCKED!`;
    } else if (rewardName === 'HEAL') {
      bannerColor = 0x20bf6b;
      bannerText = `🎉 CORRECT! 💚 HEAL UNLOCKED!`;
    }

    this.feedbackBg.clear();
    this.feedbackBg.fillStyle(bannerColor, 1);
    this.feedbackBg.fillRoundedRect(-200, -18, 400, 36, 12);
    this.feedbackBg.lineStyle(2, 0xffffff, 1);
    this.feedbackBg.strokeRoundedRect(-200, -18, 400, 36, 12);

    this.feedbackText.setText(bannerText);
    this.feedbackBanner.setVisible(true);
    this.feedbackBanner.setScale(0.8);
    this.scene.tweens.add({
      targets: this.feedbackBanner,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });

    // 4. Notify reward granted immediately
    if (this.onRewardGranted) {
      this.onRewardGranted(rewardName.toLowerCase());
    }

    // 5. Wait 800ms, then slide out challenge and restore arena
    this.scene.time.delayedCall(850, () => {
      this.scene.tweens.add({
        targets: this.modalBox,
        y: -320,
        alpha: 0,
        duration: 320,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.container.setVisible(false);
          this.modalBox.y = 195;
          if (this.onModalClosed) {
            this.onModalClosed(rewardName.toLowerCase());
          }
        }
      });
    });
  }

  handleIncorrect(cardObj) {
    if (this.audioSystem) this.audioSystem.playWrong();

    // 1. Red highlight on wrong card
    this.drawCardBorder(cardObj.cardBg, 160, 142, 0xff4757, 0xffffff);

    // 2. "TRY AGAIN!" Feedback Banner
    this.feedbackBg.clear();
    this.feedbackBg.fillStyle(0xff4757, 1);
    this.feedbackBg.fillRoundedRect(-140, -18, 280, 36, 12);
    this.feedbackBg.lineStyle(2, 0xffffff, 1);
    this.feedbackBg.strokeRoundedRect(-140, -18, 280, 36, 12);

    this.feedbackText.setText('❌ TRY AGAIN!');
    this.feedbackBanner.setVisible(true);

    // 3. Shake animation on wrong card
    const originX = cardObj.baseX;
    this.scene.tweens.add({
      targets: cardObj.container,
      x: originX + 10,
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: 'Linear',
      onComplete: () => {
        cardObj.container.x = originX;

        // Wait brief delay, reset card style, and unlock for another attempt!
        this.scene.time.delayedCall(400, () => {
          this.drawCardBorder(cardObj.cardBg, 160, 142, 0xdcdde1, 0xffffff);
          this.feedbackBanner.setVisible(false);
          cardObj.container.setScale(1.0);
          this.isLocked = false; // UNLOCKED for next attempt!
        });
      }
    });
  }

  spawnConfetti() {
    const colors = [0xff4757, 0x2ed573, 0x1e90ff, 0xfffa65, 0xffa502];
    for (let i = 0; i < 28; i++) {
      const conf = this.scene.add.image(0, 0, 'confetti')
        .setDepth(35)
        .setScale(Phaser.Math.FloatBetween(0.6, 1.1))
        .setTint(colors[i % colors.length]);

      this.modalBox.add(conf);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(80, 240);

      this.scene.tweens.add({
        targets: conf,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        alpha: 0,
        duration: 750,
        ease: 'Quad.easeOut',
        onComplete: () => conf.destroy()
      });
    }
  }

  close() {
    this.container.setVisible(false);
    this.isLocked = false;
  }
}
