# رابط‌های استاندارد (Interfaces)

هسته پیک بر اساس **قراردادها (Contracts)** طراحی شده است. برای اینکه هسته بتواند با دنیای خارج (ذخیره‌سازی، شبکه، مدل‌های هوش مصنوعی) تعامل داشته باشد، بدون اینکه به پیاده‌سازی خاصی وابسته باشد، از **Interface** ها استفاده می‌کند.

هر افزونه‌ای که می‌خواهد قابلیتی را به سیستم اضافه کند، باید یکی از این رابط‌ها را پیاده‌سازی نماید.

---

## چرا معماری Interface-محور؟

1.  **استقلال از محیط**: هسته نمی‌داند شما در مرورگر هستید یا Node.js. این رابط‌ها هستند که جزئیات محیط را پر می‌کنند.
2.  **تست‌پذیری**: به راحتی می‌توان برای تست، پیاده‌سازی‌های Mock (مثل `MemoryStorage`) را جایگزین پیاده‌سازی‌های واقعی کرد.
3.  **قابلیت تعویض**: کاربر می‌تواند به سادگی دیتابیس خود را از IndexedDB به LocalStorage یا یک سرور ابری تغییر دهد، فقط با تعویض افزونه.

---

## 1. StorageInterface

این رابط مسئولیت ذخیره و بازیابی اطلاعات (تنظیمات و چت‌ها) را بر عهده دارد.

**مسیر فایل:** `core/src/interfaces/storageInterface.js`

### متدها

#### `async saveSettings(settings)`
تنظیمات کل سیستم را ذخیره می‌کند.
*   `settings` (Object): آبجکت تنظیمات.

#### `async loadSettings()`
تنظیمات ذخیره‌شده را بازیابی می‌کند.
*   **بازگشت**: `Promise<Object|null>`

#### `async saveChat(chat)`
یک آبجکت چت (شامل پیام‌ها) را ذخیره یا به‌روزرسانی می‌کند.
*   `chat` (Object): داده‌های سریال‌سازی شده چت (خروجی `chat.toJSON()`).

#### `async loadChat(chatId)`
یک چت کامل را با شناسه بارگذاری می‌کند.
*   `chatId` (String): شناسه چت.
*   **بازگشت**: `Promise<Object|null>`

#### `async getAllChats()`
لیست خلاصه تمام چت‌ها را برمی‌گرداند. معمولاً برای سبک بودن، پیام‌ها در این لیست شامل نمی‌شوند.
*   **بازگشت**: `Promise<Array<Object>>`

#### `async deleteChat(chatId)`
یک چت را حذف می‌کند.
*   `chatId` (String): شناسه چت.

---

## 2. HttpClientInterface

این رابط وظیفه برقراری ارتباطات شبکه (HTTP) را بر عهده دارد.

**مسیر فایل:** `core/src/interfaces/httpClientInterface.js`

### متدها

#### `async request(url, options)`
یک درخواست HTTP استاندارد (تک‌مرحله‌ای) ارسال می‌کند.
*   `url` (String): آدرس مقصد.
*   `options` (Object): شامل `method`, `headers`, `body`.
*   **بازگشت**: `Promise<{ status, headers, data, ok }>`

#### `async streamRequest(url, options, onChunk, signal)`
یک درخواست HTTP با قابلیت دریافت استریم (مناسب برای پاسخ‌های طولانی AI) ارسال می‌کند.
*   `url` (String): آدرس مقصد.
*   `options` (Object): تنظیمات درخواست.
*   `onChunk` (Function): تابعی که با دریافت هر قطعه داده (Chunk) صدا زده می‌شود: `(chunkString) => void`.
*   `signal` (AbortSignal): سیگنال استاندارد برای قابلیت لغو درخواست.

---

## 3. ProviderInterface

این رابط قرارداد اتصال به مدل‌های زبانی (LLM) مختلف است.

**مسیر فایل:** `core/src/interfaces/providerInterface.js`

### ویژگی‌ها (Properties)

#### `get name()`
نام یکتای ارائه‌دهنده را برمی‌گرداند (مثلاً `'gemini'`, `'openai'`, `'custom'`).

### متدها

#### `validateConfig(config)`
بررسی می‌کند که آیا تنظیمات ورودی کاربر برای این مدل معتبر است یا خیر (مثلاً وجود API Key).
*   `config` (Object): تنظیمات مدل.
*   **پرتاب خطا**: در صورت نامعتبر بودن باید خطا پرتاب کند.

#### `async sendMessage(config, messages, onChunk, options)`
پیام‌ها را به مدل ارسال کرده و پاسخ را استریم می‌کند.
*   `config` (Object): تنظیمات مدل (مثل apiKey).
*   `messages` (Array): آرایه تاریخچه پیام‌ها با فرمت استاندارد پیک.
*   `onChunk` (Function): کالبک برای ارسال تکه‌های متن تولید شده به هسته.
*   `options` (Object): گزینه‌های اضافی مثل `signal`.

---

## نحوه پیاده‌سازی

برای ساخت یک افزونه جدید، کافیست از کلاس رابط مربوطه یا کلاس `Plugin` ارث‌بری کنید و متدها را Override کنید.

```javascript
import { Plugin } from '@peik/core';

class MyStorage extends Plugin { // یا extends StorageInterface
    async saveSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
    
    // ... سایر متدها
}
```