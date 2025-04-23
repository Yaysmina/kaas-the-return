/* --- START OF FILE script.js --- */

const game = {
    // --- Game State ---
    resources: { gold: 25, cows: 0, rawMilk: 0, milk: 0, cowCash: 0, factoryFunds: 0 },
    costs: { cow: 25, processMilk: 10 },
    production: { tapsPerClick: 1, milkPerTapCycle: 1, tapsPerCycle: 20, currentTapsLeft: 20 },
    automation: {
        isAutoTapping: false,
        autoTapIntervalId: null,
        autoTapSpeedMs: 1000 / 4, // Auto-taps at 4/s
    },
    cooldowns: {
        tapCooldownMs: 1000 / 15, // Prevent manual taps faster than 15/s
        lastManualTapTime: 0
    },

    // --- Milk Market State ---
    milkMarket: {
        customers: [], // Array of customer objects { id, type, sequenceN, name, milkRequest, rewards: { coins, cowCash }, domElement: null }
        customerSequence: { mom: 0, dad: 0 }, // Persistent total counts
        lastDadRequestAmount: 5, // Initial amount for Dad 1 calculation baseline
        customerArrivalTimerId: null,
        customerArrivalTimerDuration: 30, // Initial duration (seconds)
        customerArrivalTimerRemaining: 30, // Time left (seconds)
        lastTickTime: null,
        maxCustomers: 5,
        nameLists: {
            female: [
                "Yasmina", "Hanna", "Jits", "Frida", "Esmeralda", "Gabby", "Bariella", "Elodie", "Noor", 
                "Kiara", "Aisling", "Nia", "Thalia", "Esme", "Freya", "Inaya", "Mireille", 
                "Liora", "Nyla", "Meilin"
            ],
            male: [
                "Jens", "Elias", "Jasper", "Simon", "Victor", "Diego", "Geext", "Barry", "Ivo", 
                "Fank", "Gart", "Elias", "Ravi", "Tarek", "Leif", "Arjun", "Niko", 
                "Caius", "Jalen", "Alistair"
              ]
        },
    },

    // --- DOM Elements ---
    elements: {
        goldDisplay: null, cowsDisplay: null, milkDisplay: null, cowCashDisplay: null,
        factoryFundsDisplay: null, cowCashResourceDisplay: null, factoryFundsResourceDisplay: null,
        cowsCountFarm: null, cowsMilkYield: null, rawMilkCount: null, milkCountFarm: null,
        tapsLeft: null, tapsTotal: null, cowCost: null, rawMilkNeeded: null,
        buyCowButton: null, makeRawMilkButton: null, processMilkButton: null, toggleAutoTapButton: null,
        tabButtons: null, tabPanes: null, tabNav: null,
        lockedSections: {}, lockedHrs: {},
        // Milk Market Elements
        businessTabContent: null,
        customerQueueContainer: null,
        arrivalTimerDisplay: null,
    },

    // --- Initialization ---
    init() {
        console.log("Initializing Kaas: The Return...");
        this.cacheBaseElements();
        this.cacheMilkMarketElements(); // Cache market elements early
        this.cacheUnlockableElements();
        this.addEventListeners();
        this.addMarketEventListenersIfNeeded(); // Add market listeners early (delegation safe)
        this.updateDisplay();
        this.checkUnlocks(); // Apply initial locked states & start market if unlocked
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
        this.elements.toggleAutoTapButton = document.getElementById('toggle-auto-tap-button');
        this.elements.tabButtons = document.querySelectorAll('.tab-button');
        this.elements.tabPanes = document.querySelectorAll('.tab-pane');
        this.elements.tabNav = document.querySelector('.tab-navigation');
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
         console.log("Milk market sell button listener added.");
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

    tapCow() {
        const milkSection = document.getElementById('farm-milk-making');
        if (!milkSection || milkSection.classList.contains('subsection-locked')) {
             return;
        }
        if (this.resources.cows <= 0) return;

        this.production.currentTapsLeft -= this.production.tapsPerClick;

        if (this.production.currentTapsLeft <= 0) {
            const milkGained = this.resources.cows * this.production.milkPerTapCycle;
            this.resources.rawMilk += milkGained;
            // console.log(`Cycle complete! +${milkGained} raw milk.`);
            this.production.currentTapsLeft = this.production.tapsPerCycle + this.production.currentTapsLeft;
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
            this.automation.autoTapIntervalId = setInterval(() => this.tapCow(), this.automation.autoTapSpeedMs);
            console.log(`Auto-tap started (interval: ${this.automation.autoTapSpeedMs}ms).`);
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
            case 0: return 30;   // 30 seconds
            case 1: return 60;   // 1 minute
            case 2: return 120;   // 2 minutes
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
        return roll < 0.75 ? 'mom' : 'dad'; // 75% Mom, 25% Dad
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
             console.log("Cannot generate customer due to type constraints (e.g., 1 Dad and 3 Moms already present).");
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

        this.updateMilkMarketDisplay(); // Update the market queue visually
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
            // For simplicity now, we base on the stored lastDadRequestAmount
            const prevAmount = this.milkMarket.lastDadRequestAmount;
            const roll = Math.random();
            if (roll < 0.40) { // 40% same
                milkRequest = prevAmount;
            } else if (roll < 0.70) { // 30% +5
                milkRequest = prevAmount + 5;
            } else if (roll < 0.90) { // 20% +10
                milkRequest = prevAmount + 10;
            } else { // 10% -5
                milkRequest = prevAmount - 5;
            }
            milkRequest = Math.max(5, milkRequest); // Ensure >= 5
        }
        this.milkMarket.lastDadRequestAmount = milkRequest; // Store for next Dad

        const rewards = {
            coins: 5, // Use 'coins' key matching spec
            cowCash: 5
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


        this.updateDisplay(); // Update resources and potentially button states globally
        this.checkUnlocks(); // Check if gained Cow Cash unlocks anything
        this.updateMilkMarketDisplay(); // Redraw the market queue and timer
    },

    updateMilkMarketDisplay() {
        // Ensure elements are available before attempting to update
        if (!this.elements.customerQueueContainer || !this.elements.arrivalTimerDisplay) {
             // Attempt to cache them again if they were missing (e.g., tab unlocked after init)
             this.cacheMilkMarketElements();
             // If still missing, exit
             if (!this.elements.customerQueueContainer || !this.elements.arrivalTimerDisplay) {
                  // console.log("Milk market UI elements not ready for display.");
                  return;
             }
        }

        // Clear existing queue
        this.elements.customerQueueContainer.innerHTML = '';

        // Render customers
        if (this.milkMarket.customers.length === 0) {
            this.elements.customerQueueContainer.innerHTML = '<p><i>No customers waiting...</i></p>';
        } else {
            this.milkMarket.customers.forEach(customer => {
                const customerDiv = document.createElement('div');
                customerDiv.className = 'customer-entry';
                // customer.domElement = customerDiv; // Storing DOM ref can cause memory leaks if not managed carefully

                const canAfford = this.resources.milk >= customer.milkRequest;
                const customerTypeDisplay = customer.type === 'mom' ? `Milk Mom ${customer.sequenceN}` : `Dairy Dad ${customer.sequenceN}`;
                const rewardString = [
                    customer.rewards.coins > 0 ? `${customer.rewards.coins} Gold` : null,
                    customer.rewards.cowCash > 0 ? `${customer.rewards.cowCash} Cow Cash` : null
                ].filter(Boolean).join(', '); // Filter out nulls and join

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
                this.elements.customerQueueContainer.appendChild(customerDiv);
            });
        }


        // Update Arrival Timer display based on state
        const businessTab = document.querySelector('[data-tab="tab-business"]');
        const marketActive = this.milkMarket.customerArrivalTimerId !== null && businessTab && !businessTab.classList.contains('locked');

        if (!marketActive) {
             // Timer not running (e.g., stopped because tab locked or never started)
             this.elements.arrivalTimerDisplay.textContent = "Market Closed";
        } else if (this.milkMarket.customerArrivalTimerRemaining <= 0 && this.milkMarket.customers.length >= this.milkMarket.maxCustomers) {
            // Timer hit zero, but queue is full
            this.elements.arrivalTimerDisplay.textContent = "Customer Queue Full";
        } else if (this.milkMarket.customerArrivalTimerRemaining <= 0) {
            // Timer hit zero, generation might be pending or failed constraint check
            this.elements.arrivalTimerDisplay.textContent = "Checking for next customer...";
        } else {
            // Timer is actively counting down
            this.elements.arrivalTimerDisplay.textContent = `Next customer in: ${this.formatTime(this.milkMarket.customerArrivalTimerRemaining)}`;
        }
    },

    formatTime(totalSeconds) { // Helper function
        if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60); // Use floor to avoid fractional seconds display
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
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
        this.elements.cowCashResourceDisplay.style.display = (this.resources.cowCash > 0 || upgradesTabUnlocked) ? 'inline' : 'none';
        this.elements.factoryFundsResourceDisplay.style.display = (this.resources.factoryFunds > 0 || factoryTabUnlocked) ? 'inline' : 'none';

        // Update Farm Tab Details
        if (this.elements.cowsCountFarm) this.elements.cowsCountFarm.textContent = this.resources.cows;
        if (this.elements.cowCost) this.elements.cowCost.textContent = this.costs.cow;

        const milkMakingSection = document.getElementById('farm-milk-making');
        const milkMakingUnlocked = milkMakingSection && !milkMakingSection.classList.contains('subsection-locked');

        if (milkMakingUnlocked) {
             if (this.elements.rawMilkCount) this.elements.rawMilkCount.textContent = this.resources.rawMilk;
             if (this.elements.milkCountFarm) this.elements.milkCountFarm.textContent = this.resources.milk;
             if (this.elements.rawMilkNeeded) this.elements.rawMilkNeeded.textContent = this.costs.processMilk;
             if (this.elements.tapsLeft) this.elements.tapsLeft.textContent = Math.max(0, Math.floor(this.production.currentTapsLeft)); // Use floor for display
             if (this.elements.tapsTotal) this.elements.tapsTotal.textContent = this.production.tapsPerCycle;
             if (this.elements.cowsMilkYield) this.elements.cowsMilkYield.textContent = this.resources.cows * this.production.milkPerTapCycle;
        }

        // Update Button States
        if (this.elements.buyCowButton) {
            this.elements.buyCowButton.disabled = this.resources.gold < this.costs.cow;
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
            this.elements.processMilkButton.disabled = !milkMakingUnlocked || this.resources.rawMilk < this.costs.processMilk;
        }

        // Update milk market display (important to call this after resource updates)
        this.updateMilkMarketDisplay();
    },

    switchTab(targetTabId) {
        this.elements.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetTabId));
        this.elements.tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === targetTabId));
        console.log("Switched to tab:", targetTabId);
        // Potentially trigger display update if needed when switching TO a specific tab
         if (targetTabId === 'tab-business') {
             this.updateMilkMarketDisplay(); // Ensure market is up-to-date when viewed
         }
     },

    // --- Unlocking Logic ---
    checkUnlocks() {
        let newlyUnlocked = false; // Track if any unlock happened in this check
        let triggerDisplayUpdate = false; // Track if display needs updating due to unlocks

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

                // Special action for Business Tab unlock
                if (tabId === 'tab-business') {
                    // Ensure elements and listeners are ready (safer to call again)
                    this.cacheMilkMarketElements();
                    this.addMarketEventListenersIfNeeded();
                    this.startMilkMarketLogic(); // Start the market timer
                }
                 // Update resource visibility if relevant tabs are unlocked
                 if (tabId === 'tab-upgrades' || tabId === 'tab-factory') {
                    triggerDisplayUpdate = true;
                 }
            }
            // REMOVED THE 'else if' BLOCK FOR RE-LOCKING TABS HERE
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
                triggerDisplayUpdate = true; // Subsections changing means display update needed

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
                         // If found dynamically, add to cache? Maybe not necessary if IDs are stable.
                         if (!this.elements.lockedHrs[hrId] && hrElement) {
                             this.elements.lockedHrs[hrId] = hrElement; // Add to cache if found dynamically
                         }
                     } else if (hrElement && !hrElement.classList.contains('subsection-hr-locked')) {
                        // Already unlocked, do nothing.
                     } else {
                        // Don't warn if HR element is simply not found for a section
                        // console.warn(`HR element ${hrId} for section ${id} not found or already unlocked.`);
                     }
                 } else {
                     // Don't warn if no HR mapping exists
                     // console.warn(`No HR mapping found for subsection ${id}`);
                 }
            }
             // REMOVED THE 'else if' BLOCK FOR RE-LOCKING SUBSECTIONS HERE
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
        // TODO: Implement saving game state to localStorage
        // Need to save: resources, costs, production (current taps), automation state,
        // milkMarket (customers, sequence, lastDadAmount, timerRemaining, nameIndices)
        alert("Save Game (Not Implemented Yet)");
    },
    loadGame() {
        console.log("Loading game... (STUB)");
        // TODO: Implement loading game state from localStorage
        alert("Load Game (Not Implemented Yet)");
        // After loading, call checkUnlocks() and updateDisplay()
        // Potentially restart timers (auto-tap, market arrival) based on saved state
    },
    resetGame() {
        console.log("Resetting game... (STUB)");
        if (confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
            console.log("Proceeding with reset.");
            // TODO: Implement full game reset
            // Stop timers
            this.stopMilkMarketLogic();
            if (this.automation.isAutoTapping) this.toggleAutoTap(); // Turn off auto-tap
            // Reset resources, costs, market state, etc. to initial values
            // Re-lock tabs and sections
            // Call init() or a dedicated reset function
            alert("Reset Game (Not Implemented Yet - Refresh page for basic reset)");
            // For now, just reload the page for a basic reset
            window.location.reload();
        }
    },
};

document.addEventListener('DOMContentLoaded', () => game.init());

/* --- END OF FILE script.js --- */