import Phaser from 'phaser';

// --- Procedural Sound Effects (Web Audio API) ---
class AudioController {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
  playTone(freq, type, duration, endFreq = null) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
  sfxThrow() {
    this.playTone(400, 'sine', 0.25, 120);
  }
  sfxHit() {
    this.playTone(150, 'sawtooth', 0.3, 40);
  }
  sfxCorrect() {
    this.playTone(523.25, 'triangle', 0.15);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.25), 120);
  }
  sfxWrong() {
    this.playTone(220, 'square', 0.2, 110);
  }
}

const audio = new AudioController();

// --- Main Game Scene ---
class CatDogScene extends Phaser.Scene {
  constructor() {
    super('CatDogScene');
  }

  preload() {
    // Generate clean vector graphics procedurally
    this.createTextureAssets();
  }

  createTextureAssets() {
    if (this.textures.exists('cat')) return;

    // Helper for roundRect on canvas
    const drawRoundRect = (ctx, x, y, w, h, r) => {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
    };

    // 1. Cat (Left Character)
    const catCanvas = document.createElement('canvas');
    catCanvas.width = 120;
    catCanvas.height = 140;
    const cCtx = catCanvas.getContext('2d');
    
    // Ears
    cCtx.fillStyle = '#2FA4B8';
    cCtx.strokeStyle = '#1D2A3A';
    cCtx.lineWidth = 5;
    cCtx.beginPath();
    cCtx.moveTo(25, 45); cCtx.lineTo(10, 10); cCtx.lineTo(48, 25); cCtx.closePath();
    cCtx.fill(); cCtx.stroke();
    cCtx.beginPath();
    cCtx.moveTo(95, 45); cCtx.lineTo(110, 10); cCtx.lineTo(72, 25); cCtx.closePath();
    cCtx.fill(); cCtx.stroke();

    // Body
    cCtx.beginPath();
    cCtx.ellipse(60, 95, 35, 40, 0, 0, Math.PI * 2);
    cCtx.fill(); cCtx.stroke();

    // Head
    cCtx.beginPath();
    cCtx.ellipse(60, 52, 42, 32, 0, 0, Math.PI * 2);
    cCtx.fill(); cCtx.stroke();

    // Bandage on forehead
    cCtx.fillStyle = '#E8D8B8';
    cCtx.save();
    cCtx.translate(45, 35);
    cCtx.rotate(-0.2);
    cCtx.fillRect(-15, -6, 30, 12);
    cCtx.strokeRect(-15, -6, 30, 12);
    cCtx.restore();

    // Eyes
    cCtx.fillStyle = '#FFFFFF';
    cCtx.beginPath(); cCtx.arc(44, 52, 10, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();
    cCtx.beginPath(); cCtx.arc(76, 52, 10, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();
    cCtx.fillStyle = '#1D2A3A';
    cCtx.beginPath(); cCtx.arc(47, 52, 4, 0, Math.PI * 2); cCtx.fill();
    cCtx.beginPath(); cCtx.arc(79, 52, 4, 0, Math.PI * 2); cCtx.fill();

    // Snout & Whiskers
    cCtx.fillStyle = '#E67E96';
    cCtx.beginPath(); cCtx.arc(60, 62, 5, 0, Math.PI * 2); cCtx.fill();
    cCtx.strokeStyle = '#1D2A3A';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    cCtx.moveTo(25, 62); cCtx.lineTo(10, 60);
    cCtx.moveTo(25, 67); cCtx.lineTo(12, 72);
    cCtx.moveTo(95, 62); cCtx.lineTo(110, 60);
    cCtx.moveTo(95, 67); cCtx.lineTo(108, 72);
    cCtx.stroke();
    this.textures.addCanvas('cat', catCanvas);

    // 2. Dog (Right Character)
    const dogCanvas = document.createElement('canvas');
    dogCanvas.width = 140;
    dogCanvas.height = 140;
    const dCtx = dogCanvas.getContext('2d');

    // Droopy Ears
    dCtx.fillStyle = '#6E6259';
    dCtx.strokeStyle = '#1D2A3A';
    dCtx.lineWidth = 5;
    dCtx.beginPath(); dCtx.ellipse(22, 60, 14, 30, 0.3, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.beginPath(); dCtx.ellipse(118, 60, 14, 30, -0.3, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();

    // Body
    dCtx.fillStyle = '#9C8C7E';
    dCtx.beginPath(); dCtx.ellipse(70, 95, 42, 38, 0, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();

    // Head
    dCtx.beginPath(); dCtx.ellipse(70, 52, 46, 36, 0, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();

    // Eyes
    dCtx.fillStyle = '#FFFFFF';
    dCtx.beginPath(); dCtx.arc(52, 45, 11, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.beginPath(); dCtx.arc(88, 45, 11, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.fillStyle = '#1D2A3A';
    dCtx.beginPath(); dCtx.arc(49, 45, 5, 0, Math.PI * 2); dCtx.fill();
    dCtx.beginPath(); dCtx.arc(85, 45, 5, 0, Math.PI * 2); dCtx.fill();

    // Big Snout & Tongue
    dCtx.fillStyle = '#D1C4B9';
    dCtx.beginPath(); dCtx.ellipse(70, 68, 30, 20, 0, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.fillStyle = '#1D2A3A';
    dCtx.beginPath(); dCtx.arc(70, 60, 8, 0, Math.PI * 2); dCtx.fill();
    dCtx.fillStyle = '#E85D75';
    dCtx.beginPath(); dCtx.arc(70, 78, 10, 0, Math.PI); dCtx.fill(); dCtx.stroke();
    this.textures.addCanvas('dog', dogCanvas);

    // 3. Trash Can (Cat Base)
    const binCanvas = document.createElement('canvas');
    binCanvas.width = 120; binCanvas.height = 100;
    const bCtx = binCanvas.getContext('2d');
    bCtx.fillStyle = '#9EA7AA'; bCtx.strokeStyle = '#263238'; bCtx.lineWidth = 5;
    bCtx.beginPath();
    bCtx.moveTo(15, 10); bCtx.lineTo(105, 10); bCtx.lineTo(90, 95); bCtx.lineTo(30, 95);
    bCtx.closePath(); bCtx.fill(); bCtx.stroke();
    // Ribs
    bCtx.beginPath();
    bCtx.moveTo(42, 20); bCtx.lineTo(46, 85);
    bCtx.moveTo(60, 20); bCtx.lineTo(60, 85);
    bCtx.moveTo(78, 20); bCtx.lineTo(74, 85);
    bCtx.stroke();
    this.textures.addCanvas('trashcan', binCanvas);

    // 4. Dog Food Bowl Base
    const bowlCanvas = document.createElement('canvas');
    bowlCanvas.width = 120; bowlCanvas.height = 50;
    const boCtx = bowlCanvas.getContext('2d');
    boCtx.fillStyle = '#FF7043'; boCtx.strokeStyle = '#263238'; boCtx.lineWidth = 5;
    boCtx.beginPath();
    boCtx.moveTo(15, 10); boCtx.lineTo(105, 10); boCtx.lineTo(95, 45); boCtx.lineTo(25, 45);
    boCtx.closePath(); boCtx.fill(); boCtx.stroke();
    // Bone icon
    boCtx.fillStyle = '#FFFFFF';
    drawRoundRect(boCtx, 40, 22, 40, 10, 5);
    boCtx.fill();
    this.textures.addCanvas('dogbowl', bowlCanvas);

    // 5. Wooden Fence
    const fenceCanvas = document.createElement('canvas');
    fenceCanvas.width = 44; fenceCanvas.height = 240;
    const fCtx = fenceCanvas.getContext('2d');
    fCtx.fillStyle = '#BCAAA4'; fCtx.strokeStyle = '#3E2723'; fCtx.lineWidth = 4;
    fCtx.beginPath();
    fCtx.moveTo(4, 30); fCtx.lineTo(22, 4); fCtx.lineTo(40, 30);
    fCtx.lineTo(40, 236); fCtx.lineTo(4, 236); fCtx.closePath();
    fCtx.fill(); fCtx.stroke();
    this.textures.addCanvas('fence', fenceCanvas);

    // 6. Projectiles (Fish Bone / Dog Bone)
    const boneCanvas = document.createElement('canvas');
    boneCanvas.width = 32; boneCanvas.height = 32;
    const bnCtx = boneCanvas.getContext('2d');
    bnCtx.fillStyle = '#ECEFF1'; bnCtx.strokeStyle = '#37474F'; bnCtx.lineWidth = 3;
    drawRoundRect(bnCtx, 6, 12, 20, 8, 4);
    bnCtx.fill(); bnCtx.stroke();
    this.textures.addCanvas('bone', boneCanvas);
  }

  create() {
    window.catDogScene = this;
    this.catHp = 100;
    this.dogHp = 100;
    this.wind = 0;
    this.turn = 'CAT'; // 'CAT' or 'DOG'
    this.isCharging = false;
    this.chargePower = 0;
    this.isAimingAllowed = false;
    this.projectileInFlight = false;

    // Build World
    this.createBackground();
    this.createStageObjects();
    this.createUI();

    // Set Initial Wind & Start ESL Challenge
    this.changeWind();
    this.startTurn();
  }

  createBackground() {
    const { width, height } = this.scale;

    // Sky Gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x7ec8e3, 0x7ec8e3, 0xffe0b2, 0xfff3e0, 1);
    sky.fillRect(0, 0, width, height);

    // Cartoon Mountain Peaks
    const mountains = this.add.graphics();
    mountains.fillStyle(0x7986cb, 0.45);
    mountains.beginPath();
    mountains.moveTo(0, height - 120);
    mountains.lineTo(220, 180);
    mountains.lineTo(460, height - 120);
    mountains.lineTo(750, 160);
    mountains.lineTo(width, height - 100);
    mountains.lineTo(width, height);
    mountains.lineTo(0, height);
    mountains.closePath();
    mountains.fill();

    // Rolling Green Hills
    const hills = this.add.graphics();
    hills.fillStyle(0x81c784, 1);
    hills.fillEllipse(260, height - 40, 720, 280);
    hills.fillEllipse(800, height - 50, 840, 300);

    // Ground Floor
    const ground = this.add.graphics();
    ground.fillStyle(0x4caf50, 1);
    ground.lineStyle(6, 0x2e7d32);
    ground.fillRect(0, height - 70, width, 70);
    ground.strokeRect(0, height - 70, width, 70);
  }

  createStageObjects() {
    const { width, height } = this.scale;
    const floorY = height - 70;

    // Trash Can & Cat
    this.trashcan = this.add.image(130, floorY - 30, 'trashcan');
    this.cat = this.add.sprite(130, floorY - 110, 'cat');

    // Idle breathing animation for Cat
    this.tweens.add({
      targets: this.cat,
      scaleY: 1.04,
      scaleX: 0.98,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Dog Bowl & Dog
    this.dogbowl = this.add.image(width - 130, floorY - 15, 'dogbowl');
    this.dog = this.add.sprite(width - 130, floorY - 80, 'dog');

    // Idle breathing animation for Dog
    this.tweens.add({
      targets: this.dog,
      scaleY: 1.05,
      scaleX: 0.97,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Center Fence (Obstacle)
    this.fence = this.add.image(width / 2, floorY - 100, 'fence');
    this.physics.add.existing(this.fence, true); // Static collider
  }

  createUI() {
    const { width } = this.scale;

    // Top Header Status Plaque
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0xfff9c4, 0.95);
    headerBg.lineStyle(4, 0xf57f17);
    headerBg.fillRoundedRect(width / 2 - 280, 12, 560, 52, 16);
    headerBg.strokeRoundedRect(width / 2 - 280, 12, 560, 52, 16);

    // Cat HP Bar
    this.catHpFill = this.add.graphics();
    this.updateHealthBar('CAT');

    // Dog HP Bar
    this.dogHpFill = this.add.graphics();
    this.updateHealthBar('DOG');

    // Wind Indicator
    this.windText = this.add.text(width / 2, 38, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#d84315',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Power Charge Meter (Hidden until holding)
    this.powerBarBg = this.add.graphics().setVisible(false);
    this.powerBarFill = this.add.graphics().setVisible(false);

    // Input Events for Charging Throw
    this.input.on('pointerdown', () => {
      if (!this.isAimingAllowed || this.turn !== 'CAT' || this.projectileInFlight) return;
      this.isCharging = true;
      this.chargePower = 0;
      this.powerBarBg.setVisible(true);
      this.powerBarFill.setVisible(true);
    });

    this.input.on('pointerup', () => {
      if (this.isCharging) {
        this.isCharging = false;
        this.powerBarBg.setVisible(false);
        this.powerBarFill.setVisible(false);
        this.fireProjectile(this.chargePower, 'CAT');
      }
    });
  }

  updateHealthBar(target) {
    const { width } = this.scale;
    if (target === 'CAT') {
      this.catHpFill.clear();
      this.catHpFill.fillStyle(0x00e676, 1);
      this.catHpFill.fillRoundedRect(width / 2 - 260, 24, Math.max(0, this.catHp * 1.8), 18, 6);
    } else {
      this.dogHpFill.clear();
      this.dogHpFill.fillStyle(0x00e676, 1);
      const fillW = Math.max(0, this.dogHp * 1.8);
      this.dogHpFill.fillRoundedRect(width / 2 + 260 - fillW, 24, fillW, 18, 6);
    }
  }

  changeWind() {
    // Random wind between -6 and +6
    this.wind = Phaser.Math.Between(-6, 6);
    const arrow = this.wind > 0 ? '▶▶' : (this.wind < 0 ? '◀◀' : '—');
    this.windText.setText(`WIND: ${arrow} ${Math.abs(this.wind)}`);
  }

  startTurn() {
    this.isAimingAllowed = false;
    if (this.turn === 'CAT') {
      this.promptESLQuestion();
    } else {
      // Opponent (Dog) Turn logic after 1 second delay
      this.time.delayedCall(1000, () => this.runDogAITurn());
    }
  }

  promptESLQuestion() {
    const questions = [
      { q: "The cat is ____ the trash bin.", opts: ["ON", "UNDER", "INTO"], ans: "ON" },
      { q: "Yesterday the dog ____ a big bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" },
      { q: "Choose the opposite of 'HIGH':", opts: ["LOW", "FAST", "TALL"], ans: "LOW" },
      { q: "Cats love to catch ____.", opts: ["MICE", "DOGS", "TREES"], ans: "MICE" },
      { q: "The dog is sleeping ____ the tree.", opts: ["UNDER", "ABOVE", "THROUGH"], ans: "UNDER" },
      { q: "The bone is ____ the food bowl.", opts: ["IN", "BETWEEN", "AMONG"], ans: "IN" }
    ];
    const item = Phaser.Utils.Array.GetRandom(questions);

    // Modal Background Plaque
    const modal = this.add.container(this.scale.width / 2, 190);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.98);
    bg.lineStyle(5, 0x3f51b5);
    bg.fillRoundedRect(-220, -75, 440, 150, 16);
    bg.strokeRoundedRect(-220, -75, 440, 150, 16);
    modal.add(bg);

    const title = this.add.text(0, -45, item.q, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#1a237e'
    }).setOrigin(0.5);
    modal.add(title);

    // Option Buttons
    item.opts.forEach((opt, idx) => {
      const btnX = -130 + idx * 130;
      const btnY = 15;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x3f51b5, 1);
      btnBg.fillRoundedRect(btnX - 55, btnY - 22, 110, 44, 10);
      modal.add(btnBg);

      const btnTxt = this.add.text(btnX, btnY, opt, {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      modal.add(btnTxt);

      const hitZone = this.add.rectangle(btnX, btnY, 110, 44, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      modal.add(hitZone);

      hitZone.on('pointerdown', (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        if (opt === item.ans) {
          audio.sfxCorrect();
          modal.destroy();
          this.isAimingAllowed = true;
          this.showFeedbackToast("CORRECT! HOLD & RELEASE TO THROW!", 0x2e7d32);
        } else {
          audio.sfxWrong();
          this.tweens.add({
            targets: modal,
            x: modal.x + 10,
            duration: 60,
            yoyo: true,
            repeat: 3
          });
        }
      });
    });
  }

  showFeedbackToast(text, color) {
    const toast = this.add.text(this.scale.width / 2, 110, text, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#' + color.toString(16).padStart(6, '0'),
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5);

    this.time.delayedCall(1600, () => toast.destroy());
  }

  fireProjectile(power, shooter) {
    this.projectileInFlight = true;
    this.isAimingAllowed = false;
    audio.sfxThrow();

    const startX = shooter === 'CAT' ? this.cat.x + 30 : this.dog.x - 30;
    const startY = shooter === 'CAT' ? this.cat.y - 10 : this.dog.y - 10;
    
    const proj = this.physics.add.sprite(startX, startY, 'bone');
    proj.setAngularVelocity(shooter === 'CAT' ? 360 : -360);

    // Initial launch velocity with wind influence
    const angleRad = shooter === 'CAT' ? -55 * (Math.PI / 180) : -125 * (Math.PI / 180);
    const speed = 250 + (power * 7.5);
    proj.setVelocity(
      Math.cos(angleRad) * speed + (this.wind * 20),
      Math.sin(angleRad) * speed
    );

    // Continuous wind drift
    const flightTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (proj && proj.body) {
          proj.setVelocityX(proj.body.velocity.x + this.wind * 1.5);
        }
      }
    });

    // Collision with Fence
    this.physics.add.collider(proj, this.fence, () => {
      flightTimer.remove();
      audio.sfxHit();
      proj.destroy();
      this.endTurn();
    });

    // Collision Check Loop (Floor or Opponent)
    const checkCollision = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!proj.active) {
          checkCollision.remove();
          return;
        }

        // Missed hit on Ground
        if (proj.y >= this.scale.height - 70) {
          flightTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.endTurn();
          return;
        }

        // Cat hit Dog
        if (shooter === 'CAT' && Phaser.Math.Distance.Between(proj.x, proj.y, this.dog.x, this.dog.y) < 45) {
          flightTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.applyDamage('DOG', 25);
          return;
        }

        // Dog hit Cat
        if (shooter === 'DOG' && Phaser.Math.Distance.Between(proj.x, proj.y, this.cat.x, this.cat.y) < 45) {
          flightTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.applyDamage('CAT', 25);
          return;
        }
      }
    });
  }

  applyDamage(target, amount) {
    audio.sfxHit();
    this.cameras.main.shake(200, 0.015);

    if (target === 'DOG') {
      this.dogHp = Math.max(0, this.dogHp - amount);
      this.updateHealthBar('DOG');
      this.tweens.add({ targets: this.dog, tint: 0xff5252, duration: 80, yoyo: true, repeat: 2 });
    } else {
      this.catHp = Math.max(0, this.catHp - amount);
      this.updateHealthBar('CAT');
      this.tweens.add({ targets: this.cat, tint: 0xff5252, duration: 80, yoyo: true, repeat: 2 });
    }

    if (this.catHp <= 0 || this.dogHp <= 0) {
      this.time.delayedCall(600, () => this.gameOver(target === 'DOG' ? 'CAT' : 'DOG'));
    } else {
      this.endTurn();
    }
  }

  runDogAITurn() {
    // Dog AI estimates shot based on distance and current wind
    const estimatedPower = Phaser.Math.Clamp(50 - (this.wind * 3.5) + Phaser.Math.Between(-8, 8), 20, 95);
    this.fireProjectile(estimatedPower, 'DOG');
  }

  endTurn() {
    this.projectileInFlight = false;
    this.turn = this.turn === 'CAT' ? 'DOG' : 'CAT';
    this.changeWind();
    this.time.delayedCall(800, () => this.startTurn());
  }

  gameOver(winner) {
    const banner = this.add.text(this.scale.width / 2, this.scale.height / 2, `${winner} WINS!`, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffeb3b',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => this.scene.restart());
  }

  update() {
    if (this.isCharging && this.chargePower < 100) {
      this.chargePower += 1.8;
      
      // Update charge bar directly over Cat
      this.powerBarBg.clear();
      this.powerBarBg.fillStyle(0x000000, 0.6);
      this.powerBarBg.fillRoundedRect(this.cat.x - 35, this.cat.y - 75, 70, 10, 4);

      this.powerBarFill.clear();
      this.powerBarFill.fillStyle(0xff9800, 1);
      this.powerBarFill.fillRoundedRect(this.cat.x - 35, this.cat.y - 75, (this.chargePower / 100) * 70, 10, 4);
    }
  }
}

// --- Phaser Game Configuration ---
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 576,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 650 },
      debug: false
    }
  },
  scene: [CatDogScene]
};

const game = new Phaser.Game(config);
window.game = game;

export default game;
