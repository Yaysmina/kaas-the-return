import { state } from '../core/GameState.js';
import { MarketManager } from '../managers/MarketManager.js';
import { formatTime } from '../core/Utils.js';
import { MARKET } from '../core/Constants.js';

// --- State Cache (Module Level) ---
let _lastTimerText = "";
let _lastCustomerSignature = ""; 
let _lastMilkCount = -1;

export function updateMarketUI() {
    const queueDiv = document.getElementById('customer-queue');
    const timerDisplay = document.getElementById('arrival-timer-display');
    const businessTab = document.querySelector('[data-tab="tab-business"]');

    // --- 1. OPTIMIZED TIMER UPDATE ---
    let currentTimerText = "";
    
    // Determine what the text SHOULD be
    if (!businessTab || businessTab.classList.contains('locked')) {
        currentTimerText = "Market Closed";
    } else if (state.market.customers.length >= MARKET.MAX_CUSTOMERS) {
        currentTimerText = "Customer Queue Full";
    } else if (state.market.timerRemaining <= 0) {
        currentTimerText = "Checking for next customer...";
    } else {
        // We look at the integer value. If it goes 5.9 -> 5.1, text doesn't change. 
        // 5.1 -> 4.9, text changes.
        currentTimerText = `Next customer in: ${formatTime(state.market.timerRemaining)}`;
    }

    // Only touch the DOM if the text is different from the last frame
    if (currentTimerText !== _lastTimerText) {
        timerDisplay.textContent = currentTimerText;
        _lastTimerText = currentTimerText;
    }

    // --- 2. OPTIMIZED LIST RENDERING ---
    // Create a unique "signature" for the list based on customer IDs. 
    // If a customer is added or removed, this string changes.
    const currentSignature = state.market.customers.map(c => c.id).join(',');

    // Only rebuild innerHTML if the list structure changed
    if (currentSignature !== _lastCustomerSignature) {
        
        if (state.market.customers.length === 0) {
            queueDiv.innerHTML = '<p><i>No customers waiting...</i></p>';
        } else {
            queueDiv.innerHTML = ''; // Clear

            state.market.customers.forEach((c) => {
                const div = document.createElement('div');
                div.className = 'customer-entry';

                // Reward text logic
                const rewardText = [
                    c.rewardGold > 0 ? `${c.rewardGold} Gold` : null,
                    c.rewardCowCash > 0 ? `${c.rewardCowCash} Cow Cash` : null
                ].filter(Boolean).join(', ');

                div.innerHTML = `
                    <p>
                        <strong>${c.type} ${c.sequence} (${c.name})</strong><br>
                        Requests: ${c.request} Milk<br>
                        Rewards: ${rewardText}
                    </p>
                `;

                const btn = document.createElement('button');
                btn.className = 'action sell-milk-button';
                btn.textContent = `Sell ${c.request} Milk`;
                // Store the cost on the button element so we can check it later without re-finding the customer object
                btn.dataset.cost = c.request; 
                btn.dataset.id = c.id;
                
                // Initial check for disabled state
                btn.disabled = state.resources.milk < c.request;
                
                btn.onclick = () => {
                    MarketManager.sell(c.id);
                    // Force an immediate UI update request implies we don't wait for next frame
                    // But usually the next game loop frame handles it fine.
                };
                
                div.appendChild(btn);

                const hr = document.createElement('hr');
                hr.className = 'customer-hr';
                div.appendChild(hr);

                queueDiv.appendChild(div);
            });
        }
        
        // Update our cache
        _lastCustomerSignature = currentSignature;
        // Reset milk cache to ensure buttons get checked immediately after a rebuild
        _lastMilkCount = -1; 
    }

    // --- 3. OPTIMIZED BUTTON STATE UPDATE ---
    // Even if the list structure didn't change (no new customers), 
    // the player might have tapped enough milk to afford a current customer.
    // We only need to update the button 'disabled' property, NOT rebuild the HTML.
    
    if (state.resources.milk !== _lastMilkCount) {
        // Only loop through buttons if milk amount actually changed
        const buttons = queueDiv.querySelectorAll('.sell-milk-button');
        
        buttons.forEach(btn => {
            const cost = parseInt(btn.dataset.cost, 10);
            const canAfford = state.resources.milk >= cost;
            
            // Only toggle class/prop if necessary to minimize DOM flow
            if (btn.disabled === canAfford) {
                btn.disabled = !canAfford;
            }
        });

        _lastMilkCount = state.resources.milk;
    }
}