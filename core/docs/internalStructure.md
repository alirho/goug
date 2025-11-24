# ساختار داخلی هسته (Core Internal Structure)

این سند جزئیات فنی نحوه سازماندهی کدهای درون پکیج `@peik/core` را توضیح می‌دهد. این اطلاعات برای توسعه‌دهندگانی که قصد مشارکت در توسعه خودِ هسته را دارند، حیاتی است.

---

## نمای کلی

کد هسته برای جلوگیری از پیچیدگی (Complexity) و رعایت اصول **SOLID**، به چندین زیرماژول تقسیم شده است. کلاس اصلی `Peik` اکنون به عنوان یک **Facade (نما)** عمل می‌کند که پیچیدگی‌های زیرسیستم را از دید کاربر پنهان می‌سازد.

```
core/src/
├── peik.js                  # Facade Class (Public API)
├── chat.js                  # Chat Entity Logic
├── managers/                # State & Lifecycle Management
│   ├── chatManager.js       # CRUD for Chats
│   └── settingsManager.js   # Settings Logic
├── services/                # Stateless Logic Helpers
│   ├── providerResolver.js  # Logic to find AI providers
│   └── modelInfoHelper.js   # Formatting logic
└── ...
```

---

## ۱. کلاس `Peik` (The Facade)

این کلاس نقطه مرکزی سیستم است، اما دیگر منطق سنگینی ندارد.
*   **وظایف**:
    *   راه‌اندازی (Instantiate) تمام Managerها و Serviceها در `constructor`.
    *   ارائه متدهای عمومی (`createChat`, `updateSettings`) که درخواست‌ها را به Manager مربوطه هدایت (Proxy) می‌کنند.
    *   مدیریت رویدادهای سطح بالا (`init`, `ready`).

---

## ۲. مدیرها (Managers)

Managerها مسئول نگهداری وضعیت (State) و مدیریت چرخه حیات موجودیت‌های سیستم هستند.

### `ChatManager`
*   **مسئولیت**: مدیریت لیست تمام چت‌ها و عملیات CRUD.
*   **داده‌ها**:
    *   `chats`: آرایه‌ای از خلاصه‌ی چت‌ها.
    *   `chatRuntimeStates`: یک `Map` برای نگهداری وضعیت‌های لحظه‌ای (مثل `isSending`, `abortController`) که نباید در دیتابیس ذخیره شوند.
*   **متدها**: `load`, `createChat`, `getChat`, `deleteChat`, `renameChat`.

### `SettingsManager`
*   **مسئولیت**: بارگذاری، ذخیره و اعتبارسنجی تنظیمات سراسری.
*   **داده‌ها**:
    *   `settings`: آبجکت تنظیمات جاری.
*   **متدها**: `load`, `updateSettings`, `saveSettings`, `isValid`.

### `PluginManager`
*   **مسئولیت**: ثبت افزونه‌ها، مدیریت وابستگی‌ها و دسترسی به افزونه‌های فعال.

---

## ۳. سرویس‌ها (Services)

Serviceها کلاس‌هایی هستند که معمولاً وضعیت (State) خاصی ندارند و فقط منطق یا عملیات خاصی را انجام می‌دهند (Helper Logic).

### `ProviderResolver`
*   **مسئولیت**: منطق پیچیده انتخاب اینکه کدام افزونه Provider باید برای یک چت خاص استفاده شود.
*   **کارکرد**: بررسی می‌کند آیا چت از مدل سفارشی استفاده می‌کند یا مدل‌های پیش‌فرض (Gemini/OpenAI) و پیکربندی نهایی را برمی‌گرداند.

### `ModelInfoHelper`
*   **مسئولیت**: تبدیل اطلاعات فنی مدل (مثل ID و Provider Name) به اطلاعات قابل نمایش در UI (مثل نام نمایشی فارسی).

---

## ۴. موجودیت‌ها (Entities)

### `Chat`
*   این کلاس نماینده یک گفتگوی واحد است.
*   برخلاف Managerها، این کلاس برای هر گفتگو یک نمونه (Instance) جدید ساخته می‌شود.
*   متد `sendMessage` در این کلاس قرار دارد که با `ProviderResolver` و افزونه‌ها تعامل می‌کند.

---

## ۵. چرا این تغییرات انجام شد؟

در نسخه‌های اولیه، تمام منطق در فایل `peik.js` جمع شده بود که منجر به ایجاد "God Class" (کلاسی که همه کار می‌کند) شده بود. با این تفکیک:
1.  **خوانایی**: فایل‌ها کوچکتر و متمرکزتر هستند.
2.  **تست‌پذیری**: می‌توان `SettingsManager` را جداگانه و بدون نیاز به `ChatManager` تست کرد.
3.  **نگهداری**: افزودن قابلیت جدید به چت‌ها نیازی به تغییر در فایل اصلی `peik.js` ندارد.
