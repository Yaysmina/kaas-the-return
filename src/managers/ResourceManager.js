import { COSTS, PRODUCTION } from '../core/Constants.js';
import { state } from '../core/GameState.js';
import { UpgradeManager } from './UpgradeManager.js';

export class ResourceManager {
    static getEffectiveCowCost() {
        const standardCost = COSTS.BASE_COW * Math.pow(2, state.resources.cows);
        const multiplier = UpgradeManager.getEffect('cowCost') / 100;
        // console.log(`Effective Cow Cost: ${standardCost} * ${multiplier} = ${standardCost * multiplier}`);
        return Math.ceil(standardCost * multiplier);
    }

    static buyCow() {
        const cost = this.getEffectiveCowCost();
        if (state.resources.gold >= cost) {
            state.resources.gold -= cost;
            state.resources.cows++;
            return true;
        }
        return false;
    }

    static addResource(type, amount) {
        if (state.resources[type] !== undefined) {
            state.resources[type] += amount;
        }
    }
    
    static hasResource(type, amount) {
        return state.resources[type] >= amount;
    }
}