import { loadTemplate, loadTemplateWithPartials } from './templateLoader.js';
import MessageRenderer from './components/messageRenderer.js';
import SettingsModal from './components/settingsModal.js';
import SidebarManager from './components/sidebarManager.js';
import InputManager from './components/inputManager.js';
import FileManager from './components/fileManager.js';
import LightboxManager from './components/lightboxManager.js';

// وارد کردن تایپ‌ها برای JSDoc
/** @typedef {import('../types.js').Settings} Settings */
/** @typedef {import('../types.js').ImageData} ImageData */
/** @typedef {import('../types.js').ProviderConfig} ProviderConfig */
/** @typedef {import('../core/chatEngine.js').default} ChatEngine */

/**
 * کل رابط کاربری برنامه را مدیریت کرده و به عنوان ارکستراتور برای تمام کامپوننت‌های UI عمل می‌کند.
 */
class ChatUI {
    /**
     * @param {ChatEngine} chatEngine - نمونه اصلی موتور چت.
     * @param {HTMLElement} rootElement - المان اصلی که UI در آن رندر می‌شود.
     */
    constructor(chatEngine, rootElement) {
        this.engine = chatEngine;
        this.rootElement = rootElement;
        
        this.messageRenderer = null;
        this.settingsModal = null;
        this.sidebarManager = null;
        this.inputManager = null;
        this.fileManager = null;
        this.lightboxManager = null;
        
        this.currentStreamingBubble = null;
        
        this.dom = {};
        
        this.engineListeners = {};
        this.handleNewChatClickBound = () => this.engine.startNewChat();
        this.handleGlobalClickBound = this._handleGlobalClick.bind(this);
    }

    /**
     * UI را با بارگذاری قالب‌ها، کش کردن المان‌ها و اتصال رویدادها راه‌اندازی می‌کند.
     * @returns {Promise<void>}
     */
    async init() {
        try {
            await this.loadLayout();
            this.cacheDOMElements();
            this.initComponents();
            this.bindCoreEvents();
            this.bindUIEvents();
        } catch (error) {
            this.rootElement.innerHTML = `<p style="color: red; padding: 1rem;">خطای مهلک: بارگذاری رابط کاربری ناموفق بود. لطفاً صفحه را رفرش کنید.</p>`;
            console.error('راه‌اندازی UI ناموفق بود:', error);
        }
    }

    async loadLayout() {
        const [layoutHtml, modalHtml] = await Promise.all([
            loadTemplateWithPartials('templates/mainLayout.html'),
            loadTemplate('templates/settingsModal.html')
        ]);
        this.rootElement.innerHTML = layoutHtml + modalHtml;
    }

    cacheDOMElements() {
        this.dom = {
            mainTitle: document.getElementById('main-title'),
            newChatButton: document.getElementById('new-chat-button'),
            modelSelector: document.getElementById('model-selector'),
            modelSelectorButton: document.getElementById('model-selector-button'),
            modelSelectorIcon: document.getElementById('model-selector-icon'),
            modelSelectorName: document.getElementById('model-selector-name'),
            modelSelectorDropdown: document.getElementById('model-selector-dropdown'),
        };
    }

    initComponents() {
        this.lightboxManager = new LightboxManager();
        this.messageRenderer = new MessageRenderer(document.getElementById('message-list'), this.lightboxManager);
        this.settingsModal = new SettingsModal(this.engine);
        this.sidebarManager = new SidebarManager(this.engine);
        
        this.fileManager = new FileManager(this.engine, (imageData) => {
            this.inputManager.setAndPreviewImage(imageData);
        });

        this.inputManager = new InputManager(this.fileManager, (userInput, image) => {
            this.handleSendMessage(userInput, image);
        });
    }

    isSettingsValid(settings) {
        if (!settings || !settings.provider) return false;
        if (settings.provider === 'custom') {
            const activeCustom = settings.customProviders?.find(p => p.id === settings.customProviderId);
            return !!activeCustom?.endpointUrl;
        }
        return !!settings.apiKey;
    }

    bindCoreEvents() {
        this.engineListeners = {
            init: ({ settings, chats, activeChat, isDefaultProvider }) => {
                if (!this.isSettingsValid(settings) && !this.engine.defaultProvider) {
                    this.settingsModal.show(true);
                } else if (isDefaultProvider) {
                    this.messageRenderer.displayTemporaryInfo('شما در حال استفاده از مدل پیش‌فرض هستید. برای افزودن کلید شخصی به تنظیمات مراجعه کنید.');
                }
                
                if (activeChat) {
                    this.sidebarManager.render(chats, activeChat.id);
                    this.updateChatView(activeChat);
                } else {
                    this.sidebarManager.render(chats, null);
                    this.messageRenderer.showWelcomeMessage();
                    this.dom.modelSelector.classList.add('hidden');
                }
            },
            chatListUpdated: ({ chats, activeChatId }) => {
                this.sidebarManager.render(chats, activeChatId);
            },
            activeChatSwitched: (activeChat) => {
                this.updateChatView(activeChat);
            },
            message: (message) => {
                if (message.role === 'model' && message.content === '') {
                    this.currentStreamingBubble = this.messageRenderer.appendMessage(message, true);
                } else {
                    this.messageRenderer.appendMessage(message);
                }
            },
            chunk: (chunk) => {
                if (this.currentStreamingBubble) this.messageRenderer.appendChunk(this.currentStreamingBubble, chunk);
            },
            streamEnd: () => {
                this.currentStreamingBubble = null;
                this.inputManager.updateSendButtonState(false);
            },
            loading: (isLoading) => this.inputManager.updateSendButtonState(isLoading),
            settingsSaved: () => {
                this.settingsModal.show(false);
                alert('تنظیمات با موفقیت ذخیره شد.');
                // Refresh the active chat to apply the new default model if needed
                const activeChat = this.engine.getActiveChat();
                if (activeChat) this.updateChatView(activeChat);
            },
            error: (errorMessage) => this.messageRenderer.displayTemporaryError(errorMessage),
            success: (successMessage) => this.messageRenderer.displayTemporarySuccess(successMessage),
            messageRemoved: () => this.messageRenderer.removeLastMessage(),
        };

        Object.keys(this.engineListeners).forEach(eventName => {
            this.engine.on(eventName, this.engineListeners[eventName]);
        });
    }

    bindUIEvents() {
        this.dom.newChatButton.addEventListener('click', this.handleNewChatClickBound);
        this.dom.modelSelectorButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dom.modelSelectorDropdown.classList.toggle('hidden');
        });
        this.dom.modelSelectorDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.model-selector-item');
            if (item) {
                const config = JSON.parse(item.dataset.config);
                const activeChat = this.engine.getActiveChat();
                if (activeChat) {
                    this.engine.updateChatModel(activeChat.id, config);
                }
                this.dom.modelSelectorDropdown.classList.add('hidden');
            }
        });
        document.addEventListener('click', this.handleGlobalClickBound);
    }
    
    _handleGlobalClick() {
        if (this.dom.modelSelectorDropdown && !this.dom.modelSelectorDropdown.classList.contains('hidden')) {
            this.dom.modelSelectorDropdown.classList.add('hidden');
        }
    }

    destroy() {
        Object.keys(this.engineListeners).forEach(eventName => {
            this.engine.off(eventName, this.engineListeners[eventName]);
        });
        this.engineListeners = {};

        if (this.dom.newChatButton) this.dom.newChatButton.removeEventListener('click', this.handleNewChatClickBound);
        document.removeEventListener('click', this.handleGlobalClickBound);

        if (this.lightboxManager) this.lightboxManager.destroy();
        if (this.settingsModal) this.settingsModal.destroy();
        if (this.sidebarManager) this.sidebarManager.destroy();
        if (this.inputManager) this.inputManager.destroy();
        if (this.fileManager) this.fileManager.destroy();

        this.rootElement.innerHTML = '';
        this.dom = {};
        console.log('ChatUI نابود شد.');
    }

    handleSendMessage(userInput, image) {
        if (this.engine.isLoading) return;
        if (userInput || image) {
            this.engine.sendMessage(userInput, image);
            this.inputManager.reset();
        }
    }

    updateChatView(chat) {
        if (!chat) return;
        this.inputManager.clearPreview();
        this.dom.mainTitle.textContent = chat.title;
        this.renderModelSelector(chat);
        if (chat.messages && chat.messages.length > 0) {
            this.messageRenderer.renderHistory(chat.messages);
        } else {
            this.messageRenderer.showWelcomeMessage();
        }
    }

    // --- توابع انتخاب مدل ---

    /**
     * دکمه و منوی کشویی انتخاب مدل را بر اساس گپ فعال رندر می‌کند.
     * @param {import('../types.js').Chat} chat 
     */
    renderModelSelector(chat) {
        if (!chat || !chat.providerConfig) {
            this.dom.modelSelector.classList.add('hidden');
            return;
        }

        const config = chat.providerConfig;
        const displayName = config.name || (config.provider === 'gemini' ? 'Gemini' : config.provider === 'openai' ? 'ChatGPT' : 'سفارشی');
        
        this.dom.modelSelectorName.textContent = `${displayName}: ${config.modelName}`;
        this.dom.modelSelectorIcon.textContent = this._getProviderIconName(config.provider);
        
        this._populateModelDropdown();
        this.dom.modelSelector.classList.remove('hidden');
    }

    /**
     * منوی کشویی مدل را با تمام ارائه‌دهندگان موجود پر می‌کند.
     */
    _populateModelDropdown() {
        const dropdown = this.dom.modelSelectorDropdown;
        dropdown.innerHTML = '';
        const availableModels = this._getAllAvailableModels();

        availableModels.forEach(modelConfig => {
            const item = document.createElement('div');
            item.className = 'model-selector-item';
            item.dataset.config = JSON.stringify(modelConfig);
            
            const displayName = modelConfig.name || (modelConfig.provider === 'gemini' ? 'Gemini' : modelConfig.provider === 'openai' ? 'ChatGPT' : 'سفارشی');

            item.innerHTML = `
                <span class="material-symbols-outlined provider-icon">${this._getProviderIconName(modelConfig.provider)}</span>
                <span class="model-item-name">${displayName}: ${modelConfig.modelName}</span>
            `;
            dropdown.appendChild(item);
        });
    }

    /**
     * لیستی از تمام پیکربندی‌های مدل موجود را از تنظیمات استخراج می‌کند.
     * @returns {Array<ProviderConfig>}
     */
    _getAllAvailableModels() {
        const models = [];
        const settings = this.engine.settings;
        if (!settings) return [];
        
        // افزودن ارائه‌دهنده فعال (اگر سفارشی نباشد)
        if (settings.provider && settings.provider !== 'custom' && settings.apiKey) {
            models.push({
                provider: settings.provider,
                name: settings.provider === 'gemini' ? 'Gemini' : 'ChatGPT',
                modelName: settings.modelName,
                apiKey: settings.apiKey,
            });
        }
        
        // افزودن تمام ارائه‌دهندگان سفارشی معتبر
        if (settings.customProviders) {
            settings.customProviders.forEach(p => {
                if (p.name && p.modelName && p.endpointUrl) {
                    models.push({
                        provider: 'custom',
                        name: p.name,
                        modelName: p.modelName,
                        apiKey: p.apiKey,
                        endpointUrl: p.endpointUrl,
                        customProviderId: p.id,
                    });
                }
            });
        }
        
        return models;
    }

    /**
     * نام آیکون Material Symbols را برای یک ارائه‌دهنده برمی‌گرداند.
     * @param {string} provider 
     * @returns {string}
     */
    _getProviderIconName(provider) {
        switch (provider) {
            case 'gemini': return 'auto_awesome';
            case 'openai': return 'psychology';
            default: return 'hub';
        }
    }
}

export default ChatUI;