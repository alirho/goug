import ChatEngine from './chatEngine.js';
import ChatUI from './chatUI.js';

/**
 * Initializes the application when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Instantiate the core logic and the UI handler
    const chatEngine = new ChatEngine();
    const chatUI = new ChatUI(chatEngine);

    // Initialize both components
    chatUI.init();
    chatEngine.init();
});
