# راهنمای توسعه‌دهندگان (Developer Guide)

این راهنما برای کسانی است که می‌خواهند از `@peik/core` در پروژه‌های خود استفاده کنند یا برای پیک افزونه بسازند.

---

## معماری در یک نگاه

هسته پیک (`Core`) هیچ اطلاعی از HTML یا DOM ندارد. تمام تعاملات از طریق متدهای کلاس `Peik` و سیستم رویداد (`EventEmitter`) انجام می‌شود.

```
کاربر (UI)  --->  peik.createChat()  --->  [Core]
                                             |
                                             v  (انتخاب ارائه‌دهنده)
[Gemini API]  <<--  [Network Plugin]  <<--  [Provider Plugin]
```

---

## استفاده از هسته (Peik Core)

```javascript
import { Peik } from './core/src/index.js';
// ایمپورت کردن افزونه‌های مورد نیاز
import MemoryStorage from './plugins/platform/memoryStorage/index.js';
import FetchHttp from './plugins/platform/fetchHttp/index.js';
import GeminiProvider from './plugins/core/geminiProvider/index.js';

(async () => {
    const peik = new Peik();

    // ۱. تزریق وابستگی‌ها (Dependency Injection)
    await peik.use(new MemoryStorage());
    await peik.use(new FetchHttp());
    await peik.use(new GeminiProvider());

    // ۲. راه‌اندازی
    await peik.init();

    // ۳. تنظیمات
    await peik.updateSettings({
        activeProviderId: 'gemini',
        providers: { 
            gemini: { apiKey: '...', modelName: 'gemini-pro' } 
        }
    });

    // ۴. ایجاد گپ و گوش دادن به رویدادها
    const chat = await peik.createChat('تست توسعه');
    
    chat.on('chunk', ({ chunk }) => {
        console.log(chunk); // دریافت استریم پاسخ
    });

    await chat.sendMessage('سلام دنیا!');
})();
```

---

## ساخت افزونه جدید

تمام افزونه‌ها باید از کلاس `Plugin` ارث‌بری کنند.

### مثال: افزونه لاگر ساده

```javascript
import { Plugin } from './core/src/index.js';

export default class LoggerPlugin extends Plugin {
    static get metadata() {
        return {
            name: 'logger',
            version: '1.0.0',
            category: 'utility'
        };
    }

    async install(context) {
        // دسترسی به هسته از طریق context
        context.on('chat:created', (chat) => {
            console.log(`گپ جدید ساخته شد: ${chat.title}`);
        });
    }
}
```

---

## رفرنس سریع API

### `peik.use(plugin)`
ثبت یک افزونه.

### `peik.createChat(title)`
ایجاد یک گپ جدید و بازگرداندن شیء `Chat`.

### `chat.sendMessage(content, image?)`
ارسال پیام. این متد رویدادهای `message`, `sending`, `chunk`, `response:complete` را منتشر می‌کند.

### `peik.updateSettings(settings)`
ذخیره تنظیمات کل سیستم.

### `chat.updateTitle(newTitle)`
تغییر نام چت.

---

## نحوه Debug کردن

برای رفع اشکال در هنگام توسعه افزونه یا کار با هسته، می‌توانید از روش‌های زیر استفاده کنید:

### ۱. استفاده از کنسول مرورگر (Browser Console)
بیشتر خطاها و هشدارهای سیستم (مانند `PeikError` یا `PluginError`) در کنسول لاگ می‌شوند. کلید `F12` را بزنید و تب **Console** را بررسی کنید.

### ۲. بررسی درخواست‌های شبکه
اگر با خطای اتصال به مدل‌ها مواجه هستید (مثل خطای ۴۰۱ یا Network Error):
1.  در ابزار توسعه‌دهنده (DevTools) به تب **Network** بروید.
2.  به دنبال درخواست‌هایی با نام `streamGenerateContent` (برای Gemini) یا `completions` (برای OpenAI) بگردید.
3.  پاسخ (Response) سرور را بررسی کنید تا جزئیات دقیق خطا را ببینید.

### ۳. بررسی داده‌های ذخیره‌شده
برای اطمینان از ذخیره شدن چت‌ها و تنظیمات:
1.  در ابزار توسعه‌دهنده به تب **Application** بروید.
2.  از بخش **Storage**، گزینه **IndexedDB** را باز کنید.
3.  پایگاه داده `PeikDB` را انتخاب کنید تا جداول `chats` و `settings` را ببینید.

### ۴. گوش دادن به رویداد `error`
همیشه در کد اصلی خود به رویداد خطای سراسری گوش دهید تا از خطاهای پیش‌بینی نشده مطلع شوید:

```javascript
peik.on('error', (err) => {
    console.error('خطای سیستمی دریافت شد:', err);
});
```