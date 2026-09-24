import Phaser from 'phaser';
import { PHYSICS, calculateKinematics } from '../systems/PhysicsConfig.js';

export default class Projectile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, vx, vy, gravity, windAcc, targetMonster, groundY, audioSystem, weaponType = 'rock', onHit, obstacleBounds = null) {
    super(scene, x, y);
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.vx = vx;
    this.vy = vy;
    this.gravity = gravity || PHYSICS.gravity;
    this.windAcc = windAcc;
    this.targetMonster = targetMonster;
    this.groundY = groundY || PHYSICS.groundY;
    this.audioSystem = audioSystem;
    this.weaponType = weaponType; // 'rock' or 'fireball'
    this.damage = weaponType === 'fireball' ? 35 : 20;
    this.onHit = onHit;
    this.obstacleBounds = obstacleBounds || PHYSICS.obstacle;
    this.radius = 18; // Collision radius
    this.isDead = false;
    this.flightTime = 0; // Elapsed seconds

    this.trailTimer = 0;

    // Sprite
    const textureKey = weaponType === 'fireball' ? 'proj_fireball' : 'proj_rock';
    this.sprite = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0.5);
    this.sprite.setScale(weaponType === 'fireball' ? 0.95 : 0.85);
    this.add(this.sprite);

    // Debug circle
    this.debugGfx = scene.add.graphics();
    this.add(this.debugGfx);

    scene.add.existing(this);
    this.setDepth(18);
  }

  update(delta) {
    if (this.isDead) return;

    const dt = delta / 1000;
    this.flightTime += dt;

    // 1. Analytical Kinematics (Matches trajectory dots 100% exactly)
    const { x, y, vxAtT, vyAtT } = calculateKinematics(
      this.startX,
      this.startY,
      this.vx,
      this.vy,
      this.windAcc,
      this.gravity,
      this.flightTime
    );

    this.x = x;
    this.y = y;

    // 2. Rotate Sprite along tangent trajectory
    if (this.weaponType === 'fireball') {
      this.sprite.rotation += 12 * dt;
    } else {
      this.sprite.rotation = Math.atan2(vyAtT, vxAtT);
    }

    // 3. Motion Trail Particles
    this.trailTimer += delta;
    const trailInterval = this.weaponType === 'fireball' ? 25 : 45;
    if (this.trailTimer > trailInterval) {
      this.trailTimer = 0;
      this.spawnMotionTrail(vxAtT, vyAtT);
    }

    // 4. Debug bounds display if enabled on scene
    if (this.scene.debugMode) {
      this.debugGfx.clear();
      this.debugGfx.lineStyle(2, 0xff0000, 1);
      this.debugGfx.strokeCircle(0, 0, this.radius);
    }

    // 5. Collision with Central Obstacle
    if (this.obstacleBounds) {
      if (this.x >= this.obstacleBounds.xMin && this.x <= this.obstacleBounds.xMax && this.y >= this.obstacleBounds.yMin) {
        this.hit('obstacle');
        return;
      }
    }

    // 6. Collision with Target Monster Hitbox
    if (this.targetMonster && !this.targetMonster.isHit) {
      const bounds = this.targetMonster.getHitBounds();
      const dist = Phaser.Math.Distance.Between(this.x, this.y, bounds.x, bounds.y);
      if (dist <= bounds.radius + this.radius) {
        this.hit('monster');
        return;
      }
    }

    // 7. Collision with Ground / Water
    if (this.y >= this.groundY) {
      this.hit('ground');
      return;
    }

    // 8. Out of Bounds
    if (this.x > 1350 || this.x < -60 || this.y > 760) {
      this.destroySelf();
      if (this.onHit) this.onHit(false, this.x, this.y, 0, false);
    }
  }

  spawnMotionTrail(vx, vy) {
    const isFire = this.weaponType === 'fireball';

    if (isFire) {
      const particle = this.scene.add.image(
        this.x + Phaser.Math.Between(-4, 4),
        this.y + Phaser.Math.Between(-4, 4),
        'flame_particle'
      ).setDepth(16).setScale(Phaser.Math.FloatBetween(0.6, 1.0));

      this.scene.tweens.add({
        targets: particle,
        scale: 0.1,
        alpha: 0,
        x: particle.x - vx * 0.03,
        y: particle.y - vy * 0.03,
        duration: 280,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    } else {
      const dust = this.scene.add.graphics().setDepth(16);
      dust.fillStyle(0xa4b0be, 0.6);
      dust.fillCircle(this.x, this.y, Phaser.Math.Between(3, 6));

      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 1.6,
        duration: 220,
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

    // Shield protection check
    let isShieldBlocked = false;
    if (targetType === 'monster' && this.targetMonster && this.targetMonster.isShieldActive) {
      isShieldBlocked = true;
      this.targetMonster.breakShield();
    }

    // Visual Explosion Starburst
    const explosion = this.scene.add.image(hitX, hitY, 'impact_explosion')
      .setDepth(25)
      .setScale(0.3)
      .setAlpha(1);

    this.scene.tweens.add({
      targets: explosion,
      scale: this.weaponType === 'fireball' ? 1.5 : 1.1,
      alpha: 0,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => explosion.destroy()
    });

    // Camera Shake
    const shakeIntensity = this.weaponType === 'fireball' ? 0.016 : 0.01;
    this.scene.cameras.main.shake(200, shakeIntensity);

    // Audio Impact
    if (this.audioSystem) {
      this.audioSystem.playImpact();
      if (targetType === 'monster' && !isShieldBlocked) {
        this.audioSystem.playHit();
      }
    }

    // Sparks Shower
    const count = this.weaponType === 'fireball' ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const spark = this.scene.add.graphics().setDepth(26);
      const isFire = this.weaponType === 'fireball';
      spark.fillStyle(isFire ? (i % 2 === 0 ? 0xfffa65 : 0xff4757) : 0xced6e0, 1);
      spark.fillCircle(0, 0, Phaser.Math.Between(3, 5));
      spark.x = hitX;
      spark.y = hitY;

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(100, 240);

      this.scene.tweens.add({
        targets: spark,
        x: hitX + Math.cos(angle) * (speed * 0.35),
        y: hitY + Math.sin(angle) * (speed * 0.35) + 20,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // Obstacle thud
    if (targetType === 'obstacle') {
      const dustPuff = this.scene.add.text(hitX, hitY - 25, '💥 THUD!', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '20px',
        fontStyle: '900',
        color: '#f59e0b',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(27);

      this.scene.tweens.add({
        targets: dustPuff,
        y: dustPuff.y - 30,
        alpha: 0,
        duration: 600,
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
