const game = {
    // --- Game State ---
    resources: { gold: 25, cows: 0, rawMilk: 0, milk: 0, cowCash: 0, factoryFunds: 0 },
    costs: { cow: 25, processMilk: 10 },
    production: { tapsPerClick: 1, milkPerTapCycle: 1, tapsPerCycle: 20, currentTapsLeft: 10 },
    automation: {
        isAutoTapping: false,
        autoTapIntervalId: null,
        autoTapSpeedMs: 1000, // Auto-tap every 1 second (1000 ms)
    },
    cooldowns: {
        tapCooldownMs: 1000 / 15, // Prevent manual taps faster than 15/s
        lastManualTapTime: 0
    },
    // --- DOM Elements ---
    elements: {
        goldDisplay: null, cowsDisplay: null, milkDisplay: null, cowCashDisplay: null,
        factoryFundsDisplay: null, cowCashResourceDisplay: null, factoryFundsResourceDisplay: null,
        cowsCountFarm: null, cowsMilkYield: null, rawMilkCount: null, milkCountFarm: null,
        tapsLeft: null, tapsTotal: null, cowCost: null, rawMilkNeeded: null,
        buyCowButton: null, makeRawMilkButton: null, processMilkButton: null, toggleAutoTapButton: null, // Added auto tap button
        tabButtons: null, tabPanes: null, tabNav: null,
        lockedSections: {}, lockedHrs: {}
    },
    // --- Initialization ---
    init() {
        console.log("Initializing Kaas: The Return...");
        this.cacheBaseElements();
        this.cacheUnlockableElements();
        this.addEventListeners();
        this.updateDisplay();
        this.checkUnlocks(); // Apply initial locked states based on conditions
        console.log("Game Initialized!");
    },
    cacheBaseElements() {
        this.elements.goldDisplay = document.getElementById('gold-display');
        this.elements.cowsDisplay = document.getElementById('cows-display');
        this.elements.milkDisplay = document.getElementById('milk-display');
        this.elements.cowCashDisplay = document.getElementById('cow-cash-display');
        this.elements.factoryFundsDisplay = document.getElementById('factory-funds-display');
        this.elements.cowCashResourceDisplay = document.getElementById('cow-cash-resource-display');
        this.elements.factoryFundsResourceDisplay = document.getElementById('factory-funds-resource-display');
        this.elements.cowsCountFarm = document.getElementById('cows-count-farm');
        this.elements.cowsMilkYield = document.getElementById('cows-milk-yield');
        this.elements.rawMilkCount = document.getElementById('raw-milk-count');
        this.elements.milkCountFarm = document.getElementById('milk-count-farm');
        this.elements.cowCost = document.getElementById('cow-cost');
        this.elements.rawMilkNeeded = document.getElementById('raw-milk-needed');
        this.elements.tapsLeft = document.getElementById('taps-left');
        this.elements.tapsTotal = document.getElementById('taps-total');
        this.elements.buyCowButton = document.getElementById('buy-cow-button');
        this.elements.makeRawMilkButton = document.getElementById('make-raw-milk-button');
        this.elements.processMilkButton = document.getElementById('process-milk-button');
        this.elements.toggleAutoTapButton = document.getElementById('toggle-auto-tap-button'); // Cache new button
        this.elements.tabButtons = document.querySelectorAll('.tab-button');
        this.elements.tabPanes = document.querySelectorAll('.tab-pane');
        this.elements.tabNav = document.querySelector('.tab-navigation');
     },
    cacheUnlockableElements() {
        document.querySelectorAll('.subsection-locked[data-unlock-condition]').forEach(section => {
            if (section.id) this.elements.lockedSections[section.id] = section;
            else console.warn("Locked subsection found without an ID.", section);
        });
        document.querySelectorAll('.subsection-hr-locked[data-unlock-condition]').forEach(hr => {
            if (hr.id) this.elements.lockedHrs[hr.id] = hr;
            else console.warn("Locked HR found without an ID.", hr);
        });
     },
    addEventListeners() {
        this.elements.tabNav.addEventListener('click', (event) => {
            const button = event.target.closest('.tab-button');
            if (button && !button.classList.contains('locked')) {
                this.switchTab(button.dataset.tab);
            } else if (button && button.classList.contains('locked')) {
                console.log("Tab is locked:", button.dataset.tab);
            }
        });
        this.elements.buyCowButton.addEventListener('click', () => this.buyCow());
        // Changed: Call handleManualTap instead of tapCow directly
        this.elements.makeRawMilkButton.addEventListener('click', () => this.handleManualTap());
        this.elements.processMilkButton.addEventListener('click', () => this.processMilk());
        // Add listener for the toggle button
        this.elements.toggleAutoTapButton.addEventListener('click', () => this.toggleAutoTap());
    },
    buyCow() {
        const currentCost = this.costs.cow;
        if (this.resources.gold >= currentCost) {
            this.resources.gold -= currentCost;
            this.resources.cows++;
            this.costs.cow = Math.ceil(currentCost * 2);
            this.production.currentTapsLeft = this.production.tapsPerCycle;
            console.log(`Bought cow! Total: ${this.resources.cows}. Next cost: ${this.costs.cow}`);
            this.updateDisplay();
            this.checkUnlocks();
        } else {
            console.log(`Need ${currentCost} gold for cow.`);
        }
     },

    // --- Tapping Logic ---
    handleManualTap() {
        // Prevent manual tap if auto-tap is on or if cooldown hasn't passed
        if (this.automation.isAutoTapping) {
            console.log("Manual tap disabled while auto-tap is active.");
            return;
        }
        const now = Date.now();
        if (now - this.cooldowns.lastManualTapTime < this.cooldowns.tapCooldownMs) {
            // console.log("Manual tap cooldown active."); // Optional: uncomment for debugging
            return;
        }
        this.cooldowns.lastManualTapTime = now;
        this.tapCow(); // Execute the actual tap logic
    },

    tapCow() {
        const milkSection = document.getElementById('farm-milk-making'); // Get the element directly
        if (milkSection && milkSection.classList.contains('subsection-locked')) {
             // console.log("Milk Making section is locked."); // Can be noisy if auto-tapping
             return;
        }
        if (this.resources.cows <= 0) return;

        this.production.currentTapsLeft -= this.production.tapsPerClick;

        if (this.production.currentTapsLeft <= 0) {
            const milkGained = this.resources.cows * this.production.milkPerTapCycle;
            this.resources.rawMilk += milkGained;
            console.log(`Cycle complete! +${milkGained} raw milk.`);
            // Reset taps for the next cycle
            this.production.currentTapsLeft = this.production.tapsPerCycle + this.production.currentTapsLeft; // Add overshoot back if any
            this.checkUnlocks();
        } else {
            // console.log(`Tapped. ${this.production.currentTapsLeft} taps left.`);
        }
        this.updateDisplay();
    },

    toggleAutoTap() {
        const milkSection = document.getElementById('farm-milk-making');
        if (!milkSection || milkSection.classList.contains('subsection-locked') || this.resources.cows <= 0) {
            console.log("Cannot toggle auto-tap: Milk section locked or no cows.");
            return; // Don't allow toggling if the section isn't usable
        }

        this.automation.isAutoTapping = !this.automation.isAutoTapping;

        if (this.automation.isAutoTapping) {
            // Start auto-tapping
            this.automation.autoTapIntervalId = setInterval(() => this.tapCow(), this.automation.autoTapSpeedMs);
            console.log(`Auto-tap started (interval: ${this.automation.autoTapSpeedMs}ms).`);
        } else {
            // Stop auto-tapping
            if (this.automation.autoTapIntervalId) {
                clearInterval(this.automation.autoTapIntervalId);
                this.automation.autoTapIntervalId = null;
            }
            console.log("Auto-tap stopped.");
        }
        this.updateDisplay(); // Update button states and text
    },

    processMilk() {
        const milkSection = document.getElementById('farm-milk-making');
        if (milkSection && milkSection.classList.contains('subsection-locked')) {
             console.log("Milk Making section is locked.");
             return;
        }
        if (this.resources.rawMilk >= this.costs.processMilk) {
            this.resources.rawMilk -= this.costs.processMilk;
            this.resources.milk++;
            console.log(`Processed ${this.costs.processMilk} raw milk -> 1 milk.`);
            this.updateDisplay();
            this.checkUnlocks();
        } else {
            console.log(`Need ${this.costs.processMilk} raw milk.`);
        }
     },

    // --- Display & Updates ---
    updateDisplay() {
        // Update Resources
        this.elements.goldDisplay.textContent = this.resources.gold;
        this.elements.cowsDisplay.textContent = this.resources.cows;
        this.elements.milkDisplay.textContent = this.resources.milk;
        this.elements.cowCashDisplay.textContent = this.resources.cowCash;
        this.elements.factoryFundsDisplay.textContent = this.resources.factoryFunds;

        // Show/Hide Special Resource Displays
        const upgradesTab = document.querySelector('[data-tab="tab-upgrades"]');
        const factoryTab = document.querySelector('[data-tab="tab-factory"]');
        const upgradesTabUnlocked = upgradesTab && !upgradesTab.classList.contains('locked');
        const factoryTabUnlocked = factoryTab && !factoryTab.classList.contains('locked');
        this.elements.cowCashResourceDisplay.style.display = this.resources.cowCash > 0 || upgradesTabUnlocked ? 'inline' : 'none';
        this.elements.factoryFundsResourceDisplay.style.display = this.resources.factoryFunds > 0 || factoryTabUnlocked ? 'inline' : 'none';

        // Update Farm Tab Details
        if (this.elements.cowsCountFarm) this.elements.cowsCountFarm.textContent = this.resources.cows;
        if (this.elements.cowCost) this.elements.cowCost.textContent = this.costs.cow;

        // Check if Milk Making section is unlocked
        const milkMakingSection = document.getElementById('farm-milk-making');
        const milkMakingUnlocked = milkMakingSection && !milkMakingSection.classList.contains('subsection-locked');

        // Update Milk Making Details (only if unlocked)
        if (milkMakingUnlocked) {
             if (this.elements.rawMilkCount) this.elements.rawMilkCount.textContent = this.resources.rawMilk;
             if (this.elements.milkCountFarm) this.elements.milkCountFarm.textContent = this.resources.milk;
             if (this.elements.rawMilkNeeded) this.elements.rawMilkNeeded.textContent = this.costs.processMilk;
             if (this.elements.tapsLeft) this.elements.tapsLeft.textContent = Math.max(0, this.production.currentTapsLeft);
             if (this.elements.tapsTotal) this.elements.tapsTotal.textContent = this.production.tapsPerCycle;
             if (this.elements.cowsMilkYield) this.elements.cowsMilkYield.textContent = this.resources.cows * this.production.milkPerTapCycle;
        }

        // Update Button States
        if (this.elements.buyCowButton) {
            this.elements.buyCowButton.disabled = this.resources.gold < this.costs.cow;
        }
        const canMilk = milkMakingUnlocked && this.resources.cows > 0;

        if (this.elements.makeRawMilkButton) {
            // Disable manual tap button if auto-tap is on OR if basic conditions aren't met
            this.elements.makeRawMilkButton.disabled = !canMilk || this.automation.isAutoTapping;
        }
        if (this.elements.toggleAutoTapButton) {
            // Disable toggle button if basic conditions aren't met
            this.elements.toggleAutoTapButton.disabled = !canMilk;
            // Update text and style based on auto-tap state
            this.elements.toggleAutoTapButton.textContent = this.automation.isAutoTapping ? 'Auto-Tap ON' : 'Auto-Tap Off';
            this.elements.toggleAutoTapButton.classList.toggle('active-auto', this.automation.isAutoTapping);
        }
        if (this.elements.processMilkButton) {
            this.elements.processMilkButton.disabled = !milkMakingUnlocked || this.resources.rawMilk < this.costs.processMilk;
        }
    },
    switchTab(targetTabId) {
        this.elements.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetTabId));
        this.elements.tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === targetTabId));
        console.log("Switched to tab:", targetTabId);
     },

    // --- Unlocking Logic ---
    checkUnlocks() {
        const newlyUnlockedItems = [];

        // 1. Check TAB Unlocks
        this.elements.tabButtons.forEach(button => {
            const condition = button.dataset.unlockCondition;
            const isLocked = button.classList.contains('locked');

            if (isLocked && condition && this.evaluateCondition(condition)) {
                console.log(`Unlocking tab: ${button.dataset.tab}`);
                button.classList.remove('locked');
                newlyUnlockedItems.push(`Tab: ${button.dataset.tab}`);
            }
        });

        // 2. Check SUBSECTION and HR Unlocks
        for (const id in this.elements.lockedSections) {
            const section = this.elements.lockedSections[id];
            if (!section) continue;
            const condition = section.dataset.unlockCondition;

            if (section.classList.contains('subsection-locked') && condition && this.evaluateCondition(condition)) {
                console.log(`Unlocking subsection: ${id}`);
                section.classList.remove('subsection-locked');

                const unlockInfoSpan = section.querySelector('.subsection-unlock-info');
                if (unlockInfoSpan) unlockInfoSpan.remove();

                newlyUnlockedItems.push(`Section: ${id}`);

                // Unlock corresponding HR
                const hrId = id.replace('-making', '-hr').replace('-ripe', '-ripe-hr').replace('-corner', '-cheese-hr').replace('-goods', '-gourmet-hr').replace('-funds', '-factory-hr').replace('-production', '-premium-hr');
                const hrElement = this.elements.lockedHrs[hrId];
                if (hrElement && hrElement.classList.contains('subsection-hr-locked')) {
                     console.log(`Unlocking HR: ${hrId}`);
                     hrElement.classList.remove('subsection-hr-locked');
                }
            }
        }

        // 3. Update display ONLY if something was actually unlocked
        if (newlyUnlockedItems.length > 0) {
            console.log("Unlocked:", newlyUnlockedItems.join(', '));
            // Stop auto-tap if it was running but becomes unusable (e.g., if unlocking *disabled* it - unlikely but safe)
            if(this.automation.isAutoTapping) {
                const milkMakingSection = document.getElementById('farm-milk-making');
                const milkMakingUnlocked = milkMakingSection && !milkMakingSection.classList.contains('subsection-locked');
                if (!milkMakingUnlocked || this.resources.cows <= 0) {
                    this.toggleAutoTap(); // Turn it off if conditions are no longer met
                }
            }
            this.updateDisplay(); // Update display after unlocks
        }
    },
    evaluateCondition(conditionString) {
        const [resource, valueStr] = conditionString.split(':');
        const requiredValue = parseInt(valueStr, 10);
        if (isNaN(requiredValue)) { console.error(`Invalid condition value: ${conditionString}`); return false; }
        let currentVal = 0;
        switch (resource.toLowerCase()) {
            case 'cows': currentVal = this.resources.cows; break;
            case 'milk': currentVal = this.resources.milk; break;
            case 'rawmilk': currentVal = this.resources.rawMilk; break;
            case 'gold': currentVal = this.resources.gold; break;
            case 'cowcash': currentVal = this.resources.cowCash; break;
            case 'factoryfunds': currentVal = this.resources.factoryFunds; break;
            default: console.warn("Unknown condition resource:", resource); return false;
        }
        return currentVal >= requiredValue;
     }
};

document.addEventListener('DOMContentLoaded', () => game.init());