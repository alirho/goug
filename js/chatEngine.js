import EventEmitter from './eventEmitter.js';
import * as Storage from './storageService.js';
import { streamChatResponse } from './apiService.js';

class ChatEngine extends EventEmitter {
    constructor() {
        super();
        this.messages = [];
        this.isLoading = false;
        this.settings = null;
    }

    /**
     * Initializes the engine by loading data from storage.
     */
    init() {
        this.settings = Storage.loadSettings();
        this.messages = Storage.loadMessages();
        this.emit('init', {
            settings: this.settings,
            messages: this.messages,
        });
    }

    /**
     * Sets new settings and saves them to storage.
     * @param {object} settings The new settings object.
     */
    saveSettings(settings) {
        if (settings) {
            this.settings = settings;
            Storage.saveSettings(settings);
            this.emit('settingsSaved', settings);
        }
    }

    /**
     * Handles sending a message to the API.
     * @param {string} userInput The text message from the user.
     */
    async sendMessage(userInput) {
        if (!userInput || this.isLoading) return;
        if (!this.settings || !this.settings.apiKey) {
            this.emit('error', 'تنظیمات API صحیح نیست. لطفاً تنظیمات را بررسی کنید.');
            return;
        }

        this.setLoading(true);

        const userMessage = { role: 'user', content: userInput };
        this.messages.push(userMessage);
        this.emit('message', userMessage); // Let UI show user message immediately

        // Create and add the model message placeholder to the state
        const modelMessage = { role: 'model', content: '' };
        this.messages.push(modelMessage);
        this.emit('message', modelMessage); // Add an empty model message to UI for streaming

        let fullResponse = '';
        try {
            // Prepare the history for the API call (all messages except the empty model placeholder)
            const historyForApi = this.messages.slice(0, -1);
            const requestBody = this.buildRequestBody(historyForApi);
            
            await streamChatResponse(
                this.settings,
                requestBody,
                (chunk) => {
                    fullResponse += chunk;
                    this.emit('chunk', chunk); // Stream chunk to UI
                }
            );

            // Once streaming is done, update the last message in our state and save
            if (this.messages.length > 0) {
                this.messages[this.messages.length - 1].content = fullResponse;
            }
            Storage.saveMessages(this.messages);
            this.emit('streamEnd', fullResponse);

        } catch (error) {
            const errorMessage = error.message || 'یک خطای ناشناخته رخ داد.';
            
            // پیام مدل که برای استریم اضافه شده بود را حذف کن
            // و UI را برای حذف عنصر آن مطلع کن
            if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'model') {
                this.messages.pop();
                this.emit('messageRemoved');
            }
            
            this.emit('error', errorMessage);
            this.emit('streamEnd'); // برای اطمینان از پایان یافتن حالت استریم در UI
            Storage.saveMessages(this.messages); // تاریخچه را بدون پیام ناموفق ذخیره کن

        } finally {
            this.setLoading(false);
        }
    }

    /**
     * بر اساس ارائه‌دهنده انتخاب شده، بدنه درخواست را می‌سازد
     * @param {Array<object>} history - تاریخچه گفتگو
     * @returns {object} بدنه درخواست برای API
     */
    buildRequestBody(history) {
        const provider = this.settings.provider;

        if (provider === 'gemini') {
            const contents = history.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));
            return {
                contents: contents,
                systemInstruction: {
                    parts: [{ text: 'You are a helpful assistant named Goug. Your responses should be in Persian.' }]
                }
            };
        } else { // For 'openai' and 'custom'
            const messages = history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user', // OpenAI uses 'assistant'
                content: msg.content,
            }));
             // Add system prompt as the first message
            messages.unshift({
                role: 'system',
                content: 'You are a helpful assistant named Goug. Your responses should be in Persian.'
            });
            return { messages };
        }
    }


    /**
     * Updates the loading state and notifies listeners.
     * @param {boolean} state The new loading state.
     */
    setLoading(state) {
        this.isLoading = state;
        this.emit('loading', this.isLoading);
    }
}

export default ChatEngine;