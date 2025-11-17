import { loadTemplate, loadTemplateWithPartials } from './templateLoader.js';
import MessageRenderer from './components/messageRenderer.js';
import SettingsModal from './components/settingsModal.js';
import SidebarManager from './components/sidebarManager.js';
import InputManager from './components/inputManager.js';
import FileManager from './components/fileManager.js';
import LightboxManager from './components/lightboxManager.js';

// JSDoc Type Imports
/** @typedef {import('../types.js').Settings} Settings */
/** @typedef {import('../types.js').ImageData} ImageData */
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
        
        // Components will be initialized in init()
        this.messageRenderer = null;
        this.settingsModal = null;
        this.sidebarManager = null;
        this.inputManager = null;
        this.fileManager = null;
        this.lightboxManager = null;
        
        this.currentStreamingBubble = null;
        
        this.dom = {
            mainTitle: null,
            newChatButton: null
        };
        
        this.engineListeners = {};
        this.handleNewChatClickBound = () => this.engine.startNewChat();
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
            console.error('UI Initialization failed:', error);
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
        this.dom.mainTitle = document.getElementById('main-title');
        this.dom.newChatButton = document.getElementById('new-chat-button');
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

    /**
     * Checks if the API settings are valid for running the application.
     * @param {Settings | null} settings - The settings object from storage.
     * @returns {boolean} True if settings are valid, false otherwise.
     */
    isSettingsValid(settings) {
        if (!settings || !settings.provider) return false;
        if (settings.provider === 'custom') return !!settings.endpointUrl;
        return !!settings.apiKey;
    }

    bindCoreEvents() {
        this.engineListeners = {
            init: ({ settings, chats, activeChat }) => {
                if (!this.isSettingsValid(settings)) {
                    this.settingsModal.show(true);
                }
                if (activeChat) {
                    this.sidebarManager.render(chats, activeChat.id);
                    this.updateChatView(activeChat);
                } else {
                    console.warn('Initial active chat was not available. Rendering empty state.');
                    this.sidebarManager.render(chats, null);
                    this.messageRenderer.showWelcomeMessage();
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
    }

    /**
     * تمام کامپوننت‌های UI و شنوندگان رویداد را برای جلوگیری از نشت حافظه پاک‌سازی می‌کند.
     */
    destroy() {
        // 1. Remove engine listeners
        Object.keys(this.engineListeners).forEach(eventName => {
            this.engine.off(eventName, this.engineListeners[eventName]);
        });
        this.engineListeners = {};

        // 2. Remove UI event listeners
        if(this.dom.newChatButton) {
            this.dom.newChatButton.removeEventListener('click', this.handleNewChatClickBound);
        }

        // 3. Destroy all child components
        if (this.lightboxManager) this.lightboxManager.destroy();
        if (this.settingsModal) this.settingsModal.destroy();
        if (this.sidebarManager) this.sidebarManager.destroy();
        if (this.inputManager) this.inputManager.destroy();
        if (this.fileManager) this.fileManager.destroy();

        // 4. Clear root element and DOM references
        this.rootElement.innerHTML = '';
        this.dom = {};
        
        console.log('ChatUI destroyed.');
    }

    /**
     * Handles the logic of sending a message, called by the InputManager.
     * @param {string} userInput - The text from the input field.
     * @param {ImageData | null} image - The attached image data, if any.
     */
    handleSendMessage(userInput, image) {
        if (this.engine.isLoading) {
            return;
        }

        if (userInput || image) {
            this.engine.sendMessage(userInput, image);
            this.inputManager.reset();
        }
    }

    /**
     * Updates the main chat view with the content of a given chat.
     * @param {import('../types.js').Chat} chat - The chat object to display.
     */
    updateChatView(chat) {
        if (!chat) return;
        this.inputManager.clearPreview();
        this.dom.mainTitle.textContent = chat.title;
        if (chat.messages.length > 0) {
            this.messageRenderer.renderHistory(chat.messages);
        } else {
            this.messageRenderer.showWelcomeMessage();
        }
    }
}

export default ChatUI;