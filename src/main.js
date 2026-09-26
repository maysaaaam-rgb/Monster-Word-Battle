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
    this.generateTrueClassicAssets();
  }

  generateTrueClassicAssets() {
    if (this.textures.exists('fleabag_cat')) return;

    // ----------------------------------------------------
    // 1. FLEABAG (CAT) - Authentic slouched alley cat pose
    // ----------------------------------------------------
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 170; cCanvas.height = 180;
    const c = cCanvas.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';

    // Tail curving up on left
    c.strokeStyle = '#1D262F'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(50, 130); c.bezierCurveTo(15, 110, 10, 60, 25, 40); c.stroke();
    c.strokeStyle = '#32A5A2'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(50, 130); c.bezierCurveTo(15, 110, 10, 60, 25, 40); c.stroke();

    // Body (slouched lean towards the fence)
    c.fillStyle = '#32A5A2'; c.strokeStyle = '#1D262F'; c.lineWidth = 5;
    c.beginPath();
    c.moveTo(55, 100);
    c.quadraticCurveTo(35, 145, 60, 155);
    c.lineTo(125, 155);
    c.quadraticCurveTo(135, 125, 105, 95);
    c.closePath();
    c.fill(); c.stroke();

    // Rib cage marks
    c.strokeStyle = '#1D262F'; c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(68, 118); c.lineTo(82, 120);
    c.moveTo(66, 128); c.lineTo(84, 131);
    c.moveTo(70, 138); c.lineTo(85, 140);
    c.stroke();

    // Head (tilted forward)
    c.fillStyle = '#32A5A2'; c.strokeStyle = '#1D262F'; c.lineWidth = 5;
    c.beginPath();
    c.ellipse(90, 65, 46, 34, 0.05, 0, Math.PI * 2);
    c.fill(); c.stroke();

    // Left Ear (With bandage wrap)
    c.beginPath();
    c.moveTo(55, 50); c.lineTo(38, 12); c.lineTo(75, 36);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#EDE2CE'; c.lineWidth = 3;
    c.fillRect(44, 20, 22, 12); c.strokeRect(44, 20, 22, 12);

    // Right Ear
    c.fillStyle = '#32A5A2'; c.lineWidth = 5;
    c.beginPath();
    c.moveTo(110, 42); c.lineTo(142, 18); c.lineTo(128, 58);
    c.closePath(); c.fill(); c.stroke();

    // White Head Gauze Bandage
    c.fillStyle = '#FFF8EB'; c.lineWidth = 3.5;
    c.save(); c.translate(68, 48); c.rotate(-0.25);
    c.fillRect(-18, -9, 36, 18); c.strokeRect(-18, -9, 36, 18);
    c.restore();

    // Smirking Half-Lidded Eyes
    c.fillStyle = '#FFF'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(78, 64, 13, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(108, 64, 13, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    // Pupils glancing right towards Dog
    c.fillStyle = '#1D262F';
    c.beginPath(); c.arc(84, 64, 5.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(114, 64, 5.5, 0, Math.PI * 2); c.fill();
    // Eyelids for that classic smirk
    c.fillStyle = '#32A5A2';
    c.beginPath(); c.ellipse(78, 58, 14, 7, 0, 0, Math.PI, true); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(108, 58, 14, 7, 0, 0, Math.PI, true); c.fill(); c.stroke();

    // Nose & Whiskers
    c.fillStyle = '#E85A71';
    c.beginPath(); c.ellipse(96, 75, 4.5, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1D262F'; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(52, 78); c.lineTo(34, 75);
    c.moveTo(52, 84); c.lineTo(36, 88);
    c.moveTo(125, 78); c.lineTo(145, 76);
    c.moveTo(125, 84); c.lineTo(142, 89);
    c.stroke();
    this.textures.addCanvas('fleabag_cat', cCanvas);

    // ----------------------------------------------------
    // 2. MUTT (DOG) - Authentic goofy wide-mouthed grin
    // ----------------------------------------------------
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 200; dCanvas.height = 190;
    const d = dCanvas.getContext('2d');
    d.lineJoin = 'round'; d.lineCap = 'round';

    // Droopy long hound ears
    d.fillStyle = '#5A4333'; d.strokeStyle = '#1D262F'; d.lineWidth = 5;
    d.beginPath(); d.ellipse(35, 75, 20, 44, 0.35, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.ellipse(165, 75, 20, 44, -0.35, 0, Math.PI * 2); d.fill(); d.stroke();

    // Body (Solid bulldog posture)
    d.fillStyle = '#8E7966';
    d.beginPath();
    d.ellipse(100, 130, 52, 42, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();

    // Front Paws standing flat on ground
    d.fillStyle = '#E5D6C5';
    d.beginPath(); d.ellipse(75, 170, 18, 12, 0, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.ellipse(125, 170, 18, 12, 0, 0, Math.PI * 2); d.fill(); d.stroke();

    // Head
    d.fillStyle = '#8E7966';
    d.beginPath();
    d.ellipse(100, 62, 58, 44, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();

    // Big Cartoon Goofy Eyes
    d.fillStyle = '#FFF'; d.lineWidth = 4;
    d.beginPath(); d.arc(75, 44, 15, 0, Math.PI * 2); d.fill(); d.stroke();
    d.beginPath(); d.arc(125, 44, 15, 0, Math.PI * 2); d.fill(); d.stroke();
    // Pupils looking left towards Fleabag
    d.fillStyle = '#1D262F';
    d.beginPath(); d.arc(69, 44, 6, 0, Math.PI * 2); d.fill();
    d.beginPath(); d.arc(119, 44, 6, 0, Math.PI * 2); d.fill();

    // Black Nose right between eyes
    d.fillStyle = '#1D262F';
    d.beginPath(); d.ellipse(100, 56, 12, 8, 0, 0, Math.PI * 2); d.fill();

    // Giant Cheek-to-Cheek Grinning Mouth (Classic Mutt smile!)
    d.fillStyle = '#FFF8EB'; d.lineWidth = 5;
    d.beginPath();
    d.moveTo(48, 68);
    d.quadraticCurveTo(100, 56, 152, 68);
    d.quadraticCurveTo(158, 108, 100, 114);
    d.quadraticCurveTo(42, 108, 48, 68);
    d.closePath();
    d.fill(); d.stroke();

    // Inner Mouth & Tongue
    d.fillStyle = '#1D262F';
    d.beginPath();
    d.moveTo(56, 76);
    d.quadraticCurveTo(100, 70, 144, 76);
    d.quadraticCurveTo(148, 102, 100, 108);
    d.quadraticCurveTo(52, 102, 56, 76);
    d.closePath();
    d.fill();

    // Classic Pink Tongue resting over bottom lip
    d.fillStyle = '#E85A71'; d.strokeStyle = '#1D262F'; d.lineWidth = 3.5;
    d.beginPath();
    d.ellipse(100, 104, 18, 14, 0, 0, Math.PI * 2);
    d.fill(); d.stroke();
    d.beginPath(); d.moveTo(100, 94); d.lineTo(100, 112); d.stroke();
    this.textures.addCanvas('mutt_dog', dCanvas);

    // ----------------------------------------------------
    // 3. Wooden Perch & Trash Can (Alley Set)
    // ----------------------------------------------------
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 190; bCanvas.height = 170;
    const b = bCanvas.getContext('2d');
    b.lineJoin = 'round';

    // Wood crate / perch for cat
    b.fillStyle = '#C8A270'; b.strokeStyle = '#231B15'; b.lineWidth = 5;
    b.fillRect(10, 85, 60, 75); b.strokeRect(10, 85, 60, 75);
    b.beginPath(); b.moveTo(10, 122); b.lineTo(70, 122); b.stroke();

    // Metal Trash Can
    b.fillStyle = '#9BA4A8';
    b.beginPath();
    b.moveTo(78, 38); b.lineTo(172, 38); b.lineTo(158, 160); b.lineTo(92, 160);
    b.closePath(); b.fill(); b.stroke();
    // Metal Ridges
    b.lineWidth = 3.5;
    b.beginPath();
    b.moveTo(104, 46); b.lineTo(108, 150);
    b.moveTo(125, 46); b.lineTo(125, 150);
    b.moveTo(146, 46); b.lineTo(142, 150);
    b.stroke();
    // Garbage bags & fishbone in can
    b.fillStyle = '#556270';
    b.beginPath(); b.arc(120, 32, 18, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#E88B98';
    b.fillRect(135, 20, 22, 16);
    this.textures.addCanvas('alley_perch', bCanvas);

    // ----------------------------------------------------
    // 4. Food Bowl (Now placed on ground in front of Dog)
    // ----------------------------------------------------
    const boCanvas = document.createElement('canvas');
    boCanvas.width = 110; boCanvas.height = 50;
    const bo = boCanvas.getContext('2d');
    bo.lineJoin = 'round';
    bo.fillStyle = '#E65100'; bo.strokeStyle = '#231B15'; bo.lineWidth = 4;
    bo.beginPath();
    bo.moveTo(10, 16); bo.lineTo(100, 16); bo.lineTo(88, 44); bo.lineTo(22, 44);
    bo.closePath(); bo.fill(); bo.stroke();
    // Bones sticking out
    bo.fillStyle = '#FFF';
    bo.beginPath(); bo.roundRect(32, 8, 46, 12, 5); bo.fill(); bo.stroke();
    this.textures.addCanvas('mutt_bowl', boCanvas);

    // ----------------------------------------------------
    // 5. Classic Wooden Fence (Proportional center obstacle)
    // ----------------------------------------------------
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 160; fCanvas.height = 250;
    const f = fCanvas.getContext('2d');
    f.lineJoin = 'round';

    // Front yellow post
    f.fillStyle = '#F5DE98'; f.strokeStyle = '#231B15'; f.lineWidth = 5;
    f.fillRect(8, 12, 38, 235); f.strokeRect(8, 12, 38, 235);
    // Pointed post top
    f.fillStyle = '#FFF3BF';
    f.beginPath(); f.moveTo(8, 12); f.lineTo(27, 2); f.lineTo(46, 12); f.closePath();
    f.fill(); f.stroke();

    // Weathered vertical fence planks
    const planks = ['#9A8149', '#8C743D', '#9A8149'];
    for (let i = 0; i < 3; i++) {
      const px = 46 + (i * 36);
      f.fillStyle = planks[i];
      f.fillRect(px, 30, 36, 218);
      f.strokeRect(px, 30, 36, 218);
      // Wood knot lines
      f.strokeStyle = '#5E4A20'; f.lineWidth = 2;
      f.beginPath();
      f.moveTo(px + 12, 45); f.lineTo(px + 14, 130);
      f.moveTo(px + 22, 110); f.lineTo(px + 20, 210);
      f.stroke();
      f.strokeStyle = '#231B15'; f.lineWidth = 5;
    }
    this.textures.addCanvas('classic_fence', fCanvas);

    // ----------------------------------------------------
    // 6. Projectiles
    // ----------------------------------------------------
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32; pCanvas.height = 32;
    const p = pCanvas.getContext('2d');
    p.fillStyle = '#FFF'; p.strokeStyle = '#231B15'; p.lineWidth = 3;
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

    // Sky with sunny gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x76B6E4, 0x76B6E4, 0xEBF7FD, 0xEBF7FD, 1);
    sky.fillRect(0, 0, width, height);

    // Fluffy clouds
    const clouds = this.add.graphics();
    clouds.fillStyle(0xFFFFFF, 0.95);
    clouds.beginPath();
    clouds.arc(320, 95, 26, 0, Math.PI * 2);
    clouds.arc(350, 90, 32, 0, Math.PI * 2);
    clouds.arc(380, 95, 24, 0, Math.PI * 2);
    clouds.arc(680, 80, 24, 0, Math.PI * 2);
    clouds.arc(710, 75, 30, 0, Math.PI * 2);
    clouds.arc(740, 80, 22, 0, Math.PI * 2);
    clouds.fill();

    // Distant cartoon hills
    const mountains = this.add.graphics();
    mountains.fillStyle(0x7EA598, 1);
    mountains.beginPath();
    mountains.moveTo(250, height - 70);
    mountains.lineTo(420, 140);
    mountains.lineTo(630, height - 70);
    mountains.lineTo(840, 130);
    mountains.lineTo(width, height - 70);
    mountains.lineTo(width, height);
    mountains.lineTo(250, height);
    mountains.closePath();
    mountains.fill();

    // Alley Wall (Left)
    const alley = this.add.graphics();
    alley.fillStyle(0xBA86BA, 1);
    alley.fillRect(0, 0, 240, height);
    alley.lineStyle(6, 0x362337);
    alley.beginPath(); alley.moveTo(240, 0); alley.lineTo(240, height); alley.stroke();

    // Alley Cobblestone Floor
    alley.fillStyle(0x9E9B95, 1);
    alley.lineStyle(5, 0x362337);
    alley.fillRect(0, floorY, 430, 50);
    alley.strokeRect(0, floorY, 430, 50);

    // Right Lawn & Backyard Roof
    const yard = this.add.graphics();
    yard.fillStyle(0x56A838, 1);
    yard.lineStyle(5, 0x224916);
    yard.fillRect(430, floorY, width - 430, 50);
    yard.strokeRect(430, floorY, width - 430, 50);

    // Corner Roof (Top Right)
    yard.fillStyle(0xCF5A30, 1);
    yard.lineStyle(5, 0x231B15);
    yard.beginPath();
    yard.moveTo(width - 150, 70);
    yard.lineTo(width, 10);
    yard.lineTo(width, 240);
    yard.lineTo(width - 90, 200);
    yard.closePath();
    yard.fill(); yard.stroke();

    // Fence right on center boundary
    this.fence = this.add.image(width / 2 - 10, floorY - 95, 'classic_fence');
    this.physics.add.existing(this.fence, true);

    // Cat & Base (Sitting properly on box)
    this.add.image(110, floorY - 60, 'alley_perch');
    this.cat = this.add.sprite(75, floorY - 145, 'fleabag_cat');
    this.tweens.add({
      targets: this.cat,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Dog standing on grass, with bowl placed directly in front of him!
    this.dog = this.add.sprite(width - 130, floorY - 80, 'mutt_dog');
    this.add.image(width - 175, floorY - 14, 'mutt_bowl'); // In front on the grass
    this.tweens.add({
      targets: this.dog,
      scaleY: 1.04,
      duration: 750,
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
    catHead.fillStyle(0x32A5A2, 1); catHead.lineStyle(2, 0x1D262F);
    catHead.beginPath(); catHead.arc(width / 2 - 295, 31, 14, 0, Math.PI * 2); catHead.fill(); catHead.stroke();

    const dogHead = this.add.graphics();
    dogHead.fillStyle(0x8E7966, 1); dogHead.lineStyle(2, 0x1D262F);
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

    const hasDomOverlay = !!document.getElementById('ui-overlay');
    if (hasDomOverlay) {
      ui.setVisible(false);
      catHead.setVisible(false);
      dogHead.setVisible(false);
      windBox.setVisible(false);
      this.windText.setVisible(false);
    }

    // Power Charge Meter
    this.powerBarBg = this.add.graphics().setVisible(false);
    this.powerBarFill = this.add.graphics().setVisible(false);

    // Input handlers
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
        const pMeter = document.getElementById('power-meter');
        if (pMeter) pMeter.style.display = 'none';
        this.fireProjectile(this.chargePower, 'CAT');
      }
    });
  }

  updateHealthBar(target) {
    const catEl = document.getElementById('cat-hp');
    if (catEl) catEl.style.width = `${Math.max(0, this.catHp)}%`;
    const dogEl = document.getElementById('dog-hp');
    if (dogEl) dogEl.style.width = `${Math.max(0, this.dogHp)}%`;

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
    const windEl = document.getElementById('wind-txt');
    if (windEl) windEl.innerText = `WIND: ${this.wind > 0 ? '▶' : (this.wind < 0 ? '◀' : '—')} ${Math.abs(this.wind)}`;
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

    const quizBox = document.getElementById('quiz-box');
    if (quizBox) {
      quizBox.style.display = 'block';
      quizBox.innerHTML = `
        <h3>${item.q}</h3>
        <div class="quiz-options">
          ${item.opts.map(opt => `<button class="quiz-btn" data-opt="${opt}">${opt}</button>`).join('')}
        </div>
      `;
      quizBox.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const opt = btn.getAttribute('data-opt');
          if (opt === item.ans) {
            audio.sfxCorrect();
            quizBox.style.display = 'none';
            this.isAimingAllowed = true;
            this.showFeedbackToast("CORRECT! HOLD & RELEASE TO THROW!", 0x27AE60);
          } else {
            audio.sfxWrong();
            btn.style.background = '#d32f2f';
            setTimeout(() => { btn.style.background = '#ff9800'; }, 400);
          }
        };
      });
      return;
    }

    // Compact in-world question plaque positioned high up so characters and fence remain 100% visible
    const modal = this.add.container(this.scale.width / 2, 130);
    this.activeModal = modal;
    modal.on('destroy', () => { this.activeModal = null; });

    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.98);
    bg.lineStyle(4, 0xEA7700);
    bg.fillRoundedRect(-210, -50, 420, 100, 14);
    bg.strokeRoundedRect(-210, -50, 420, 100, 14);
    modal.add(bg);

    const title = this.add.text(0, -28, item.q, {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#D35400'
    }).setOrigin(0.5);
    modal.add(title);

    item.opts.forEach((opt, idx) => {
      const btnX = -120 + idx * 120;
      const btnY = 16;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xFF9F1A, 1);
      btnBg.fillRoundedRect(btnX - 48, btnY - 17, 96, 34, 8);
      modal.add(btnBg);

      const btnTxt = this.add.text(btnX, btnY, opt, {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      modal.add(btnTxt);

      const hitZone = this.add.rectangle(btnX, btnY, 96, 34, 0x000000, 0)
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
    const toast = this.add.text(this.scale.width / 2, 85, text, {
      fontSize: '17px',
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

      const pMeter = document.getElementById('power-meter');
      const pFill = document.getElementById('power-fill');
      if (pMeter && pFill) {
        pMeter.style.display = 'block';
        pFill.style.width = `${Math.min(100, this.chargePower)}%`;
      }
      
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
