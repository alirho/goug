const CHATS_KEY = 'goug-all-chats';
const SETTINGS_KEY = 'goug-chat-settings';

/**
 * Saves the entire array of chat objects to localStorage.
 * @param {Array<object>} chats - The array of chat objects.
 */
export function saveAllChats(chats) {
    try {
        localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
        console.error("Failed to save chats to storage:", e);
    }
}

/**
 * Loads all chat objects from localStorage.
 * @returns {Array<object>} The array of chats or an empty array if none are found.
 */
export function loadAllChats() {
    try {
        const saved = localStorage.getItem(CHATS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load chats from storage:", e);
        return [];
    }
}

/**
 * Saves the user's settings to localStorage.
 * @param {object} settings - The settings object.
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
}

/**
 * Loads the user's settings from localStorage.
 * @returns {object|null} The settings object or null if not found.
 */
export function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Failed to load settings from storage:", e);
        return null;
    }
}