import { NotImplementedError } from '../utils/errors.js';

/**
 * افزونه‌های مدل‌های زبانی (مانند Gemini, OpenAI) باید از این کلاس ارث‌بری کنند.
 */
export default class ProviderInterface {
    /**
     * نام یکتای ارائه‌دهنده (مثل 'gemini', 'openai')
     */
    get name() { throw new NotImplementedError('getter name'); }

    /**
     * ارسال پیام به مدل
     * @param {object} config تنظیمات مدل (apiKey, modelName, ...)
     * @param {Array} messages تاریخچه پیام‌ها
     * @param {Function} onChunk تابعی که برای استریم صدا زده می‌شود
     * @param {object} options گزینه‌های اضافی (signal, ...)
     */
    async sendMessage(config, messages, onChunk, options) { throw new NotImplementedError('sendMessage'); }

    /**
     * اعتبارسنجی تنظیمات ورودی کاربر برای این مدل
     * @param {object} config 
     * @returns {boolean}
     */
    validateConfig(config) { throw new NotImplementedError('validateConfig'); }
}