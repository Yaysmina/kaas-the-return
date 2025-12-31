import { state } from '../core/GameState.js';
import { COSTS, PRODUCTION } from '../core/Constants.js';

const SAVE_KEY = 'kaas-the-return-save';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export class SaveManager {
    static autosaveIntervalId = null;
    static updateSaveInfoCallback = null;

    /**
     * Serializes the current game state into a saveable object
     */
    static serialize() {
        return {
            version: '0.3.3',
            timestamp: Date.now(),
            resources: {
                gold: state.resources.gold,
                cows: state.resources.cows,
                rawMilk: state.resources.rawMilk,
                milk: state.resources.milk,
                cowCash: state.resources.cowCash,
                factoryFunds: state.resources.factoryFunds
            },
            playstyle: state.playstyle,
            upgrades: {
                cowCost: state.upgrades.cowCost,
                tapReduction: state.upgrades.tapReduction,
                rawMilkReduction: state.upgrades.rawMilkReduction
            },
            internal: {
                tapsLeft: state.internal.tapsLeft,
                lastTick: state.internal.lastTick
            },
            automation: {
                isAutoTapping: state.automation.isAutoTapping
            },
            market: {
                customers: state.market.customers,
                timerRemaining: state.market.timerRemaining,
                timerDuration: state.market.timerDuration,
                dadSequence: state.market.dadSequence,
                momSequence: state.market.momSequence,
                lastDadRequest: state.market.lastDadRequest
            }
        };
    }

    /**
     * Deserializes saved data and applies it to the game state
     */
    static deserialize(data) {
        if (!data || !data.version) {
            console.warn('Invalid save data');
            return { success: false };
        }

        try {
            // Resources
            if (data.resources) {
                state.resources.gold = data.resources.gold || 0;
                state.resources.cows = data.resources.cows || 0;
                state.resources.rawMilk = data.resources.rawMilk || 0;
                state.resources.milk = data.resources.milk || 0;
                state.resources.cowCash = data.resources.cowCash || 0;
                state.resources.factoryFunds = data.resources.factoryFunds || 0;
            }

            // Playstyle
            if (data.playstyle) {
                state.playstyle = data.playstyle;
            }

            // Upgrades
            if (data.upgrades) {
                state.upgrades.cowCost = data.upgrades.cowCost || 0;
                state.upgrades.tapReduction = data.upgrades.tapReduction || 0;
                state.upgrades.rawMilkReduction = data.upgrades.rawMilkReduction || 0;
            }

            // Internal state
            if (data.internal) {
                state.internal.tapsLeft = data.internal.tapsLeft || PRODUCTION.BASE_TAPS_PER_CYCLE;
                state.internal.lastTick = data.internal.lastTick || Date.now();
            }

            // Automation (don't restore intervalId or isAutoTapping state - will be restarted manually if needed)
            // Clear any existing automation
            if (state.automation.intervalId) {
                clearInterval(state.automation.intervalId);
            }
            state.automation.isAutoTapping = false;
            state.automation.intervalId = null;
            
            // Store whether auto-tapping was enabled for manual restart
            const wasAutoTapping = data.automation?.isAutoTapping || false;

            // Market
            if (data.market) {
                state.market.customers = data.market.customers || [];
                state.market.timerRemaining = data.market.timerRemaining || 0;
                state.market.timerDuration = data.market.timerDuration || 0;
                state.market.dadSequence = data.market.dadSequence || 0;
                state.market.momSequence = data.market.momSequence || 0;
                state.market.lastDadRequest = data.market.lastDadRequest || 0;
            }

            console.log('Game loaded successfully');
            return { success: true, wasAutoTapping };
        } catch (error) {
            console.error('Error deserializing save data:', error);
            return { success: false };
        }
    }

    /**
     * Saves the current game state to localStorage
     */
    static save() {
        try {
            const saveData = this.serialize();
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            console.log('Game saved successfully');
            // Update save info display if callback is set
            if (this.updateSaveInfoCallback) {
                this.updateSaveInfoCallback();
            }
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    /**
     * Loads the game state from localStorage
     */
    static load() {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (!savedData) {
                console.log('No save data found');
                return { success: false };
            }

            const data = JSON.parse(savedData);
            return this.deserialize(data);
        } catch (error) {
            console.error('Error loading game:', error);
            return { success: false };
        }
    }

    /**
     * Checks if a save exists
     */
    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    /**
     * Gets save metadata without loading the full save
     */
    static getSaveInfo() {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (!savedData) return null;

            const data = JSON.parse(savedData);
            // Count total upgrade levels
            const upgrades = data.upgrades || {};
            const totalUpgrades = (upgrades.cowCost || 0) + (upgrades.tapReduction || 0) + (upgrades.rawMilkReduction || 0);
            
            return {
                version: data.version,
                timestamp: data.timestamp,
                playstyle: data.playstyle,
                cows: data.resources?.cows || 0,
                totalUpgrades: totalUpgrades
            };
        } catch (error) {
            console.error('Error reading save info:', error);
            return null;
        }
    }

    /**
     * Deletes the saved game
     */
    static deleteSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
            console.log('Save deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            return false;
        }
    }

    /**
     * Resets the game to initial state
     */
    static resetGame() {
        // Reset resources
        state.resources.gold = 25;
        state.resources.cows = 0;
        state.resources.rawMilk = 0;
        state.resources.milk = 0;
        state.resources.cowCash = 0;
        state.resources.factoryFunds = 0;

        // Reset playstyle
        state.playstyle = null;

        // Reset internal state
        state.internal.tapsLeft = PRODUCTION.BASE_TAPS_PER_CYCLE;
        state.internal.lastTick = Date.now();

        // Reset upgrades
        state.upgrades.cowCost = 0;
        state.upgrades.tapReduction = 0;
        state.upgrades.rawMilkReduction = 0;

        // Reset automation
        if (state.automation.intervalId) {
            clearInterval(state.automation.intervalId);
        }
        state.automation.isAutoTapping = false;
        state.automation.intervalId = null;

        // Reset market
        state.market.customers = [];
        state.market.timerRemaining = 0;
        state.market.timerDuration = 0;
        state.market.dadSequence = 0;
        state.market.momSequence = 0;
        state.market.lastDadRequest = 0;

        console.log('Game reset to initial state');
    }

    /**
     * Sets the callback function to update save info display
     */
    static setUpdateSaveInfoCallback(callback) {
        this.updateSaveInfoCallback = callback;
    }

    /**
     * Starts autosave with the specified interval
     */
    static startAutosave() {
        if (this.autosaveIntervalId) {
            clearInterval(this.autosaveIntervalId);
        }

        this.autosaveIntervalId = setInterval(() => {
            if (this.save()) {
                this.showNotification('Game autosaved');
                // Update save info display if callback is set
                if (this.updateSaveInfoCallback) {
                    this.updateSaveInfoCallback();
                }
            }
        }, AUTOSAVE_INTERVAL);

        console.log('Autosave started (30s interval)');
    }

    /**
     * Stops autosave
     */
    static stopAutosave() {
        if (this.autosaveIntervalId) {
            clearInterval(this.autosaveIntervalId);
            this.autosaveIntervalId = null;
            console.log('Autosave stopped');
        }
    }

    /**
     * Checks if autosave is currently enabled
     */
    static isAutosaveEnabled() {
        return this.autosaveIntervalId !== null;
    }

    /**
     * Shows a temporary notification to the user
     */
    static showNotification(message, duration = 2000) {
        // Remove existing notification if any
        const existing = document.getElementById('save-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'save-notification';
        notification.className = 'save-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

