import { NotImplementedError } from '../utils/errors.js';

/**
 * افزونه‌های کلاینت HTTP باید از این کلاس ارث‌بری کنند.
 * این کار وابستگی به fetch یا axios را انتزاعی می‌کند.
 */
export default class HttpClientInterface {
    /**
     * انجام یک درخواست HTTP استاندارد
     * @param {string} url 
     * @param {object} options (method, headers, body)
     * @returns {Promise<object>} Response object { status, data, headers }
     */
    async request(url, options) { throw new NotImplementedError('request'); }

    /**
     * انجام یک درخواست HTTP با قابلیت دریافت استریم
     * @param {string} url 
     * @param {object} options 
     * @param {Function} onChunk Callback برای دریافت قطعات داده
     * @param {object} signal سیگنال برای لغو (Abstract AbortSignal)
     */
    async streamRequest(url, options, onChunk, signal) { throw new NotImplementedError('streamRequest'); }
}