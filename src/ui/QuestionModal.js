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
    this.isCorrectRewardPending = false;
    this.cards = [];

    // Root Container
    this.container = scene.add.container(0, 0).setDepth(40);
    this.container.setVisible(false);

    // 1. Interactive Input Blocker (Dims subtly at 0.15 to keep full battlefield clearly visible)
    this.blocker = scene.add.rectangle(0, 0, 1280, 720, 0x050f1e, 0.15)
      .setOrigin(0, 0)
      .setInteractive();

    this.blocker.on('pointerdown', (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      console.log('[QUESTION] Background click blocked');
    });
    this.container.add(this.blocker);

    // 2. Floating Plaque Box (Upper center at x: 640, y: 125)
    this.modalBox = scene.add.container(640, 125);
    this.container.add(this.modalBox);

    this.createEventFrame();
  }

  createEventFrame() {
    // Compact Header Banner Pill
    this.bannerBg = this.scene.add.graphics();
    this.bannerBg.fillStyle(0x131e3a, 0.94);
    this.bannerBg.fillRoundedRect(-220, -68, 440, 36, 12);
    this.bannerBg.lineStyle(2, 0xf39c12, 1);
    this.bannerBg.strokeRoundedRect(-220, -68, 440, 36, 12);
    this.modalBox.add(this.bannerBg);

    // Question Prompt Text in Plaque Banner Ribbon
    this.promptText = this.scene.add.text(0, -50, '🎯 Where is the cat?', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.modalBox.add(this.promptText);

    // Container for Answer Cards
    this.cardsContainer = this.scene.add.container(0, 8);
    this.modalBox.add(this.cardsContainer);

    // Debug Indicator Text below the cards (Hidden from view to keep canvas pristine)
    this.debugIndicator = this.scene.add.text(0, 68, 'ANSWER CLICKED: NONE', {
      fontFamily: 'monospace, system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#feca57'
    }).setOrigin(0.5).setVisible(false);
    this.modalBox.add(this.debugIndicator);

    // Status / Feedback Banner below cards
    this.feedbackBanner = this.scene.add.container(0, 68);
    this.feedbackBg = this.scene.add.graphics();
    this.feedbackBanner.add(this.feedbackBg);

    this.feedbackText = this.scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
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
    this.isCorrectRewardPending = false;
    this.feedbackBanner.setVisible(false);

    // Reset debug indicator to initial state
    this.debugIndicator.setText('ANSWER CLICKED: NONE');

    this.promptText.setText(`🎯 ${question.prompt}`);
    this.cardsContainer.removeAll(true);
    this.cards = [];

    const choices = question.choices || [];
    const cardW = 105;
    const cardH = 92;
    const spacing = 118;
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
    this.modalBox.y = 125;

    this.scene.tweens.add({
      targets: this.modalBox,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut'
    });
  }

  handleCardClicked(selectedIndex, cardComponent) {
    // If locked, reject click
    if (this.isLocked || this.isCorrectRewardPending) {
      return;
    }
    this.isLocked = true;

    // Debug indicator update & console log
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
    this.isCorrectRewardPending = true;
    if (this.audioSystem) this.audioSystem.playCorrect();

    // 1. Highlight clicked card with green state
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

    this.showFeedback(bannerText, bannerColor);

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
        duration: 280,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.container.setVisible(false);
          this.modalBox.y = 125;
          this.modalBox.setAlpha(1);
          this.isLocked = false;
          this.isCorrectRewardPending = false;
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
    this.showFeedback('❌ TRY AGAIN!', 0xff4757);

    // 2. Card turns RED, shakes, shows "TRY AGAIN", then resets
    cardComponent.setStateIncorrect(() => {
      this.resetAllCards();
    });

    // Safety watchdog: guarantees unlock after 550ms if anything interrupted the tween
    this.scene.time.delayedCall(550, () => {
      if (this.isLocked && !this.isCorrectRewardPending) {
        this.resetAllCards();
      }
    });
  }

  resetAllCards() {
    this.cards.forEach(card => {
      card.resetToNormal();
    });
    this.feedbackBanner.setVisible(false);
    this.isLocked = false;
  }

  showFeedback(text, color) {
    this.feedbackBg.clear();
    this.feedbackBg.fillStyle(color, 1);
    this.feedbackBg.fillRoundedRect(-180, -18, 360, 36, 12);
    this.feedbackBg.lineStyle(2, 0xffffff, 1);
    this.feedbackBg.strokeRoundedRect(-180, -18, 360, 36, 12);

    this.feedbackText.setText(text);
    this.feedbackBanner.setVisible(true);
    this.feedbackBanner.setScale(0.85);

    this.scene.tweens.add({
      targets: this.feedbackBanner,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
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
    this.isCorrectRewardPending = false;
  }
}
