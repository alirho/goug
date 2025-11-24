import { Plugin, Errors, Validator } from '../../../core/src/index.js';

const { ProviderError, PluginError } = Errors;

export default class GeminiProvider extends Plugin {
    static metadata = {
        name: 'gemini',
        version: '1.0.0',
        category: 'provider',
        description: 'ارائه‌دهنده رسمی Google Gemini API',
        author: 'Peik Team',
        dependencies: [] // وابستگی ضمنی به یک افزونه شبکه دارد
    };

    async install(context) {
        await super.install(context);
        // پیدا کردن کلاینت HTTP از افزونه‌های نصب شده
        const networkPlugins = context.pluginManager.getPluginsByCategory('network');
        if (networkPlugins.length === 0) {
            throw new PluginError('هیچ افزونه شبکه‌ای (HttpClient) یافت نشد.');
        }
        this.httpClient = networkPlugins[0];
    }

    /**
     * اعتبارسنجی تنظیمات ورودی
     */
    validateConfig(config) {
        try {
            Validator.required(config.apiKey, 'apiKey');
            Validator.required(config.modelName, 'modelName');
            return true;
        } catch (error) {
            throw new ProviderError(`تنظیمات نامعتبر برای Gemini: ${error.message}`);
        }
    }

    /**
     * ارسال پیام به Gemini
     */
    async sendMessage(config, messages, onChunk, options = {}) {
        this.validateConfig(config);

        const systemText = config.systemInstruction || 'You are a helpful assistant named Peik.';

        const requestBody = {
            contents: this._formatMessages(messages),
            systemInstruction: {
                parts: [{ text: systemText }]
            }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:streamGenerateContent?key=${config.apiKey}&alt=sse`;

        try {
            await this.httpClient.streamRequest(
                url,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                },
                (line) => this._processStreamLine(line, onChunk),
                options.signal
            );
        } catch (error) {
            throw new ProviderError(error.message, error.statusCode);
        }
    }

    /**
     * تبدیل فرمت پیام‌های پیک به فرمت Gemini
     */
    _formatMessages(history) {
        return history.map(msg => {
            const parts = [];

            if (msg.role === 'user') {
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                if (msg.image && msg.image.data && msg.image.mimeType) {
                    parts.push({
                        inlineData: {
                            mimeType: msg.image.mimeType,
                            data: msg.image.data
                        }
                    });
                }
            } else {
                // برای مدل، فقط متن پشتیبانی می‌شود (در پاسخ‌های استاندارد)
                parts.push({ text: msg.content });
            }

            return {
                role: msg.role === 'model' ? 'model' : 'user',
                parts: parts
            };
        });
    }

    /**
     * پردازش هر خط از استریم SSE
     */
    _processStreamLine(line, onChunk) {
        if (line.startsWith('data: ')) {
            try {
                const jsonStr = line.substring(6);
                if (jsonStr) {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        onChunk(content);
                    }
                }
            } catch (e) {
                console.error("خطا در تجزیه استریم Gemini:", e);
                // نادیده گرفتن خطاهای جزئی در پارس JSON یا خطوط خالی که ممکن است در استریم رخ دهند
            }
        }
    }
}