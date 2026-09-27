import Phaser from 'phaser';

// نظام صوتي مركب عبر Web Audio API بدون الحاجة لملفات صوت خارجية
class SoundEffects {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playTone(freq, type, duration, endFreq = null) {
    this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
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
    } catch (e) {}
  }
  throw() { this.playTone(380, 'sine', 0.28, 90); }
  hit() { this.playTone(150, 'sawtooth', 0.35, 30); }
  correct() {
    this.playTone(520, 'triangle', 0.12);
    setTimeout(() => this.playTone(680, 'triangle', 0.2), 100);
  }
  wrong() { this.playTone(180, 'square', 0.25, 80); }
}

const sfx = new SoundEffects();

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    // تحميل الصور عالية الدقة المفرغة المحفوظة في public/assets/
    this.load.image('bg', 'assets/background.jpg');
    this.load.image('fence', 'assets/fence.png');
    this.load.image('cat', 'assets/cat.png');
    this.load.image('dog', 'assets/dog.png');
    this.load.image('bone', 'assets/bone.png');
  }

  create() {
    const { width, height } = this.scale;

    this.catHp = 100;
    this.dogHp = 100;
    this.wind = 0;
    this.turn = 'CAT'; // يبدأ القط
    this.isCharging = false;
    this.chargePower = 0;
    this.canThrow = false;
    this.projectileInFlight = false;

    // 1. Single continuous background pinned to the center
    this.bg = this.add.image(width / 2, height / 2, 'bg');
    this.bg.setDisplaySize(width, height);
    this.bg.setDepth(0);

    // Ground line baseline
    this.floorY = height - 42;
    this.ground = this.add.rectangle(width / 2, this.floorY + 20, width, 40, 0x000000, 0);
    this.physics.add.existing(this.ground, true);

    // Center Fence grounded firmly into the turf
    this.fence = this.physics.add.staticImage(width / 2 - 12, this.floorY - 110, 'fence');
    this.fence.setDisplaySize(125, 235); // Wider and taller to match the classic proportion
    this.fence.refreshBody();
    this.fence.setDepth(2);

    // Fleabag (Cat) resting solidly on the cobblestone walkway
    this.cat = this.add.sprite(260, this.floorY - 95, 'cat');
    this.cat.setDisplaySize(205, 225);
    this.cat.setDepth(3);
    // حركة تنفس كرتونية خفيفة
    this.tweens.add({
      targets: this.cat,
      scaleY: this.cat.scaleY * 1.03,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Mutt (Dog) anchored on the right lawn
    this.dog = this.add.sprite(width - 235, this.floorY - 95, 'dog');
    this.dog.setDisplaySize(210, 195);
    this.dog.setDepth(3);
    this.tweens.add({
      targets: this.dog,
      scaleY: this.dog.scaleY * 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 6. واجهة المستخدم الكلاسيكية (Classic Flash HUD)
    this.buildTopUI();

    // 7. التقاط الضغط لشحن الرمية
    this.input.on('pointerdown', () => {
      if (!this.canThrow || this.turn !== 'CAT' || this.projectileInFlight) return;
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

    // بدء الجولة الأولى
    this.updateWind();
    this.startTurn();
  }

  buildTopUI() {
    const { width } = this.scale;

    // Golden Bar Frame
    const hud = this.add.graphics();
    hud.fillStyle(0xfed330, 1);
    hud.lineStyle(4, 0xd35400);
    hud.fillRoundedRect(width / 2 - 340, 10, 680, 54, 18);
    hud.strokeRoundedRect(width / 2 - 340, 10, 680, 54, 18);

    // Health Trackers (Red base)
    hud.fillStyle(0xc0392b, 1);
    hud.fillRoundedRect(width / 2 - 280, 26, 190, 20, 6);
    hud.fillRoundedRect(width / 2 + 90, 26, 190, 20, 6);

    // Dynamic HP Bars
    this.catHpFill = this.add.graphics();
    this.dogHpFill = this.add.graphics();
    this.updateHealthBar('CAT');
    this.updateHealthBar('DOG');

    // Cat Avatar Badge (Left)
    const catBadgeBg = this.add.circle(width / 2 - 305, 36, 22, 0x22a4a2);
    catBadgeBg.setStrokeStyle(3, 0xd35400);
    const catIcon = this.add.image(width / 2 - 305, 36, 'cat');
    catIcon.setDisplaySize(38, 38);

    // Dog Avatar Badge (Right)
    const dogBadgeBg = this.add.circle(width / 2 + 305, 36, 22, 0x7c6453);
    dogBadgeBg.setStrokeStyle(3, 0xd35400);
    const dogIcon = this.add.image(width / 2 + 305, 36, 'dog');
    dogIcon.setDisplaySize(38, 38);

    // Wind Gauge Badge
    const windBox = this.add.graphics();
    windBox.fillStyle(0xff9f1a, 1);
    windBox.lineStyle(3, 0xd35400);
    windBox.fillRoundedRect(width / 2 - 68, 14, 136, 44, 12);
    windBox.strokeRoundedRect(width / 2 - 68, 14, 136, 44, 12);

    this.windText = this.add.text(width / 2, 36, '', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#b33939',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Power Charge Meter
    this.powerBarBg = this.add.graphics().setVisible(false).setDepth(10);
    this.powerBarFill = this.add.graphics().setVisible(false).setDepth(10);
  }

  updateHealthBar(target) {
    const { width } = this.scale;
    if (target === 'CAT') {
      this.catHpFill.clear();
      this.catHpFill.fillStyle(0x2ecc71, 1);
      this.catHpFill.fillRoundedRect(width / 2 - 280, 26, Math.max(0, this.catHp * 1.9), 20, 6);
    } else {
      this.dogHpFill.clear();
      this.dogHpFill.fillStyle(0x2ecc71, 1);
      const fillW = Math.max(0, this.dogHp * 1.9);
      this.dogHpFill.fillRoundedRect(width / 2 + 280 - fillW, 26, fillW, 20, 6);
    }
  }

  updateWind() {
    this.wind = Phaser.Math.Between(-6, 6);
    const arrow = this.wind > 0 ? '▶▶' : (this.wind < 0 ? '◀◀' : '—');
    this.windText.setText(`WIND ${arrow} ${Math.abs(this.wind)}`);
  }

  startTurn() {
    this.canThrow = false;
    if (this.turn === 'CAT') {
      this.showESLQuiz();
    } else {
      this.time.delayedCall(1200, () => this.runDogAI());
    }
  }

  showESLQuiz() {
    const questions = [
      { q: "Yesterday the dog ____ a big bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" },
      { q: "The cat is sitting ____ the wooden box.", opts: ["ON", "INTO", "UNDER"], ans: "ON" },
      { q: "What stands in the middle of the yards?", opts: ["FENCE", "RIVER", "CAR"], ans: "FENCE" },
      { q: "Dogs really love to chew on ____.", opts: ["BONES", "ROCKS", "CLOUDS"], ans: "BONES" }
    ];
    const item = Phaser.Utils.Array.GetRandom(questions);

    // Drop the plaque down slightly so the entire wind badge remains readable
    const modal = this.add.container(this.scale.width / 2, 108);
    modal.setDepth(10);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.98);
    bg.lineStyle(3.5, 0xff9f1a);
    bg.fillRoundedRect(-220, -22, 440, 78, 12);
    bg.strokeRoundedRect(-220, -22, 440, 78, 12);
    modal.add(bg);

    const questionText = this.add.text(0, -6, item.q, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#d35400'
    }).setOrigin(0.5);
    modal.add(questionText);

    item.opts.forEach((opt, idx) => {
      const btnX = -120 + idx * 120;
      const btnY = 28;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xff9f1a, 1);
      btnBg.fillRoundedRect(btnX - 48, btnY - 14, 96, 28, 6);
      modal.add(btnBg);

      const btnText = this.add.text(btnX, btnY, opt, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      modal.add(btnText);

      // Hit area covering the button
      const hitZone = this.add.zone(btnX, btnY, 96, 28).setOrigin(0.5).setInteractive({ useHandCursor: true });
      modal.add(hitZone);

      const handleChoice = () => {
        if (opt === item.ans) {
          sfx.correct();
          modal.destroy();
          this.canThrow = true;
          this.showToast("CORRECT! HOLD & RELEASE TO THROW!", 0x27ae60);
        } else {
          sfx.wrong();
          this.tweens.add({
            targets: modal,
            x: modal.x + 8,
            duration: 50,
            yoyo: true,
            repeat: 3
          });
        }
      };

      hitZone.on('pointerdown', handleChoice);
      btnText.setInteractive({ useHandCursor: true }).on('pointerdown', handleChoice);
    });
  }

  showToast(msg, color) {
    const toast = this.add.text(this.scale.width / 2, 155, msg, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#' + color.toString(16).padStart(6, '0'),
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setDepth(11);

    this.time.delayedCall(1600, () => toast.destroy());
  }

  fireProjectile(power, shooter) {
    this.projectileInFlight = true;
    sfx.throw();

    const startX = shooter === 'CAT' ? this.cat.x + 40 : this.dog.x - 40;
    const startY = shooter === 'CAT' ? this.cat.y - 30 : this.dog.y - 30;

    const proj = this.physics.add.image(startX, startY, 'bone');
    proj.setDisplaySize(38, 22);
    proj.setDepth(5);
    proj.setAngularVelocity(shooter === 'CAT' ? 420 : -420);

    // زاوية وسرعة القذف الباليستي
    const angleRad = shooter === 'CAT' ? -55 * (Math.PI / 180) : -125 * (Math.PI / 180);
    const speed = 260 + (power * 7.5);
    proj.setVelocity(
      Math.cos(angleRad) * speed + (this.wind * 20),
      Math.sin(angleRad) * speed
    );

    // تأثير الرياح المستمر خلال الطيران
    const windTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (proj && proj.body) {
          proj.setVelocityX(proj.body.velocity.x + this.wind * 1.6);
        }
      }
    });

    // الاصطدام بالسياج الخشبي
    this.physics.add.collider(proj, this.fence, () => {
      windTimer.remove();
      sfx.hit();
      proj.destroy();
      this.endTurn();
    });

    // مراقبة مسار المقذوف والاصطدام بالخصم أو الأرض
    const checkCollision = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!proj.active) {
          checkCollision.remove();
          return;
        }

        // السقوط على الأرض
        if (proj.y >= this.floorY) {
          windTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.endTurn();
          return;
        }

        // إصابة الكلب
        if (shooter === 'CAT' && Phaser.Math.Distance.Between(proj.x, proj.y, this.dog.x, this.dog.y) < 65) {
          windTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.applyDamage('DOG', 25);
          return;
        }

        // إصابة القط
        if (shooter === 'DOG' && Phaser.Math.Distance.Between(proj.x, proj.y, this.cat.x, this.cat.y) < 65) {
          windTimer.remove();
          checkCollision.remove();
          proj.destroy();
          this.applyDamage('CAT', 25);
          return;
        }
      }
    });
  }

  applyDamage(target, amount) {
    sfx.hit();
    this.cameras.main.shake(220, 0.015);

    if (target === 'DOG') {
      this.dogHp = Math.max(0, this.dogHp - amount);
      this.updateHealthBar('DOG');
      this.tweens.add({ targets: this.dog, tint: 0xff3838, duration: 80, yoyo: true, repeat: 2 });
    } else {
      this.catHp = Math.max(0, this.catHp - amount);
      this.updateHealthBar('CAT');
      this.tweens.add({ targets: this.cat, tint: 0xff3838, duration: 80, yoyo: true, repeat: 2 });
    }

    if (this.catHp <= 0 || this.dogHp <= 0) {
      this.time.delayedCall(700, () => this.gameOver(target === 'DOG' ? 'CAT' : 'DOG'));
    } else {
      this.endTurn();
    }
  }

  runDogAI() {
    const estimatedPower = Phaser.Math.Clamp(52 - (this.wind * 3.4) + Phaser.Math.Between(-8, 8), 20, 95);
    this.fireProjectile(estimatedPower, 'DOG');
  }

  endTurn() {
    this.projectileInFlight = false;
    this.turn = this.turn === 'CAT' ? 'DOG' : 'CAT';
    this.updateWind();
    this.time.delayedCall(900, () => this.startTurn());
  }

  gameOver(winner) {
    this.add.text(this.scale.width / 2, this.scale.height / 2, `${winner} WINS!`, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => this.scene.restart());
  }

  update() {
    if (this.isCharging && this.chargePower < 100) {
      this.chargePower += 1.8;

      this.powerBarBg.clear();
      this.powerBarBg.fillStyle(0x000000, 0.65);
      this.powerBarBg.fillRoundedRect(this.cat.x - 35, this.cat.y - 120, 70, 10, 4);

      this.powerBarFill.clear();
      this.powerBarFill.fillStyle(0xff9f1a, 1);
      this.powerBarFill.fillRoundedRect(this.cat.x - 35, this.cat.y - 120, (this.chargePower / 100) * 70, 10, 4);
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
  scene: [BattleScene]
};

const game = new Phaser.Game(config);
window.phaserGame = game;
