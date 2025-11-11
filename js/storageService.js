const HISTORY_KEY = 'goug-chat-history';
const API_KEY = 'goug-api-key';

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
 * Saves the user's API key to localStorage.
 * @param {string} key - The API key.
 */
export function saveApiKey(key) {
    try {
        localStorage.setItem(API_KEY, key);
    } catch (e) {
        console.error("Failed to save API key:", e);
    }
}

/**
 * Loads the user's API key from localStorage.
 * @returns {string|null} The API key or null if not found.
 */
export function loadApiKey() {
    return localStorage.getItem(API_KEY);
}
