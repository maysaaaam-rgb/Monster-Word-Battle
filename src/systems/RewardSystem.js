export default class RewardSystem {
  constructor() {
    this.currentReward = 'rock'; // 'rock', 'fireball', 'heal'
    this.streak = 0;
  }

  onCorrectAnswer(question) {
    this.streak++;

    // Alternate or determine reward based on target/streak
    if (question.target === 'in' || this.streak % 3 === 1) {
      this.currentReward = 'fireball';
      return {
        type: 'fireball',
        label: 'CORRECT! + ATTACK POWER!',
        badge: '🔥 x1.5',
        damage: 35
      };
    } else if (this.streak % 3 === 2) {
      this.currentReward = 'heal';
      return {
        type: 'heal',
        label: 'AMAZING! HEAL UNLOCKED!',
        badge: '💚 +30 HP',
        healAmount: 30
      };
    } else {
      this.currentReward = 'fireball';
      return {
        type: 'fireball',
        label: 'PERFECT! FIRE POWER!',
        badge: '🔥 x1.5',
        damage: 35
      };
    }
  }

  getReward() {
    return this.currentReward;
  }

  consumeReward() {
    const reward = this.currentReward;
    this.currentReward = 'rock'; // Resets to normal rock after use
    return reward;
  }
}
