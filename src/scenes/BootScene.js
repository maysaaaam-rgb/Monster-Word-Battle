import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = 1280;
    const height = 720;

    // Loading Screen Visuals
    const bg = this.add.graphics();
    bg.fillStyle(0x0c2461, 1);
    bg.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 50, 'MONSTER WORD BATTLE', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '36px',
      fontStyle: '900',
      color: '#feca57',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 10, 'Loading Adventure Arena...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#48dbfb'
    }).setOrigin(0.5);

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x1e272e, 1);
    progressBg.fillRoundedRect(width / 2 - 160, height / 2 + 25, 320, 24, 12);
    progressBg.lineStyle(2, 0x57606f, 1);
    progressBg.strokeRoundedRect(width / 2 - 160, height / 2 + 25, 320, 24, 12);

    const progressBar = this.add.graphics();
    this.load.on('progress', (val) => {
      progressBar.clear();
      progressBar.fillStyle(0x2ed573, 1);
      progressBar.fillRoundedRect(width / 2 - 156, height / 2 + 29, 312 * val, 16, 8);
    });

    // 1. Characters: Blue Monster
    this.load.svg('blue_body', 'assets/characters/blue_monster/body.svg', { width: 140, height: 140 });
    this.load.svg('blue_belly', 'assets/characters/blue_monster/belly.svg', { width: 80, height: 70 });
    this.load.svg('blue_eye_open', 'assets/characters/blue_monster/eye_open.svg', { width: 80, height: 42 });
    this.load.svg('blue_eye_blink', 'assets/characters/blue_monster/eye_blink.svg', { width: 80, height: 42 });
    this.load.svg('blue_eye_hurt', 'assets/characters/blue_monster/eye_hurt.svg', { width: 80, height: 42 });
    this.load.svg('blue_mouth_smile', 'assets/characters/blue_monster/mouth_smile.svg', { width: 50, height: 30 });
    this.load.svg('blue_mouth_hurt', 'assets/characters/blue_monster/mouth_hurt.svg', { width: 50, height: 30 });
    this.load.svg('blue_arm', 'assets/characters/blue_monster/arm.svg', { width: 50, height: 40 });
    this.load.svg('blue_foot', 'assets/characters/blue_monster/foot.svg', { width: 50, height: 30 });

    // 2. Characters: Red Monster
    this.load.svg('red_body', 'assets/characters/red_monster/body.svg', { width: 140, height: 140 });
    this.load.svg('red_belly', 'assets/characters/red_monster/belly.svg', { width: 80, height: 70 });
    this.load.svg('red_eye_open', 'assets/characters/red_monster/eye_open.svg', { width: 80, height: 42 });
    this.load.svg('red_eye_blink', 'assets/characters/red_monster/eye_blink.svg', { width: 80, height: 42 });
    this.load.svg('red_eye_hurt', 'assets/characters/red_monster/eye_hurt.svg', { width: 80, height: 42 });
    this.load.svg('red_mouth', 'assets/characters/red_monster/mouth.svg', { width: 50, height: 30 });
    this.load.svg('red_arm', 'assets/characters/red_monster/arm.svg', { width: 50, height: 40 });
    this.load.svg('red_foot', 'assets/characters/red_monster/foot.svg', { width: 50, height: 30 });

    // 3. Environments
    this.load.svg('bg_sky', 'assets/environments/bg_sky.svg', { width: 1280, height: 720 });
    this.load.svg('bg_sky_bright', 'assets/environments/bg_sky_bright.svg', { width: 1280, height: 720 });
    this.load.svg('bg_mountains', 'assets/environments/bg_mountains.svg', { width: 1280, height: 300 });
    this.load.svg('bg_mountains_bright', 'assets/environments/bg_mountains_bright.svg', { width: 1280, height: 300 });
    this.load.svg('bg_hills_village', 'assets/environments/bg_hills_village.svg', { width: 1280, height: 320 });
    this.load.svg('bg_hills_bright', 'assets/environments/bg_hills_bright.svg', { width: 1280, height: 320 });
    this.load.svg('cliff_left', 'assets/environments/cliff_platform_left.svg', { width: 340, height: 220 });
    this.load.svg('cliff_right', 'assets/environments/cliff_platform_right.svg', { width: 340, height: 220 });
    this.load.svg('terrain_center_rock', 'assets/environments/terrain_center_rock.svg', { width: 180, height: 140 });
    this.load.svg('river_water', 'assets/environments/river_water_layer.svg', { width: 1280, height: 180 });
    this.load.svg('rope_bridge', 'assets/environments/rope_bridge.svg', { width: 260, height: 70 });
    this.load.svg('wooden_crate', 'assets/environments/wooden_crate.svg', { width: 70, height: 70 });
    this.load.svg('observer_cat', 'assets/environments/observer_cat.svg', { width: 60, height: 60 });
    this.load.svg('butterfly', 'assets/environments/butterfly.svg', { width: 44, height: 40 });
    this.load.svg('bird', 'assets/environments/bird.svg', { width: 48, height: 36 });
    this.load.svg('foreground_plants', 'assets/environments/foreground_plants.svg', { width: 1280, height: 80 });

    // 4. Projectiles
    this.load.svg('proj_rock', 'assets/projectiles/rock.svg', { width: 50, height: 50 });
    this.load.svg('proj_fireball', 'assets/projectiles/fireball.svg', { width: 60, height: 60 });
    this.load.svg('flame_particle', 'assets/projectiles/flame_particle.svg', { width: 24, height: 24 });

    // 5. Effects
    this.load.svg('impact_explosion', 'assets/effects/impact_explosion.svg', { width: 100, height: 100 });
    this.load.svg('heal_cross', 'assets/effects/heal_cross.svg', { width: 40, height: 40 });
    this.load.svg('heart_particle', 'assets/effects/heart_particle.svg', { width: 36, height: 36 });
    this.load.svg('confetti', 'assets/effects/confetti.svg', { width: 32, height: 32 });
    this.load.svg('shield_dome', 'assets/effects/shield_dome.svg', { width: 180, height: 180 });
    this.load.svg('shield_break', 'assets/effects/shield_break.svg', { width: 120, height: 120 });

    // 6. UI
    this.load.svg('avatar_frame', 'assets/ui/avatar_frame.svg', { width: 80, height: 80 });
    this.load.svg('hp_bar_frame', 'assets/ui/hp_bar_frame.svg', { width: 200, height: 24 });
    this.load.svg('turn_banner', 'assets/ui/turn_banner.svg', { width: 380, height: 70 });
    this.load.svg('ability_fire', 'assets/ui/ability_card_fire.svg', { width: 48, height: 48 });
    this.load.svg('ability_heal', 'assets/ui/ability_card_heal.svg', { width: 48, height: 48 });
    this.load.svg('ability_shield', 'assets/ui/ability_card_shield.svg', { width: 48, height: 48 });
    this.load.svg('ability_rock', 'assets/ui/ability_card_rock.svg', { width: 48, height: 48 });
    this.load.svg('wind_gauge_badge', 'assets/ui/wind_gauge_badge.svg', { width: 140, height: 36 });
    this.load.svg('challenge_scroll', 'assets/ui/challenge_scroll.svg', { width: 580, height: 230 });
    this.load.svg('card_checkmark', 'assets/ui/card_checkmark.svg', { width: 36, height: 36 });
    this.load.svg('mini_cat_in_box', 'assets/ui/mini_cat_in_box.svg', { width: 160, height: 100 });
    this.load.svg('mini_cat_on_box', 'assets/ui/mini_cat_on_box.svg', { width: 160, height: 100 });
    this.load.svg('mini_cat_under_box', 'assets/ui/mini_cat_under_box.svg', { width: 160, height: 100 });
  }

  create() {
    this.scene.start('GameScene');
  }
}
