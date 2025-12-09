import { state } from '../core/GameState.js';
import { ResourceManager } from '../managers/ResourceManager.js';
import { ProductionManager } from '../managers/ProductionManager.js';
import { UpgradeManager } from '../managers/UpgradeManager.js';
import { UPGRADES } from '../data/UpgradesData.js';
import { updateMarketUI } from './MarketUI.js';
import { PRODUCTION, COSTS } from '../core/Constants.js';

export class UIManager {
    constructor() {
        this.cache = {};
        this.initTabs();
        this.initUpgrades();
    }

    get(id) {
        if (!this.cache[id]) this.cache[id] = document.getElementById(id);
        return this.cache[id];
    }

    initTabs() {
        const buttons = document.querySelectorAll('.tab-button');
        const panes = document.querySelectorAll('.tab-pane');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('locked')) return;
                
                buttons.forEach(b => b.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
    }

    initUpgrades() {
        const container = document.getElementById('cow-cash-upgrades-container');
        
        Object.keys(UPGRADES).forEach(key => {
            const def = UPGRADES[key];
            const div = document.createElement('div');
            div.className = 'upgrade-item';
            div.innerHTML = `
                <h4>${def.name}</h4>
                <p>${def.description}</p>
                <p>Level: <span id="upg-lvl-${key}">0</span>/${def.maxLevel}</p>
                <p>Effect: <span id="upg-eff-${key}">-</span></p>
                <button class="upgrade-button" id="upg-btn-${key}">Purchase</button>
            `;
            container.appendChild(div);
            
            div.querySelector('button').addEventListener('click', () => {
                UpgradeManager.purchase(key);
            });
        });
    }

    update() {
        // Resources
        this.get('gold-display').textContent = Math.floor(state.resources.gold);
        this.get('cows-display').textContent = state.resources.cows;
        this.get('milk-display').textContent = state.resources.milk;
        this.get('cow-cash-display').textContent = Math.floor(state.resources.cowCash);
        
        // Resource Visibility
        this.get('cow-cash-resource-display').style.display = state.resources.cowCash > 0 ? 'inline' : 'none';

        // Farm Section
        this.get('cows-count-farm').textContent = state.resources.cows;
        const effCowCost = ResourceManager.getEffectiveCowCost();
        this.get('effective-cow-cost-display').textContent = effCowCost;
        this.get('buy-cow-button').disabled = state.resources.gold < effCowCost;

        // Milk Production
        const milkCost = ProductionManager.getCurrentRawMilkCost();
        const tapsMax = ProductionManager.getCurrentTapsPerCycle();
        
        this.get('taps-left').textContent = Math.ceil(state.internal.tapsLeft);
        this.get('current-taps-per-cycle-display').textContent = tapsMax;
        this.get('cows-milk-yield').textContent = state.resources.cows;
        this.get('raw-milk-count').textContent = state.resources.rawMilk;
        this.get('milk-count-farm').textContent = state.resources.milk;
        this.get('effective-raw-milk-cost-display').textContent = milkCost;

        // Buttons
        const canMilk = state.resources.cows > 0;
        this.get('make-raw-milk-button').disabled = !canMilk || state.automation.isAutoTapping;
        
        const autoBtn = this.get('toggle-auto-tap-button');
        autoBtn.disabled = !canMilk;
        autoBtn.textContent = state.automation.isAutoTapping ? "Auto-Tap ON" : "Auto-Tap Off";
        
        this.get('process-milk-button').disabled = state.resources.rawMilk < milkCost;
        this.get('process-all-milk-button').disabled = state.resources.rawMilk < milkCost;

        // Upgrades
        Object.keys(UPGRADES).forEach(key => {
            const def = UPGRADES[key];
            const level = state.upgrades[key];
            const isMax = level >= def.maxLevel;
            
            this.get(`upg-lvl-${key}`).textContent = level;
            
            // For effect display, we might need specific logic or pass constants
            let baseVal = 0;
            if (key === 'tapReduction') baseVal = PRODUCTION.BASE_TAPS_PER_CYCLE;
            if (key === 'rawMilkReduction') baseVal = COSTS.PROCESS_MILK;
            
            this.get(`upg-eff-${key}`).textContent = def.effectDisplay(level, baseVal);
            
            const btn = this.get(`upg-btn-${key}`);
            if (isMax) {
                btn.textContent = "Max Level";
                btn.classList.add('max-level');
                btn.disabled = true;
            } else {
                const cost = def.getCost(level);
                btn.textContent = `Buy (${cost} CC)`;
                btn.disabled = state.resources.cowCash < cost;
            }
        });

        // Sub-modules
        updateMarketUI();
    }
}