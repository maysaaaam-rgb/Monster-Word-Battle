/**
 * AudioSystem Architecture
 * 
 * Non-professional oscillator beeps have been completely disabled.
 * The game is intentionally silent until studio-quality sound assets
 * are placed into public/assets/audio/ (ui, combat, rewards, environment, music).
 */
export default class AudioSystem {
  constructor() {
    this.isMuted = true;
    this.sounds = {};
  }

  init() {
    // Ready for future audio loading
  }

  ensureContext() {
    return null;
  }

  // UI Sounds
  playClick() {}
  playCorrect() {}
  playWrong() {}
  playReward() {}

  // Combat Sounds
  playThrow() {}
  playFireballThrow() {}
  playHit() {}
  playImpact() {}
  playHeal() {}

  // Environment & Music
  playVictory() {}
  playDefeat() {}
}
