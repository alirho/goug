// JSDoc Type Imports
/** @typedef {import('../types.js').StorageAdapter} StorageAdapter */

/**
 * An in-memory storage implementation that mimics the storageService API.
 * Useful for environments without IndexedDB or for testing.
 */

let settings = null;
const chats = new Map();

/**
 * تنظیمات کاربر را از حافظه موقت بارگذاری می‌کند.
 * @type {StorageAdapter['loadSettings']}
 */
export async function loadSettings() {
    return settings;
}

/**
 * تنظیمات کاربر را در حافظه موقت ذخیره می‌کند.
 * @type {StorageAdapter['saveSettings']}
 */
export async function saveSettings(newSettings) {
    settings = newSettings;
}

/**
 * تمام چت‌ها را از حافظه موقت بارگذاری می‌کند.
 * @type {StorageAdapter['loadAllChats']}
 */
export async function loadAllChats() {
    return Array.from(chats.values());
}

/**
 * یک آبجکت چت را در حافظه موقت ذخیره یا به‌روزرسانی می‌کند.
 * @type {StorageAdapter['saveChat']}
 */
export async function saveChat(chat) {
    // Clone to prevent mutation issues, mimicking database behavior
    chats.set(chat.id, JSON.parse(JSON.stringify(chat)));
}

/**
 * یک چت را با شناسه آن از حافظه موقت حذف می‌کند.
 * @type {StorageAdapter['deleteChatById']}
 */
export async function deleteChatById(chatId) {
    chats.delete(chatId);
}
