import { state } from './core/GameState.js';
import { ResourceManager } from './managers/ResourceManager.js';
import { ProductionManager } from './managers/ProductionManager.js';
import { MarketManager } from './managers/MarketManager.js';
import { UnlockManager } from './managers/UnlockManager.js';
import { SaveManager } from './managers/SaveManager.js';
import { UIManager } from './ui/UIManager.js';
import { parseAllEmojis } from './core/EmojiUtils.js';

const ui = new UIManager();

// Event Bindings
document.getElementById('buy-cow-button').onclick = () => ResourceManager.buyCow();
document.getElementById('make-raw-milk-button').onclick = () => ProductionManager.tap(true);
document.getElementById('toggle-auto-tap-button').onclick = () => ProductionManager.toggleAutoTap();
document.getElementById('process-milk-button').onclick = () => ProductionManager.processMilk();
document.getElementById('process-all-milk-button').onclick = () => ProductionManager.processMilk(true);

// Save/Load Event Bindings
document.getElementById('btn-save').onclick = () => {
    if (SaveManager.save()) {
        SaveManager.showNotification('Game saved successfully! ✓');
        // updateSaveInfo() is now called automatically by SaveManager.save()
    } else {
        SaveManager.showNotification('Failed to save game ✗');
    }
};

document.getElementById('btn-load').onclick = () => {
    if (!SaveManager.hasSave()) {
        SaveManager.showNotification('No save file found');
        return;
    }
    
    if (confirm('Load saved game? Any unsaved progress will be lost.')) {
        const result = SaveManager.load();
        if (result.success) {
            SaveManager.showNotification('Game loaded successfully! ✓');
            updateSaveInfo();
            // Restart auto-tap if it was enabled
            if (result.wasAutoTapping) {
                ProductionManager.toggleAutoTap();
            }
        } else {
            SaveManager.showNotification('Failed to load game ✗');
        }
    }
};

document.getElementById('btn-toggle-autosave').onclick = () => {
    const btn = document.getElementById('btn-toggle-autosave');
    if (SaveManager.isAutosaveEnabled()) {
        SaveManager.stopAutosave();
        btn.textContent = '🔄 Enable Autosave (30s)';
        btn.classList.remove('autosave-enabled');
        SaveManager.showNotification('Autosave disabled');
    } else {
        SaveManager.startAutosave();
        btn.textContent = '⏸️ Disable Autosave';
        btn.classList.add('autosave-enabled');
        SaveManager.showNotification('Autosave enabled (30s interval)');
    }
};

document.getElementById('btn-delete-progress').onclick = () => {
    if (!SaveManager.hasSave()) {
        SaveManager.showNotification('No save file to delete');
        return;
    }

    if (confirm('⚠️ WARNING ⚠️\n\nThis will permanently delete your saved game!\n\nAre you absolutely sure?')) {
        if (SaveManager.deleteSave()) {
            SaveManager.showNotification('Save deleted successfully');
            updateSaveInfo();
            location.reload();
        } else {
            SaveManager.showNotification('Failed to delete save');
        }
    }
};

// Update save info display
function updateSaveInfo() {
    const saveInfo = SaveManager.getSaveInfo();
    const container = document.getElementById('save-info');
    
    if (saveInfo) {
        const date = new Date(saveInfo.timestamp);
        container.innerHTML = `
            <p><strong>Last Save:</strong> ${date.toLocaleString()}</p>
            <p><strong>Progress:</strong> ${saveInfo.cows} 🐄, ${saveInfo.totalUpgrades} upgrades</p>
        `;
    } else {
        container.innerHTML = '<p><em>No save file found</em></p>';
    }
}


// Game Loop - Performance Fix
let lastTime = Date.now();

function gameLoop() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // 1. Logic Updates
    MarketManager.tick(dt);
    UnlockManager.processUnlocks();
    
    // 2. UI Render - Running this in requestAnimationFrame ensures smooth 60fps
    // Visuals will update instantly as values change.
    ui.update();

    requestAnimationFrame(gameLoop);
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log("Kaas: The Return started");

    // Parse all emojis in static HTML content
    // Wait a tick to ensure Twemoji script has loaded
    setTimeout(() => {
        parseAllEmojis();
    }, 0);

    // Try to load saved game
    const hasSave = SaveManager.hasSave();
    if (hasSave) {
        const saveInfo = SaveManager.getSaveInfo();
        if (saveInfo && confirm(`Load saved game?\n\nLast played: ${new Date(saveInfo.timestamp).toLocaleString()}\nProgress: ${saveInfo.cows} cows, ${saveInfo.totalUpgrades} upgrades`)) {
            const result = SaveManager.load();
            // Restart auto-tap if it was enabled
            if (result.success && result.wasAutoTapping) {
                ProductionManager.toggleAutoTap();
            }
        }
    }

    // Register callback for save info updates (must be before starting autosave)
    SaveManager.setUpdateSaveInfoCallback(updateSaveInfo);
    
    // Enable autosave by default
    SaveManager.startAutosave();
    const autosaveBtn = document.getElementById('btn-toggle-autosave');
    autosaveBtn.textContent = '⏸️ Disable Autosave';
    autosaveBtn.classList.add('autosave-enabled');

    // Update save info display
    updateSaveInfo();

    // Start Loop immediately (no playstyle selection needed)
    requestAnimationFrame(gameLoop);
});