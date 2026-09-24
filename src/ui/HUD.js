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
    const cx = 130;
    const cy = 30;
    const w = 185;
    const h = 40;

    // Compact Pill Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131e3a, 0.92);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    bg.lineStyle(2, 0x0984e3, 1);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    this.container.add(bg);

    // Player 1 Name
    const name = this.scene.add.text(cx - 82, cy - 14, 'PLAYER', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#feca57',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.container.add(name);

    // Hearts
    this.p1Hearts = this.scene.add.text(cx + 18, cy - 14, '❤️❤️❤️', {
      fontSize: '11px'
    });
    this.container.add(this.p1Hearts);

    // HP Bar Track
    const barWidth = 105;
    const barHeight = 8;
    const barX = cx - 82;
    const barY = cy + 5;

    const track = this.scene.add.graphics();
    track.fillStyle(0x1e272e, 1);
    track.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    this.container.add(track);

    // HP Bar Fill
    this.p1BarFill = this.scene.add.graphics();
    this.drawHPBar(this.p1BarFill, barX, barY, barWidth, barHeight, 1, 0x2ed573);
    this.container.add(this.p1BarFill);

    // HP Numerical Readout
    this.p1HpText = this.scene.add.text(barX + barWidth + 14, barY + barHeight / 2, '100 HP', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(this.p1HpText);

    this.p1BarConfig = { x: barX, y: barY, w: barWidth, h: barHeight };
    this.p1Abilities = [];
  }

  createPlayer2HUD() {
    const cx = 1150;
    const cy = 30;
    const w = 185;
    const h = 40;

    // Compact Pill Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131e3a, 0.92);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    bg.lineStyle(2, 0xeb3b5a, 1);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    this.container.add(bg);

    // Player 2 Name
    const name = this.scene.add.text(cx - 82, cy - 14, 'ENEMY', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.container.add(name);

    // Hearts
    this.p2Hearts = this.scene.add.text(cx + 18, cy - 14, '❤️❤️❤️', {
      fontSize: '11px'
    });
    this.container.add(this.p2Hearts);

    // HP Bar Track
    const barWidth = 105;
    const barHeight = 8;
    const barX = cx - 82;
    const barY = cy + 5;

    const track = this.scene.add.graphics();
    track.fillStyle(0x1e272e, 1);
    track.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    this.container.add(track);

    // HP Bar Fill
    this.p2BarFill = this.scene.add.graphics();
    this.drawHPBar(this.p2BarFill, barX, barY, barWidth, barHeight, 1, 0xeb3b5a);
    this.container.add(this.p2BarFill);

    // HP Numerical Readout
    this.p2HpText = this.scene.add.text(barX + barWidth + 14, barY + barHeight / 2, '100 HP', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(this.p2HpText);

    this.p2BarConfig = { x: barX, y: barY, w: barWidth, h: barHeight };
    this.p2Abilities = [];
  }

  createWindIndicator() {
    const x = 640;
    const y = 30;

    // Compact Metallic Wind Badge
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131e3a, 0.92);
    bg.fillRoundedRect(x - 65, y - 16, 130, 32, 10);
    bg.lineStyle(2, 0xf39c12, 1);
    bg.strokeRoundedRect(x - 65, y - 16, 130, 32, 10);
    this.container.add(bg);

    this.windText = this.scene.add.text(x, y, '💨 WIND 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.windText);
  }

  updateWind(wind) {
    const arrow = wind > 0 ? '→' : wind < 0 ? '←' : '0';
    const absSpeed = Math.abs(wind);
    const text = wind === 0 ? '🌬 WIND 0' : `🌬 WIND ${arrow} ${absSpeed}`;
    this.windText.setText(text);

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
