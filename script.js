/* --- START OF FILE script.js --- */

const game = {
    // --- Game State ---
    resources: { gold: 25, cows: 0, rawMilk: 0, milk: 0, cowCash: 0, factoryFunds: 0 },
    playstyle: null, // 'active', 'passive', or null (needs selection)
    costs: {
        baseCowCost: 25, // Base cost before upgrades and scaling
        currentBaseCowCost: 25, // The cost used for the *next* purchase, which scales
        baseProcessMilk: 10,
    },
    production: {
        tapsPerClick: 1,
        milkPerTapCycle: 1,
        baseTapsPerCycle: 20,
        tapsPerCycle: 20, // Current effective taps needed, modified by upgrades
        currentTapsLeft: 20
    },
    internalState: {
        previousMilk: -1, // Initialize to ensure first update happens
        previousCustomerIds: '', // Store IDs as a string for easy comparison
        marketUpdateNeeded: true, // Flag to force update on certain actions
    },
    upgrades: {
        cowCost: { level: 0, maxLevel: 8 },
        tapReduction: { level: 0, maxLevel: 15 },
        rawMilkReduction: { level: 0, maxLevel: 5 }
    },
    automation: {
        isAutoTapping: false,
        autoTapIntervalId: null,
        baseAutoTapSpeedMs: 1000 / 4, // Base speed (4/s)
    },
    cooldowns: {
        tapCooldownMs: 1000 / 20, // Prevent manual taps faster than 20/s
        lastManualTapTime: 0
    },

    // --- Milk Market State ---
    milkMarket: {
        customers: [], // Array of customer objects { id, type, sequenceN, name, milkRequest, rewards: { coins, cowCash }, domElement: null }
        customerSequence: { mom: 0, dad: 0 }, // Persistent total counts
        lastDadRequestAmount: 5, // Initial amount for Dad 1 calculation baseline
        customerArrivalTimerId: null,
        customerArrivalTimerDuration: 20, // Initial duration (seconds)
        customerArrivalTimerRemaining: 20, // Time left (seconds)
        lastTickTime: null,
        maxCustomers: 5,
        nameLists: {
            female: [
                "Yasmina", "Hanna", "Jits", "Frida", "Esmeralda", "Gabby", "Bariella", "Greetje", "Francel", 
                "Marcois", "Freya", "Mireille", "Daphne", "Pandora", "Kabouter Kwebbel", "Eufrazie"
            ],
            male: [
                "Jens", "Elias", "Jasper", "Simon", "Victór", "Diego", "Geext", "Barry", "Ivo", 
                "Fank", "Gart", "Elias", "Pasquino", "Bostjan", "Bahador", "Marc Albrechts", "Dirk Van An", 
                "Gertje", "Koenraad", "Rachidt", "Jeldert", "Tristan", "Pepijn", "Bart De Wever", "Kabouter Plop", "Balthazar Boma"
            ]
        },
    },

    // --- DOM Elements ---
    elements: {
        playstyleDisplay: null, goldDisplay: null, cowsDisplay: null, milkDisplay: null, cowCashDisplay: null,
        factoryFundsDisplay: null, cowCashResourceDisplay: null, factoryFundsResourceDisplay: null,
        cowsCountFarm: null, cowsMilkYield: null, rawMilkCount: null, milkCountFarm: null,
        tapsLeft: null, tapsTotal: null, cowCost: null, rawMilkNeeded: null,
        buyCowButton: null, makeRawMilkButton: null, processMilkButton: null, toggleAutoTapButton: null,
        tabButtons: null, tabPanes: null, tabNav: null, effectiveCowCostDisplay: null,
        currentTapsPerCycleDisplay: null, effectiveRawMilkCostDisplay: null,
        lockedSections: {}, lockedHrs: {},

        // Upgrade Tab Elements
        upgrades: {
            cowCost: { level: null, maxLevel: null, effect: null, cost: null, button: null },
            tapReduction: { level: null, maxLevel: null, effect: null, cost: null, button: null },
            rawMilkReduction: { level: null, maxLevel: null, effect: null, cost: null, button: null },
        },
        // Milk Market Elements
        businessTabContent: null,
        customerQueueContainer: null,
        arrivalTimerDisplay: null,

    },


    // --- Initialization ---
    init() {
        console.log("Initializing Kaas: The Return...");
        this.cacheBaseElements();
        this.cacheUpgradeElements();
        this.cacheMilkMarketElements();
        this.cacheUnlockableElements();
        // This assumes loading happens *before* init or state is pre-populated
        if (this.playstyle === null) {
            this.showPlaystylePrompt(true);
        } else {
            this.applyPlaystyleEffects();
            this.updateDisplay();
        }
        this.addEventListeners();
        this.addUpgradeEventListeners();
        this.addMarketEventListenersIfNeeded();
        this.updateProductionCostsFromUpgrades();
        this.updateDisplay();
        this.checkUnlocks();
        console.log("Game Initialized!");
    },

    cacheBaseElements() {
        this.elements.playstyleDisplay = document.getElementById('playstyle-display');
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
        this.elements.cowCost = document.getElementById('effective-cow-cost-display');
        this.elements.rawMilkNeeded = document.getElementById('effective-raw-milk-cost-display');
        this.elements.tapsLeft = document.getElementById('taps-left');
        this.elements.tapsTotal = document.getElementById('current-taps-per-cycle-display');
        this.elements.effectiveCowCostDisplay = document.getElementById('effective-cow-cost-display');
        this.elements.currentTapsPerCycleDisplay = document.getElementById('current-taps-per-cycle-display');
        this.elements.effectiveRawMilkCostDisplay = document.getElementById('effective-raw-milk-cost-display');
        this.elements.buyCowButton = document.getElementById('buy-cow-button');
        this.elements.makeRawMilkButton = document.getElementById('make-raw-milk-button');
        this.elements.processMilkButton = document.getElementById('process-milk-button');
        this.elements.toggleAutoTapButton = document.getElementById('toggle-auto-tap-button');
        this.elements.tabButtons = document.querySelectorAll('.tab-button');
        this.elements.tabPanes = document.querySelectorAll('.tab-pane');
        this.elements.tabNav = document.querySelector('.tab-navigation');
    },

    cacheUpgradeElements() {
        // --- USE camelCase for the types list ---
        const upgradeTypes = ['cowCost', 'tapReduction', 'rawMilkReduction']; // Use camelCase

        upgradeTypes.forEach(type => { // 'type' will now be camelCase ('cowCost', etc.)

            // Helper function to convert camelCase to kebab-case FOR IDs ONLY
            const toKebabCase = (str) => str.replace(/([A-Z])/g, "-$1").toLowerCase();

            // Construct IDs using kebab-case derived from the camelCase type
            const baseId = `upgrade-${toKebabCase(type)}`; // e.g., "upgrade-cow-cost"
            const levelId = `${baseId}-level`;
            const maxLevelId = `${baseId}-max-level`;
            const effectId = `${baseId}-effect`;
            const costId = `${baseId}-cost`;
            const buttonId = `${baseId}-button`;

            // --- Store elements using the camelCase 'type' as the key ---
            this.elements.upgrades[type] = {
                level: document.getElementById(levelId),
                maxLevel: document.getElementById(maxLevelId),
                effect: document.getElementById(effectId),
                cost: document.getElementById(costId),
                button: document.getElementById(buttonId)
            };

            // Basic check if elements were found
            if (!this.elements.upgrades[type].level || !this.elements.upgrades[type].button) {
                 console.error(`Upgrade element(s) not found for type: ${type} (Expected IDs like: ${levelId}, ${buttonId})`);
            }
        });
        // Log the final structure to confirm it's ONLY camelCase keys
        // console.log("Final this.elements.upgrades structure:", this.elements.upgrades);
    },

    cacheMilkMarketElements() { // New method
        this.elements.businessTabContent = document.getElementById('tab-business');
        const milkMarketSection = document.getElementById('business-milk-market');
        if (milkMarketSection) {
             // Find existing elements first
             this.elements.customerQueueContainer = milkMarketSection.querySelector('#customer-queue');
             this.elements.arrivalTimerDisplay = milkMarketSection.querySelector('#arrival-timer-display');

             // Check if elements were found, log error if expected but missing
             if (!this.elements.customerQueueContainer) {
                console.error("Milk Market Error: #customer-queue element not found in HTML!");
             }
             if (!this.elements.arrivalTimerDisplay) {
                console.error("Milk Market Error: #arrival-timer-display element not found in HTML!");
             }
        } else if (document.querySelector('[data-tab="tab-business"]')) { // Only warn if the tab exists
            console.warn("Milk Market section structure (#business-milk-market) not found within the Business tab.");
        }
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
        this.elements.makeRawMilkButton.addEventListener('click', () => this.handleManualTap());
        this.elements.processMilkButton.addEventListener('click', () => this.processMilk());
        this.elements.toggleAutoTapButton.addEventListener('click', () => this.toggleAutoTap());

        // Settings Buttons (Placeholder functionality)
        document.querySelector('#tab-settings .action:nth-of-type(1)').addEventListener('click', () => this.saveGame());
        document.querySelector('#tab-settings .action:nth-of-type(2)').addEventListener('click', () => this.loadGame());
        document.querySelector('#tab-settings .action:nth-of-type(3)').addEventListener('click', () => this.resetGame());

    },


    addUpgradeEventListeners() {
        // Use Object.keys on the elements cache which should use camelCase keys
        const upgradeTypes = Object.keys(this.elements.upgrades); // Should be ['cowCost', 'tapReduction', 'rawMilkReduction']
        // Ensure the cache actually HAS these keys and valid button refs
        // console.log("Adding listeners for upgrade types:", upgradeTypes);
        // console.log("Elements cache structure:", this.elements.upgrades);


        upgradeTypes.forEach(type => { // 'type' here is the camelCase key ('cowCost', etc.)
            const button = this.elements.upgrades[type]?.button;
            if (button) {
                 // Double-check the data attribute value on the actual button element
                 const dataTypeFromButton = button.dataset.upgradeType;
                //  console.log(`Attaching listener to button for type: ${type}. Button's data-upgrade-type: ${dataTypeFromButton}`);

                // Pass the value DIRECTLY from the button's dataset
                button.addEventListener('click', () => {
                    const typeToPurchase = button.dataset.upgradeType; // Get camelCase type from attribute
                    // console.log(`Upgrade button clicked! Attempting to purchase type: ${typeToPurchase}`); // Log type being passed
                    this.purchaseUpgrade(typeToPurchase);
                });
            } else {
                console.warn(`Could not add listener for upgrade type "${type}": button element not found in cache.`);
            }
        });
    },

    addMarketEventListenersIfNeeded() { // Using Event Delegation
        if (!this.elements.customerQueueContainer) {
             // console.log("Market container not ready for listeners yet.");
             return; // Don't add if container doesn't exist
        }
        // Check if listener already added to prevent duplicates
        if (this.elements.customerQueueContainer.dataset.listenerAdded === 'true') {
            return;
        }
         this.elements.customerQueueContainer.addEventListener('click', (event) => {
             const button = event.target.closest('.sell-milk-button');
             if (button && !button.disabled) {
                 const customerId = button.dataset.customerId;
                 this.sellMilkToCustomer(customerId);
             }
         });
         this.elements.customerQueueContainer.dataset.listenerAdded = 'true'; // Mark as added
        //  console.log("Milk market sell button listener added.");
     },

    buyCow() {
        const currentEffectiveCost = this.getEffectiveCowCost();
        if (this.resources.gold >= currentEffectiveCost) {
            this.resources.gold -= currentEffectiveCost;
            this.resources.cows++;
            // Update the *base* cost for the *next* purchase (scaling)
            this.costs.currentBaseCowCost = Math.ceil(this.costs.currentBaseCowCost * 2);
            // Reset taps needed for the new cow level
            this.production.currentTapsLeft = this.production.tapsPerCycle;
            console.log(`Bought cow! Total: ${this.resources.cows}. Next base cost: ${this.costs.currentBaseCowCost}`);
            this.updateDisplay(); // Update display which calculates effective cost again
            this.checkUnlocks();
        } else {
            console.log(`Need ${currentEffectiveCost} gold for cow.`);
        }
     },

    // --- Tapping Logic ---
    handleManualTap() {
        if (this.automation.isAutoTapping) {
            // console.log("Manual tap disabled while auto-tap is active.");
            return;
        }
        const now = Date.now();
        if (now - this.cooldowns.lastManualTapTime < this.cooldowns.tapCooldownMs) {
            return;
        }
        this.cooldowns.lastManualTapTime = now;
        this.tapCow();
    },

    tapCow(manual = true) {
        const milkSection = document.getElementById('farm-milk-making');
        if (!milkSection || milkSection.classList.contains('subsection-locked')) {
             return;
        }
        if (this.resources.cows <= 0) return;

        const tapsToAdd = (this.playstyle === 'active' && manual)
            ? this.production.tapsPerClick * 2
            : this.production.tapsPerClick;
        // console.log(`Tapping: Adding ${tapsToAdd} taps (Style: ${this.playstyle})`); // Optional debug log
        this.production.currentTapsLeft -= tapsToAdd;

        if (this.production.currentTapsLeft <= 0) {
            const milkGained = this.resources.cows * this.production.milkPerTapCycle;
            this.resources.rawMilk += milkGained;
            // console.log(`Cycle complete! +${milkGained} raw milk.`);
            this.production.currentTapsLeft = this.production.tapsPerCycle + this.production.currentTapsLeft; // Keep overshoot
            this.checkUnlocks();
        }
        this.updateDisplay();
    },

    toggleAutoTap() {
        const milkSection = document.getElementById('farm-milk-making');
        if (!milkSection || milkSection.classList.contains('subsection-locked') || this.resources.cows <= 0) {
            console.log("Cannot toggle auto-tap: Milk section locked or no cows.");
            // Ensure button state reflects reality if toggling fails
            if (this.automation.isAutoTapping) this.automation.isAutoTapping = false;
            if (this.automation.autoTapIntervalId) {
                 clearInterval(this.automation.autoTapIntervalId);
                 this.automation.autoTapIntervalId = null;
            }
            this.updateDisplay();
            return;
        }

        this.automation.isAutoTapping = !this.automation.isAutoTapping;

        if (this.automation.isAutoTapping) {
            const effectiveAutoTapSpeed = (this.playstyle === 'passive')
                ? this.automation.baseAutoTapSpeedMs / 2
                : this.automation.baseAutoTapSpeedMs;
            this.automation.autoTapIntervalId = setInterval(() => this.tapCow(manual = false), effectiveAutoTapSpeed);
            console.log(`Auto-tap started (interval: ${effectiveAutoTapSpeed}ms).`);
        } else {
            if (this.automation.autoTapIntervalId) {
                clearInterval(this.automation.autoTapIntervalId);
                this.automation.autoTapIntervalId = null;
            }
            console.log("Auto-tap stopped.");
        }
        this.updateDisplay();
    },

    processMilk() {
        const milkSection = document.getElementById('farm-milk-making');
        if (!milkSection || milkSection.classList.contains('subsection-locked')) {
             console.log("Milk Making section is locked.");
             return;
        }
        const currentRawMilkCost = this.getCurrentRawMilkCost();
        if (this.resources.rawMilk >= currentRawMilkCost) {
            this.resources.rawMilk -= currentRawMilkCost;
            this.resources.milk++;
            console.log(`Processed ${currentRawMilkCost} raw milk -> 1 milk.`);
            this.updateDisplay();
            this.checkUnlocks();
        } else {
            console.log(`Need ${currentRawMilkCost} raw milk.`);
        }
     },

    // --- Upgrade Purchase Logic ---
    purchaseUpgrade(type) {
        const upgrade = this.upgrades[type];
        if (!upgrade) {
            console.error("Invalid upgrade type:", type);
            return;
        }

        if (upgrade.level >= upgrade.maxLevel) {
            console.log(`Upgrade "${type}" is already at max level.`);
            return;
        }

        const cost = this.getUpgradeCost(type);
        if (this.resources.cowCash >= cost) {
            this.resources.cowCash -= cost;
            upgrade.level++;
            console.log(`Purchased level ${upgrade.level} of upgrade "${type}" for ${cost} Cow Cash.`);

            // Update core game values affected by this upgrade
            this.updateProductionCostsFromUpgrades();

            // Update display to reflect new level, cost, and potentially other game values
            this.updateDisplay();
            this.checkUnlocks(); // Check if new Cow Cash total unlocks anything (unlikely but good practice)
        } else {
            console.log(`Not enough Cow Cash for upgrade "${type}". Need ${cost}, have ${this.resources.cowCash}.`);
        }
    },

    // --- Update Core Values from Upgrades ---
    updateProductionCostsFromUpgrades() {
        // Update taps per cycle
        const oldTapsPerCycle = this.production.tapsPerCycle;
        this.production.tapsPerCycle = this.getCurrentTapsPerCycle();

        // If taps per cycle changed, reset taps left
        if (oldTapsPerCycle !== this.production.tapsPerCycle) {
                this.production.currentTapsLeft = this.production.tapsPerCycle;
                console.log(`Taps per cycle updated to: ${this.production.tapsPerCycle}. Taps left reset.`);
        }

        // Cow cost and raw milk cost are calculated on-demand (getEffectiveCowCost, getCurrentRawMilkCost)
    },

    // --- Milk Market Methods ---
    startMilkMarketLogic() {
        if (this.milkMarket.customerArrivalTimerId !== null) return; // Already running
        const businessTab = document.querySelector('[data-tab="tab-business"]');
        if (!businessTab || businessTab.classList.contains('locked')) {
            console.log("Cannot start Milk Market: Business tab is locked.");
            return;
        }
        console.log("Starting Milk Market arrival timer.");
        this.milkMarket.lastTickTime = Date.now();
        // Ensure timer starts correctly based on current state
        if(this.milkMarket.customerArrivalTimerRemaining <= 0) {
             const currentQueueSize = this.milkMarket.customers.length;
             this.milkMarket.customerArrivalTimerDuration = this.determineNextTimerDuration(currentQueueSize);
             this.milkMarket.customerArrivalTimerRemaining = this.milkMarket.customerArrivalTimerDuration;
        }
        this.milkMarket.customerArrivalTimerId = setInterval(() => this.updateArrivalTimer(), 1000); // Update every second
        this.updateMilkMarketDisplay(); // Initial display update
    },

    stopMilkMarketLogic() {
        if (this.milkMarket.customerArrivalTimerId !== null) {
             console.log("Stopping Milk Market arrival timer.");
             clearInterval(this.milkMarket.customerArrivalTimerId);
             this.milkMarket.customerArrivalTimerId = null;
        }
        // Update display to show market closed
        this.updateMilkMarketDisplay();
    },

    updateArrivalTimer() {
        if (this.milkMarket.customerArrivalTimerId === null) return; // Stop if timer ID cleared

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.milkMarket.lastTickTime) / 1000);

        if (elapsedSeconds > 0) {
            this.milkMarket.customerArrivalTimerRemaining -= elapsedSeconds;
            this.milkMarket.lastTickTime = now;

            if (this.milkMarket.customerArrivalTimerRemaining <= 0) {
                if (this.canGenerateCustomer()) {
                    this.generateCustomer(); // This will also reset the timer duration and remaining time
                } else {
                    // Queue is full or constraints met, timer hit zero. Display appropriate message.
                    console.log("Arrival timer hit zero, but cannot generate customer (queue full or constraints).");
                    this.milkMarket.customerArrivalTimerRemaining = 0; // Keep at 0 until space clears
                }
            }
             // Always update display after potential changes
            this.updateMilkMarketDisplay();
        }
    },

    determineNextTimerDuration(queueSize) {
        switch (queueSize) {
            case 0: return 20;   // 20 seconds
            case 1: return 45;   // 45 seconds
            case 2: return 90;   // 1.5 minutes
            case 3: return 180;   // 3 minutes
            case 4: return 300;   // 5 minutes
            default: return 300; // Handles queue size 5+
        }
    },

    canGenerateCustomer() {
        // Check total customer limit
        if (this.milkMarket.customers.length >= this.milkMarket.maxCustomers) {
            return false;
        }
        // Check type constraints implicitly handled in selectCustomerType,
        // but an explicit check here makes logic clearer.
        const currentMoms = this.milkMarket.customers.filter(c => c.type === 'mom').length;
        const currentDads = this.milkMarket.customers.filter(c => c.type === 'dad').length;
        const canAddMom = currentMoms < 3;
        const canAddDad = currentDads < 2;

        // Can we add *any* customer type?
        return canAddMom || canAddDad;
    },

    selectCustomerType() {
        const currentMoms = this.milkMarket.customers.filter(c => c.type === 'mom').length;
        const currentDads = this.milkMarket.customers.filter(c => c.type === 'dad').length;

        const canAddMom = currentMoms < 3;
        const canAddDad = currentDads < 2;

        if (!canAddMom && canAddDad) return 'dad'; // Only Dad possible
        if (canAddMom && !canAddDad) return 'mom'; // Only Mom possible
        if (!canAddMom && !canAddDad) return null; // Neither possible (should be caught by canGenerateCustomer)

        // Both Mom and Dad are possible
        const roll = Math.random();
        return roll < 0.70 ? 'mom' : 'dad'; // 70% Mom, 30% Dad
    },

    generateCustomer() {
        // Redundant check, but safe
        if (!this.canGenerateCustomer()) {
            console.log("GenerateCustomer called but cannot generate.");
            this.milkMarket.customerArrivalTimerRemaining = 0; // Ensure timer stays at 0 if queue is full
            this.updateMilkMarketDisplay();
            return;
        };

        const type = this.selectCustomerType();
        if (!type) {
             console.log("Cannot generate customer due to type constraints (e.g., 2 Dad and 3 Moms already present).");
             // Keep timer at 0 or reset to short check interval? Let's keep at 0.
             this.milkMarket.customerArrivalTimerRemaining = 0;
             this.updateMilkMarketDisplay();
             return;
        }

        let newCustomer;
        if (type === 'mom') {
            newCustomer = this.createMilkMom();
        } else {
            newCustomer = this.createDairyDad();
        }

        this.milkMarket.customers.push(newCustomer);
        console.log(`Generated ${newCustomer.type === 'mom' ? 'Milk Mom' : 'Dairy Dad'} ${newCustomer.sequenceN} (${newCustomer.name}) requesting ${newCustomer.milkRequest} milk.`);

        // Restart timer based on NEW queue size
        const newQueueSize = this.milkMarket.customers.length;
        this.milkMarket.customerArrivalTimerDuration = this.determineNextTimerDuration(newQueueSize);
        this.milkMarket.customerArrivalTimerRemaining = this.milkMarket.customerArrivalTimerDuration;

        this.internalState.marketUpdateNeeded = true;
        this.updateDisplay(); // Update overall resource display (e.g., Cow Cash)
    },

    createMilkMom() {
        this.milkMarket.customerSequence.mom++;
        const sequenceN = this.milkMarket.customerSequence.mom;
        const nameList = this.milkMarket.nameLists.female;
        const name = nameList[Math.floor(Math.random() * nameList.length)];   

        const minMilk = sequenceN;
        const maxMilk = 2 * sequenceN;
        const milkRequest = Math.floor(Math.random() * (maxMilk - minMilk + 1)) + minMilk;

        const rewards = {
            coins: 10 + milkRequest, // Use 'coins' key matching spec, map to 'gold' later
            cowCash: 1
        };

        return {
            id: `mom-${sequenceN}-${Date.now()}`, // Unique enough ID
            type: 'mom',
            sequenceN: sequenceN,
            name: name,
            milkRequest: milkRequest,
            rewards: rewards,
            domElement: null
        };
    },

    createDairyDad() {
        this.milkMarket.customerSequence.dad++;
        const sequenceN = this.milkMarket.customerSequence.dad;
        const nameList = this.milkMarket.nameLists.male;
        const name = nameList[Math.floor(Math.random() * nameList.length)];

        let milkRequest;
        if (sequenceN === 1) {
            milkRequest = 5;
        } else {
            // Requires knowing the previous Dad's actual request amount
            const prevAmount = this.milkMarket.lastDadRequestAmount;
            const roll = Math.random();
            if (roll < 0.40) { // 40% same
                milkRequest = prevAmount;
            } else if (roll < 0.80) { // 40% +5
                milkRequest = prevAmount + 5;
            } else if (roll < 0.95) { // 15% +10
                milkRequest = prevAmount + 10;
            } else { // 5% -5
                milkRequest = prevAmount - 5;
            }
            milkRequest = Math.max(5, milkRequest); // Ensure >= 5
        }
        this.milkMarket.lastDadRequestAmount = milkRequest; // Store for next Dad

        const rewards = {
            coins: 5 + milkRequest/5, // Use 'coins' key matching spec
            cowCash: 5 + milkRequest/5
        };

        return {
            id: `dad-${sequenceN}-${Date.now()}`, // Unique enough ID
            type: 'dad',
            sequenceN: sequenceN,
            name: name,
            milkRequest: milkRequest,
            rewards: rewards,
            domElement: null
        };
    },

    sellMilkToCustomer(customerId) {
        const customerIndex = this.milkMarket.customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
             console.error("Customer not found:", customerId);
             return;
        }
        const customer = this.milkMarket.customers[customerIndex];

        if (this.resources.milk < customer.milkRequest) {
             console.log("Not enough milk to sell.");
             // Button should be disabled, but double-check
             return;
        }

        // Process sale
        this.resources.milk -= customer.milkRequest;
        this.resources.gold += customer.rewards.coins; // Grant Gold for 'coins' reward
        this.resources.cowCash += customer.rewards.cowCash;

        console.log(`Sold ${customer.milkRequest} milk to ${customer.name}. Earned ${customer.rewards.coins} Gold, ${customer.rewards.cowCash} Cow Cash.`);

        // Remove customer
        this.milkMarket.customers.splice(customerIndex, 1);

        // Update timer based on new queue size and remaining time rule
        const newQueueSize = this.milkMarket.customers.length;
        const standardDuration = this.determineNextTimerDuration(newQueueSize);

        // Apply the timer update rule
        if (this.milkMarket.customerArrivalTimerRemaining > standardDuration) {
            console.log(`Timer adjusted from ${this.formatTime(this.milkMarket.customerArrivalTimerRemaining)} to ${this.formatTime(standardDuration)} due to sale.`);
            this.milkMarket.customerArrivalTimerRemaining = standardDuration;
            // Ensure lastTickTime is updated if timer changes drastically, to prevent immediate tick
            this.milkMarket.lastTickTime = Date.now();
        } else {
            console.log(`Timer remains at ${this.formatTime(this.milkMarket.customerArrivalTimerRemaining)} (<= standard ${this.formatTime(standardDuration)})`);
            // No change needed if remaining is less than or equal to standard
        }

        // Crucial: If the timer was at 0 (queue full), and now there's space, restart it properly.
        if (this.milkMarket.customerArrivalTimerRemaining <= 0 && newQueueSize < this.milkMarket.maxCustomers) {
            this.milkMarket.customerArrivalTimerDuration = standardDuration; // Set the correct duration
            this.milkMarket.customerArrivalTimerRemaining = standardDuration; // Start countdown from full duration
            this.milkMarket.lastTickTime = Date.now(); // Reset tick time
            console.log(`Timer restarted to ${this.formatTime(standardDuration)} as queue now has space.`);
        }

        this.internalState.marketUpdateNeeded = true;

        this.updateDisplay(); // Update resources and potentially button states globally
        this.checkUnlocks(); // Check if gained Cow Cash unlocks anything
    },

    updateMilkMarketDisplay() {
        // Ensure elements are available before attempting to update
        if (!this.elements.customerQueueContainer || !this.elements.arrivalTimerDisplay) {
            this.cacheMilkMarketElements();
            if (!this.elements.customerQueueContainer || !this.elements.arrivalTimerDisplay) {
                // console.log("Milk market UI elements not ready for display.");
                return;
            }
        }

        const container = this.elements.customerQueueContainer;
        const currentCustomerData = this.milkMarket.customers; // Array of { id, ..., domElement }
        const currentCustomerIds = new Set(currentCustomerData.map(c => c.id));
        const elementsToRemove = [];
        const existingElementMap = new Map(); // Map customerId -> DOM element

        // --- Pass 1: Identify existing DOM elements and those to remove ---
        for (const child of container.children) {
            // Skip non-element nodes like text nodes if any exist
            if (!(child instanceof HTMLElement)) continue;

            // Identify customer entries (assuming they have the class)
            if (child.classList.contains('customer-entry')) {
                const button = child.querySelector('.sell-milk-button');
                const customerId = button?.dataset.customerId;

                if (customerId && currentCustomerIds.has(customerId)) {
                    // This DOM element corresponds to a customer still in our data
                    existingElementMap.set(customerId, child);
                    // Also update the domElement reference in the data, in case it was lost (e.g., after load)
                    const customerObj = currentCustomerData.find(c => c.id === customerId);
                    if(customerObj) customerObj.domElement = child;

                } else if (customerId) {
                    // This DOM element's customer ID is NOT in our current data, mark for removal
                    elementsToRemove.push(child);
                } else {
                    // This is a .customer-entry div but has no button/id? Maybe malformed, remove it.
                    console.warn("Found customer-entry div without valid button/ID:", child);
                    elementsToRemove.push(child);
                }
            } else if (child.tagName === 'P' && child.textContent.includes('No customers waiting...')) {
                // If the 'No customers' message exists, mark it for removal *if* we actually have customers now
                if (currentCustomerData.length > 0) {
                    elementsToRemove.push(child);
                }
                // If we have NO customers, this paragraph should NOT be in existingElementMap or elementsToRemove yet
            } else {
                // Unknown element type in the container, maybe remove it? Or log it.
                 console.warn("Found unexpected element in customer queue:", child);
                 // Decide if you want to remove unexpected elements: elementsToRemove.push(child);
            }
        }

        // --- Pass 2: Remove the outdated elements ---
        elementsToRemove.forEach(el => {
            // console.log("Removing outdated element:", el.outerHTML.substring(0, 100) + "..."); // Debug log
            container.removeChild(el)
        });

        // --- Pass 3: Update existing elements or add new ones, maintaining order ---
        let lastPlacedElement = null; // Track the last correctly positioned element
        currentCustomerData.forEach((customer) => {
            const customerId = customer.id;
            const canAfford = this.resources.milk >= customer.milkRequest;
            let customerDiv = existingElementMap.get(customerId);

            if (customerDiv) {
                // ### UPDATE EXISTING ELEMENT ###
                // console.log("Updating existing element:", customerId); // Debug log
                const button = customerDiv.querySelector('.sell-milk-button');
                if (button) {
                    button.disabled = !canAfford;
                    // Optionally update button text if request amount could change (unlikely here)
                    // button.textContent = `Sell ${customer.milkRequest} Milk`;
                }

                // Update text content - Safest is to target specific elements if possible.
                // Rebuilding paragraph innerHTML is simpler but technically less ideal.
                // Let's stick to rebuilding the paragraph for now unless issues arise.
                const paragraph = customerDiv.querySelector('p');
                if (paragraph) {
                    const customerTypeDisplay = customer.type === 'mom' ? `Milk Mom ${customer.sequenceN}` : `Dairy Dad ${customer.sequenceN}`;
                    const rewardString = [
                        customer.rewards.coins > 0 ? `${customer.rewards.coins} Gold` : null,
                        customer.rewards.cowCash > 0 ? `${customer.rewards.cowCash} Cow Cash` : null
                    ].filter(Boolean).join(', ');
                    paragraph.innerHTML = `
                        <strong>${customerTypeDisplay} (${customer.name})</strong><br>
                        Requests: ${customer.milkRequest} Milk<br>
                        Rewards: ${rewardString || 'None'}
                    `;
                }
                // Ensure our data reference points to this element
                customer.domElement = customerDiv;
                lastPlacedElement = customerDiv; // This element is already in place

            } else {
                // ### CREATE NEW ELEMENT ###
                // console.log("Creating new element:", customerId); // Debug log
                customerDiv = document.createElement('div');
                customerDiv.className = 'customer-entry';
                customer.domElement = customerDiv; // Store the reference IMMEDIATELY

                const customerTypeDisplay = customer.type === 'mom' ? `Milk Mom ${customer.sequenceN}` : `Dairy Dad ${customer.sequenceN}`;
                const rewardString = [
                    customer.rewards.coins > 0 ? `${customer.rewards.coins} Gold` : null,
                    customer.rewards.cowCash > 0 ? `${customer.rewards.cowCash} Cow Cash` : null
                ].filter(Boolean).join(', ');

                customerDiv.innerHTML = `
                    <p>
                        <strong>${customerTypeDisplay} (${customer.name})</strong><br>
                        Requests: ${customer.milkRequest} Milk<br>
                        Rewards: ${rewardString || 'None'}
                    </p>
                    <button class="action sell-milk-button" data-customer-id="${customer.id}" ${!canAfford ? 'disabled' : ''}>
                        Sell ${customer.milkRequest} Milk
                    </button>
                    <hr class='customer-hr'>
                `;

                // Insert the new element in the correct position
                if (lastPlacedElement && lastPlacedElement.nextSibling) {
                    // Insert after the last element we knew was in the right place
                    container.insertBefore(customerDiv, lastPlacedElement.nextSibling);
                } else if (lastPlacedElement) {
                     // Insert at the very end if the last known element was the last child
                     container.appendChild(customerDiv);
                } else {
                    // Insert at the beginning if the container was empty or only had the placeholder
                     container.insertBefore(customerDiv, container.firstChild);
                }
                lastPlacedElement = customerDiv; // Update the last placed element
            }
        });

        // --- Pass 4: Handle the "No customers" message ---
        // Check if the container is empty *after* processing customers
        const hasCustomerEntries = container.querySelector('.customer-entry');
        const hasNoCustomerMessage = container.querySelector('p')?.textContent.includes('No customers waiting...');

        if (currentCustomerData.length === 0 && !hasNoCustomerMessage) {
             // console.log("Adding 'No customers' message."); // Debug log
             // Clear anything else (shouldn't be needed but safe)
             container.innerHTML = '<p><i>No customers waiting...</i></p>';
        } else if (currentCustomerData.length > 0 && hasNoCustomerMessage) {
            // This case should have been handled by removal in Pass 2, but double check
            console.warn("Found 'No customers' message unexpectedly when customers exist. Removing.");
             const msgElement = container.querySelector('p');
             if (msgElement && msgElement.textContent.includes('No customers waiting...')) {
                 container.removeChild(msgElement);
             }
        }


        // --- Update Arrival Timer display ---
        const businessTab = document.querySelector('[data-tab="tab-business"]');
        const marketActive = this.milkMarket.customerArrivalTimerId !== null && businessTab && !businessTab.classList.contains('locked');

        if (!marketActive) {
             this.elements.arrivalTimerDisplay.textContent = "Market Closed";
        } else if (this.milkMarket.customerArrivalTimerRemaining <= 0 && this.milkMarket.customers.length >= this.milkMarket.maxCustomers) {
            this.elements.arrivalTimerDisplay.textContent = "Customer Queue Full";
        } else if (this.milkMarket.customerArrivalTimerRemaining <= 0) {
            this.elements.arrivalTimerDisplay.textContent = "Checking for next customer...";
        } else {
            this.elements.arrivalTimerDisplay.textContent = `Next customer in: ${this.formatTime(this.milkMarket.customerArrivalTimerRemaining)}`;
        }
    },

    formatTime(totalSeconds) { // Helper function
        if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60); // Use floor to avoid fractional seconds display
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    },

    factorial(n) { // Helper function
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = n; i > 1; i--) {
            result *= i;
        }
        return result;
    },

    // --- Upgrade Calculation Functions ---
    getUpgradeCost(type) {
        const upgrade = this.upgrades[type];
        if (!upgrade) return Infinity; // Invalid type
        const currentLevel = upgrade.level;
        const maxLevel = upgrade.maxLevel;

        if (currentLevel >= maxLevel) {
            return Infinity; // Already max level
        }

        const nextLevel = currentLevel + 1; // Level being purchased

        switch (type) {
            case 'cowCost':
                // Cost: 5 * 2^(N-1) where N is the level being purchased (nextLevel)
                return 5 * Math.pow(2, nextLevel - 1);
            case 'tapReduction':
                // Cost: N * (N + 1) / 2 (Triangle Number) where N is the level being purchased
                return nextLevel * (nextLevel + 1) / 2;
            case 'rawMilkReduction':
                // Cost: 10 * N! where N is the level being purchased
                return 10 * this.factorial(nextLevel);
            default:
                console.warn("Unknown upgrade type in getUpgradeCost:", type); // Added warning
                return Infinity;
        }
    },

    getCurrentCowCostMultiplier() {
        const level = this.upgrades.cowCost.level;
        // Base: 100%. Reduction: 10% per level. Min: 20%.
        const reductionPercent = level * 10;
        const effectivePercent = Math.max(20, 100 - reductionPercent);
        return effectivePercent / 100; // Return as multiplier (e.g., 0.9, 0.8, ...)
    },

    getEffectiveCowCost() {
        const multiplier = this.getCurrentCowCostMultiplier();
        // Apply multiplier to the *current scaling* base cost
        return Math.ceil(this.costs.currentBaseCowCost * multiplier);
    },

    getCurrentTapsPerCycle() {
        const level = this.upgrades.tapReduction.level;
        // Base: 20. Reduction: 1 per level. Min: 5.
        return Math.max(5, this.production.baseTapsPerCycle - level);
    },

    getCurrentRawMilkCost() {
        const level = this.upgrades.rawMilkReduction.level;
        // Base: 10. Reduction: 1 per level. Min: 5.
        return Math.max(5, this.costs.baseProcessMilk - level);
    },

    // --- Display & Updates ---
    updateDisplay() {
        // Update Playstyle
        if (this.elements.playstyleDisplay) {
            this.elements.playstyleDisplay.textContent = this.playstyle
                ? `Playstyle: ${this.playstyle.charAt(0).toUpperCase() + this.playstyle.slice(1)}` // Capitalize
                : 'Playstyle: Select...';
       }
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
        this.elements.cowCashResourceDisplay.style.display = (this.resources.cowCash > 0 || upgradesTabUnlocked) ? 'inline' : 'none';
        this.elements.factoryFundsResourceDisplay.style.display = (this.resources.factoryFunds > 0 || factoryTabUnlocked) ? 'inline' : 'none';

        const currentCustomerIds = this.milkMarket.customers.map(c => c.id).join(',');
        const milkChanged = this.resources.milk !== this.internalState.previousMilk;
        const customersChanged = currentCustomerIds !== this.internalState.previousCustomerIds;

        // Update market UI ONLY if milk changed, customers changed, or forced
        if (milkChanged || customersChanged || this.internalState.marketUpdateNeeded) {
            // console.log("Market update triggered:", { milkChanged, customersChanged, forced: this.internalState.marketUpdateNeeded }); // Optional Debug log
            this.updateMilkMarketDisplay(); // Redraw the market
            this.internalState.previousMilk = this.resources.milk; // Update tracked milk
            this.internalState.previousCustomerIds = currentCustomerIds; // Update tracked IDs
            this.internalState.marketUpdateNeeded = false; // Reset the force flag
        }

        // Update Farm Tab Details (using effective costs)
        const currentEffectiveCowCost = this.getEffectiveCowCost();
        const currentEffectiveRawMilkCost = this.getCurrentRawMilkCost();
        const currentTapsPerCycle = this.getCurrentTapsPerCycle(); // Use the getter

        if (this.elements.cowsCountFarm) this.elements.cowsCountFarm.textContent = this.resources.cows;
        if (this.elements.effectiveCowCostDisplay) this.elements.effectiveCowCostDisplay.textContent = currentEffectiveCowCost;
        if (this.elements.effectiveRawMilkCostDisplay) this.elements.effectiveRawMilkCostDisplay.textContent = currentEffectiveRawMilkCost;
        if (this.elements.currentTapsPerCycleDisplay) this.elements.currentTapsPerCycleDisplay.textContent = currentTapsPerCycle; // Update the total taps span

        const milkMakingSection = document.getElementById('farm-milk-making');
        const milkMakingUnlocked = milkMakingSection && !milkMakingSection.classList.contains('subsection-locked');


        if (milkMakingUnlocked) {
            if (this.elements.rawMilkCount) this.elements.rawMilkCount.textContent = this.resources.rawMilk;
            if (this.elements.milkCountFarm) this.elements.milkCountFarm.textContent = this.resources.milk;
            if (this.elements.tapsLeft) this.elements.tapsLeft.textContent = Math.max(0, Math.floor(this.production.currentTapsLeft));
            if (this.elements.cowsMilkYield) this.elements.cowsMilkYield.textContent = this.resources.cows * this.production.milkPerTapCycle;
       }

        // Update Button States
        if (this.elements.buyCowButton) {
            this.elements.buyCowButton.disabled = this.resources.gold < currentEffectiveCowCost;
        }
        const canMilk = milkMakingUnlocked && this.resources.cows > 0;
        if (this.elements.makeRawMilkButton) {
            this.elements.makeRawMilkButton.disabled = !canMilk || this.automation.isAutoTapping;
        }
        if (this.elements.toggleAutoTapButton) {
            this.elements.toggleAutoTapButton.disabled = !canMilk;
            this.elements.toggleAutoTapButton.textContent = this.automation.isAutoTapping ? 'Auto-Tap ON' : 'Auto-Tap Off';
            this.elements.toggleAutoTapButton.classList.toggle('active-auto', this.automation.isAutoTapping);
        }
        if (this.elements.processMilkButton) {
            this.elements.processMilkButton.disabled = !milkMakingUnlocked || this.resources.rawMilk < currentEffectiveRawMilkCost;
        }

        // --- Update Upgrades Tab UI ---
        const upgradeTypes = ['cowCost', 'tapReduction', 'rawMilkReduction'];
        // console.log("--- Starting Upgrade UI Update ---");
        upgradeTypes.forEach(type => {
            const els = this.elements.upgrades[type]; // Get cached element references
            const upgrade = this.upgrades[type];      // Get current game state for this upgrade

            // Defensive check: Ensure both state and element references exist
            if (!els || !upgrade || !els.level || !els.maxLevel || !els.effect || !els.cost || !els.button) {
                console.warn(`Missing state or cached elements for upgrade type '${type}' in updateDisplay. Skipping UI update.`);
                // console.log("Elements obj:", els); // Log the element references found
                // console.log("Upgrade state:", upgrade); // Log the game state found
                return;
            }

            const currentLevel = upgrade.level;
            const maxLevel = upgrade.maxLevel;
            const isMaxLevel = currentLevel >= maxLevel;

            // Update Level Display
            els.level.textContent = currentLevel;
            els.maxLevel.textContent = maxLevel;

            // Update Effect Display
            let effectText = '';
            switch (type) { /* ... effect calculation ... */
                case 'cowCost':
                    effectText = `${(this.getCurrentCowCostMultiplier() * 100).toFixed(0)}% Gold Cost`;
                    break;
                case 'tapReduction':
                    effectText = `${this.getCurrentTapsPerCycle()} Taps per Cycle`;
                    break;
                case 'rawMilkReduction':
                    effectText = `${this.getCurrentRawMilkCost()} Raw Milk per Milk`;
                    break;
            }
            els.effect.textContent = effectText;


            // Update Cost Display & Button State
            if (isMaxLevel) {
                // --- Logic for MAX LEVEL ---
                // console.log(`[updateDisplay] ${type} - Setting UI to MAX LEVEL`);
                els.cost.textContent = "N/A";
                els.button.textContent = "Max Level";
                els.button.disabled = true;
                els.button.classList.add('max-level');
                els.button.classList.remove('action');
            } else {
                // --- Logic for NOT MAX LEVEL ---
                const nextCost = this.getUpgradeCost(type);
                const canAfford = this.resources.cowCash >= nextCost;

                // --- Log the values we are about to set ---
                // console.log(`[updateDisplay] ${type} - Setting UI: Next Cost=${nextCost}, Can Afford=${canAfford}`);

                // --- Explicitly set the UI elements ---
                els.cost.textContent = `${nextCost} Cow Cash`; // <--- Update cost text
                els.button.textContent = "Purchase";          // <--- Update button text
                els.button.disabled = !canAfford;             // <--- Update button disabled status

                // --- Log the elements AFTER attempting to set them ---
                // console.log(`[updateDisplay] ${type} - AFTER SET: Cost Text = '${els.cost.textContent}', Button Disabled = ${els.button.disabled}`);


                els.button.classList.remove('max-level');
                els.button.classList.add('action');
            }
        });

        // Update milk market display (important to call this after resource updates)
        this.updateMilkMarketDisplay();
    },

    switchTab(targetTabId) {
        this.elements.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetTabId));
        this.elements.tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === targetTabId));
        // console.log("Switched to tab:", targetTabId);
        // Potentially trigger display update if needed when switching TO a specific tab
         if (targetTabId === 'tab-business') {
             this.updateMilkMarketDisplay(); // Ensure market is up-to-date when viewed
         }
     },

    // --- Unlocking Logic ---
    checkUnlocks() {
        let newlyUnlocked = false;
        let triggerDisplayUpdate = false;
        let shouldShowPlaystylePrompt = false;

        // 1. Check TAB Unlocks
        this.elements.tabButtons.forEach(button => {
            const condition = button.dataset.unlockCondition;
            const isLocked = button.classList.contains('locked');
            const tabId = button.dataset.tab;

            // ONLY check for unlocking
            if (isLocked && condition && this.evaluateCondition(condition)) {
                console.log(`Unlocking tab: ${tabId}`);
                button.classList.remove('locked');
                newlyUnlocked = true; // Mark unlock happened
                triggerDisplayUpdate = true;

                if (tabId === 'tab-upgrades' || tabId === 'tab-factory') {
                    shouldShowPlaystylePrompt = true;
                    console.log(`Major feature unlocked (${tabId}), queuing playstyle prompt.`);
                }

                // Special action for Business Tab unlock
                if (tabId === 'tab-business') {
                    this.cacheMilkMarketElements();
                    this.addMarketEventListenersIfNeeded();
                    this.startMilkMarketLogic(); // Start the market timer
                }
                 // Update resource visibility if relevant tabs are unlocked
                 if (tabId === 'tab-upgrades' || tabId === 'tab-factory') {
                    triggerDisplayUpdate = true;
                 }
            }
        });

        // 2. Check SUBSECTION and HR Unlocks
        for (const id in this.elements.lockedSections) {
            const section = this.elements.lockedSections[id];
            if (!section) continue; // Skip if section somehow became null
            const condition = section.dataset.unlockCondition;

            // ONLY check for unlocking
            if (section.classList.contains('subsection-locked') && condition && this.evaluateCondition(condition)) {
                console.log(`Unlocking subsection: ${id}`);
                section.classList.remove('subsection-locked');
                newlyUnlocked = true; // Mark unlock happened
                triggerDisplayUpdate = true;

                const unlockInfoSpan = section.querySelector('.subsection-unlock-info');
                if (unlockInfoSpan) unlockInfoSpan.remove(); // Remove the "Requires X" text

                // Unlock corresponding HR using a more robust mapping
                 let hrId = null;
                 const hrMappings = {
                     'farm-milk-making': 'farm-milk-hr',
                     'farm-ripe-milk': 'farm-ripe-hr',
                     'business-cheese-corner': 'business-cheese-hr',
                     'business-gourmet-goods': 'business-gourmet-hr',
                     'upgrades-factory-funds': 'upgrades-factory-hr',
                     'factory-premium-production': 'factory-premium-hr'
                 };
                 hrId = hrMappings[id];

                 if (hrId) {
                     const hrElement = this.elements.lockedHrs[hrId] || document.getElementById(hrId);
                     if (hrElement && hrElement.classList.contains('subsection-hr-locked')) {
                         console.log(`Unlocking HR: ${hrId}`);
                         hrElement.classList.remove('subsection-hr-locked');
                         if (!this.elements.lockedHrs[hrId] && hrElement) {
                             this.elements.lockedHrs[hrId] = hrElement; // Add to cache if found dynamically
                         }
                     }
                 }
            }
         }


        // 3. Update display ONLY if something changed that requires it
        if (triggerDisplayUpdate) {
            console.log("Unlock check resulted in potential display changes.");
            // Stop auto-tap if it becomes unusable (existing logic)
            if (this.automation.isAutoTapping) {
                const milkMakingSection = document.getElementById('farm-milk-making');
                const milkMakingUnlocked = milkMakingSection && !milkMakingSection.classList.contains('subsection-locked');
                if (!milkMakingUnlocked || this.resources.cows <= 0) {
                    // Check if toggleAutoTap function exists before calling
                    if (typeof this.toggleAutoTap === 'function') {
                         this.toggleAutoTap(); // Turn it off if conditions are no longer met
                    }
                }
            }
            this.updateDisplay(); // Update display after unlocks/relocks
        } else if (newlyUnlocked) {
             // Something unlocked but didn't require a full display update (e.g., only market start)
             console.log("Unlock check finished, items unlocked but no immediate display refresh triggered by checkUnlocks itself.");
        }
        if (shouldShowPlaystylePrompt) {
            this.showPlaystylePrompt();
        }
    },

    showPlaystylePrompt(isInitial = false) {
        console.log("Showing playstyle prompt.");
        // Prevent showing multiple modals
        if (document.getElementById('playstyle-modal')) {
            console.warn("Playstyle modal already exists.");
            // Ensure it's visible if somehow hidden
            document.getElementById('playstyle-modal').classList.add('active');
            return;
        }

        // Create Modal Structure
        const modal = document.createElement('div');
        modal.id = 'playstyle-modal';
        modal.className = 'active'; // Show it immediately

        const modalContent = document.createElement('div');
        modalContent.className = 'playstyle-modal-content';

        modalContent.innerHTML = `
            <h2>Choose Your Playstyle</h2>
            <p>Select how you want to primarily generate Raw Milk. You can change this later when other major features unlock.</p>

            <div class="playstyle-option">
                <h3>Active Playstyle</h3>
                <p>Your manual clicks on "Milk your Cows" count for <strong>double</strong> the taps towards completing a cycle.</p>
                <button class="playstyle-select-button active-style" data-style="active">Select Active</button>
            </div>

            <div class="playstyle-option">
                <h3>Passive Playstyle</h3>
                <p>The built-in "Auto-Tap" feature works <strong>twice as fast</strong>, automatically clicking for you more often.</p>
                <button class="playstyle-select-button passive-style" data-style="passive">Select Passive</button>
            </div>

            <p class="playstyle-warning">
                ⚠️ Important: Please do not use any type of autoclicker. It can unbalance the game. If you don't want to click a lot, the Passive playstyle is designed for you.
            </p>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners to buttons within the modal
        modal.addEventListener('click', (event) => {
            const button = event.target.closest('.playstyle-select-button');
            if (button && button.dataset.style) {
                this.selectPlaystyle(button.dataset.style);
            }
        });

        // Note: This modal currently REQUIRES a selection to be dismissed.
    },

    selectPlaystyle(chosenStyle) {
        console.log(`Playstyle selected: ${chosenStyle}`);
        if (chosenStyle !== 'active' && chosenStyle !== 'passive') {
            console.error("Invalid playstyle selected:", chosenStyle);
            return;
        }

        this.playstyle = chosenStyle;

        // Remove the modal
        const modal = document.getElementById('playstyle-modal');
        if (modal) {
            modal.remove();
        } else {
            console.warn("Could not find playstyle modal to remove.");
        }


        // Apply effects immediately (e.g., restart auto-tap if needed)
        this.applyPlaystyleEffects();

        // Update UI display
        this.updateDisplay();

        // TODO: Consider triggering a game save here?
        // this.saveGame();
    },

    applyPlaystyleEffects() {
        console.log(`Applying effects for ${this.playstyle} playstyle.`);
        // Key effect: If auto-tap is currently running, stop and restart it with the correct speed.
        if (this.automation.isAutoTapping) {
            console.log("Auto-tap is active, restarting with updated speed.");
            // Stop existing interval
            if (this.automation.autoTapIntervalId) {
                clearInterval(this.automation.autoTapIntervalId);
                this.automation.autoTapIntervalId = null; // Clear ID
            }
            // Restart with new speed (logic duplicated from toggleAutoTap for clarity)
            const effectiveAutoTapSpeed = (this.playstyle === 'passive')
                ? this.automation.baseAutoTapSpeedMs / 2
                : this.automation.baseAutoTapSpeedMs;
            this.automation.autoTapIntervalId = setInterval(() => this.tapCow(), effectiveAutoTapSpeed);
        }
        // Manual tap effect is handled directly in tapCow based on current this.playstyle
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
     },

    // --- Game Lifecycle (Save/Load/Reset stubs) ---
    saveGame() {
        console.log("Saving game... (STUB)");
        const saveData = {
            resources: this.resources,
            playstyle: this.playstyle, // <<< ADD
            costs: { currentBaseCowCost: this.costs.currentBaseCowCost },
            production: { currentTapsLeft: this.production.currentTapsLeft },
            upgrades: this.upgrades, // Save upgrade levels
            automation: { isAutoTapping: this.automation.isAutoTapping },
            milkMarket: {
                // Save relevant market state like customerSequence, lastDadRequestAmount
                // Potentially save active customers if you want them to persist? (complex)
                customerSequence: this.milkMarket.customerSequence,
                lastDadRequestAmount: this.milkMarket.lastDadRequestAmount,
                // Note: Saving timers precisely is tricky; often easier to restart on load
            }
            // ... other necessary state ...
        };
        // TODO: Implement actual saving (e.g., localStorage.setItem('kaasGameSave', JSON.stringify(saveData)))
        alert("Save Game (Not Implemented Yet - Playstyle added to stub)");
    },

    loadGame() {
        console.log("Loading game... (STUB)");
        // TODO: Implement actual loading (e.g., from localStorage)
        const savedString = null; // Replace with actual loading mechanism
        if (savedString) {
            const loadedData = JSON.parse(savedString);
            this.resources = loadedData.resources;
            this.playstyle = loadedData.playstyle || null; // <<< LOAD (default to null if missing)
            this.costs.currentBaseCowCost = loadedData.costs.currentBaseCowCost;
            this.production.currentTapsLeft = loadedData.production.currentTapsLeft;
            this.upgrades = loadedData.upgrades;
            this.automation.isAutoTapping = loadedData.automation.isAutoTapping;
            this.milkMarket.customerSequence = loadedData.milkMarket.customerSequence;
            this.milkMarket.lastDadRequestAmount = loadedData.milkMarket.lastDadRequestAmount;
            // ... load other state ...

            console.log("Game data loaded. Applying states...");

            // Re-apply states and check unlocks AFTER loading
            this.updateProductionCostsFromUpgrades(); // Crucial after loading upgrades
            this.applyPlaystyleEffects(); // Apply loaded playstyle effects

            // Re-initialize market logic if unlocked
            const businessTab = document.querySelector('[data-tab="tab-business"]');
            if (businessTab && !businessTab.classList.contains('locked')) {
                this.cacheMilkMarketElements(); // Ensure elements are cached
                this.addMarketEventListenersIfNeeded(); // Ensure listeners are attached
                this.startMilkMarketLogic(); // Restart market timer
            }

            // Restart auto-tap if it was saved as active
            if (this.automation.isAutoTapping) {
                this.automation.isAutoTapping = false; // Set to false first
                this.toggleAutoTap(); // Then toggle to correctly start interval with loaded playstyle speed
            }

            this.checkUnlocks(); // Run unlocks check based on loaded state
            this.updateDisplay(); // Update UI fully

        } else {
            alert("Load Game (No save data found)");
        }
        // Initial prompt handled by init if playstyle is null after load attempt
    },

    resetGame() {
        console.log("Resetting game... (STUB)");
        if (confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
            console.log("Proceeding with reset.");
            // TODO: Implement full game reset
            // Reset resources to initial values
            // Reset playstyle to null to trigger prompt on reload
            this.playstyle = null; // <<< RESET
            // Reset upgrade levels to 0
            // Object.keys(this.upgrades).forEach(key => this.upgrades[key].level = 0);
            // Reset costs, production state, automation, market state...
            alert("Reset Game (Not Implemented Yet - Refresh page for basic reset, playstyle reset added to stub)");
            // Consider stopping timers before reload
            // if (this.automation.autoTapIntervalId) clearInterval(this.automation.autoTapIntervalId);
            // if (this.milkMarket.customerArrivalTimerId) clearInterval(this.milkMarket.customerArrivalTimerId);
            window.location.reload(); // Simplest reset for now
        }
    },
};

document.addEventListener('DOMContentLoaded', () => game.init());

/* --- END OF FILE script.js --- */