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
  sfxThrow() {
    this.playTone(380, 'sine', 0.28, 90);
  }
  sfxHit() {
    this.playTone(160, 'sawtooth', 0.35, 30);
  }
  sfxCorrect() {
    this.playTone(520, 'triangle', 0.12);
    setTimeout(() => this.playTone(680, 'triangle', 0.2), 100);
  }
  sfxWrong() {
    this.playTone(200, 'square', 0.25, 90);
  }
}

const audio = new AudioController();

class CatDogScene extends Phaser.Scene {
  constructor() {
    super('CatDogScene');
  }

  preload() {
    this.createPixelAssets();
  }

  createPixelAssets() {
    if (this.textures.exists('fence_wall')) return;

    // 1. Classic Wooden Plank Fence (Wide like the original)
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 420;
    fCanvas.height = 360;
    const fCtx = fCanvas.getContext('2d');

    // Horizontal top rail
    fCtx.fillStyle = '#E6C687';
    fCtx.strokeStyle = '#2B1E16';
    fCtx.lineWidth = 6;
    fCtx.fillRect(10, 10, 400, 32);
    fCtx.strokeRect(10, 10, 400, 32);

    // Left post
    fCtx.fillStyle = '#FFF2AF';
    fCtx.beginPath();
    fCtx.roundRect(10, 8, 48, 350, [12, 12, 0, 0]);
    fCtx.fill();
    fCtx.stroke();

    // Vertical slats
    const plankColors = ['#9E8852', '#8C7745', '#94804A', '#836F3D', '#9A854E', '#877442', '#927E48'];
    for (let i = 0; i < 7; i++) {
      const px = 58 + (i * 50);
      fCtx.fillStyle = plankColors[i];
      fCtx.fillRect(px, 42, 50, 318);
      fCtx.strokeRect(px, 42, 50, 318);
    }
    this.textures.addCanvas('fence_wall', fCanvas);

    // 2. Alley Trash Bin with overflow trash
    const binCanvas = document.createElement('canvas');
    binCanvas.width = 160;
    binCanvas.height = 180;
    const bCtx = binCanvas.getContext('2d');

    // Garbage pile peeking over the top
    bCtx.fillStyle = '#6E6E6E';
    bCtx.beginPath();
    bCtx.arc(105, 55, 24, 0, Math.PI * 2);
    bCtx.arc(130, 60, 18, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#E8A598';
    bCtx.fillRect(108, 40, 20, 16); // Tin can / paper

    // Metal Bin
    bCtx.fillStyle = '#A0AAB2';
    bCtx.strokeStyle = '#232A31';
    bCtx.lineWidth = 6;
    bCtx.beginPath();
    bCtx.moveTo(30, 60);
    bCtx.lineTo(150, 60);
    bCtx.lineTo(138, 175);
    bCtx.lineTo(46, 175);
    bCtx.closePath();
    bCtx.fill();
    bCtx.stroke();

    // Ridges
    bCtx.lineWidth = 4;
    bCtx.beginPath();
    bCtx.moveTo(60, 68); bCtx.lineTo(68, 168);
    bCtx.moveTo(90, 68); bCtx.lineTo(92, 168);
    bCtx.moveTo(120, 68); bCtx.lineTo(116, 168);
    bCtx.stroke();
    this.textures.addCanvas('trashcan_full', binCanvas);

    // 3. Cat Sprite (Looking Right toward Dog)
    const catCanvas = document.createElement('canvas');
    catCanvas.width = 140;
    catCanvas.height = 140;
    const cCtx = catCanvas.getContext('2d');

    // Pointed ears with dark ink stroke
    cCtx.fillStyle = '#26A69A';
    cCtx.strokeStyle = '#1A2421';
    cCtx.lineWidth = 6;
    cCtx.beginPath();
    cCtx.moveTo(25, 60); cCtx.lineTo(10, 15); cCtx.lineTo(55, 35); cCtx.closePath();
    cCtx.fill(); cCtx.stroke();
    cCtx.beginPath();
    cCtx.moveTo(70, 40); cCtx.lineTo(110, 15); cCtx.lineTo(100, 60); cCtx.closePath();
    cCtx.fill(); cCtx.stroke();

    // Body & tail
    cCtx.beginPath();
    cCtx.ellipse(60, 102, 38, 30, 0, 0, Math.PI * 2);
    cCtx.fill(); cCtx.stroke();

    // Head
    cCtx.beginPath();
    cCtx.ellipse(60, 64, 46, 34, 0, 0, Math.PI * 2);
    cCtx.fill(); cCtx.stroke();

    // White Head Bandage
    cCtx.fillStyle = '#F5F5DC';
    cCtx.save();
    cCtx.translate(45, 45);
    cCtx.rotate(-0.15);
    cCtx.fillRect(-18, -8, 36, 16);
    cCtx.strokeRect(-18, -8, 36, 16);
    cCtx.restore();

    // Expressive Eyes (Glancing right toward dog)
    cCtx.fillStyle = '#FFFFFF';
    cCtx.beginPath(); cCtx.ellipse(48, 64, 12, 14, 0, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();
    cCtx.beginPath(); cCtx.ellipse(80, 64, 12, 14, 0, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();
    cCtx.fillStyle = '#1A2421';
    cCtx.beginPath(); cCtx.arc(54, 64, 5, 0, Math.PI * 2); cCtx.fill();
    cCtx.beginPath(); cCtx.arc(86, 64, 5, 0, Math.PI * 2); cCtx.fill();

    // Whiskers
    cCtx.lineWidth = 4;
    cCtx.beginPath();
    cCtx.moveTo(25, 75); cCtx.lineTo(5, 70);
    cCtx.moveTo(25, 82); cCtx.lineTo(8, 88);
    cCtx.moveTo(95, 75); cCtx.lineTo(115, 70);
    cCtx.moveTo(95, 82); cCtx.lineTo(112, 88);
    cCtx.stroke();
    this.textures.addCanvas('cat_classic', catCanvas);

    // 4. Dog Food Bowl & Bones
    const bowlCanvas = document.createElement('canvas');
    bowlCanvas.width = 150;
    bowlCanvas.height = 70;
    const boCtx = bowlCanvas.getContext('2d');

    // Bones overflowing
    boCtx.fillStyle = '#FFFFFF';
    boCtx.strokeStyle = '#2B1E16';
    boCtx.lineWidth = 4;
    boCtx.beginPath();
    boCtx.roundRect(40, 10, 60, 16, 8); boCtx.fill(); boCtx.stroke();
    boCtx.beginPath();
    boCtx.roundRect(65, 5, 50, 14, 6); boCtx.fill(); boCtx.stroke();

    // Bowl
    boCtx.fillStyle = '#F4511E';
    boCtx.lineWidth = 6;
    boCtx.beginPath();
    boCtx.moveTo(15, 24);
    boCtx.lineTo(135, 24);
    boCtx.lineTo(122, 65);
    boCtx.lineTo(28, 65);
    boCtx.closePath();
    boCtx.fill();
    boCtx.stroke();
    boCtx.fillStyle = '#FFFFFF';
    boCtx.beginPath();
    boCtx.roundRect(45, 36, 60, 14, 6);
    boCtx.fill();
    this.textures.addCanvas('dog_bowl_full', bowlCanvas);

    // 5. Classic Dog Sprite (Chubby grinning pup)
    const dogCanvas = document.createElement('canvas');
    dogCanvas.width = 170;
    dogCanvas.height = 150;
    const dCtx = dogCanvas.getContext('2d');

    // Big droopy ears
    dCtx.fillStyle = '#795548';
    dCtx.strokeStyle = '#2B1E16';
    dCtx.lineWidth = 6;
    dCtx.beginPath(); dCtx.ellipse(22, 70, 18, 36, 0.25, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.beginPath(); dCtx.ellipse(148, 70, 18, 36, -0.25, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();

    // Body
    dCtx.fillStyle = '#A1887F';
    dCtx.beginPath();
    dCtx.ellipse(85, 105, 52, 38, 0, 0, Math.PI * 2);
    dCtx.fill(); dCtx.stroke();

    // Head
    dCtx.beginPath();
    dCtx.ellipse(85, 60, 56, 42, 0, 0, Math.PI * 2);
    dCtx.fill(); dCtx.stroke();

    // Wide Grin / Snout
    dCtx.fillStyle = '#EFEBE9';
    dCtx.beginPath();
    dCtx.ellipse(85, 78, 42, 28, 0, 0, Math.PI * 2);
    dCtx.fill(); dCtx.stroke();

    // Black Nose
    dCtx.fillStyle = '#2B1E16';
    dCtx.beginPath();
    dCtx.ellipse(85, 65, 12, 8, 0, 0, Math.PI * 2);
    dCtx.fill();

    // Big Cartoon Grin with Tongue
    dCtx.beginPath();
    dCtx.arc(85, 80, 24, 0.1 * Math.PI, 0.9 * Math.PI);
    dCtx.stroke();
    dCtx.fillStyle = '#E91E63';
    dCtx.beginPath();
    dCtx.arc(85, 88, 12, 0, Math.PI);
    dCtx.fill(); dCtx.stroke();

    // Big Eyes looking left toward cat
    dCtx.fillStyle = '#FFFFFF';
    dCtx.beginPath(); dCtx.arc(62, 48, 13, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.beginPath(); dCtx.arc(108, 48, 13, 0, Math.PI * 2); dCtx.fill(); dCtx.stroke();
    dCtx.fillStyle = '#2B1E16';
    dCtx.beginPath(); dCtx.arc(58, 48, 6, 0, Math.PI * 2); dCtx.fill();
    dCtx.beginPath(); dCtx.arc(104, 48, 6, 0, Math.PI * 2); dCtx.fill();
    this.textures.addCanvas('dog_classic', dogCanvas);

    // 6. Projectile (Trash Can / Bone)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 36;
    pCanvas.height = 36;
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = '#FFF';
    pCtx.strokeStyle = '#2B1E16';
    pCtx.lineWidth = 3;
    pCtx.beginPath();
    pCtx.roundRect(8, 12, 20, 10, 4);
    pCtx.fill(); pCtx.stroke();
    pCtx.beginPath(); pCtx.arc(8, 12, 5, 0, Math.PI*2); pCtx.fill(); pCtx.stroke();
    pCtx.beginPath(); pCtx.arc(8, 22, 5, 0, Math.PI*2); pCtx.fill(); pCtx.stroke();
    pCtx.beginPath(); pCtx.arc(28, 12, 5, 0, Math.PI*2); pCtx.fill(); pCtx.stroke();
    pCtx.beginPath(); pCtx.arc(28, 22, 5, 0, Math.PI*2); pCtx.fill(); pCtx.stroke();
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

    this.createStageLayout();
    this.createClassicUI();

    this.changeWind();
    this.startTurn();
  }

  createStageLayout() {
    const { width, height } = this.scale;
    const floorY = height - 60;

    // 1. Sky & Rolling Hills
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x76B6E4, 0x76B6E4, 0xEBF7FD, 0xEBF7FD, 1);
    bg.fillRect(0, 0, width, height);

    // Far mountains (muted green-grey)
    bg.fillStyle(0x7EA598, 1);
    bg.beginPath();
    bg.moveTo(250, height - 120);
    bg.lineTo(440, 150);
    bg.lineTo(650, height - 120);
    bg.lineTo(850, 180);
    bg.lineTo(width, height - 100);
    bg.lineTo(width, height);
    bg.lineTo(250, height);
    bg.closePath();
    bg.fill();

    // 2. Left Side: Urban Alley (Purple wall)
    const alley = this.add.graphics();
    alley.fillStyle(0xBC8CBF, 1); // Classic purple building
    alley.fillRect(0, 0, 240, height);
    alley.lineStyle(5, 0x3E273F);
    alley.beginPath();
    alley.moveTo(240, 0);
    alley.lineTo(240, height);
    alley.stroke();

    // Alley floor (Cobblestone pavement)
    alley.fillStyle(0x9E9D93, 1);
    alley.lineStyle(5, 0x3E3D38);
    alley.fillRect(0, floorY, 410, 60);
    alley.strokeRect(0, floorY, 410, 60);

    // 3. Right Side: Residential Backyard (Green lawn + roof trim)
    const yard = this.add.graphics();
    yard.fillStyle(0x5DAE47, 1); // Rich green lawn
    yard.lineStyle(5, 0x2A581F);
    yard.fillRect(410, floorY, width - 410, 60);
    yard.strokeRect(410, floorY, width - 410, 60);

    // Corner roof detail in far top-right
    yard.fillStyle(0xD84315, 1);
    yard.lineStyle(4, 0x2B1E16);
    yard.beginPath();
    yard.moveTo(width - 140, 100);
    yard.lineTo(width, 40);
    yard.lineTo(width, 160);
    yard.lineTo(width - 100, 210);
    yard.closePath();
    yard.fill();
    yard.stroke();

    // 4. Center Wooden Fence (Positioned exactly between Cat and Dog)
    this.fence = this.add.image(width / 2 + 10, floorY - 110, 'fence_wall');
    this.physics.add.existing(this.fence, true);

    // 5. Cat on Bin
    this.add.image(130, floorY - 60, 'trashcan_full');
    this.cat = this.add.sprite(105, floorY - 140, 'cat_classic');
    this.tweens.add({
      targets: this.cat,
      scaleY: 1.05,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 6. Dog next to his bowl (Standing tall)
    this.add.image(width - 130, floorY - 25, 'dog_bowl_full');
    this.dog = this.add.sprite(width - 130, floorY - 90, 'dog_classic');
    this.tweens.add({
      targets: this.dog,
      scaleY: 1.04,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createClassicUI() {
    const { width } = this.scale;

    // Top Header Plaque with Golden Border
    const uiBox = this.add.graphics();
    uiBox.fillStyle(0xFFEB3B, 1);
    uiBox.lineStyle(4, 0xD84315);
    uiBox.fillRoundedRect(width / 2 - 310, 12, 620, 56, 18);
    uiBox.strokeRoundedRect(width / 2 - 310, 12, 620, 56, 18);

    // Health Bar Containers (Red background)
    uiBox.fillStyle(0xD32F2F, 1);
    uiBox.fillRoundedRect(width / 2 - 290, 24, 210, 20, 6);
    uiBox.fillRoundedRect(width / 2 + 80, 24, 210, 20, 6);

    // Dynamic HP Bars
    this.catHpFill = this.add.graphics();
    this.dogHpFill = this.add.graphics();
    this.updateHealthBar('CAT');
    this.updateHealthBar('DOG');

    // Central Wind Gauge Box
    const windBox = this.add.graphics();
    windBox.fillStyle(0xFF9800, 1);
    windBox.lineStyle(3, 0xD84315);
    windBox.fillRoundedRect(width / 2 - 68, 16, 136, 44, 10);
    windBox.strokeRoundedRect(width / 2 - 68, 16, 136, 44, 10);

    this.windText = this.add.text(width / 2, 38, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#BF360C',
      strokeThickness: 3
    }).setOrigin(0.5);

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
        this.fireProjectile(this.chargePower, 'CAT');
      }
    });
  }

  updateHealthBar(target) {
    const { width } = this.scale;
    if (target === 'CAT') {
      this.catHpFill.clear();
      this.catHpFill.fillStyle(0x00E676, 1);
      this.catHpFill.fillRoundedRect(width / 2 - 290, 24, Math.max(0, this.catHp * 2.1), 20, 6);
    } else {
      this.dogHpFill.clear();
      this.dogHpFill.fillStyle(0x00E676, 1);
      const fillW = Math.max(0, this.dogHp * 2.1);
      this.dogHpFill.fillRoundedRect(width / 2 + 290 - fillW, 24, fillW, 20, 6);
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
      { q: "The cat is ____ the trash bin.", opts: ["ON", "UNDER", "INTO"], ans: "ON" },
      { q: "Yesterday the dog ____ a bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" },
      { q: "Which one is an animal?", opts: ["CAT", "FENCE", "CLOUD"], ans: "CAT" },
      { q: "The fence is in the ____.", opts: ["MIDDLE", "SKY", "WATER"], ans: "MIDDLE" },
      { q: "The dog is sleeping ____ the tree.", opts: ["UNDER", "ABOVE", "THROUGH"], ans: "UNDER" },
      { q: "The bone is ____ the food bowl.", opts: ["IN", "BETWEEN", "AMONG"], ans: "IN" }
    ];
    const item = Phaser.Utils.Array.GetRandom(questions);

    const modal = this.add.container(this.scale.width / 2, 195);
    this.activeModal = modal;
    modal.on('destroy', () => { this.activeModal = null; });

    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF, 0.98);
    bg.lineStyle(5, 0xF57C00);
    bg.fillRoundedRect(-230, -75, 460, 150, 16);
    bg.strokeRoundedRect(-230, -75, 460, 150, 16);
    modal.add(bg);

    const title = this.add.text(0, -45, item.q, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#E65100'
    }).setOrigin(0.5);
    modal.add(title);

    item.opts.forEach((opt, idx) => {
      const btnX = -135 + idx * 135;
      const btnY = 15;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xFF9800, 1);
      btnBg.fillRoundedRect(btnX - 58, btnY - 22, 116, 44, 10);
      modal.add(btnBg);

      const btnTxt = this.add.text(btnX, btnY, opt, {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      modal.add(btnTxt);

      const hitZone = this.add.rectangle(btnX, btnY, 116, 44, 0x000000, 0)
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
          this.showFeedbackToast("CORRECT! HOLD & RELEASE TO THROW!", 0x2E7D32);
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
    const toast = this.add.text(this.scale.width / 2, 110, text, {
      fontSize: '20px',
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

    const startX = shooter === 'CAT' ? this.cat.x + 35 : this.dog.x - 35;
    const startY = shooter === 'CAT' ? this.cat.y - 10 : this.dog.y - 10;
    
    const proj = this.physics.add.sprite(startX, startY, 'bone_proj');
    proj.setAngularVelocity(shooter === 'CAT' ? 420 : -420);

    const angleRad = shooter === 'CAT' ? -58 * (Math.PI / 180) : -122 * (Math.PI / 180);
    const speed = 260 + (power * 7.5);
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

        if (proj.y >= this.scale.height - 60) {
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
    const estimatedPower = Phaser.Math.Clamp(54 - (this.wind * 3.6) + Phaser.Math.Between(-8, 8), 22, 95);
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
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFEB3B',
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
      this.powerBarBg.fillRoundedRect(this.cat.x - 35, this.cat.y - 75, 70, 10, 4);

      this.powerBarFill.clear();
      this.powerBarFill.fillStyle(0xFF9800, 1);
      this.powerBarFill.fillRoundedRect(this.cat.x - 35, this.cat.y - 75, (this.chargePower / 100) * 70, 10, 4);
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
