import { factorial } from '../core/Utils.js';
import { PRODUCTION, COSTS } from '../core/Constants.js';

export const UPGRADES = {
    cowCost: {
        name: "Cow Cost Reduction",
        description: "Reduces 🪙 needed to buy a 🐄 by 10%",
        maxLevel: 8,
        getCost: (level) => 5 * Math.pow(2, level), // Level is 0-indexed for current, +1 for next
        getEffect: (level) => Math.max(20, 100 - level * 10),
        effectDisplay: (level) => `${Math.max(20, 100 - level * 10)}% Cost`
    },
    tapReduction: {
        name: "Tap Reduction",
        description: "Reduces taps needed per cycle",
        maxLevel: 8,
        getCost: (level) => {
            const costs = [3, 6, 9, 18, 27, 54, 81, 162];
            return costs[level] || costs[costs.length - 1];
        },
        getEffect: (level) => Math.max(2, PRODUCTION.BASE_TAPS_PER_CYCLE - level),
        effectDisplay: (level) => `${Math.max(2, PRODUCTION.BASE_TAPS_PER_CYCLE - level)} Taps`
    },
    rawMilkReduction: {
        name: "Raw Milk Reduction",
        description: "Reduces the cost of processing Raw🥛",
        maxLevel: 5,
        getCost: (level) => 10 * factorial(level + 1),
        getEffect: (level) => Math.max(5, COSTS.BASE_PROCESS_MILK - level),
        effectDisplay: (level) => `${Math.max(5, COSTS.BASE_PROCESS_MILK - level)} Raw🥛`
    }
};