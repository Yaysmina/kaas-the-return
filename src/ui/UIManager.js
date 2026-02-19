import { state } from '../core/GameState.js';
import { ResourceManager } from '../managers/ResourceManager.js';
import { ProductionManager } from '../managers/ProductionManager.js';
import { UpgradeManager } from '../managers/UpgradeManager.js';
import { UPGRADES } from '../data/UpgradesData.js';
import { updateMarketUI } from './MarketUI.js';
import { PRODUCTION, COSTS } from '../core/Constants.js';
import { parseEmojis, parseEmojisInText } from '../core/EmojiUtils.js';

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
                <p class="upgrade-description">${def.description}</p>
                <div class="stat-row">
                    <span class="stat-label">Level</span>
                    <span class="stat-value"><span id="upg-lvl-${key}">0</span>/${def.maxLevel}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Currently</span>
                    <span class="stat-value" id="upg-eff-${key}">-</span>
                </div>
                <button class="upgrade-button" id="upg-btn-${key}">Purchase</button>
            `;
            parseEmojis(div);
            container.appendChild(div);
            
            div.querySelector('button').addEventListener('click', () => {
                UpgradeManager.purchase(key);
            });
        });
    }

    update() {
        // Resources
        this.get('gold-display').textContent = Math.floor(state.resources.gold);
        this.get('milk-display').textContent = state.resources.milk;
        this.get('cow-cash-display').textContent = Math.floor(state.resources.cowCash);
        
        // Resource Visibility logic
        const businessTabBtn = document.querySelector('button[data-tab="tab-business"]');
        const isBusinessUnlocked = businessTabBtn && !businessTabBtn.classList.contains('locked');
        this.get('cow-cash-resource-display').style.display = (state.resources.cowCash > 0 || isBusinessUnlocked) ? 'inline' : 'none';

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

        // Progress Bar
        const progressBar = this.get('tap-progress-bar');
        if (progressBar) {
            const progress = ((tapsMax - state.internal.tapsLeft) / tapsMax) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        // Buttons
        const canMilk = state.resources.cows > 0;
        this.get('make-raw-milk-button').disabled = !canMilk;
        
        const autoBtn = this.get('toggle-auto-tap-button');
        autoBtn.disabled = !canMilk;
        
        if (state.automation.isAutoTapping) {
            const speed = ProductionManager.getCurrentAutoTapSpeed();
            autoBtn.textContent = `Auto-Tap ON (${speed}/s)`;
        } else {
            autoBtn.textContent = "Auto-Tap Off";
        }
        
        this.get('process-milk-button').disabled = state.resources.rawMilk < milkCost;
        this.get('process-all-milk-button').disabled = state.resources.rawMilk < milkCost;

        const factoryUnlocked = state.resources.cows >= 4;
        this.get('process-milk-button').style.display = factoryUnlocked ? 'none' : 'inline-block';
        this.get('process-all-milk-button').style.display = factoryUnlocked ? 'inline-block' : 'none';
        if (factoryUnlocked) {
            this.get('process-all-milk-button').innerHTML = parseEmojisInText(`Process All (${milkCost} Raw🥛 each)`);
        }

        // Upgrades
        Object.keys(UPGRADES).forEach(key => {
            const def = UPGRADES[key];
            const level = state.upgrades[key];
            const isMax = level >= def.maxLevel;
            
            this.get(`upg-lvl-${key}`).textContent = level;
            
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
                btn.innerHTML = parseEmojisInText(`Upgrade for ${cost}💵`);
                btn.disabled = state.resources.cowCash < cost;
            }
        });

        // Farm Tab Raw Milk Count
        const rawMilkCountSpan = document.getElementById('farm-raw-milk-count');
        if (rawMilkCountSpan) {
            const rawMilkCount = state.resources.rawMilk;
            rawMilkCountSpan.textContent = rawMilkCount > 0 ? rawMilkCount : '';
            rawMilkCountSpan.style.display = rawMilkCount > 0 ? 'block' : 'none';
        }

        // Business Tab Customer Count
        const customerCountSpan = document.getElementById('business-customer-count');
        if (businessTabBtn && customerCountSpan) {
            if (isBusinessUnlocked) {
                const customerCount = state.market.customers.length;
                customerCountSpan.textContent = customerCount > 0 ? customerCount : '';
                customerCountSpan.style.display = customerCount > 0 ? 'block' : 'none';
            } else {
                customerCountSpan.style.display = 'none';
            }
        }

        // Upgrades Tab Available Upgrades Count
        const upgradesTabBtn = document.querySelector('button[data-tab="tab-upgrades"]');
        const upgradeCountSpan = document.getElementById('upgrades-count');
        if (upgradesTabBtn && upgradeCountSpan) {
            const isUnlocked = !upgradesTabBtn.classList.contains('locked');
            if (isUnlocked) {
                let availableCount = 0;
                Object.keys(UPGRADES).forEach(key => {
                    const def = UPGRADES[key];
                    const level = state.upgrades[key];
                    if (level < def.maxLevel) {
                        const cost = def.getCost(level);
                        if (state.resources.cowCash >= cost) {
                            availableCount++;
                        }
                    }
                });
                upgradeCountSpan.textContent = availableCount > 0 ? availableCount : '';
                upgradeCountSpan.style.display = availableCount > 0 ? 'block' : 'none';
            } else {
                upgradeCountSpan.style.display = 'none';
            }
        }

        updateMarketUI();
    }
}