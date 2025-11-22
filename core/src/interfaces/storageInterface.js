import { NotImplementedError } from '../utils/errors.js';

/**
 * افزونه‌های ذخیره‌سازی باید از این کلاس ارث‌بری کنند.
 */
export default class StorageInterface {
    async saveSettings(settings) { throw new NotImplementedError('saveSettings'); }
    async loadSettings() { throw new NotImplementedError('loadSettings'); }
    
    async saveChat(chat) { throw new NotImplementedError('saveChat'); }
    async loadChat(chatId) { throw new NotImplementedError('loadChat'); }
    async getAllChats() { throw new NotImplementedError('getAllChats'); }
    async deleteChat(chatId) { throw new NotImplementedError('deleteChat'); }
}