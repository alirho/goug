import { ApiError } from '../utils/apiErrors.js';
import { API_CONFIG } from '../utils/constants.js';

/**
 * یک تابع عمومی برای انجام درخواست‌های fetch با منطق تلاش مجدد، وقفه زمانی و پردازش استریم.
 * @param {string} url - آدرس URL نقطه پایانی API.
 * @param {RequestInit} options - گزینه‌های مربوط به درخواست fetch.
 * @param {(line: string) => void} processLine - یک callback برای پردازش هر خط از استریم.
 * @param {(response: Response) => Promise<string>} getErrorMessage - یک callback برای استخراج پیام خطا از پاسخ.
 * @returns {Promise<void>}
 * @throws {ApiError | Error} - در صورتی که درخواست پس از تمام تلاش‌ها ناموفق باشد، یک خطا پرتاب می‌کند.
 */
export async function fetchStreamWithRetries(url, options, processLine, getErrorMessage) {
    let lastError = null;

    for (let attempt = 0; attempt < API_CONFIG.MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const message = await getErrorMessage(response);
                lastError = new ApiError(message, response.status);
                // Don't retry for client-side errors that are unlikely to change
                if ([400, 401, 403, 404].includes(response.status)) throw lastError;
                continue; // Retry for other server-side errors
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep any incomplete line for the next chunk

                for (const line of lines) {
                    if (line.trim()) processLine(line);
                }
            }
            return; // Success, exit the loop

        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof ApiError) throw error; // Re-throw un-retryable ApiError
            
            lastError = (error.name === 'AbortError')
                ? new Error("پاسخ از سرور دریافت نشد (Timeout).")
                : new Error("اتصال به اینترنت برقرار نیست.");
        }
        
        // Wait before retrying
        if (attempt < API_CONFIG.MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.INITIAL_DELAY_MS * Math.pow(2, attempt)));
        }
    }

    throw lastError;
}
