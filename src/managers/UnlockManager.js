import { state } from '../core/GameState.js';

export class UnlockManager {
    static checkCondition(conditionStr) {
        const [resource, val] = conditionStr.split(':');
        const req = parseInt(val, 10);
        
        // Case insensitive lookup in resources
        const key = Object.keys(state.resources).find(k => k.toLowerCase() === resource.toLowerCase());
        
        if (key) {
            return state.resources[key] >= req;
        }
        return false;
    }

    static processUnlocks() {
        // Elements with data-unlock-condition
        const lockedElements = document.querySelectorAll('[data-unlock-condition]');
        
        lockedElements.forEach(el => {
            // Check if already processed (class removed)
            const isSection = el.classList.contains('subsection-locked');
            const isTab = el.classList.contains('locked');
            const isHr = el.classList.contains('subsection-hr-locked');

            if (!isSection && !isTab && !isHr) return;

            const condition = el.dataset.unlockCondition;
            if (this.checkCondition(condition)) {
                el.classList.remove('locked', 'subsection-locked', 'subsection-hr-locked');
                
                // Hide specific info spans
                const info = el.querySelector('.unlock-info');
                if (info && !isTab) info.style.display = 'none';
            }
        });
    }
}