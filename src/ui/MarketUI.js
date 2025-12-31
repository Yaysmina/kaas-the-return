import { state } from '../core/GameState.js';
import { MarketManager } from '../managers/MarketManager.js';
import { formatTime } from '../core/Utils.js';
import { MARKET } from '../core/Constants.js';
import { parseEmojis, parseEmojisInText } from '../core/EmojiUtils.js';

// --- State Cache ---
let _lastTimerText = "";
let _lastCustomerSignature = null; // Set to null to ensure initial render
let _lastMilkCount = -1;

export function updateMarketUI() {
    const queueDiv = document.getElementById('customer-queue');
    const businessTab = document.querySelector('[data-tab="tab-business"]');

    // 1. GENERATE SIGNATURE
    // We include the queue length in signature to trigger a rebuild if a customer leaves
    const currentSignature = state.market.customers.map(c => c.id).join(',');

    // 2. REBUILD GRID (Only if customers changed)
    if (currentSignature !== _lastCustomerSignature) {
        queueDiv.innerHTML = ''; 

        // A. Render Customers
        state.market.customers.forEach((c) => {
            const div = document.createElement('div');
            div.className = 'customer-entry';

            const rewardText = [
                c.rewardGold > 0 ? `Gives ${c.rewardGold}🪙` : null,
                c.rewardCowCash > 0 ? `Gives ${c.rewardCowCash}💵` : null
            ].filter(Boolean).join('<br>');

            div.innerHTML = `
                <p>
                    <strong>(${c.type}) ${c.name}</strong><br>
                    ${rewardText}
                </p>
            `;
            parseEmojis(div);

            const btn = document.createElement('button');
            btn.className = 'action sell-milk-button';
            btn.innerHTML = parseEmojisInText(`Sell ${c.request}🥛`);
            btn.dataset.cost = c.request; 
            btn.dataset.id = c.id;
            // Check affordability immediately
            btn.disabled = state.resources.milk < c.request;
            
            btn.onclick = () => { MarketManager.sell(c.id); };
            
            div.appendChild(btn);
            queueDiv.appendChild(div);
        });

        // B. Render Timer Slot (If there is space)
        if (state.market.customers.length < MARKET.MAX_CUSTOMERS) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'customer-entry timer-slot';
            timerDiv.id = 'market-timer-slot'; // ID to find it easily later
            timerDiv.innerHTML = ''; // Keep empty initially to avoid flashing text
            queueDiv.appendChild(timerDiv);
        }
        
        _lastCustomerSignature = currentSignature;
        _lastMilkCount = -1; // Reset button cache
        _lastTimerText = null; // Force the timer text to update immediately
    }

    // 3. UPDATE TIMER TEXT (Every Frame)
    const timerSlot = document.getElementById('market-timer-slot');
    
    if (timerSlot) {
        let currentTimerText = "";
        
        if (!businessTab || businessTab.classList.contains('locked')) {
            currentTimerText = "Market Closed";
        } else if (state.market.timerRemaining <= 0) {
            currentTimerText = "New customer arriving...";
        } else {
            // Only update logic is needed here, rendering happens below if changed
            currentTimerText = `Next customer in:<br><span style="font-size:1.2em">${formatTime(state.market.timerRemaining)}</span>`;
        }

        // If text changed (or forced by null reset above), update DOM
        if (currentTimerText !== _lastTimerText) {
            timerSlot.innerHTML = currentTimerText;
            parseEmojis(timerSlot);
            _lastTimerText = currentTimerText;
        }
    }

    // 4. UPDATE BUTTONS (Milk Affordability)
    if (state.resources.milk !== _lastMilkCount) {
        const buttons = queueDiv.querySelectorAll('.sell-milk-button');
        buttons.forEach(btn => {
            const cost = parseInt(btn.dataset.cost, 10);
            const canAfford = state.resources.milk >= cost;
            // Only touch DOM if state is actually different
            if (btn.disabled === canAfford) {
                btn.disabled = !canAfford;
            }
        });
        _lastMilkCount = state.resources.milk;
    }
}