import { factorial } from '../core/Utils.js';
import { PRODUCTION, COSTS } from '../core/Constants.js';

export const UPGRADES = {
    cowCost: {
        name: "Cow Cost Reduction",
        description: "Reduces the Gold cost of buying Cows.",
        maxLevel: 8,
        getCost: (level) => 5 * Math.pow(2, level), // Level is 0-indexed for current, +1 for next
        getEffect: (level) => Math.max(20, 100 - level * 10),
        effectDisplay: (level) => `${Math.max(20, 100 - level * 10)}% Gold Cost`
    },
    tapReduction: {
        name: "Tap Reduction",
        description: "Reduces taps needed per raw milk cycle.",
        maxLevel: 15,
        getCost: (level) => (level + 1) * (level + 2) / 2, // Triangle number logic
        getEffect: (level) => Math.max(5, PRODUCTION.BASE_TAPS_PER_CYCLE - level),
        effectDisplay: (level) => `${Math.max(5, PRODUCTION.BASE_TAPS_PER_CYCLE - level)} Taps per Cycle`
    },
    rawMilkReduction: {
        name: "Raw Milk Reduction",
        description: "Reduces Raw Milk needed per Milk.",
        maxLevel: 5,
        getCost: (level) => 10 * factorial(level + 1),
        getEffect: (level) => Math.max(5, COSTS.BASE_PROCESS_MILK - level),
        effectDisplay: (level) => `${Math.max(5, COSTS.BASE_PROCESS_MILK - level)} Raw Milk per Milk`
    }
};