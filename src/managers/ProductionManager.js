import { state } from '../core/GameState.js';
import { PRODUCTION, COSTS, DEV_CHEATS } from '../core/Constants.js';
import { UpgradeManager } from './UpgradeManager.js';

export class ProductionManager {
    static getCurrentTapsPerCycle() {
        return UpgradeManager.getEffect('tapReduction');
    }

    static getCurrentRawMilkCost() {
        return UpgradeManager.getEffect('rawMilkReduction');
    }

    static getCurrentAutoTapSpeed() {
        // Returns the auto-tap speed in taps per second
        return 1000 / PRODUCTION.AUTO_TAP_SPEED_MS;
    }

    static tap(isManual) {
        if (state.resources.cows <= 0) return;
        
        // Tap strength is always 1 by default
        let power = 1 * DEV_CHEATS.TAP_BOOST;

        state.internal.tapsLeft -= power;

        if (state.internal.tapsLeft <= 0) {
            // Cycle Complete
            const yieldAmount = state.resources.cows;
            state.resources.rawMilk += yieldAmount;
            
            // Reset taps (handling overflow could be added here)
            const maxTaps = this.getCurrentTapsPerCycle();
            state.internal.tapsLeft = maxTaps + state.internal.tapsLeft; 
        }
    }

    static processMilk(all = false) {
        const cost = this.getCurrentRawMilkCost();
        if (cost <= 0) return;

        let amount = 0;
        if (all) {
            amount = Math.floor(state.resources.rawMilk / cost);
        } else if (state.resources.rawMilk >= cost) {
            amount = 1;
        }

        if (amount > 0) {
            state.resources.rawMilk -= (amount * cost);
            state.resources.milk += amount;
        }
    }

    static toggleAutoTap() {
        if (state.automation.isAutoTapping) {
            clearInterval(state.automation.intervalId);
            state.automation.isAutoTapping = false;
            state.automation.intervalId = null;
        } else {
            // Auto-tap is 4/s by default (1000ms / 4 = 250ms)
            let speed = PRODUCTION.AUTO_TAP_SPEED_MS;

            state.automation.isAutoTapping = true;
            state.automation.intervalId = setInterval(() => {
                this.tap(false);
            }, speed);
        }
    }
}