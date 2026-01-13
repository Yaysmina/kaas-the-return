import { COSTS, PRODUCTION } from './Constants.js';

class GameState {
    constructor() {
        this.resources = {
            gold: 25,
            cows: 0,
            rawMilk: 0,
            milk: 0,
            cowCash: 0,
            factoryFunds: 0
        };
        
        this.internal = {
            tapsLeft: PRODUCTION.BASE_TAPS_PER_CYCLE,
            lastTick: Date.now(),
        };

        this.upgrades = {
            cowCost: 0,
            tapReduction: 0,
            rawMilkReduction: 0
        };
        
        this.automation = {
            isAutoTapping: false,
            intervalId: null
        };
        
        this.market = {
            customers: [],
            timerRemaining: 0,
            timerDuration: 0,
            dadSequence: 0,
            momSequence: 0,
            lastDadRequest: 0
        };
    }
}

// Export a single instance
export const state = new GameState();