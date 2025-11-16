import EventEmitter from './eventEmitter.js';
import * as MemoryStorage from '../services/memoryStorage.js';
import { SYNC_CONFIG, VALIDATION_LIMITS, STORAGE_CONFIG } from '../utils/constants.js';

// JSDoc Type Imports
/** @typedef {import('../types.js').Settings} Settings */
/** @typedef {import('../types.js').Chat} Chat */
/** @typedef {import('../types.js').Message} Message */
/** @typedef {import('../types.js').ImageData} ImageData */
/** @typedef {import('../types.js').StorageAdapter} StorageAdapter */
/** @typedef {import('../types.js').ProviderHandler} ProviderHandler */

/**
 * Generates a unique ID for a message.
 * @returns {string} The unique message ID.
 */
function generateMessageId() {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `msg_${timestamp}_${randomPart}`;
}

/**
 * موتور اصلی برنامه که وضعیت گفتگوها، ارتباط با ارائه‌دهندگان و ذخیره‌سازی را مدیریت می‌کند.
 * @extends {EventEmitter}
 */
class ChatEngine extends EventEmitter {
    /**
     * @param {object} [options] - Configuration options.
     * @param {StorageAdapter} [options.storage] - یک آداپتور ذخیره‌سازی که رابط StorageAdapter را پیاده‌سازی می‌کند.
     * @param {Object.<string, ProviderHandler>} [options.providers] - یک map از نام ارائه‌دهندگان به توابع مدیریت‌کننده آن‌ها.
     */
    constructor(options = {}) {
        super();
        /** @type {Array<Chat>} */
        this.chats = [];
        /** @type {string | null} */
        this.activeChatId = null;
        /** @type {boolean} */
        this.isLoading = false;
        /** @type {Settings | null} */
        this.settings = null;
        /** @type {BroadcastChannel | null} */
        this.syncChannel = null;
        /** @type {StorageAdapter} */
        this.storage = options.storage || MemoryStorage;
        /** @type {Array<Chat>} */
        this.unsavedChats = [];
        /** @type {number | null} */
        this.unsavedRetryInterval = null;
        /** @type {Map<string, ProviderHandler>} */
        this.providers = new Map();

        if (options.providers) {
            for (const name in options.providers) {
                this.registerProvider(name, options.providers[name]);
            }
        }
    }

    /**
     * یک ارائه‌دهنده (Provider) جدید را در موتور ثبت می‌کند.
     * @param {string} name - نام ارائه‌دهنده (مانند 'gemini').
     * @param {ProviderHandler} handler - تابع async که پاسخ‌های استریم را مدیریت می‌کند.
     */
    registerProvider(name, handler) {
        this.providers.set(name, handler);
    }

    /**
     * موتور را راه‌اندازی می‌کند، داده‌ها را بارگذاری کرده و رویداد 'init' را منتشر می‌کند.
     * @returns {Promise<void>}
     */
    async init() {
        try {
            this.settings = await this.storage.loadSettings();
            this.chats = await this.storage.loadAllChats();
            
            if (this.chats.length === 0) {
                // Creates a new chat in memory, will be saved on first message
                this.startNewChat(false);
            } else {
                const lastActive = this.chats.sort((a,b) => b.updatedAt - a.updatedAt)[0];
                this.activeChatId = lastActive.id;
            }

            this.emit('init', {
                settings: this.settings,
                chats: this.chats,
                activeChat: this.getActiveChat(),
            });
            
            this.setupSyncChannel();

        } catch (error) {
            this.emit('error', error.message || 'خطا در بارگذاری تاریخچه گفتگوها.');
        }
    }

    setupSyncChannel() {
        if ('BroadcastChannel' in window) {
            try {
                this.syncChannel = new BroadcastChannel(SYNC_CONFIG.CHANNEL_NAME);
                this.syncChannel.onmessage = (event) => {
                    if (event.data.type === 'update') {
                        this.handleSyncUpdate();
                    }
                };
            } catch (e) {
                console.error("BroadcastChannel could not be created:", e);
                this.syncChannel = null;
            }
        }
    }

    broadcastUpdate() {
        if (this.syncChannel) {
            this.syncChannel.postMessage({ type: 'update' });
        }
    }

    async handleSyncUpdate() {
        try {
            this.chats = await this.storage.loadAllChats();
            const activeChatExists = this.chats.some(c => c.id === this.activeChatId);

            if (!activeChatExists) {
                if (this.chats.length > 0) {
                    const newActiveChat = this.chats.sort((a, b) => b.updatedAt - a.updatedAt)[0];
                    this.activeChatId = newActiveChat.id;
                } else {
                    // All chats were deleted from another tab
                    await this.startNewChat();
                    return; // startNewChat handles its own emissions
                }
            }

            this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
            this.emit('activeChatSwitched', this.getActiveChat());

        } catch (error) {
            this.emit('error', error.message || 'خطا در همگام‌سازی با تب‌های دیگر.');
        }
    }

    /**
     * تنظیمات جدید کاربر را ذخیره می‌کند.
     * @param {Settings} settings - آبجکت تنظیمات جدید.
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        if (settings) {
            try {
                this.settings = settings;
                await this.storage.saveSettings(settings);
                this.emit('settingsSaved', settings);
            } catch (error) {
                this.emit('error', error.message);
            }
        }
    }

    /**
     * یک گپ جدید ایجاد کرده و آن را به عنوان گپ فعال تنظیم می‌کند.
     * @param {boolean} [emitUpdate=true] - اگر true باشد، رویدادها برای UI منتشر می‌شوند.
     * @returns {Promise<void>}
     */
    async startNewChat(emitUpdate = true) {
        const now = Date.now();
        const newChat = {
            id: `chat_${now}`,
            title: 'گپ جدید',
            messages: [],
            createdAt: now,
            updatedAt: now,
            provider: this.settings?.provider || 'unknown',
            modelName: this.settings?.modelName || 'unknown'
        };
        this.chats.push(newChat);
        this.activeChatId = newChat.id;
        
        if (emitUpdate) {
            this.emit('activeChatSwitched', newChat);
            this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
            await this.saveWithRetry(newChat);
        }
    }
    
    /**
     * گپ فعال فعلی را به گپ دیگری با شناسه مشخص تغییر می‌دهد.
     * @param {string} chatId - شناسه گپ مورد نظر.
     * @returns {void}
     */
    switchActiveChat(chatId) {
        if (chatId === this.activeChatId) return;
        this.activeChatId = chatId;
        const activeChat = this.getActiveChat();
        if (activeChat) {
            this.emit('activeChatSwitched', activeChat);
            this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
        }
    }

    /**
     * عنوان یک گپ مشخص را تغییر می‌دهد.
     * @param {string} chatId - شناسه گپ.
     * @param {string} newTitle - عنوان جدید.
     * @returns {Promise<void>}
     */
    async renameChat(chatId, newTitle) {
        if (typeof newTitle !== 'string' || !newTitle.trim()) {
            this.emit('error', 'نام گپ نمی‌تواند خالی باشد.');
            return;
        }

        const trimmedTitle = newTitle.trim();

        if (trimmedTitle.length > VALIDATION_LIMITS.MAX_CHAT_TITLE_LENGTH) {
            this.emit('error', `نام گپ نمی‌تواند بیشتر از ${VALIDATION_LIMITS.MAX_CHAT_TITLE_LENGTH} کاراکتر باشد.`);
            return;
        }

        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.title = trimmedTitle;
            chat.updatedAt = Date.now();
            await this.saveWithRetry(chat);
            this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
            if (chat.id === this.activeChatId) {
                 this.emit('activeChatSwitched', chat);
            }
        }
    }

    /**
     * یک گپ مشخص را حذف می‌کند.
     * @param {string} chatId - شناسه گپ برای حذف.
     * @returns {Promise<void>}
     */
    async deleteChat(chatId) {
        this.chats = this.chats.filter(c => c.id !== chatId);
        try {
            await this.storage.deleteChatById(chatId);
            this.broadcastUpdate();

            if (this.activeChatId === chatId) {
                if (this.chats.length > 0) {
                    const newActiveChat = this.chats.sort((a,b) => b.updatedAt - a.updatedAt)[0];
                    this.switchActiveChat(newActiveChat.id);
                } else {
                    await this.startNewChat();
                }
            } else {
                this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
            }
        } catch (error) {
            this.emit('error', error.message);
        }
    }

    /**
     * آبجکت گپ فعال فعلی را برمی‌گرداند.
     * @returns {Chat | undefined} آبجکت گپ فعال.
     */
    getActiveChat() {
        return this.chats.find(c => c.id === this.activeChatId);
    }

    /**
     * یک پیام جدید از کاربر دریافت کرده، به تاریخچه اضافه می‌کند و برای دریافت پاسخ به ارائه‌دهنده ارسال می‌کند.
     * @param {string} userInput - متن پیام کاربر.
     * @param {ImageData | null} [image=null] - داده‌های تصویر پیوست شده (اختیاری).
     * @returns {Promise<void>}
     */
    async sendMessage(userInput, image = null) {
        if (this.isLoading || !this.activeChatId) return;

        const hasText = typeof userInput === 'string' && userInput.trim().length > 0;
        const hasImage = image && typeof image === 'object';
        if (!hasText && !hasImage) return;

        if (userInput && typeof userInput !== 'string') {
            this.emit('error', 'ورودی پیام نامعتبر است.');
            return;
        }
        if (hasText && userInput.length > VALIDATION_LIMITS.MAX_MESSAGE_LENGTH) {
            this.emit('error', `متن پیام نمی‌تواند بیشتر از ${VALIDATION_LIMITS.MAX_MESSAGE_LENGTH} کاراکتر باشد.`);
            return;
        }
        if (hasImage && (typeof image.data !== 'string' || !image.data || typeof image.mimeType !== 'string' || !image.mimeType)) {
             this.emit('error', 'ساختار فایل تصویر پیوست شده نامعتبر است.');
            return;
        }

        if (!this.settings || (!this.settings.apiKey && this.settings.provider !== 'custom')) {
            this.emit('error', 'تنظیمات API صحیح نیست. لطفاً تنظیمات را بررسی کنید.');
            return;
        }

        const activeChat = this.getActiveChat();
        if (!activeChat) return;

        const providerStreamer = this.providers.get(this.settings.provider);
        if (!providerStreamer) {
            this.emit('error', `ارائه‌دهنده ${this.settings.provider} پشتیبانی نمی‌شود.`);
            return;
        }

        this.setLoading(true);
        
        const now = Date.now();
        const userMessage = {
            id: generateMessageId(),
            timestamp: now,
            role: 'user',
            content: userInput,
        };

        if (image) {
            userMessage.image = image;
        }
        activeChat.messages.push(userMessage);
        this.emit('message', userMessage);
        
        // Auto-title new chat on first message
        if (activeChat.messages.length === 1) {
            let title = userInput.substring(0, 30);
            if (!title && image) {
                title = 'گپ با تصویر';
            }
            if (userInput.length > 30) {
                title += '...';
            }
            activeChat.title = title;
            this.emit('chatListUpdated', { chats: this.chats, activeChatId: this.activeChatId });
            this.emit('activeChatSwitched', activeChat);
        }

        const modelMessage = {
            id: generateMessageId(),
            timestamp: Date.now(),
            role: 'model',
            content: '',
        };
        activeChat.messages.push(modelMessage);
        this.emit('message', modelMessage);

        let fullResponse = '';
        try {
            const historyForApi = activeChat.messages.slice(0, -1);
            
            await providerStreamer(
                this.settings,
                historyForApi,
                (chunk) => {
                    fullResponse += chunk;
                    this.emit('chunk', chunk);
                }
            );

            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            if (lastMsg) lastMsg.content = fullResponse;

        } catch (error) {
            const errorMessage = error.message || 'یک خطای ناشناخته رخ داد.';
            if (activeChat.messages.length > 0 && activeChat.messages[activeChat.messages.length - 1].role === 'model') {
                activeChat.messages.pop();
                this.emit('messageRemoved');
            }
            this.emit('error', errorMessage);
        } finally {
            activeChat.updatedAt = Date.now();
            await this.saveWithRetry(activeChat);
            this.emit('streamEnd', fullResponse);
            this.setLoading(false);
        }
    }

    /**
     * وضعیت بارگذاری (loading) برنامه را تنظیم کرده و رویداد 'loading' را منتشر می‌کند.
     * @param {boolean} state - وضعیت جدید (true برای در حال بارگذاری).
     * @returns {void}
     */
    setLoading(state) {
        this.isLoading = state;
        this.emit('loading', this.isLoading);
    }

    // --- Storage Error Handling ---

    /**
     * Tries to save a chat with a retry mechanism.
     * @param {Chat} chat The chat object to save.
     * @returns {Promise<boolean>} A promise that resolves to true on success, false on failure.
     */
    async saveWithRetry(chat) {
        for (let attempt = 0; attempt < STORAGE_CONFIG.MAX_SAVE_RETRIES; attempt++) {
            try {
                await this.storage.saveChat(chat);
                // On success, also remove it from the unsaved list if it was there
                const index = this.unsavedChats.findIndex(c => c.id === chat.id);
                if (index > -1) {
                    this.unsavedChats.splice(index, 1);
                    this.emit('success', `گپ "${chat.title}" که قبلا ذخیره نشده بود، با موفقیت ذخیره شد.`);
                }
                this.broadcastUpdate();
                return true; // Indicate success
            } catch (error) {
                console.error(`Save attempt ${attempt + 1} failed for chat ${chat.id}:`, error);
                if (attempt < STORAGE_CONFIG.MAX_SAVE_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, STORAGE_CONFIG.SAVE_RETRY_DELAY_MS));
                } else {
                    this.handleSaveFailure(chat, error);
                }
            }
        }
        return false; // Indicate failure
    }

    /**
     * Handles the final failure of a save operation by adding the chat to an unsaved queue.
     * @param {Chat} chat The chat that failed to save.
     * @param {Error} error The final error object.
     */
    handleSaveFailure(chat, error) {
        // Avoid adding duplicates
        if (!this.unsavedChats.some(c => c.id === chat.id)) {
            this.unsavedChats.push(chat);
        }
        
        this.emit('error', `ذخیره‌سازی ناموفق بود. برنامه به صورت خودکار دوباره تلاش خواهد کرد. لطفاً صفحه را بازنشانی نکنید!`);

        // Start the retry interval if it's not already running
        if (!this.unsavedRetryInterval) {
            this.startUnsavedRetryInterval();
        }
    }

    /**
     * Starts a periodic timer to re-attempt saving chats from the unsaved queue.
     */
    startUnsavedRetryInterval() {
        this.unsavedRetryInterval = setInterval(() => {
            this.retryUnsavedChats();
        }, STORAGE_CONFIG.UNSAVED_RETRY_INTERVAL_MS);
    }

    /**
     * Iterates through the unsaved chats and attempts to save them again.
     */
    async retryUnsavedChats() {
        if (this.unsavedChats.length === 0) {
            clearInterval(this.unsavedRetryInterval);
            this.unsavedRetryInterval = null;
            return;
        }

        console.log(`Attempting to save ${this.unsavedChats.length} unsaved chat(s)...`);
        
        const stillUnsaved = [];
        for (const chat of this.unsavedChats) {
            try {
                await this.storage.saveChat(chat);
                this.broadcastUpdate();
                this.emit('success', `گپ "${chat.title}" با موفقیت ذخیره شد.`);
            } catch (error) {
                // If it fails again, keep it in the list for the next attempt
                stillUnsaved.push(chat);
            }
        }

        this.unsavedChats = stillUnsaved;

        // If all chats are saved, the list will be empty and the interval will be cleared on the next run.
    }
}

export default ChatEngine;