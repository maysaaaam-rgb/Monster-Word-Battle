import Phaser from 'phaser';

export default class HUD {
  constructor(scene, audioSystem, onPlayAgain) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.onPlayAgain = onPlayAgain;
    this.p1Hp = 100;
    this.p2Hp = 100;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(22);

    this.createPlayer1HUD();
    this.createPlayer2HUD();
    this.createWindIndicator();
    this.createVictoryOverlay();
  }

  createPlayer1HUD() {
    const x = 160;
    const y = 48;

    // Card background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131e3a, 0.92);
    bg.fillRoundedRect(x - 130, y - 36, 260, 68, 16);
    bg.lineStyle(3, 0x0984e3, 1);
    bg.strokeRoundedRect(x - 130, y - 36, 260, 68, 16);
    this.container.add(bg);

    // Golden Beveled Avatar Frame
    const frame = this.scene.add.image(x - 95, y - 2, 'avatar_frame').setScale(0.85);
    this.container.add(frame);

    // Mini Avatar inside frame
    const avatar = this.scene.add.image(x - 95, y - 2, 'blue_body').setScale(0.35);
    this.container.add(avatar);

    // Player 1 Name
    const name = this.scene.add.text(x - 55, y - 28, 'PLAYER 1', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffffff'
    });
    this.container.add(name);

    // Hearts
    this.p1Hearts = this.scene.add.text(x + 45, y - 30, '❤️❤️❤️', {
      fontSize: '13px'
    });
    this.container.add(this.p1Hearts);

    // HP Bar Frame
    const barFrame = this.scene.add.image(x + 28, y + 4, 'hp_bar_frame').setScale(0.85, 0.85);
    this.container.add(barFrame);

    // HP Bar Fill
    const barWidth = 160;
    const barHeight = 12;
    const barX = x - 52;
    const barY = y - 2;

    this.p1BarFill = this.scene.add.graphics();
    this.drawHPBar(this.p1BarFill, barX, barY, barWidth, barHeight, 1, 0x2ed573);
    this.container.add(this.p1BarFill);

    // HP Numerical Readout
    this.p1HpText = this.scene.add.text(barX + barWidth / 2, barY + barHeight / 2, '100 HP', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.p1HpText);

    this.p1BarConfig = { x: barX, y: barY, w: barWidth, h: barHeight };

    // Collectible Ability Badges: [🔥] [🛡️] [💚] [🪨]
    this.p1Abilities = this.createAbilityBadges(x - 130, y + 40, ['ability_fire', 'ability_shield', 'ability_heal', 'ability_rock'], 0);
  }

  createPlayer2HUD() {
    const x = 1120;
    const y = 48;

    // Card background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131e3a, 0.92);
    bg.fillRoundedRect(x - 130, y - 36, 260, 68, 16);
    bg.lineStyle(3, 0xeb3b5a, 1);
    bg.strokeRoundedRect(x - 130, y - 36, 260, 68, 16);
    this.container.add(bg);

    // Golden Avatar Frame
    const frame = this.scene.add.image(x - 95, y - 2, 'avatar_frame').setScale(0.85);
    this.container.add(frame);

    // Mini Avatar inside frame
    const avatar = this.scene.add.image(x - 95, y - 2, 'red_body').setScale(0.35);
    this.container.add(avatar);

    // Player 2 Name
    const name = this.scene.add.text(x - 55, y - 28, 'PLAYER 2', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffffff'
    });
    this.container.add(name);

    // Hearts
    this.p2Hearts = this.scene.add.text(x + 45, y - 30, '❤️❤️❤️', {
      fontSize: '13px'
    });
    this.container.add(this.p2Hearts);

    // HP Bar Frame
    const barFrame = this.scene.add.image(x + 28, y + 4, 'hp_bar_frame').setScale(0.85, 0.85);
    this.container.add(barFrame);

    // HP Bar Fill
    const barWidth = 160;
    const barHeight = 12;
    const barX = x - 52;
    const barY = y - 2;

    this.p2BarFill = this.scene.add.graphics();
    this.drawHPBar(this.p2BarFill, barX, barY, barWidth, barHeight, 1, 0xeb3b5a);
    this.container.add(this.p2BarFill);

    this.p2HpText = this.scene.add.text(barX + barWidth / 2, barY + barHeight / 2, '100 HP', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.p2HpText);

    this.p2BarConfig = { x: barX, y: barY, w: barWidth, h: barHeight };

    // Ability Badges
    this.p2Abilities = this.createAbilityBadges(x - 130, y + 40, ['ability_rock', 'ability_shield', 'ability_heal', 'ability_fire'], 0);
  }

  createAbilityBadges(startX, startY, iconKeys, activeIndex = 0) {
    const badges = [];
    iconKeys.forEach((key, i) => {
      const bx = startX + 22 + i * 36;
      const by = startY + 12;

      const badge = this.scene.add.image(bx, by, key)
        .setScale(0.68)
        .setAlpha(i === activeIndex ? 1 : 0.65);

      this.container.add(badge);
      badges.push(badge);
    });
    return badges;
  }

  createWindIndicator() {
    const x = 640;
    const y = 48;

    // Metallic Wind Badge
    const badge = this.scene.add.image(x, y, 'wind_gauge_badge').setScale(1.1);
    this.container.add(badge);

    this.windText = this.scene.add.text(x, y, '💨 WIND ➔ 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.windText);
  }

  updateWind(wind) {
    const arrow = wind > 0 ? '➔' : wind < 0 ? '⬅' : '●';
    const absSpeed = Math.abs(wind);
    this.windText.setText(`💨 WIND ${arrow} ${absSpeed}`);

    if (wind > 0) this.windText.setColor('#ff9ff3');
    else if (wind < 0) this.windText.setColor('#48dbfb');
    else this.windText.setColor('#f1c40f');
  }

  drawHPBar(gfx, x, y, w, h, ratio, color) {
    gfx.clear();
    const fillW = Math.max(0, w * ratio);
    if (fillW > 0) {
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(x, y, fillW, h, 6);
    }
  }

  updateP1Health(hp) {
    this.p1Hp = Math.max(0, Math.min(100, hp));
    const ratio = this.p1Hp / 100;
    const color = ratio > 0.5 ? 0x2ed573 : ratio > 0.25 ? 0xffa502 : 0xff4757;
    const { x, y, w, h } = this.p1BarConfig;
    this.drawHPBar(this.p1BarFill, x, y, w, h, ratio, color);
    this.p1HpText.setText(`${this.p1Hp} HP`);

    if (this.p1Hp <= 0) this.p1Hearts.setText('🖤🖤🖤');
    else if (this.p1Hp <= 35) this.p1Hearts.setText('❤️🖤🖤');
    else if (this.p1Hp <= 70) this.p1Hearts.setText('❤️❤️🖤');
    else this.p1Hearts.setText('❤️❤️❤️');
  }

  updateP2Health(hp) {
    this.p2Hp = Math.max(0, Math.min(100, hp));
    const ratio = this.p2Hp / 100;
    const color = ratio > 0.5 ? 0x2ed573 : ratio > 0.25 ? 0xffa502 : 0xff4757;
    const { x, y, w, h } = this.p2BarConfig;
    this.drawHPBar(this.p2BarFill, x, y, w, h, ratio, color);
    this.p2HpText.setText(`${this.p2Hp} HP`);

    if (this.p2Hp <= 0) this.p2Hearts.setText('🖤🖤🖤');
    else if (this.p2Hp <= 35) this.p2Hearts.setText('❤️🖤🖤');
    else if (this.p2Hp <= 70) this.p2Hearts.setText('❤️❤️🖤');
    else this.p2Hearts.setText('❤️❤️❤️');
  }

  createVictoryOverlay() {
    this.victoryContainer = this.scene.add.container(640, 360).setDepth(40);
    this.victoryContainer.setVisible(false);

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x0c1829, 0.75);
    overlay.fillRect(-640, -360, 1280, 720);
    this.victoryContainer.add(overlay);

    const banner = this.scene.add.graphics();
    banner.fillStyle(0x131e3a, 0.95);
    banner.fillRoundedRect(-240, -110, 480, 220, 24);
    banner.lineStyle(4, 0xf1c40f, 1);
    banner.strokeRoundedRect(-240, -110, 480, 220, 24);
    this.victoryContainer.add(banner);

    this.victoryTitle = this.scene.add.text(0, -50, 'VICTORY!', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '44px',
      fontStyle: '900',
      color: '#fffa65',
      stroke: '#d35400',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.victoryContainer.add(this.victoryTitle);

    this.victorySubtitle = this.scene.add.text(0, 10, 'PLAYER 1 WINS THE BATTLE!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.victoryContainer.add(this.victorySubtitle);

    const playAgainBtn = this.scene.add.container(0, 65);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x2ed573, 1);
    btnBg.fillRoundedRect(-100, -22, 200, 44, 14);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.strokeRoundedRect(-100, -22, 200, 44, 14);
    playAgainBtn.add(btnBg);

    const btnTxt = this.scene.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    playAgainBtn.add(btnTxt);

    const hit = this.scene.add.rectangle(0, 0, 200, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    playAgainBtn.add(hit);

    hit.on('pointerdown', () => {
      this.victoryContainer.setVisible(false);
      if (this.onPlayAgain) this.onPlayAgain();
    });

    this.victoryContainer.add(playAgainBtn);
  }

  showVictory(winner) {
    if (this.audioSystem) this.audioSystem.playVictory();
    this.victoryTitle.setText(`${winner} WINS!`);
    this.victoryContainer.setVisible(true);
    this.victoryContainer.setScale(0.7);
    this.scene.tweens.add({
      targets: this.victoryContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: 'Back.easeOut'
    });
  }

  reset() {
    this.victoryContainer.setVisible(false);
    this.updateP1Health(100);
    this.updateP2Health(100);
  }
}
