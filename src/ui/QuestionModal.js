import Phaser from 'phaser';

export default class QuestionModal {
  constructor(scene, audioSystem, rewardSystem, onRewardGranted, onModalClosed) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.rewardSystem = rewardSystem;
    this.onRewardGranted = onRewardGranted;
    this.onModalClosed = onModalClosed;
    this.currentQuestion = null;
    this.isAnswering = false;

    // Floating in upper center (y: 195) preserving 100% visibility of the arena, monsters, bridge, and river below!
    this.container = scene.add.container(640, 195).setDepth(30);
    this.container.setVisible(false);

    // Soft 30% vignette dimmer behind modal (fullscreen overlay)
    this.dimmer = scene.add.graphics();
    this.dimmer.fillStyle(0x050f1e, 0.35);
    this.dimmer.fillRect(-640, -195, 1280, 720);
    this.container.add(this.dimmer);

    this.modalBox = scene.add.container(0, 0);
    this.container.add(this.modalBox);

    this.createEventFrame();
  }

  createEventFrame() {
    // 1. Ornate Wooden & Golden Plaque Scroll
    this.scrollFrame = this.scene.add.image(0, 0, 'challenge_scroll').setOrigin(0.5, 0.5);
    this.modalBox.add(this.scrollFrame);

    // 2. Question Prompt Text in Golden Ribbon
    this.promptText = this.scene.add.text(0, -96, 'Where is the cat?', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      fontStyle: '900',
      color: '#3d2005'
    }).setOrigin(0.5);
    this.modalBox.add(this.promptText);

    // 3. Cards Container
    this.cardsContainer = this.scene.add.container(0, 18);
    this.modalBox.add(this.cardsContainer);

    // 4. Reward Banner
    this.rewardBanner = this.scene.add.container(0, 132);
    this.rewardBannerBg = this.scene.add.graphics();
    this.rewardBanner.add(this.rewardBannerBg);

    this.rewardBannerText = this.scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '17px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.rewardBanner.add(this.rewardBannerText);

    this.rewardBanner.setVisible(false);
    this.modalBox.add(this.rewardBanner);
  }

  showQuestion(question) {
    this.currentQuestion = question;
    this.isAnswering = false;
    this.rewardBanner.setVisible(false);

    this.promptText.setText(question.prompt);
    this.cardsContainer.removeAll(true);

    const cardDefs = [
      { key: 'mini_cat_in_box', label: 'IN', target: 'in' },
      { key: 'mini_cat_on_box', label: 'ON', target: 'on' },
      { key: 'mini_cat_under_box', label: 'UNDER', target: 'under' }
    ];

    // Determine correct answer index
    const targetPreposition = (question.target || 'on').toLowerCase();
    const correctIdx = cardDefs.findIndex(c => c.target === targetPreposition);
    this.currentQuestion.answer = correctIdx >= 0 ? correctIdx : 1;

    const cardW = 160;
    const cardH = 142;
    const spacing = 175;
    const startX = -spacing;

    this.cardObjects = [];

    cardDefs.forEach((def, i) => {
      const cardX = startX + i * spacing;
      const card = this.scene.add.container(cardX, 0);

      // Card Background with Rounded Border
      const cardBg = this.scene.add.graphics();
      cardBg.fillStyle(0xffffff, 0.98);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      cardBg.lineStyle(3, 0xdcdde1, 1);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      card.add(cardBg);

      // Illustrated Mini-Scene SVG
      const miniScene = this.scene.add.image(0, -20, def.key).setOrigin(0.5, 0.5);
      miniScene.setScale(0.92);
      card.add(miniScene);

      // Pill Label Button at Bottom
      const pillBg = this.scene.add.graphics();
      pillBg.fillStyle(0x0984e3, 1);
      pillBg.fillRoundedRect(-cardW / 2 + 12, cardH / 2 - 36, cardW - 24, 28, 8);
      card.add(pillBg);

      const pillTxt = this.scene.add.text(0, cardH / 2 - 22, def.label, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        fontStyle: '900',
        color: '#ffffff'
      }).setOrigin(0.5);
      card.add(pillTxt);

      // Emerald Checkmark Icon (Hidden initially)
      const checkSprite = this.scene.add.image(cardW / 2 - 12, -cardH / 2 + 12, 'card_checkmark')
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      card.add(checkSprite);

      // Hit Area
      const hit = this.scene.add.rectangle(0, 0, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      card.add(hit);

      hit.on('pointerover', () => {
        if (!this.isAnswering) card.setScale(1.05);
      });
      hit.on('pointerout', () => {
        if (!this.isAnswering) card.setScale(1.0);
      });
      hit.on('pointerdown', () => {
        if (!this.isAnswering) {
          card.setScale(0.96);
          this.handleCardSelected(i, card, cardBg, pillBg, pillTxt, checkSprite);
        }
      });
      hit.on('pointerup', () => {
        if (!this.isAnswering) card.setScale(1.0);
      });

      this.cardsContainer.add(card);
      this.cardObjects.push({ card, cardBg, pillBg, pillTxt, checkGfx: checkSprite });
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
      duration: 320,
      ease: 'Back.easeOut'
    });
  }

  handleCardSelected(index, card, cardBg, pillBg, pillTxt, checkSprite) {
    if (this.isAnswering) return;

    const isCorrect = index === this.currentQuestion.answer;

    if (isCorrect) {
      this.isAnswering = true;
      if (this.audioSystem) this.audioSystem.playCorrect();

      // Card emerald highlight & checkmark badge
      cardBg.clear();
      cardBg.fillStyle(0xffffff, 1);
      cardBg.fillRoundedRect(-160 / 2, -142 / 2, 160, 142, 14);
      cardBg.lineStyle(4, 0x2ed573, 1);
      cardBg.strokeRoundedRect(-160 / 2, -142 / 2, 160, 142, 14);

      pillBg.clear();
      pillBg.fillStyle(0x2ed573, 1);
      pillBg.fillRoundedRect(-160 / 2 + 12, 142 / 2 - 36, 160 - 24, 28, 8);

      checkSprite.setVisible(true);
      checkSprite.setScale(0.2);
      this.scene.tweens.add({
        targets: checkSprite,
        scale: 1,
        duration: 250,
        ease: 'Back.easeOut'
      });

      // Confetti Explosion Shower
      this.spawnConfetti();

      // Earn Battle Reward
      const reward = this.rewardSystem.onCorrectAnswer(this.currentQuestion);

      // Reward Banner
      this.rewardBannerBg.clear();
      const isFire = reward.type === 'fireball';
      const isShield = reward.type === 'shield';
      const bannerColor = isFire ? 0xeb3b5a : isShield ? 0xf59e0b : 0x20bf6b;
      this.rewardBannerBg.fillStyle(bannerColor, 1);
      this.rewardBannerBg.fillRoundedRect(-190, -18, 380, 36, 12);
      this.rewardBannerBg.lineStyle(2, 0xffffff, 1);
      this.rewardBannerBg.strokeRoundedRect(-190, -18, 380, 36, 12);

      this.rewardBannerText.setText(`${reward.label} ${reward.badge}`);
      this.rewardBanner.setVisible(true);
      this.rewardBanner.setScale(0.8);
      this.scene.tweens.add({
        targets: this.rewardBanner,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut'
      });

      // Immediately grant reward so monster pulls out weapon and button changes!
      if (this.onRewardGranted) {
        this.onRewardGranted(reward);
      }

      // Smooth slide-up transition into battle
      this.scene.time.delayedCall(500, () => {
        this.scene.tweens.add({
          targets: this.modalBox,
          y: -280,
          alpha: 0,
          duration: 300,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.container.setVisible(false);
            this.modalBox.y = 0;
            if (this.onModalClosed) {
              this.onModalClosed(reward);
            }
          }
        });
      });
    } else {
      // Wrong answer - Immediate retry without losing turn
      if (this.audioSystem) this.audioSystem.playWrong();

      cardBg.lineStyle(3, 0xff4757, 1);
      cardBg.strokeRoundedRect(-160 / 2, -142 / 2, 160, 142, 14);

      this.scene.tweens.add({
        targets: card,
        x: card.x + 8,
        duration: 35,
        yoyo: true,
        repeat: 4,
        ease: 'Linear'
      });
    }
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
  }
}
