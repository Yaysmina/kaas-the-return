import { state } from '../core/GameState.js';
import { DEV_CHEATS, MARKET } from '../core/Constants.js';
import { FEMALE_NAMES, MALE_NAMES } from '../data/NamesData.js';
import { generateId } from '../core/Utils.js';

export class MarketManager {
    static tick(deltaTimeSeconds) {
        // 1. UNLOCK CHECK
        const businessTabBtn = document.querySelector('button[data-tab="tab-business"]');

        // If the button doesn't exist (safety) or still has 'locked', stop logic.
        if (!businessTabBtn || businessTabBtn.classList.contains('locked')) {
            return;
        }

        // 2. TIMER LOGIC
        if (state.market.timerRemaining > 0) {
            state.market.timerRemaining -= deltaTimeSeconds * DEV_CHEATS.MARKET_SPEED;
            
            // Did the timer just finish?
            if (state.market.timerRemaining <= 0) {
                // If we have space, generate immediately
                if (state.market.customers.length < MARKET.MAX_CUSTOMERS) {
                    this.generateCustomer();
                }
                // If queue is full, timer stays at 0 (paused) until space opens
            }
        } 
        else if (state.market.customers.length < MARKET.MAX_CUSTOMERS) {
            // Case: Timer is 0 or uninitialized, AND we have space.
            // This block kickstarts the system the moment the tab unlocks.
            this.resetTimer();
        }
    }

    static resetTimer() {
        const count = state.market.customers.length;
        if (count >= MARKET.MAX_CUSTOMERS) return;

        let duration = MARKET.BASE_ARRIVAL_TIME * Math.pow(2, count);
        
        state.market.timerDuration = duration;
        state.market.timerRemaining = duration;
    }

    static generateCustomer() {
        // Get customer counts
        const customerCount = state.market.customers.length;
        const momCount = state.market.customers.filter(c => c.type === 'Mom').length;
        const dadCount = state.market.customers.filter(c => c.type === 'Dad').length;

        if (customerCount >= MARKET.MAX_CUSTOMERS) return;
        
        var customer;

        // If there are only milk moms and at least 2, next will be a dad
        if (momCount === customerCount && customerCount >= 2) {
            customer = this.createDad();
        }
        // If there are only dads and at least 1, next will be a mom
        else if (dadCount === customerCount && customerCount >= 1) {
            customer = this.createMom();
        }
        // Otherwise, next customer will be randomly determined
        else {
            const isMom = Math.random() > 0.3; // 70% chance for Mom
            customer = isMom ? this.createMom() : this.createDad();
        }
        
        state.market.customers.push(customer);
        
        // Immediately start timer for the *next* customer
        this.resetTimer();
    }

    static createMom() {
        state.market.momSequence++;
        const name = FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];
        // The n-th mom will request a random amount between n and 2*n
        const baseReq = Math.round(Math.random() * state.market.momSequence) + state.market.momSequence;
        
        // If there are already 5 or more milk moms generated, add +(generated-5) to the cost
        let req = baseReq;
        if (state.market.momSequence >= 5) {
            req += (state.market.momSequence - 5);
        }
        
        return {
            id: generateId('mom'),
            type: 'Mom',
            name,
            sequence: state.market.momSequence,
            request: req,
            rewardGold: 10 + baseReq,
            rewardCowCash: 1
        };
    }

static createDad() {
    const { market } = state;
    market.dadSequence++;

    const name = MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)];
    const dadCount = market.customers.filter(c => c.type === 'Dad').length;
    
    let req = market.lastDadRequest;

    if (req === 0) {
        req = 5;
    } else {
        // Calculate how many +5 increments to add
        // 60% base + 5% per existing dad
        const chanceMultiplier = (60 + (5 * dadCount)) / 100; 
        
        const guaranteedIncrements = Math.floor(chanceMultiplier);
        const extraRoll = Math.random() < (chanceMultiplier % 1) ? 1 : 0;
        
        req += (guaranteedIncrements + extraRoll) * 5;
    }

    market.lastDadRequest = req;

    // Both rewards follow the same formula
    const reward = 4 + (req / 5);

    return {
        id: generateId('dad'),
        type: 'Dad',
        name,
        sequence: market.dadSequence,
        request: req,
        rewardGold: reward,
        rewardCowCash: reward
    };
}

    static sell(customerId) {
        const idx = state.market.customers.findIndex(c => c.id === customerId);
        if (idx === -1) return;
        
        const customer = state.market.customers[idx];
        
        if (state.resources.milk >= customer.request) {
            // Transaction
            state.resources.milk -= customer.request;
            state.resources.gold += customer.rewardGold;
            state.resources.cowCash += customer.rewardCowCash;
            
            // Remove customer
            state.market.customers.splice(idx, 1);

            // The time left will be capped at the duration if there'd be ONE MORE customer
            const timerIfOneMore = MARKET.BASE_ARRIVAL_TIME * Math.pow(2, state.market.customers.length + 1);
            if (state.market.timerRemaining > timerIfOneMore) {
                state.market.timerRemaining = timerIfOneMore;
            }
            
            // If timer was stuck at 0 because queue was full, kickstart it now
            if (state.market.timerRemaining <= 0) {
                this.resetTimer(); 
            }
        }
    }
}