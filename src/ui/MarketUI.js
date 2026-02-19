import { state } from '../core/GameState.js';
import { MarketManager } from '../managers/MarketManager.js';
import { formatTime } from '../core/Utils.js';
import { MARKET } from '../core/Constants.js';
import { parseEmojis, parseEmojisInText } from '../core/EmojiUtils.js';

// --- State Cache ---
let _lastTimerText = "";
let _lastCustomerSignature = null; 
let _lastMilkCount = -1;

export function updateMarketUI() {
    const queueDiv = document.getElementById('customer-queue');
    const businessTab = document.querySelector('[data-tab="tab-business"]');

    // 1. GENERATE SIGNATURE
    const currentSignature = state.market.customers.map(c => c.id).join(',');

    // 2. REBUILD GRID (Only if customers changed)
    if (currentSignature !== _lastCustomerSignature) {
        queueDiv.innerHTML = ''; 

        // A. Render Customers
        state.market.customers.forEach((c) => {
            const div = document.createElement('div');
            div.className = 'customer-entry';

            const rewardHtml = `
                ${c.rewardGold > 0 ? `<div class="reward-row"><span>Gives</span><span>${c.rewardGold}🪙</span></div>` : ''}
                ${c.rewardCowCash > 0 ? `<div class="reward-row"><span>Gives</span><span>${c.rewardCowCash}💵</span></div>` : ''}
            `;

            div.innerHTML = `
                <div class="customer-header">
                    <strong class="customer-name">${c.name}</strong>
                    <span class="customer-type-badge">${c.type}</span>
                </div>
                <div class="customer-rewards">
                    ${rewardHtml}
                </div>
            `;
            parseEmojis(div);

            const btn = document.createElement('button');
            btn.className = 'action sell-milk-button secondary';
            btn.innerHTML = parseEmojisInText(`Sell ${c.request}🥛`);
            btn.dataset.cost = c.request; 
            btn.dataset.id = c.id;
            btn.disabled = state.resources.milk < c.request;
            
            btn.onclick = () => { MarketManager.sell(c.id); };
            
            div.appendChild(btn);
            queueDiv.appendChild(div);
        });

        // B. Render Timer Slot
        if (state.market.customers.length < MARKET.MAX_CUSTOMERS) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'customer-entry timer-slot';
            timerDiv.id = 'market-timer-slot';
            queueDiv.appendChild(timerDiv);
        }
        
        _lastCustomerSignature = currentSignature;
        _lastMilkCount = -1; 
        _lastTimerText = null; 
    }

    // 3. UPDATE TIMER TEXT
    const timerSlot = document.getElementById('market-timer-slot');
    if (timerSlot) {
        let currentTimerText = "";
        if (!businessTab || businessTab.classList.contains('locked')) {
            currentTimerText = "Market Closed";
        } else if (state.market.timerRemaining <= 0) {
            currentTimerText = "New customer arriving...";
        } else {
            currentTimerText = `
                <div class="timer-label">Next customer in:</div>
                <div class="timer-countdown">${formatTime(state.market.timerRemaining)}</div>
            `;
        }

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
            if (btn.disabled === canAfford) {
                btn.disabled = !canAfford;
            }
        });
        _lastMilkCount = state.resources.milk;
    }
}