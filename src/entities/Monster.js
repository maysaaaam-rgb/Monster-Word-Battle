import Phaser from 'phaser';

export default class Monster extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type = 'player') {
    super(scene, x, y);
    this.scene = scene;
    this.type = type; // 'player' (blue) or 'opponent' (red)
    this.baseX = x;
    this.baseY = y;
    this.maxHp = 100;
    this.hp = 100;
    this.isDizzy = false;
    this.heldItemType = null; // 'rock', 'fireball', or null
    this.isHit = false;

    this.prefix = this.type === 'player' ? 'blue_' : 'red_';

    this.createCharacterRig();
    this.setupBreathingIdle();
    this.setupBlinkingTimer();

    scene.add.existing(this);
  }

  createCharacterRig() {
    // 1. Ground Drop Shadow
    this.shadow = this.scene.add.graphics();
    this.shadow.fillStyle(0x0c1829, 0.4);
    this.shadow.fillEllipse(0, 10, 110, 24);
    this.add(this.shadow);

    // 2. Torso Rig Container (bobs & squashes independently during breathing/throw)
    this.torso = this.scene.add.container(0, 0);
    this.add(this.torso);

    // Feet
    this.footLeft = this.scene.add.image(-28, 0, `${this.prefix}foot`).setOrigin(0.5, 0.5);
    this.footRight = this.scene.add.image(28, 0, `${this.prefix}foot`).setOrigin(0.5, 0.5);
    if (this.type === 'opponent') {
      this.footLeft.setFlipX(true);
      this.footRight.setFlipX(true);
    }
    this.add(this.footLeft);
    this.add(this.footRight);

    // Main Body
    this.bodySprite = this.scene.add.image(0, -60, `${this.prefix}body`).setOrigin(0.5, 0.5);
    if (this.type === 'opponent') this.bodySprite.setFlipX(true);
    this.torso.add(this.bodySprite);

    // Belly Patch
    this.bellySprite = this.scene.add.image(0, -45, `${this.prefix}belly`).setOrigin(0.5, 0.5);
    if (this.type === 'opponent') this.bellySprite.setFlipX(true);
    this.torso.add(this.bellySprite);

    // Facial Features Container
    this.face = this.scene.add.container(0, -65);
    this.torso.add(this.face);

    // Eyes
    this.eyeOpen = this.scene.add.image(0, 0, `${this.prefix}eye_open`).setOrigin(0.5, 0.5);
    this.eyeBlink = this.scene.add.image(0, 0, `${this.prefix}eye_blink`).setOrigin(0.5, 0.5).setVisible(false);
    this.eyeHurt = this.scene.add.image(0, 0, `${this.prefix}eye_hurt`).setOrigin(0.5, 0.5).setVisible(false);
    this.face.add(this.eyeOpen);
    this.face.add(this.eyeBlink);
    this.face.add(this.eyeHurt);

    // Mouth
    const mouthKey = this.type === 'player' ? 'blue_mouth_smile' : 'red_mouth';
    this.mouth = this.scene.add.image(0, 20, mouthKey).setOrigin(0.5, 0.5);
    this.face.add(this.mouth);

    // Arms
    // Left Arm (Throwing/Aiming arm for player)
    this.armLeft = this.scene.add.image(-42, -55, `${this.prefix}arm`).setOrigin(0.8, 0.3);
    this.torso.add(this.armLeft);

    // Right Arm
    this.armRight = this.scene.add.image(42, -55, `${this.prefix}arm`).setOrigin(0.2, 0.3);
    if (this.type === 'player') this.armRight.setFlipX(true);
    this.torso.add(this.armRight);

    // Held Item (Equipped weapon held in hand when aiming)
    this.heldItemSprite = this.scene.add.image(-52, -72, 'proj_fireball').setOrigin(0.5, 0.5).setVisible(false);
    this.torso.add(this.heldItemSprite);
  }

  setupBreathingIdle() {
    // Gentle sine-wave breathing & bobbing animation
    this.scene.tweens.add({
      targets: this.torso,
      scaleY: 1.04,
      scaleX: 0.98,
      y: -4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Slight foot compression
    this.scene.tweens.add({
      targets: [this.footLeft, this.footRight],
      scaleY: 0.92,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  setupBlinkingTimer() {
    const triggerBlink = () => {
      if (this.isHit || this.isDizzy) return;
      this.eyeOpen.setVisible(false);
      this.eyeBlink.setVisible(true);

      this.scene.time.delayedCall(130, () => {
        if (!this.isHit && !this.isDizzy) {
          this.eyeBlink.setVisible(false);
          this.eyeOpen.setVisible(true);
        }
      });

      // Schedule next blink randomly between 2.5s and 4.8s
      this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(2500, 4800), triggerBlink);
    };

    this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(1500, 3000), triggerBlink);
  }

  setHeldItem(type) {
    this.heldItemType = type;
    if (!type || this.type !== 'player') {
      this.heldItemSprite.setVisible(false);
      this.armLeft.setRotation(0);
      return;
    }

    const textureKey = type === 'fireball' ? 'proj_fireball' : 'proj_rock';
    this.heldItemSprite.setTexture(textureKey);
    this.heldItemSprite.setVisible(true);
    this.heldItemSprite.setScale(type === 'fireball' ? 0.75 : 0.65);

    // Aim pose: Arm raises backward holding weapon
    this.armLeft.setRotation(-0.45);
  }

  setAimAngle(angleDeg) {
    if (this.type !== 'player') return;
    // Rotate arm slightly with angle
    const rad = Phaser.Math.DegToRad(angleDeg);
    this.armLeft.setRotation(-0.3 - (angleDeg / 90) * 0.35);
  }

  playThrowAnimation(onRelease) {
    // 3-Stage Cartoon Squash & Stretch Throw
    // Stage 1: Anticipation (wind-up lean back & squash)
    this.scene.tweens.add({
      targets: this.torso,
      scaleX: 1.15,
      scaleY: 0.85,
      x: -18,
      rotation: -0.15,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Stage 2: Thrust snap forward (stretch & release)
        this.scene.tweens.add({
          targets: this.torso,
          scaleX: 0.88,
          scaleY: 1.25,
          x: 24,
          rotation: 0.22,
          duration: 110,
          ease: 'Cubic.easeOut',
          onStart: () => {
            // Hide held item upon release
            this.heldItemSprite.setVisible(false);
            this.armLeft.setRotation(0.8);
            if (onRelease) onRelease();
          },
          onComplete: () => {
            // Stage 3: Follow-through and settle back to idle
            this.scene.tweens.add({
              targets: this.torso,
              scaleX: 1,
              scaleY: 1,
              x: 0,
              rotation: 0,
              duration: 380,
              ease: 'Back.easeOut',
              onComplete: () => {
                this.armLeft.setRotation(0);
              }
            });
          }
        });
      }
    });
  }

  takeDamage(amount) {
    this.isHit = true;
    this.hp = Math.max(0, this.hp - amount);

    // 1. Dizzy/Hurt Facial Expression
    this.eyeOpen.setVisible(false);
    this.eyeBlink.setVisible(false);
    this.eyeHurt.setVisible(true);

    if (this.type === 'player') {
      this.mouth.setTexture('blue_mouth_hurt');
    }

    // 2. Comic Hit Flash
    this.scene.tweens.add({
      targets: [this.bodySprite, this.bellySprite],
      tint: 0xff4757,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.bodySprite.clearTint();
        this.bellySprite.clearTint();
      }
    });

    // 3. Knockback $+35px with elastic bounce
    const knockDir = this.type === 'player' ? -35 : 35;
    this.scene.tweens.add({
      targets: this,
      x: this.baseX + knockDir,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          x: this.baseX,
          duration: 400,
          ease: 'Bounce.easeOut'
        });
      }
    });

    // 4. Floating Damage Text
    const dmgText = this.scene.add.text(this.x, this.y - 120, `-${amount} HP`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '36px',
      fontStyle: '900',
      color: '#ff3838',
      stroke: '#ffffff',
      strokeThickness: 8,
      shadow: { blur: 10, color: '#000000', fill: true }
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 60,
      scale: 1.35,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => dmgText.destroy()
    });

    // Reset expression after delay unless defeated
    this.scene.time.delayedCall(900, () => {
      this.isHit = false;
      if (this.hp > 0) {
        this.eyeHurt.setVisible(false);
        this.eyeOpen.setVisible(true);
        if (this.type === 'player') {
          this.mouth.setTexture('blue_mouth_smile');
        }
      } else {
        this.isDizzy = true;
      }
    });
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);

    // 1. Joyful upward hop
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - 28,
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    // 2. Floating Healing Crosses & Heart Bubbles
    for (let i = 0; i < 8; i++) {
      const isCross = i % 2 === 0;
      const key = isCross ? 'heal_cross' : 'heart_particle';
      const particle = this.scene.add.image(
        this.x + Phaser.Math.Between(-35, 35),
        this.y - Phaser.Math.Between(20, 60),
        key
      ).setDepth(28).setScale(0.8);

      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(50, 90),
        x: particle.x + Phaser.Math.Between(-20, 20),
        scale: 1.25,
        alpha: 0,
        duration: 850,
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // 3. Floating Green +30 HP text
    const healText = this.scene.add.text(this.x, this.y - 120, `+${amount} HP`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '36px',
      fontStyle: '900',
      color: '#2ed573',
      stroke: '#ffffff',
      strokeThickness: 8,
      shadow: { blur: 10, color: '#000000', fill: true }
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 60,
      scale: 1.35,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => healText.destroy()
    });
  }

  playThinkingAnimation() {
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - 16,
      duration: 320,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });
  }

  playVictory() {
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - 40,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeOut'
    });

    this.armLeft.setRotation(-1.2);
    this.armRight.setRotation(1.2);
  }

  reset() {
    this.hp = this.maxHp;
    this.isDizzy = false;
    this.isHit = false;
    this.x = this.baseX;
    this.y = this.baseY;
    this.torso.setScale(1);
    this.torso.setRotation(0);
    this.eyeHurt.setVisible(false);
    this.eyeBlink.setVisible(false);
    this.eyeOpen.setVisible(true);
    if (this.type === 'player') {
      this.mouth.setTexture('blue_mouth_smile');
    }
  }

  getLaunchPoint() {
    return {
      x: this.x + 48,
      y: this.y - 72
    };
  }

  getHitBounds() {
    return {
      x: this.x,
      y: this.y - 55,
      radius: 55
    };
  }
}
