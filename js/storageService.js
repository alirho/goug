const HISTORY_KEY = 'goug-chat-history';
const SETTINGS_KEY = 'goug-chat-settings';

/**
 * Saves the chat messages to localStorage.
 * @param {Array<object>} messages - The array of message objects.
 */
export function saveMessages(messages) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch (e) {
        console.error("Failed to save messages to storage:", e);
    }
}

/**
 * Loads chat messages from localStorage.
 * @returns {Array<object>} The array of messages or an empty array if none are found.
 */
export function loadMessages() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load messages from storage:", e);
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