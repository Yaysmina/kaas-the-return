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
    }
};