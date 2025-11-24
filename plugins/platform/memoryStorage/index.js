import { Plugin, Serializer } from '../../../core/src/index.js';

/**
 * افزونه ذخیره‌سازی در حافظه (Memory Storage).
 * داده‌ها را فقط در طول عمر برنامه نگه می‌دارد و با رفرش صفحه پاک می‌شوند.
 */
export default class MemoryStoragePlugin extends Plugin {
    static metadata = {
        name: 'memory-storage',
        version: '1.0.0',
        category: 'storage',
        description: 'ذخیره‌سازی موقت در حافظه RAM (مناسب برای تست)',
        author: 'Peik Team',
        dependencies: []
    };

    constructor() {
        super();
        /** @type {object|null} */
        this.settings = null;
        /** @type {Map<string, object>} */
        this.chats = new Map();
    }

    /**
     * ذخیره تنظیمات کاربر
     * @param {object} settings 
     */
    async saveSettings(settings) {
        // استفاده از Serializer برای شبیه‌سازی ذخیره‌سازی واقعی (Deep Copy)
        this.settings = Serializer.clone(settings);
    }

    /**
     * بارگذاری تنظیمات کاربر
     * @returns {Promise<object|null>}
     */
    async loadSettings() {
        return Serializer.clone(this.settings);
    }

    /**
     * ذخیره یا به‌روزرسانی یک چت
     * @param {object} chat 
     */
    async saveChat(chat) {
        // داده‌ها کلون می‌شوند تا تغییرات بعدی روی آبجکت اصلی، داده‌های "ذخیره شده" را تغییر ندهد
        this.chats.set(chat.id, Serializer.clone(chat));
    }

    /**
     * بارگذاری یک چت کامل با شناسه
     * @param {string} chatId 
     * @returns {Promise<object|null>}
     */
    async loadChat(chatId) {
        const chat = this.chats.get(chatId);
        return chat ? Serializer.clone(chat) : null;
    }

    /**
     * دریافت لیست تمام چت‌ها (بدون پیام‌ها برای سبک بودن)
     * @returns {Promise<Array>}
     */
    async getAllChats() {
        const allChats = Array.from(this.chats.values()).map(chat => {
            return {
                id: chat.id,
                title: chat.title,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                modelInfo: chat.modelInfo
            };
        });

        // مرتب‌سازی نزولی بر اساس تاریخ به‌روزرسانی (جدیدترین اول)
        return allChats.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    /**
     * حذف یک چت
     * @param {string} chatId 
     */
    async deleteChat(chatId) {
        this.chats.delete(chatId);
    }
}