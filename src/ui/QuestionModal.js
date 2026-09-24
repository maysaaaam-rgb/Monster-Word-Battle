import Phaser from 'phaser';
import AnswerCard from './AnswerCard.js';

export default class QuestionModal {
  constructor(scene, audioSystem, onRewardGranted, onModalClosed) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.onRewardGranted = onRewardGranted;
    this.onModalClosed = onModalClosed;
    this.currentQuestion = null;
    this.isLocked = false;
    this.cards = [];

    // Root Container
    this.container = scene.add.container(0, 0).setDepth(40);
    this.container.setVisible(false);

    // 1. Full-screen Interactive Input Blocker (Prevents ANY pointer events passing to arena/monsters/controls)
    this.blocker = scene.add.rectangle(0, 0, 1280, 720, 0x050f1e, 0.42)
      .setOrigin(0, 0)
      .setInteractive();

    this.blocker.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      console.log('[QUESTION] Background click blocked');
    });
    this.container.add(this.blocker);

    // 2. Floating Plaque Box (Upper center at x: 640, y: 195)
    this.modalBox = scene.add.container(640, 195);
    this.container.add(this.modalBox);

    this.createEventFrame();
  }

  createEventFrame() {
    // Ornate Wooden Plaque Frame
    if (this.scene.textures.exists('challenge_scroll')) {
      this.scrollFrame = this.scene.add.image(0, 0, 'challenge_scroll').setOrigin(0.5, 0.5);
      this.modalBox.add(this.scrollFrame);
    }

    // Question Prompt Text in Plaque Banner Ribbon
    this.promptText = this.scene.add.text(0, -96, 'Where is the cat?', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#3d2005'
    }).setOrigin(0.5);
    this.modalBox.add(this.promptText);

    // Container for Answer Cards
    this.cardsContainer = this.scene.add.container(0, 14);
    this.modalBox.add(this.cardsContainer);

    // Debug Indicator Text below the cards
    this.debugIndicator = this.scene.add.text(0, 96, 'ANSWER CLICKED: NONE', {
      fontFamily: 'monospace, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#feca57',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1e272edd',
      padding: { x: 10, y: 3 }
    }).setOrigin(0.5);
    this.modalBox.add(this.debugIndicator);

    // Status / Feedback Banner below debug indicator
    this.feedbackBanner = this.scene.add.container(0, 134);
    this.feedbackBg = this.scene.add.graphics();
    this.feedbackBanner.add(this.feedbackBg);

    this.feedbackText = this.scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '17px',
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

    // Reset debug indicator to initial state
    this.debugIndicator.setText('ANSWER CLICKED: NONE');

    this.promptText.setText(question.prompt);
    this.cardsContainer.removeAll(true);
    this.cards = [];

    const choices = question.choices || [];
    const cardW = 160;
    const cardH = 142;
    const spacing = 175;
    const startX = -spacing;

    choices.forEach((choice, i) => {
      const cardX = startX + i * spacing;
      const card = new AnswerCard(
        this.scene,
        cardX,
        0,
        cardW,
        cardH,
        choice,
        i,
        (idx, cardComponent) => this.handleCardClicked(idx, cardComponent)
      );

      this.cardsContainer.add(card);
      this.cards.push(card);
    });

    // Animate Entrance
    this.container.setVisible(true);
    this.modalBox.setScale(0.7);
    this.modalBox.setAlpha(0);
    this.modalBox.y = 195;

    this.scene.tweens.add({
      targets: this.modalBox,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut'
    });
  }

  handleCardClicked(selectedIndex, cardComponent) {
    // 1. Double-click lockout: register ONLY ONE answer event
    if (this.isLocked) {
      return;
    }
    this.isLocked = true;

    // 2. Debug indicator update & console log
    const letters = ['A', 'B', 'C'];
    const letter = letters[selectedIndex] || `${selectedIndex + 1}`;
    this.debugIndicator.setText(`ANSWER CLICKED: ${letter}`);
    console.log(`[QUESTION] answer clicked: ${selectedIndex}`);

    const isCorrect = (selectedIndex === this.currentQuestion.correctIndex);

    if (isCorrect) {
      this.handleCorrect(cardComponent);
    } else {
      this.handleIncorrect(cardComponent);
    }
  }

  handleCorrect(cardComponent) {
    if (this.audioSystem) this.audioSystem.playCorrect();

    // 1. Highlight card with green state
    cardComponent.setStateCorrect();

    // 2. Disable all other cards
    this.cards.forEach(c => {
      if (c !== cardComponent) {
        c.setDisabled(true);
      }
    });

    // 3. Confetti Burst Shower
    this.spawnConfetti();

    // 4. Show Celebratory Reward Banner
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

    // 5. Grant in-game ability
    if (this.onRewardGranted) {
      this.onRewardGranted(rewardName.toLowerCase());
    }

    // 6. Wait ~800ms, close question overlay, restore battlefield
    this.scene.time.delayedCall(800, () => {
      this.scene.tweens.add({
        targets: this.modalBox,
        y: -320,
        alpha: 0,
        duration: 320,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.container.setVisible(false);
          this.modalBox.y = 195;
          this.modalBox.setAlpha(1);
          if (this.onModalClosed) {
            this.onModalClosed(rewardName.toLowerCase());
          }
        }
      });
    });
  }

  handleIncorrect(cardComponent) {
    if (this.audioSystem) this.audioSystem.playWrong();

    // 1. Show TRY AGAIN feedback banner
    this.feedbackBg.clear();
    this.feedbackBg.fillStyle(0xff4757, 1);
    this.feedbackBg.fillRoundedRect(-140, -18, 280, 36, 12);
    this.feedbackBg.lineStyle(2, 0xffffff, 1);
    this.feedbackBg.strokeRoundedRect(-140, -18, 280, 36, 12);

    this.feedbackText.setText('❌ TRY AGAIN!');
    this.feedbackBanner.setVisible(true);

    // 2. Card turns RED, shakes, shows "TRY AGAIN", returns to normal, then unlocks
    cardComponent.setStateIncorrect(() => {
      this.feedbackBanner.setVisible(false);
      this.isLocked = false; // Child CAN TRY AGAIN!
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
