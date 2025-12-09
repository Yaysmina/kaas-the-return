import { state } from './core/GameState.js';
import { ResourceManager } from './managers/ResourceManager.js';
import { ProductionManager } from './managers/ProductionManager.js';
import { MarketManager } from './managers/MarketManager.js';
import { UnlockManager } from './managers/UnlockManager.js';
import { UIManager } from './ui/UIManager.js';
import { Components } from './ui/Components.js';

const ui = new UIManager();

// Event Bindings
document.getElementById('buy-cow-button').onclick = () => ResourceManager.buyCow();
document.getElementById('make-raw-milk-button').onclick = () => ProductionManager.tap(true);
document.getElementById('toggle-auto-tap-button').onclick = () => ProductionManager.toggleAutoTap();
document.getElementById('process-milk-button').onclick = () => ProductionManager.processMilk();
document.getElementById('process-all-milk-button').onclick = () => ProductionManager.processMilk(true);

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

    // Check Playstyle
    if (!state.playstyle) {
        Components.showPlaystyleModal((selectedStyle) => {
            state.playstyle = selectedStyle;
            const display = document.getElementById('playstyle-display');
            if(display) {
                display.textContent = `Playstyle: ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}`;
            }
            // Start Loop
            requestAnimationFrame(gameLoop);
        });
    } else {
        requestAnimationFrame(gameLoop);
    }
});