import Phaser from 'phaser';

// Polyfill CanvasRenderingContext2D.roundRect if missing
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii[0] || 0 : (typeof radii === 'number' ? radii : 0);
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

class AudioController {
  constructor() { this.ctx = null; }
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
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
  sfxThrow() { this.playTone(380, 'sine', 0.28, 90); }
  sfxHit() { this.playTone(160, 'sawtooth', 0.35, 30); }
  sfxCorrect() {
    this.playTone(520, 'triangle', 0.12);
    setTimeout(() => this.playTone(680, 'triangle', 0.2), 100);
  }
  sfxWrong() { this.playTone(200, 'square', 0.25, 90); }
}

const audio = new AudioController();

class CatDogScene extends Phaser.Scene {
  constructor() {
    super('CatDogScene');
  }

  preload() {
    this.generateAuthenticArt();
  }

  generateAuthenticArt() {
    if (this.textures.exists('cat_handdrawn')) return;

    // --- 1. Authentic Fleabag (Cat) ---
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 160; cCanvas.height = 180;
    const c = cCanvas.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';

    // Tail
    c.strokeStyle = '#1a2634'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(35, 135); c.quadraticCurveTo(10, 110, 20, 80); c.stroke();
    c.strokeStyle = '#29B6A8'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(35, 135); c.quadraticCurveTo(10, 110, 20, 80); c.stroke();

    // Body (sitting scruffy pose)
    c.fillStyle = '#29B6A8'; c.strokeStyle = '#1a2634'; c.lineWidth = 5;
    c.beginPath();
    c.moveTo(50, 100);
    c.bezierCurveTo(35, 120, 35, 150, 55, 160);
    c.lineTo(110, 160);
    c.bezierCurveTo(125, 145, 115, 115, 95, 100);
    c.closePath();
    c.fill(); c.stroke();

    // Chest ribs/fur
    c.strokeStyle = '#1a2634'; c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(60, 120); c.lineTo(75, 122);
    c.moveTo(58, 130); c.lineTo(78, 133);
    c.moveTo(62, 140); c.lineTo(76, 142);
    c.stroke();

    // Big Head
    c.fillStyle = '#29B6A8'; c.strokeStyle = '#1a2634'; c.lineWidth = 5;
    c.beginPath();
    c.ellipse(75, 65, 48, 38, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();

    // Left Ear (Bandaged)
    c.beginPath();
    c.moveTo(38, 50); c.lineTo(22, 12); c.lineTo(58, 32);
    c.closePath(); c.fill(); c.stroke();
    // Ear bandage wrap
    c.fillStyle = '#F5E6CC'; c.lineWidth = 3.5;
    c.fillRect(25, 20, 20, 12); c.strokeRect(25, 20, 20, 12);

    // Right Ear
    c.fillStyle = '#29B6A8'; c.lineWidth = 5;
    c.beginPath();
    c.moveTo(95, 34); c.lineTo(130, 15); c.lineTo(112, 52);
    c.closePath(); c.fill(); c.stroke();

    // White Head Gauze Bandage
    c.fillStyle = '#FFF8E7'; c.lineWidth = 3.5;
    c.save(); c.translate(50, 44); c.rotate(-0.2);
    c.fillRect(-18, -9, 36, 18); c.strokeRect(-18, -9, 36, 18);
    c.restore();

    // Cheerful / Mischievous Eyes
    c.fillStyle = '#FFF'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(60, 65, 12, 16, -0.05, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(92, 65, 12, 16, 0.05, 0, Math.PI * 2); c.fill(); c.stroke();
    // Pupils looking towards Mutt
    c.fillStyle = '#1a2634';
    c.beginPath(); c.arc(65, 65, 5.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(97, 65, 5.5, 0, Math.PI * 2); c.fill();

    // Nose & Whiskers
    c.fillStyle = '#E91E63';
    c.beginPath(); c.ellipse(76, 75, 4.5, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1a2634'; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(35, 78); c.lineTo(15, 74);
    c.moveTo(35, 84); c.lineTo(18, 88);
    c.moveTo(110, 78); c.lineTo(130, 75);
    c.moveTo(110, 84); c.lineTo(128, 89);
    c.stroke();
    this.textures.addCanvas('cat_handdrawn', cCanvas);

    // --- 2. Authentic Mutt (Dog) ---
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 190; dCanvas.height = 180;
    const d = dCanvas.getContext('2d');
    d.lineJoin = 'round'; d.lineCap = 'round';

    // Droopy Ears
    d.fillStyle = '#5A4638'; d.strokeStyle = '#1a2634'; d.lineWidth = 5;
    d.beginPath(); d.ellipse(32, 75, 20, 42, 0.35, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.ellipse(158, 75, 20, 42, -0.35, 0, Math.PI * 2); d.fill(); d.stroke();

    // Body (Upright dog)
    d.fillStyle = '#8D7765';
    d.beginPath();
    d.ellipse(95, 125, 48, 42, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();

    // Front paws
    d.fillStyle = '#EDE2D4';
    d.beginPath(); d.ellipse(75, 162, 16, 12, 0, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.ellipse(115, 162, 16, 12, 0, 0, Math.PI * 2); d.fill(); d.stroke();

    // Head
    d.fillStyle = '#8D7765';
    d.beginPath();
    d.ellipse(95, 62, 54, 44, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();

    // Huge Cream Muzzle
    d.fillStyle = '#EDE2D4';
    d.beginPath();
    d.ellipse(95, 80, 45, 28, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();

    // Big Black Wet Nose
    d.fillStyle = '#1a2634';
    d.beginPath();
    d.ellipse(95, 66, 14, 10, 0, 0, Math.PI * 2);
    d.fill();
    // Nose highlight
    d.fillStyle = '#FFF';
    d.beginPath(); d.arc(92, 63, 3, 0, Math.PI * 2); d.fill();

    // Signature Giant Goofy Mouth & Tongue
    d.strokeStyle = '#1a2634'; d.lineWidth = 4;
    d.beginPath();
    d.arc(95, 78, 28, 0.15 * Math.PI, 0.85 * Math.PI);
    d.stroke();
    // Pink Floppy Tongue
    d.fillStyle = '#E85D75';
    d.beginPath();
    d.ellipse(95, 104, 14, 16, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();
    d.beginPath(); d.moveTo(95, 94); d.lineTo(95, 112); d.stroke();

    // Wide Goofy Cartoon Eyes
    d.fillStyle = '#FFF'; d.lineWidth = 4;
    d.beginPath(); d.arc(72, 46, 15, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.arc(118, 46, 15, 0, Math.PI * 2); d.fill(); d.stroke();
    d.fillStyle = '#1a2634';
    d.beginPath(); d.arc(68, 46, 6, 0, Math.PI * 2); d.fill();
    d.beginPath(); d.arc(114, 46, 6, 0, Math.PI * 2); d.fill();
    this.textures.addCanvas('dog_handdrawn', dCanvas);

    // --- 3. Classic Wooden Post Fence ---
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 240; fCanvas.height = 280;
    const f = fCanvas.getContext('2d');
    f.lineJoin = 'round';

    // Yellow post in front
    f.fillStyle = '#E6C687'; f.strokeStyle = '#2B1E16'; f.lineWidth = 5;
    f.fillRect(10, 10, 42, 265); f.strokeRect(10, 10, 42, 265);
    // Beveled top
    f.fillStyle = '#FFF2AF';
    f.beginPath(); f.moveTo(10, 10); f.lineTo(31, 0); f.lineTo(52, 10); f.closePath();
    f.fill(); f.stroke();

    // Fence boards
    const planks = ['#9A8149', '#8A733E', '#9E864E', '#7F6734'];
    for (let i = 0; i < 4; i++) {
      const px = 52 + (i * 44);
      f.fillStyle = planks[i];
      f.fillRect(px, 35, 44, 240);
      f.strokeRect(px, 35, 44, 240);
      // Wood grain lines
      f.strokeStyle = '#5B4822'; f.lineWidth = 2.5;
      f.beginPath();
      f.moveTo(px + 15, 50); f.lineTo(px + 18, 140);
      f.moveTo(px + 28, 120); f.lineTo(px + 25, 230);
      f.stroke();
      f.strokeStyle = '#2B1E16'; f.lineWidth = 5;
    }
    this.textures.addCanvas('fence_post', fCanvas);

    // --- 4. Cat Trash Bin & Stand ---
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 170; bCanvas.height = 160;
    const b = bCanvas.getContext('2d');
    b.lineJoin = 'round';

    // Wooden stand block on left
    b.fillStyle = '#D6B485'; b.strokeStyle = '#2B1E16'; b.lineWidth = 5;
    b.fillRect(10, 80, 50, 75); b.strokeRect(10, 80, 50, 75);

    // Trash bin on right
    b.fillStyle = '#A3ADB2';
    b.beginPath();
    b.moveTo(65, 30); b.lineTo(155, 30); b.lineTo(142, 155); b.lineTo(76, 155);
    b.closePath(); b.fill(); b.stroke();
    // Ribs
    b.lineWidth = 3.5;
    b.beginPath();
    b.moveTo(90, 40); b.lineTo(95, 145);
    b.moveTo(110, 40); b.lineTo(110, 145);
    b.moveTo(130, 40); b.lineTo(125, 145);
    b.stroke();
    // Trash overflow
    b.fillStyle = '#65737E';
    b.beginPath(); b.arc(105, 25, 16, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#F48FB1';
    b.fillRect(115, 15, 22, 14);
    this.textures.addCanvas('cat_perch', bCanvas);

    // --- 5. Dog Bone Bowl ---
    const boCanvas = document.createElement('canvas');
    boCanvas.width = 120; boCanvas.height = 60;
    const bo = boCanvas.getContext('2d');
    bo.fillStyle = '#F4511E'; bo.strokeStyle = '#2B1E16'; bo.lineWidth = 4;
    bo.beginPath();
    bo.moveTo(10, 20); bo.lineTo(110, 20); bo.lineTo(98, 55); bo.lineTo(22, 55);
    bo.closePath(); bo.fill(); bo.stroke();
    // Dog bones inside
    bo.fillStyle = '#FFF';
    bo.beginPath(); bo.roundRect(35, 10, 45, 14, 6); bo.fill(); bo.stroke();
    this.textures.addCanvas('dog_bowl', boCanvas);

    // --- 6. Projectiles ---
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32; pCanvas.height = 32;
    const p = pCanvas.getContext('2d');
    p.fillStyle = '#FFF'; p.strokeStyle = '#2B1E16'; p.lineWidth = 3;
    p.beginPath(); p.roundRect(6, 11, 20, 10, 4); p.fill(); p.stroke();
    p.beginPath(); p.arc(6, 11, 4, 0, Math.PI*2); p.fill(); p.stroke();
    p.beginPath(); p.arc(6, 21, 4, 0, Math.PI*2); p.fill(); p.stroke();
    p.beginPath(); p.arc(26, 11, 4, 0, Math.PI*2); p.fill(); p.stroke();
    p.beginPath(); p.arc(26, 21, 4, 0, Math.PI*2); p.fill(); p.stroke();
    this.textures.addCanvas('bone_proj', pCanvas);
  }

  create() {
    window.catDogScene = this;
    this.catHp = 100;
    this.dogHp = 100;
    this.wind = 0;
    this.turn = 'CAT';
    this.isCharging = false;
    this.chargePower = 0;
    this.isAimingAllowed = false;
    this.projectileInFlight = false;

    this.buildWorld();
    this.buildClassicUI();

    this.changeWind();
    this.startTurn();
  }

  buildWorld() {
    const { width, height } = this.scale;
    const floorY = height - 50;

    // Sky with soft gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x7EB8E4, 0x7EB8E4, 0xEDF7FC, 0xEDF7FC, 1);
    sky.fillRect(0, 0, width, height);

    // Clouds
    const cloud = this.add.graphics();
    cloud.fillStyle(0xFFFFFF, 0.9);
    cloud.beginPath();
    cloud.arc(340, 95, 26, 0, Math.PI * 2);
    cloud.arc(370, 90, 32, 0, Math.PI * 2);
    cloud.arc(400, 95, 24, 0, Math.PI * 2);
    cloud.arc(660, 80, 24, 0, Math.PI * 2);
    cloud.arc(690, 75, 30, 0, Math.PI * 2);
    cloud.arc(720, 80, 22, 0, Math.PI * 2);
    cloud.fill();

    // Rolling Distant Green Mountains
    const mountains = this.add.graphics();
    mountains.fillStyle(0x7EA598, 1);
    mountains.beginPath();
    mountains.moveTo(240, height - 80);
    mountains.lineTo(410, 140);
    mountains.lineTo(620, height - 80);
    mountains.lineTo(820, 130);
    mountains.lineTo(width, height - 70);
    mountains.lineTo(width, height);
    mountains.lineTo(240, height);
    mountains.closePath();
    mountains.fill();

    // Left Alley (Purple Wall & Ground)
    const alley = this.add.graphics();
    alley.fillStyle(0xBA86BA, 1);
    alley.fillRect(0, 0, 235, height);
    alley.lineStyle(6, 0x3A263B);
    alley.beginPath(); alley.moveTo(235, 0); alley.lineTo(235, height); alley.stroke();
    // Sidewalk
    alley.fillStyle(0x9E9B95, 1);
    alley.lineStyle(5, 0x3A263B);
    alley.fillRect(0, floorY, 410, 50);
    alley.strokeRect(0, floorY, 410, 50);

    // Right Lawn & Backyard Roof
    const yard = this.add.graphics();
    yard.fillStyle(0x56A838, 1);
    yard.lineStyle(5, 0x244E18);
    yard.fillRect(410, floorY, width - 410, 50);
    yard.strokeRect(410, floorY, width - 410, 50);

    // Brick/Roof corner at right
    yard.fillStyle(0xCF5A30, 1);
    yard.lineStyle(5, 0x2B1E16);
    yard.beginPath();
    yard.moveTo(width - 150, 70);
    yard.lineTo(width, 10);
    yard.lineTo(width, 240);
    yard.lineTo(width - 90, 200);
    yard.closePath();
    yard.fill(); yard.stroke();

    // Fence positioned naturally in the center
    this.fence = this.add.image(width / 2 + 10, floorY - 110, 'fence_post');
    this.physics.add.existing(this.fence, true);

    // Cat & Base
    this.add.image(95, floorY - 55, 'cat_perch');
    this.cat = this.add.sprite(65, floorY - 135, 'cat_handdrawn');
    this.tweens.add({
      targets: this.cat,
      scaleY: 1.04,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Dog & Bowl
    this.dog = this.add.sprite(width - 130, floorY - 80, 'dog_handdrawn');
    this.add.image(width - 130, floorY - 10, 'dog_bowl');
    this.tweens.add({
      targets: this.dog,
      scaleY: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  buildClassicUI() {
    const { width } = this.scale;

    // Authentic Yellow Status Frame
    const ui = this.add.graphics();
    ui.fillStyle(0xFED330, 1);
    ui.lineStyle(4, 0xEA7700);
    ui.fillRoundedRect(width / 2 - 320, 10, 640, 52, 16);
    ui.strokeRoundedRect(width / 2 - 320, 10, 640, 52, 16);

    // Health Trackers (Red base)
    ui.fillStyle(0xD63031, 1);
    ui.fillRoundedRect(width / 2 - 280, 22, 200, 18, 5);
    ui.fillRoundedRect(width / 2 + 80, 22, 200, 18, 5);

    // Dynamic HP bars
    this.catHpFill = this.add.graphics();
    this.dogHpFill = this.add.graphics();
    this.updateHealthBar('CAT');
    this.updateHealthBar('DOG');

    // Cat & Dog Mini Head Portraits in UI
    const catHead = this.add.graphics();
    catHead.fillStyle(0x29B6A8, 1); catHead.lineStyle(2, 0x1a2634);
    catHead.beginPath(); catHead.arc(width / 2 - 295, 31, 14, 0, Math.PI * 2); catHead.fill(); catHead.stroke();
    // Dog head
    const dogHead = this.add.graphics();
    dogHead.fillStyle(0x8D7765, 1); dogHead.lineStyle(2, 0x1a2634);
    dogHead.beginPath(); dogHead.arc(width / 2 + 295, 31, 14, 0, Math.PI * 2); dogHead.fill(); dogHead.stroke();

    // Wind Box
    const windBox = this.add.graphics();
    windBox.fillStyle(0xFF9F1A, 1);
    windBox.lineStyle(3, 0xD35400);
    windBox.fillRoundedRect(width / 2 - 65, 14, 130, 44, 10);
    windBox.strokeRoundedRect(width / 2 - 65, 14, 130, 44, 10);

    this.windText = this.add.text(width / 2, 36, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#D35400',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Power Charge Meter
    this.powerBarBg = this.add.graphics().setVisible(false);
    this.powerBarFill = this.add.graphics().setVisible(false);

    // Input
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
      this.catHpFill.fillStyle(0x2ECC71, 1);
      this.catHpFill.fillRoundedRect(width / 2 - 280, 22, Math.max(0, this.catHp * 2), 18, 5);
    } else {
      this.dogHpFill.clear();
      this.dogHpFill.fillStyle(0x2ECC71, 1);
      const fillW = Math.max(0, this.dogHp * 2);
      this.dogHpFill.fillRoundedRect(width / 2 + 280 - fillW, 22, fillW, 18, 5);
    }
  }

  changeWind() {
    this.wind = Phaser.Math.Between(-7, 7);
    const arrow = this.wind > 0 ? '▶▶' : (this.wind < 0 ? '◀◀' : '—');
    this.windText.setText(`WIND ${arrow} ${Math.abs(this.wind)}`);
  }

  startTurn() {
    this.isAimingAllowed = false;
    if (this.turn === 'CAT') {
      this.promptESLQuestion();
    } else {
      this.time.delayedCall(1000, () => this.runDogAITurn());
    }
  }

  promptESLQuestion() {
    const questions = [
      { q: "Yesterday the dog ____ a bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" },
      { q: "The cat is sitting ____ the box.", opts: ["ON", "INTO", "UNDER"], ans: "ON" },
      { q: "Dogs like to chew on ____.", opts: ["BONES", "CARS", "CLOUDS"], ans: "BONES" },
      { q: "What is between the yards?", opts: ["FENCE", "RIVER", "TRAIN"], ans: "FENCE" },
      { q: "The dog is sleeping ____ the tree.", opts: ["UNDER", "ABOVE", "THROUGH"], ans: "UNDER" },
      { q: "The bone is ____ the food bowl.", opts: ["IN", "BETWEEN", "AMONG"], ans: "IN" }
    ];
    const item = Phaser.Utils.Array.GetRandom(questions);

    // Compact in-world question plaque so it doesn't block the screen
    const modal = this.add.container(this.scale.width / 2, 145);
    this.activeModal = modal;
    modal.on('destroy', () => { this.activeModal = null; });

    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.98);
    bg.lineStyle(4, 0xEA7700);
    bg.fillRoundedRect(-220, -55, 440, 110, 14);
    bg.strokeRoundedRect(-220, -55, 440, 110, 14);
    modal.add(bg);

    const title = this.add.text(0, -32, item.q, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#D35400'
    }).setOrigin(0.5);
    modal.add(title);

    item.opts.forEach((opt, idx) => {
      const btnX = -130 + idx * 130;
      const btnY = 16;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xFF9F1A, 1);
      btnBg.fillRoundedRect(btnX - 52, btnY - 18, 104, 36, 8);
      modal.add(btnBg);

      const btnTxt = this.add.text(btnX, btnY, opt, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      modal.add(btnTxt);

      const hitZone = this.add.rectangle(btnX, btnY, 104, 36, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hitZone.opt = opt;
      hitZone.isCorrect = (opt === item.ans);
      modal.add(hitZone);

      const onSelect = (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        if (opt === item.ans) {
          audio.sfxCorrect();
          modal.destroy();
          this.isAimingAllowed = true;
          this.showFeedbackToast("CORRECT! HOLD & RELEASE TO THROW!", 0x27AE60);
        } else {
          audio.sfxWrong();
          this.tweens.add({
            targets: modal,
            x: modal.x + 8,
            duration: 50,
            yoyo: true,
            repeat: 3
          });
        }
      };

      hitZone.on('pointerdown', onSelect);
      btnTxt.setInteractive({ useHandCursor: true });
      btnTxt.on('pointerdown', onSelect);
    });
  }

  showFeedbackToast(text, color) {
    const toast = this.add.text(this.scale.width / 2, 95, text, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#' + color.toString(16).padStart(6, '0'),
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5);

    this.time.delayedCall(1600, () => toast.destroy());
  }

  fireProjectile(power, shooter) {
    this.projectileInFlight = true;
    this.isAimingAllowed = false;
    audio.sfxThrow();

    const startX = shooter === 'CAT' ? this.cat.x + 35 : this.dog.x - 35;
    const startY = shooter === 'CAT' ? this.cat.y - 15 : this.dog.y - 15;
    
    const proj = this.physics.add.sprite(startX, startY, 'bone_proj');
    proj.setAngularVelocity(shooter === 'CAT' ? 420 : -420);

    const angleRad = shooter === 'CAT' ? -56 * (Math.PI / 180) : -124 * (Math.PI / 180);
    const speed = 250 + (power * 7.6);
    proj.setVelocity(
      Math.cos(angleRad) * speed + (this.wind * 20),
      Math.sin(angleRad) * speed
    );

    const flightTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (proj && proj.body) {
          proj.setVelocityX(proj.body.velocity.x + this.wind * 1.6);
        }
      }
    });

    this.physics.add.collider(proj, this.fence, () => {
      flightTimer.remove();
      audio.sfxHit();
      proj.destroy();
      this.endTurn();
    });

    const checkCollision = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!proj.active) {
          checkCollision.remove();
          return;
        }

        if (proj.y >= this.scale.height - 50) {
          flightTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.endTurn();
          return;
        }

        if (shooter === 'CAT' && Phaser.Math.Distance.Between(proj.x, proj.y, this.dog.x, this.dog.y) < 55) {
          flightTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.applyDamage('DOG', 25);
          return;
        }

        if (shooter === 'DOG' && Phaser.Math.Distance.Between(proj.x, proj.y, this.cat.x, this.cat.y) < 55) {
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
      this.tweens.add({ targets: this.dog, tint: 0xFF5252, duration: 80, yoyo: true, repeat: 2 });
    } else {
      this.catHp = Math.max(0, this.catHp - amount);
      this.updateHealthBar('CAT');
      this.tweens.add({ targets: this.cat, tint: 0xFF5252, duration: 80, yoyo: true, repeat: 2 });
    }

    if (this.catHp <= 0 || this.dogHp <= 0) {
      this.time.delayedCall(600, () => this.gameOver(target === 'DOG' ? 'CAT' : 'DOG'));
    } else {
      this.endTurn();
    }
  }

  runDogAITurn() {
    const estimatedPower = Phaser.Math.Clamp(53 - (this.wind * 3.5) + Phaser.Math.Between(-8, 8), 20, 95);
    this.fireProjectile(estimatedPower, 'DOG');
  }

  endTurn() {
    this.projectileInFlight = false;
    this.turn = this.turn === 'CAT' ? 'DOG' : 'CAT';
    this.changeWind();
    this.time.delayedCall(800, () => this.startTurn());
  }

  gameOver(winner) {
    this.add.text(this.scale.width / 2, this.scale.height / 2, `${winner} WINS!`, {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#F1C40F',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => this.scene.restart());
  }

  update() {
    if (this.isCharging && this.chargePower < 100) {
      this.chargePower += 1.8;
      
      this.powerBarBg.clear();
      this.powerBarBg.fillStyle(0x000000, 0.6);
      this.powerBarBg.fillRoundedRect(this.cat.x - 30, this.cat.y - 70, 60, 10, 4);

      this.powerBarFill.clear();
      this.powerBarFill.fillStyle(0xFF9F1A, 1);
      this.powerBarFill.fillRoundedRect(this.cat.x - 30, this.cat.y - 70, (this.chargePower / 100) * 60, 10, 4);
    }
  }
}

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
