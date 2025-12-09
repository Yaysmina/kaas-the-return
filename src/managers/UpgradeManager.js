import { state } from '../core/GameState.js';
import { UPGRADES } from '../data/UpgradesData.js';

export class UpgradeManager {
    static getCost(type) {
        const def = UPGRADES[type];
        const currentLevel = state.upgrades[type];
        if (currentLevel >= def.maxLevel) return Infinity;
        return def.getCost(currentLevel);
    }

    static purchase(type) {
        const cost = this.getCost(type);
        if (state.resources.cowCash >= cost) {
            state.resources.cowCash -= cost;
            state.upgrades[type]++;
            return true;
        }
        return false;
    }

    static getEffect(type) {
        const def = UPGRADES[type];
        return def.getEffect(state.upgrades[type]);
    }
}