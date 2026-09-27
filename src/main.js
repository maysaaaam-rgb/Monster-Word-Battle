import Phaser from 'phaser';

// --- Web Audio SFX Synthesizer ---
class SoundController {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
  playTone(freq, type, duration, endFreq = null, vol = 0.2) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  sfxThrow() { this.playTone(340, 'sine', 0.25, 90, 0.25); }
  sfxHit() { this.playTone(140, 'sawtooth', 0.35, 30, 0.3); }
  sfxFence() { this.playTone(180, 'square', 0.15, 60, 0.2); }
  sfxHeal() {
    this.playTone(400, 'triangle', 0.1);
    setTimeout(() => this.playTone(600, 'triangle', 0.2), 90);
  }
  sfxCorrect() {
    this.playTone(520, 'triangle', 0.12);
    setTimeout(() => this.playTone(700, 'triangle', 0.22), 100);
  }
  sfxWrong() { this.playTone(180, 'square', 0.25, 70, 0.2); }
}

const sfx = new SoundController();

class CatDogClassicGame extends Phaser.Scene {
  constructor() {
    super('CatDogClassicGame');
  }

  preload() {
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
    this.turn = 'CAT';
    this.isCharging = false;
    this.chargePower = 0;
    this.canThrow = false;
    this.projectileInFlight = false;

    // Special item inventory for player
    this.items = {
      double: 1, // Double Throw (x2)
      heavy: 1,  // Giant Bone (Extra dmg)
      heal: 1    // First Aid Band-Aid
    };
    this.activePowerUp = null;

    // 1. Background
    this.bg = this.add.image(width / 2, height / 2, 'bg');
    this.bg.setDisplaySize(width, height);
    this.bg.setDepth(0);

    // 2. Ground & World
    this.floorY = height - 42;
    this.ground = this.add.rectangle(width / 2, this.floorY + 20, width, 40, 0x000000, 0);
    this.physics.add.existing(this.ground, true);

    // 3. Fence in Center
    this.fence = this.physics.add.staticImage(width / 2 - 12, this.floorY - 110, 'fence');
    this.fence.setDisplaySize(125, 235);
    this.fence.refreshBody();
    this.fence.setDepth(2);

    // 4. Cat & Dog Characters
    this.cat = this.add.sprite(260, this.floorY - 95, 'cat');
    this.cat.setDisplaySize(205, 225);
    this.cat.setDepth(3);

    this.dog = this.add.sprite(width - 235, this.floorY - 95, 'dog');
    this.dog.setDisplaySize(210, 195);
    this.dog.setDepth(3);

    // Idle breathing tweens
    this.tweens.add({
      targets: this.cat,
      scaleY: this.cat.scaleY * 1.025,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: this.dog,
      scaleY: this.dog.scaleY * 1.025,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 5. Classic Flash HUD
    this.buildClassicHUD();

    // 6. Charging and Controls
    this.input.on('pointerdown', (pointer) => {
      if (!this.canThrow || this.turn !== 'CAT' || this.projectileInFlight) return;
      // Prevent throw if clicking an item button in top region
      if (pointer.y < 120) return;

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
        this.executePlayerThrow(this.chargePower);
      }
    });

    this.updateWind();
    this.startTurn();
  }

  buildClassicHUD() {
    const { width } = this.scale;

    // Golden Main Bar
    const hud = this.add.graphics().setDepth(10);
    hud.fillStyle(0xfed330, 1);
    hud.lineStyle(4, 0xd35400);
    hud.fillRoundedRect(width / 2 - 340, 10, 680, 54, 18);
    hud.strokeRoundedRect(width / 2 - 340, 10, 680, 54, 18);

    // Health Trackers (Red base)
    hud.fillStyle(0xc0392b, 1);
    hud.fillRoundedRect(width / 2 - 275, 26, 180, 20, 6);
    hud.fillRoundedRect(width / 2 + 95, 26, 180, 20, 6);

    // Health Fill Bars
    this.catHpFill = this.add.graphics().setDepth(11);
    this.dogHpFill = this.add.graphics().setDepth(11);
    this.updateHealthBar('CAT');
    this.updateHealthBar('DOG');

    // Cat & Dog Avatar Badges
    const catBadge = this.add.circle(width / 2 - 300, 36, 22, 0x22a4a2).setDepth(12);
    catBadge.setStrokeStyle(3, 0xd35400);
    this.add.image(width / 2 - 300, 36, 'cat').setDisplaySize(38, 38).setDepth(13);

    const dogBadge = this.add.circle(width / 2 + 300, 36, 22, 0x7c6453).setDepth(12);
    dogBadge.setStrokeStyle(3, 0xd35400);
    this.add.image(width / 2 + 300, 36, 'dog').setDisplaySize(38, 38).setDepth(13);

    // Wind Meter in Center
    const windBox = this.add.graphics().setDepth(12);
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
    }).setOrigin(0.5).setDepth(13);

    // Power Meter Display over Cat
    this.powerBarBg = this.add.graphics().setDepth(15).setVisible(false);
    this.powerBarFill = this.add.graphics().setDepth(15).setVisible(false);

    // Item Action Tray (Double Attack, Heavy Throw, First-Aid Heal)
    this.itemContainer = this.add.container(width / 2 - 90, 74).setDepth(14);
    this.buildItemTray();
  }

  buildItemTray() {
    this.itemContainer.removeAll(true);
    const itemTypes = [
      { key: 'double', label: 'x2', color: 0x2980b9 },
      { key: 'heavy', label: 'PWR', color: 0x8e44ad },
      { key: 'heal', label: 'HEAL', color: 0x27ae60 }
    ];

    itemTypes.forEach((it, idx) => {
      const btnX = idx * 64;
      const count = this.items[it.key];
      const isAvailable = count > 0;

      const bg = this.add.graphics();
      bg.fillStyle(isAvailable ? it.color : 0x7f8c8d, 1);
      bg.lineStyle(2, 0xffffff);
      bg.fillRoundedRect(btnX, 0, 56, 28, 8);
      bg.strokeRoundedRect(btnX, 0, 56, 28, 8);
      this.itemContainer.add(bg);

      const txt = this.add.text(btnX + 28, 14, it.label, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.itemContainer.add(txt);

      if (isAvailable) {
        const hitZone = this.add.zone(btnX + 28, 14, 56, 28).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.itemContainer.add(hitZone);

        const onTrigger = () => this.activateItem(it.key);
        hitZone.on('pointerdown', onTrigger);
        txt.setInteractive({ useHandCursor: true }).on('pointerdown', onTrigger);
      }
    });
  }

  activateItem(key) {
    if (!this.canThrow || this.turn !== 'CAT' || this.projectileInFlight) return;
    if (this.items[key] <= 0) return;

    if (key === 'heal') {
      this.items.heal--;
      this.catHp = Math.min(100, this.catHp + 25);
      this.updateHealthBar('CAT');
      sfx.sfxHeal();
      this.showToast("+25 HP RECOVERED!", 0x27ae60);
      this.buildItemTray();
      this.endTurn();
      return;
    }

    this.activePowerUp = key;
    this.items[key]--;
    this.buildItemTray();
    this.showToast(`${key.toUpperCase()} ACTIVATED! HOLD TO THROW`, 0xf39c12);
  }

  updateHealthBar(target) {
    const { width } = this.scale;
    if (target === 'CAT') {
      this.catHpFill.clear();
      this.catHpFill.fillStyle(0x2ecc71, 1);
      this.catHpFill.fillRoundedRect(width / 2 - 275, 26, Math.max(0, this.catHp * 1.8), 20, 6);
    } else {
      this.dogHpFill.clear();
      this.dogHpFill.fillStyle(0x2ecc71, 1);
      const fillW = Math.max(0, this.dogHp * 1.8);
      this.dogHpFill.fillRoundedRect(width / 2 + 275 - fillW, 26, fillW, 20, 6);
    }
  }

  updateWind() {
    this.wind = Phaser.Math.Between(-7, 7);
    const arrow = this.wind > 0 ? '▶▶' : (this.wind < 0 ? '◀◀' : '—');
    this.windText.setText(`WIND ${arrow} ${Math.abs(this.wind)}`);
  }

  startTurn() {
    this.canThrow = false;
    this.activePowerUp = null;
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

    const modal = this.add.container(this.scale.width / 2, 115).setDepth(20);

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

      const hitZone = this.add.zone(btnX, btnY, 96, 28).setOrigin(0.5).setInteractive({ useHandCursor: true });
      modal.add(hitZone);

      const onSelect = () => {
        if (opt === item.ans) {
          sfx.sfxCorrect();
          modal.destroy();
          this.canThrow = true;
          this.showToast("CORRECT! HOLD & RELEASE TO THROW!", 0x27ae60);
        } else {
          sfx.sfxWrong();
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
      btnText.setInteractive({ useHandCursor: true }).on('pointerdown', onSelect);
    });
  }

  showToast(msg, color) {
    const toast = this.add.text(this.scale.width / 2, 160, msg, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#' + color.toString(16).padStart(6, '0'),
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setDepth(25);

    this.time.delayedCall(1600, () => toast.destroy());
  }

  executePlayerThrow(power) {
    if (this.activePowerUp === 'double') {
      this.fireSingleBone(power, 'CAT', 1.0, 20);
      this.time.delayedCall(240, () => {
        this.fireSingleBone(power * 1.06, 'CAT', 1.0, 20);
      });
    } else if (this.activePowerUp === 'heavy') {
      this.fireSingleBone(power, 'CAT', 0.5, 40, 1.4); // 40 damage, less wind drift
    } else {
      this.fireSingleBone(power, 'CAT', 1.0, 25);
    }
  }

  fireSingleBone(power, shooter, windSensitivity = 1.0, damage = 25, scale = 1.0) {
    this.projectileInFlight = true;
    sfx.sfxThrow();

    const startX = shooter === 'CAT' ? this.cat.x + 40 : this.dog.x - 40;
    const startY = shooter === 'CAT' ? this.cat.y - 30 : this.dog.y - 30;

    const proj = this.physics.add.image(startX, startY, 'bone').setDepth(8);
    proj.setDisplaySize(38 * scale, 22 * scale);
    proj.setAngularVelocity(shooter === 'CAT' ? 440 : -440);

    const angleDeg = shooter === 'CAT' ? -56 : -124;
    const angleRad = angleDeg * (Math.PI / 180);
    const speed = 255 + (power * 7.6);

    proj.setVelocity(
      Math.cos(angleRad) * speed + (this.wind * 18 * windSensitivity),
      Math.sin(angleRad) * speed
    );

    const windTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (proj && proj.body) {
          proj.setVelocityX(proj.body.velocity.x + (this.wind * 1.5 * windSensitivity));
        }
      }
    });

    // Fence Collision
    this.physics.add.collider(proj, this.fence, () => {
      windTimer.remove();
      sfx.sfxFence();
      this.createDirtPuff(proj.x, proj.y);
      proj.destroy();
      this.endTurn();
    });

    // Dynamic flight check
    const flightCheck = this.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        if (!proj.active) {
          flightCheck.remove();
          return;
        }

        // Ground hit
        if (proj.y >= this.floorY) {
          windTimer.remove();
          flightCheck.remove();
          sfx.sfxFence();
          this.createDirtPuff(proj.x, this.floorY);
          proj.destroy();
          this.endTurn();
          return;
        }

        // Hit Dog
        if (shooter === 'CAT' && Phaser.Math.Distance.Between(proj.x, proj.y, this.dog.x, this.dog.y) < 65) {
          windTimer.remove();
          flightCheck.remove();
          proj.destroy();
          this.applyDamage('DOG', damage);
          return;
        }

        // Hit Cat
        if (shooter === 'DOG' && Phaser.Math.Distance.Between(proj.x, proj.y, this.cat.x, this.cat.y) < 65) {
          windTimer.remove();
          flightCheck.remove();
          proj.destroy();
          this.applyDamage('CAT', damage);
          return;
        }
      }
    });
  }

  createDirtPuff(x, y) {
    const puff = this.add.circle(x, y, 12, 0xdfe6e9, 0.8).setDepth(9);
    this.tweens.add({
      targets: puff,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 250,
      onComplete: () => puff.destroy()
    });
  }

  applyDamage(target, amount) {
    sfx.sfxHit();
    this.cameras.main.shake(240, 0.018);

    const victim = target === 'DOG' ? this.dog : this.cat;
    this.tweens.add({
      targets: victim,
      scaleX: victim.scaleX * 1.25,
      scaleY: victim.scaleY * 0.75,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

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
    // Dog AI calculates ballistic curve against wind with intelligent margin of error
    const idealPower = 52 - (this.wind * 3.4);
    const aiPower = Phaser.Math.Clamp(idealPower + Phaser.Math.Between(-6, 6), 20, 95);
    this.fireSingleBone(aiPower, 'DOG', 1.0, 25);
  }

  endTurn() {
    this.projectileInFlight = false;
    this.turn = this.turn === 'CAT' ? 'DOG' : 'CAT';
    this.updateWind();
    this.time.delayedCall(900, () => this.startTurn());
  }

  gameOver(winner) {
    const text = this.add.text(this.scale.width / 2, this.scale.height / 2, `${winner} WINS!`, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(30);

    this.time.delayedCall(3000, () => this.scene.restart());
  }

  update() {
    if (this.isCharging && this.chargePower < 100) {
      this.chargePower += 1.8;

      this.powerBarBg.clear();
      this.powerBarBg.fillStyle(0x000000, 0.65);
      this.powerBarBg.fillRoundedRect(this.cat.x - 35, this.cat.y - 130, 70, 10, 4);

      this.powerBarFill.clear();
      this.powerBarFill.fillStyle(0xff9f1a, 1);
      this.powerBarFill.fillRoundedRect(this.cat.x - 35, this.cat.y - 130, (this.chargePower / 100) * 70, 10, 4);
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
  scene: [CatDogClassicGame]
};

const game = new Phaser.Game(config);
window.phaserGame = game;
