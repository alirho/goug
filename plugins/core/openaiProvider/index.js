import { Plugin, Errors, Validator } from '../../../core/src/index.js';

const { ProviderError, PluginError } = Errors;

export default class OpenAIProvider extends Plugin {
    static get metadata() {
        return {
            name: 'openai',
            version: '1.0.0',
            category: 'provider',
            description: 'ارائه‌دهنده OpenAI (ChatGPT) و APIهای سازگار',
            author: 'Peik Team',
            dependencies: []
        };
    }

    async install(context) {
        await super.install(context);
        const networkPlugins = context.pluginManager.getPluginsByCategory('network');
        if (networkPlugins.length === 0) {
            throw new PluginError('هیچ افزونه شبکه‌ای (HttpClient) یافت نشد.');
        }
        this.httpClient = networkPlugins[0];
    }

    validateConfig(config) {
        try {
            Validator.required(config.apiKey, 'apiKey');
            Validator.required(config.modelName, 'modelName');
            return true;
        } catch (error) {
            throw new ProviderError(`تنظیمات نامعتبر برای OpenAI: ${error.message}`);
        }
    }

    async sendMessage(config, messages, onChunk, options = {}) {
        this.validateConfig(config);

        const requestBody = {
            model: config.modelName,
            messages: this._formatMessages(messages),
            stream: true
        };

        // امکان تغییر Endpoint برای مدل‌های سازگار (مثل Ollama یا سرویس‌های دیگر)
        const url = config.endpointUrl || 'https://api.openai.com/v1/chat/completions';

        try {
            await this.httpClient.streamRequest(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
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
     * تبدیل فرمت پیام‌های پیک به فرمت OpenAI
     */
    _formatMessages(history) {
        const formatted = history.map(msg => {
            // نگاشت role: مدل پیک -> assistant در OpenAI
            const role = msg.role === 'model' ? 'assistant' : 'user';

            // اگر پیام حاوی تصویر باشد (فقط برای کاربر)
            if (msg.role === 'user' && msg.image) {
                const content = [];
                if (msg.content) {
                    content.push({ type: 'text', text: msg.content });
                }
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${msg.image.mimeType};base64,${msg.image.data}`
                    }
                });
                return { role, content };
            }

            // پیام متنی ساده
            return {
                role: role,
                content: msg.content || ''
            };
        });

        // افزودن پیام سیستم به ابتدای لیست
        formatted.unshift({
            role: 'system',
            content: 'You are a helpful assistant named Peik. Your responses should be in Persian.'
        });

        return formatted;
    }

    _processStreamLine(line, onChunk) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) return;

        const jsonStr = trimmedLine.substring(6).trim();
        if (jsonStr === '[DONE]') return;

        try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
                onChunk(content);
            }
        } catch (e) {
            console.warn("خطا در تجزیه استریم OpenAI:", e);
        }
    }
}