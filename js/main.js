import ChatEngine from './core/chatEngine.js';
import ChatUI from './ui/chatUI.js';
import { streamGeminiResponse } from './core/providers/geminiProvider.js';
import { streamOpenAIResponse } from './core/providers/openaiProvider.js';
import { streamCustomResponse } from './core/providers/customProvider.js';
import { VersionError, StorageSupportError, StorageAccessError } from './utils/customErrors.js';

// --- Storage Implementation ---
// The ChatEngine is designed to be storage-agnostic. We are injecting
// the IndexedDB adapter here to provide persistent storage for the web app.
// Another adapter (e.g., for a file system in Node.js) could be used
// without changing the core engine. See `docs/storageAdaptorGuide.md`.
import * as IndexedDBStorage from './services/indexedDBStorage.js';

/**
 * Displays a detailed fatal error message to the user, helping them diagnose the issue.
 * @param {HTMLElement} rootElement The element to render the error into.
 * @param {Error} error The error object.
 */
function displayFatalError(rootElement, error) {
    console.error('A fatal error occurred during initialization:', error);

    let title = 'خطا در بارگذاری برنامه';
    let message = 'متاسفانه مشکلی در هنگام راه‌اندازی برنامه پیش آمده است. لطفاً صفحه را مجدداً بارگیری کنید.';
    let showReloadButton = true;

    // Use instanceof for type-safe error checking
    if (error instanceof VersionError) {
        title = 'نسخه دیگری از برنامه باز است';
        message = 'به نظر می‌رسد نسخه دیگری از «گوگ» در یک تب دیگر باز است که مانع از بارگذاری این صفحه می‌شود. لطفاً تمام تب‌های دیگر این برنامه را بسته و سپس صفحه را مجدداً بارگیری کنید.';
    } else if (error instanceof StorageSupportError) {
        title = 'مرورگر شما پشتیبانی نمی‌شود';
        message = 'متاسفانه مرورگر شما از قابلیت‌های لازم برای ذخیره‌سازی تاریخچه گفتگو پشتیبانی نمی‌کند. لطفاً از یک مرورگر مدرن مانند کروم، فایرفاکس یا اج استفاده کنید.';
        showReloadButton = false;
    } else if (error instanceof StorageAccessError) {
        title = 'مشکل در دسترسی به حافظه';
        message = 'برنامه نتوانست به فضای ذخیره‌سازی مرورگر شما دسترسی پیدا کند. این مشکل ممکن است به دلیل تنظیمات حریم خصوصی مرورگر یا استفاده از حالت ناشناس (Incognito) باشد. لطفاً تنظیمات خود را بررسی کرده و دوباره تلاش کنید.';
    }

    const reloadButtonHtml = showReloadButton
        ? `<div class="fatal-error-actions">
               <button id="reload-button" class="btn btn-primary" style="width: auto; padding: 0 1.5rem;">بارگیری مجدد</button>
           </div>`
        : '';
        
    // Center the error container vertically and horizontally
    rootElement.style.display = 'flex';
    rootElement.style.alignItems = 'center';
    rootElement.style.justifyContent = 'center';
    rootElement.style.height = '100vh';

    rootElement.innerHTML = `
        <div class="fatal-error-container">
            <div class="fatal-error-icon">
                <span class="material-symbols-outlined">error</span>
            </div>
            <h2 class="fatal-error-title">${title}</h2>
            <p class="fatal-error-message">${message}</p>
            ${reloadButtonHtml}
        </div>
    `;

    if (showReloadButton) {
        document.getElementById('reload-button').addEventListener('click', () => {
            window.location.reload();
        });
    }
}

/**
 * Initializes the application when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        console.error('Fatal Error: Root element #root not found.');
        document.body.innerHTML = '<p style="color: red; padding: 1rem; text-align: center;">خطای مهلک: المان اصلی برنامه یافت نشد.</p>';
        return;
    }

    try {
        // Instantiate the core logic with injected storage and providers
        const chatEngine = new ChatEngine({
            storage: IndexedDBStorage,
            providers: {
                gemini: streamGeminiResponse,
                openai: streamOpenAIResponse,
                custom: streamCustomResponse,
            }
        });
        const chatUI = new ChatUI(chatEngine, rootElement);

        // Ensure the UI is fully initialized before the engine starts emitting events
        await chatUI.init();
        await chatEngine.init();

        // Add cleanup logic for when the user leaves the page
        window.addEventListener('beforeunload', () => {
            if (chatUI) chatUI.destroy();
            if (chatEngine) chatEngine.destroy();
        });

    } catch (error) {
        displayFatalError(rootElement, error);
    }
});