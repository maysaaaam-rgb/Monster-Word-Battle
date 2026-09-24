export default class RewardSystem {
  constructor() {
    this.currentReward = 'rock'; // 'rock', 'fireball', 'shield', 'heal'
    this.streak = 0;
    this.inventory = {
      rock: true,
      fireball: false,
      shield: false,
      heal: false
    };
  }

  onCorrectAnswer(question) {
    this.streak++;

    // Cycle between Fireball, Shield, and Heal
    const cycle = this.streak % 3;

    if (cycle === 1) {
      this.currentReward = 'fireball';
      this.inventory.fireball = true;
      return {
        type: 'fireball',
        label: '🎉 AWESOME! FIREBALL UNLOCKED!',
        badge: '🔥 35 DMG',
        damage: 35
      };
    } else if (cycle === 2) {
      this.currentReward = 'shield';
      this.inventory.shield = true;
      return {
        type: 'shield',
        label: '🛡️ SUPER! SHIELD DOME UNLOCKED!',
        badge: '🛡️ BLOCK 1 HIT',
        shieldPower: 1
      };
    } else {
      this.currentReward = 'heal';
      this.inventory.heal = true;
      return {
        type: 'heal',
        label: '💚 GREAT JOB! HEAL UNLOCKED!',
        badge: '💚 +30 HP',
        healAmount: 30
      };
    }
  }

  setReward(type) {
    if (this.inventory[type] || type === 'rock') {
      this.currentReward = type;
    }
  }

  getReward() {
    return this.currentReward;
  }

  consumeReward() {
    const reward = this.currentReward;
    if (reward !== 'rock') {
      this.inventory[reward] = false;
      this.currentReward = 'rock'; // Resets to normal rock after single use
    }
    return reward;
  }
}
