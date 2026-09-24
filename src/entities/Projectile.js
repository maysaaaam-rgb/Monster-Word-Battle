import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, vx, vy, gravity, windAcc, targetMonster, groundY, audioSystem, weaponType = 'rock', onHit, obstacleBounds = null) {
    super(scene, x, y);
    this.scene = scene;
    this.vx = vx;
    this.vy = vy;
    this.gravity = gravity;
    this.windAcc = windAcc;
    this.targetMonster = targetMonster;
    this.groundY = groundY;
    this.audioSystem = audioSystem;
    this.weaponType = weaponType; // 'rock' or 'fireball'
    this.damage = weaponType === 'fireball' ? 35 : 20;
    this.onHit = onHit;
    this.obstacleBounds = obstacleBounds || { xMin: 560, xMax: 720, yMin: 450 };
    this.isDead = false;

    this.trailTimer = 0;

    // Sprite
    const textureKey = weaponType === 'fireball' ? 'proj_fireball' : 'proj_rock';
    this.sprite = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0.5);
    this.sprite.setScale(weaponType === 'fireball' ? 0.95 : 0.85);
    this.add(this.sprite);

    scene.add.existing(this);
    this.setDepth(18);
  }

  update(delta) {
    if (this.isDead) return;

    const dt = delta / 1000;

    // 1. Rotate projectile during flight
    const rotSpeed = this.weaponType === 'fireball' ? 14 : 8;
    this.sprite.rotation += rotSpeed * dt;

    // 2. Physics: Wind & Gravity
    this.vx += this.windAcc * dt;
    this.vy += this.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 3. Motion Trail Particles
    this.trailTimer += delta;
    const trailInterval = this.weaponType === 'fireball' ? 20 : 35;
    if (this.trailTimer > trailInterval) {
      this.trailTimer = 0;
      this.spawnMotionTrail();
    }

    // 4. Collision with Central Rock/Crate Obstacle
    if (this.obstacleBounds) {
      if (this.x >= this.obstacleBounds.xMin && this.x <= this.obstacleBounds.xMax && this.y >= this.obstacleBounds.yMin) {
        this.hit('obstacle');
        return;
      }
    }

    // 5. Collision with Opponent Monster
    if (this.targetMonster && !this.targetMonster.isHit) {
      const bounds = this.targetMonster.getHitBounds();
      const dist = Phaser.Math.Distance.Between(this.x, this.y, bounds.x, bounds.y);
      if (dist < bounds.radius + 18) {
        this.hit('monster');
        return;
      }
    }

    // 6. Collision with Ground / Water
    if (this.y >= this.groundY) {
      this.hit('ground');
      return;
    }

    // Out of Bounds
    if (this.x > 1340 || this.x < -60 || this.y > 760) {
      this.destroySelf();
      if (this.onHit) this.onHit(false, this.x, this.y, 0, false);
    }
  }

  spawnMotionTrail() {
    const isFire = this.weaponType === 'fireball';
    const key = isFire ? 'flame_particle' : null;

    if (isFire) {
      const particle = this.scene.add.image(
        this.x + Phaser.Math.Between(-6, 6),
        this.y + Phaser.Math.Between(-6, 6),
        key
      ).setDepth(16).setScale(Phaser.Math.FloatBetween(0.6, 1.1));

      this.scene.tweens.add({
        targets: particle,
        scale: 0.1,
        alpha: 0,
        x: particle.x - this.vx * 0.04,
        y: particle.y - this.vy * 0.04,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    } else {
      // Dust puff for rock
      const dust = this.scene.add.graphics().setDepth(16);
      dust.fillStyle(0xa4b0be, 0.7);
      dust.fillCircle(this.x, this.y, Phaser.Math.Between(4, 7));

      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 1.8,
        duration: 250,
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy()
      });
    }
  }

  hit(targetType) {
    if (this.isDead) return;
    this.isDead = true;

    const hitX = this.x;
    const hitY = this.y;

    // Check Shield Protection
    let isShieldBlocked = false;
    if (targetType === 'monster' && this.targetMonster && this.targetMonster.isShieldActive) {
      isShieldBlocked = true;
      this.targetMonster.breakShield();
    }

    // 1. Comic Impact Starburst & Shockwave
    const explosion = this.scene.add.image(hitX, hitY, 'impact_explosion')
      .setDepth(25)
      .setScale(0.3)
      .setAlpha(1);

    this.scene.tweens.add({
      targets: explosion,
      scale: this.weaponType === 'fireball' ? 1.6 : 1.1,
      alpha: 0,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => explosion.destroy()
    });

    // 2. Camera Punch Screen Shake
    const shakeIntensity = this.weaponType === 'fireball' ? 0.018 : 0.01;
    this.scene.cameras.main.shake(220, shakeIntensity);

    // 3. Audio Impact
    if (this.audioSystem) {
      this.audioSystem.playImpact();
      if (targetType === 'monster' && !isShieldBlocked) {
        this.audioSystem.playHit();
      }
    }

    // 4. Flying Sparks Shower
    const count = this.weaponType === 'fireball' ? 18 : 10;
    for (let i = 0; i < count; i++) {
      const spark = this.scene.add.graphics().setDepth(26);
      const isFire = this.weaponType === 'fireball';
      spark.fillStyle(isFire ? (i % 2 === 0 ? 0xfffa65 : 0xff4757) : 0xced6e0, 1);
      spark.fillCircle(0, 0, Phaser.Math.Between(3, 6));
      spark.x = hitX;
      spark.y = hitY;

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(120, 280);

      this.scene.tweens.add({
        targets: spark,
        x: hitX + Math.cos(angle) * (speed * 0.4),
        y: hitY + Math.sin(angle) * (speed * 0.4) + 25,
        alpha: 0,
        scale: 0.2,
        duration: 450,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // 5. If hitting obstacle, spawn rubble dust puff
    if (targetType === 'obstacle') {
      const dustPuff = this.scene.add.text(hitX, hitY - 30, '💥 THUD!', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '22px',
        fontStyle: '900',
        color: '#f59e0b',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5).setDepth(27);

      this.scene.tweens.add({
        targets: dustPuff,
        y: dustPuff.y - 35,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => dustPuff.destroy()
      });
    }

    this.destroySelf();

    // Notify scene
    const effectiveDamage = isShieldBlocked ? 0 : this.damage;
    if (this.onHit) {
      this.onHit(targetType === 'monster', hitX, hitY, effectiveDamage, isShieldBlocked);
    }
  }

  destroySelf() {
    this.isDead = true;
    this.destroy();
  }
}
