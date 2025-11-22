/**
 * Fight Engine Module
 * Calculates fight outcomes based on stats and random factors
 */

/**
 * Calculate fight outcome between two fighters
 * Formula: final_score = (STR*1.2 + SPD*1.1 + END*1.3 + TECH*1.4) + random(5-25) + LCK * random(1-3)
 * 
 * @param {Object} fighter1 - Fighter object with stats
 * @param {Object} fighter2 - Fighter object with stats
 * @returns {Object} Fight result with winner, loser, damage log, and details
 */
function calculateFight(fighter1, fighter2) {
  // Ensure stats exist, default to 50 if missing
  const getStat = (fighter, statName, defaultValue = 50) => {
    if (fighter.stats && fighter.stats[statName] !== undefined) {
      return fighter.stats[statName];
    }
    return defaultValue;
  };

  // Get stats for fighter 1
  const str1 = getStat(fighter1, 'striking', 50);
  const spd1 = getStat(fighter1, 'speed', 50);
  const end1 = getStat(fighter1, 'stamina', 50);
  const tech1 = getStat(fighter1, 'grappling', 50);
  const lck1 = getStat(fighter1, 'luck', 50);

  // Get stats for fighter 2
  const str2 = getStat(fighter2, 'striking', 50);
  const spd2 = getStat(fighter2, 'speed', 50);
  const end2 = getStat(fighter2, 'stamina', 50);
  const tech2 = getStat(fighter2, 'grappling', 50);
  const lck2 = getStat(fighter2, 'luck', 50);

  // Calculate base scores
  const baseScore1 = (str1 * 1.2) + (spd1 * 1.1) + (end1 * 1.3) + (tech1 * 1.4);
  const baseScore2 = (str2 * 1.2) + (spd2 * 1.1) + (end2 * 1.3) + (tech2 * 1.4);

  // Random factors
  const randomBonus1 = Math.random() * 20 + 5; // 5-25
  const randomBonus2 = Math.random() * 20 + 5; // 5-25
  const luckMultiplier1 = Math.random() * 2 + 1; // 1-3
  const luckMultiplier2 = Math.random() * 2 + 1; // 1-3

  // Final scores
  const finalScore1 = baseScore1 + randomBonus1 + (lck1 * luckMultiplier1);
  const finalScore2 = baseScore2 + randomBonus2 + (lck2 * luckMultiplier2);

  // Determine winner
  const winner = finalScore1 >= finalScore2 ? fighter1 : fighter2;
  const loser = finalScore1 >= finalScore2 ? fighter2 : fighter1;
  const winnerScore = finalScore1 >= finalScore2 ? finalScore1 : finalScore2;
  const loserScore = finalScore1 >= finalScore2 ? finalScore2 : finalScore1;

  // Calculate damage dealt (percentage of opponent's HP)
  const damagePercentage = Math.min(100, Math.max(10, ((winnerScore - loserScore) / loserScore) * 100));
  
  // Generate damage log (simulate rounds)
  const damageLog = generateDamageLog(winner, loser, damagePercentage, winnerScore, loserScore);

  // Calculate XP gained (winner gets more)
  const winnerXP = Math.floor(winnerScore / 10) + Math.floor(damagePercentage / 2);
  const loserXP = Math.floor(loserScore / 20); // Loser gets minimal XP

  return {
    winner: {
      _id: winner._id || winner.avatarId,
      name: winner.name,
      score: Math.round(winnerScore * 100) / 100,
      xpGained: winnerXP,
      damageDealt: Math.round(damagePercentage * 100) / 100
    },
    loser: {
      _id: loser._id || loser.avatarId,
      name: loser.name,
      score: Math.round(loserScore * 100) / 100,
      xpGained: loserXP,
      damageTaken: Math.round(damagePercentage * 100) / 100
    },
    damageLog,
    fightDuration: damageLog.length * 3, // 3 seconds per round
    timestamp: new Date(),
    details: {
      winnerBaseScore: Math.round(baseScore1 >= baseScore2 ? baseScore1 : baseScore2 * 100) / 100,
      loserBaseScore: Math.round(baseScore1 >= baseScore2 ? baseScore2 : baseScore1 * 100) / 100,
      winnerRandomBonus: Math.round(winnerScore === finalScore1 ? randomBonus1 : randomBonus2 * 100) / 100,
      winnerLuckBonus: Math.round((winnerScore === finalScore1 ? lck1 : lck2) * (winnerScore === finalScore1 ? luckMultiplier1 : luckMultiplier2) * 100) / 100
    }
  };
}

/**
 * Generate damage log for fight visualization
 * @param {Object} winner - Winner fighter
 * @param {Object} loser - Loser fighter
 * @param {Number} totalDamage - Total damage percentage
 * @param {Number} winnerScore - Winner's final score
 * @param {Number} loserScore - Loser's final score
 * @returns {Array} Array of damage events
 */
function generateDamageLog(winner, loser, totalDamage, winnerScore, loserScore) {
  const rounds = Math.floor(Math.random() * 3) + 2; // 2-4 rounds
  const damageLog = [];
  
  let remainingDamage = totalDamage;
  const damagePerRound = totalDamage / rounds;

  for (let i = 0; i < rounds; i++) {
    // Randomize damage slightly
    const roundDamage = damagePerRound + (Math.random() * 20 - 10);
    const actualDamage = Math.max(5, Math.min(remainingDamage, roundDamage));
    remainingDamage -= actualDamage;

    // Determine if it's a critical hit (5% chance)
    const isCritical = Math.random() < 0.05;
    const damageType = isCritical ? 'critical' : (Math.random() < 0.3 ? 'heavy' : 'normal');

    damageLog.push({
      round: i + 1,
      attacker: winner.name,
      defender: loser.name,
      damage: Math.round(actualDamage * 100) / 100,
      type: damageType,
      isCritical,
      message: isCritical 
        ? `${winner.name} lands a CRITICAL HIT!`
        : damageType === 'heavy'
        ? `${winner.name} lands a heavy blow!`
        : `${winner.name} strikes ${loser.name}!`
    });

    // Small counter-attack chance (20%)
    if (Math.random() < 0.2 && remainingDamage > 0) {
      const counterDamage = Math.min(remainingDamage * 0.2, 15);
      damageLog.push({
        round: i + 1,
        attacker: loser.name,
        defender: winner.name,
        damage: Math.round(counterDamage * 100) / 100,
        type: 'counter',
        isCritical: false,
        message: `${loser.name} counters!`
      });
    }
  }

  // Final blow
  if (remainingDamage > 0) {
    damageLog.push({
      round: rounds,
      attacker: winner.name,
      defender: loser.name,
      damage: Math.round(remainingDamage * 100) / 100,
      type: 'finisher',
      isCritical: Math.random() < 0.3,
      message: `${winner.name} finishes the fight!`
    });
  }

  return damageLog;
}

/**
 * Check if two fighters can fight (same weight class)
 * @param {Object} fighter1 - Fighter 1
 * @param {Object} fighter2 - Fighter 2
 * @returns {Object} {canFight: boolean, reason: string}
 */
function canFight(fighter1, fighter2) {
  const weightClass1 = fighter1.weightClass || fighter1.selectedWeightClass;
  const weightClass2 = fighter2.weightClass || fighter2.selectedWeightClass;

  if (!weightClass1 || !weightClass2) {
    return {
      canFight: false,
      reason: 'Weight class not specified for one or both fighters'
    };
  }

  if (weightClass1 !== weightClass2) {
    return {
      canFight: false,
      reason: `Weight class mismatch: ${weightClass1} vs ${weightClass2}`
    };
  }

  if (fighter1.eliminated || fighter2.eliminated) {
    return {
      canFight: false,
      reason: 'One or both fighters are already eliminated'
    };
  }

  return {
    canFight: true,
    reason: 'Fight can proceed'
  };
}

module.exports = {
  calculateFight,
  generateDamageLog,
  canFight
};

