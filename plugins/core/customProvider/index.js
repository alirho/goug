import { Plugin, Errors, Validator } from '../../../core/src/index.js';

const { ProviderError, PluginError } = Errors;

export default class CustomProvider extends Plugin {
    static metadata = {
        name: 'custom',
        version: '1.0.0',
        category: 'provider',
        description: 'ارائه‌دهنده مدل‌های سفارشی سازگار با OpenAI (مانند Ollama)',
        author: 'Peik Team',
        dependencies: []
    };

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
            Validator.required(config.endpointUrl, 'endpointUrl');
            Validator.required(config.modelName, 'modelName');
            // apiKey اختیاری است
            return true;
        } catch (error) {
            throw new ProviderError(`تنظیمات نامعتبر برای مدل سفارشی: ${error.message}`);
        }
    }

    async sendMessage(config, messages, onChunk, options = {}) {
        this.validateConfig(config);

        const requestBody = {
            model: config.modelName,
            messages: this._formatMessages(messages, config),
            stream: true
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (config.apiKey && config.apiKey.trim() !== '') {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        try {
            await this.httpClient.streamRequest(
                config.endpointUrl,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                },
                (line) => this._processStreamLine(line, onChunk),
                options.signal
            );
        } catch (error) {
            // تلاش برای استخراج پیام خطای مفیدتر از پاسخ سرور
            let errorMessage = error.message;
            if (error.responseBody) {
                try {
                    // اگر پاسخ جیسون باشد
                    const errorJson = typeof error.responseBody === 'string' ? JSON.parse(error.responseBody) : error.responseBody;
                    errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
                } catch (e) {
                    // اگر پاسخ متن ساده باشد
                    if (typeof error.responseBody === 'string') {
                        errorMessage = error.responseBody;
                    }
                }
            }
            
            throw new ProviderError(errorMessage, error.statusCode);
        }
    }

    _formatMessages(history, config) {
        const formatted = history.map(msg => {
            const role = msg.role === 'model' ? 'assistant' : 'user';

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

            return {
                role: role,
                content: msg.content || ''
            };
        });

        // دستورالعمل سیستم
        const systemText = config.systemInstruction || 'You are a helpful assistant named Peik.';
        formatted.unshift({
            role: 'system',
            content: systemText
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
            console.error("خطا در تجزیه استریم Custom Provider:", e);
            // نادیده گرفتن خطاهای جزئی در پارس JSON
        }
    }
}