export const Serializer = {
    /**
     * یک کپی عمیق و ایمن از داده می‌گیرد تا از نبودن Reference به DOM یا توابع اطمینان حاصل شود.
     * @param {any} data 
     * @returns {any}
     */
    clone(data) {
        if (data === undefined) return undefined;
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            console.error('خطا در سریال‌سازی داده:', error);
            throw new Error('داده قابل سریال‌سازی نیست (circular reference یا نوع داده نامعتبر).');
        }
    }
};