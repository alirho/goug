import { PluginError } from './utils/errors.js';

export default class PluginManager {
    constructor(peikContext) {
        this.peik = peikContext;
        this.plugins = new Map();
        this.hooks = new Map();
    }

    /**
     * ثبت و نصب یک افزونه جدید
     * @param {Plugin} pluginInstance 
     */
    async register(pluginInstance) {
        const meta = pluginInstance.constructor.metadata;
        
        if (this.plugins.has(meta.name)) {
            console.warn(`افزونه ${meta.name} قبلاً ثبت شده است.`);
            return;
        }

        // بررسی وابستگی‌ها (ساده)
        if (meta.dependencies && meta.dependencies.length > 0) {
            const missing = meta.dependencies.filter(dep => !this.plugins.has(dep));
            if (missing.length > 0) {
                throw new PluginError(`وابستگی‌های زیر برای ${meta.name} یافت نشد: ${missing.join(', ')}`);
            }
        }

        try {
            await pluginInstance.install(this.peik);
            this.plugins.set(meta.name, pluginInstance);
            
            // فعال‌سازی خودکار
            await pluginInstance.activate();
        } catch (error) {
            throw new PluginError(`خطا در نصب افزونه ${meta.name}: ${error.message}`, error);
        }
    }

    getPlugin(name) {
        return this.plugins.get(name);
    }

    /**
     * دریافت لیست افزونه‌ها بر اساس دسته‌بندی (storage, provider, ...)
     * @param {string} category 
     */
    getPluginsByCategory(category) {
        const result = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.constructor.metadata.category === category) {
                result.push(plugin);
            }
        }
        return result;
    }

    /**
     * ثبت یک هوک برای گسترش منطق هسته
     * @param {string} hookName نام نقطه اتصال (مثلاً 'beforeSendMessage')
     * @param {Function} callback تابع اجرایی
     */
    registerHook(hookName, callback) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push(callback);
    }

    /**
     * اجرای هوک‌ها به صورت زنجیره‌ای
     * @param {string} hookName 
     * @param {any} initialData داده اولیه
     */
    async executeHook(hookName, initialData) {
        if (!this.hooks.has(hookName)) return initialData;
        
        let data = initialData;
        for (const callback of this.hooks.get(hookName)) {
            data = await callback(data);
        }
        return data;
    }
}