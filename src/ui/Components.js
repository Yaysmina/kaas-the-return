export const Components = {
    /**
     * Creates a generic modal overlay.
     * @param {string} id - Unique ID for the modal
     * @param {string} innerHTML - The content inside the modal
     */
    createModal(id, innerHTML) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        // Inline styles for the overlay to ensure it works immediately
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; 
            justify-content: center; align-items: center; z-index: 9999;
        `;
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = `
            background: #fff; padding: 30px; border-radius: 8px; 
            text-align: center; max-width: 500px; width: 90%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        content.innerHTML = innerHTML;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        return modal;
    },

    /**
     * Specific component for the Playstyle Selection.
     * @param {Function} onSelect - Callback function(styleString)
     */
    showPlaystyleModal(onSelect) {
        const html = `
            <h2 style="margin-bottom: 15px; color: #333;">Choose Your Path</h2>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="color: #4CAF50;">Active Playstyle</h3>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                    Your manual clicks are <strong>x2 more effective</strong>.
                </p>
                <button class="action" id="comp-select-active" style="width: 100%;">Select Active</button>
            </div>

            <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="color: #5bc0de;">Passive Playstyle</h3>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                    Auto-Tap works <strong>x2 faster</strong>.
                </p>
                <button class="action" id="comp-select-passive" style="width: 100%; background-color: #5bc0de;">Select Passive</button>
            </div>
            
            <p style="font-size: 0.8em; color: #999; font-style: italic;">
                You can change this later in Settings (Coming Soon).
            </p>
        `;

        const modal = this.createModal('playstyle-modal', html);

        // Attach listeners
        const handleSelection = (style) => {
            onSelect(style);
            document.body.removeChild(modal);
        };

        modal.querySelector('#comp-select-active').onclick = () => handleSelection('active');
        modal.querySelector('#comp-select-passive').onclick = () => handleSelection('passive');
    }
};