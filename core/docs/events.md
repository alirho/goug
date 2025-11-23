# سیستم رویدادها (Events System)

هسته پیک کاملاً **رویداد-محور (Event-Driven)** است. این یعنی اجزای مختلف سیستم (مانند رابط کاربری و هسته) از طریق انتشار و شنیدن رویدادها با یکدیگر هماهنگ می‌شوند.

کلاس `EventEmitter` در هسته (`core/src/eventEmitter.js`) مسئولیت مدیریت این رویدادها را بر عهده دارد.

---

## نحوه استفاده

هر کلاسی که از `EventEmitter` ارث‌بری کرده باشد (مانند `Peik` و `Chat`)، متدهای زیر را دارد:

### `on(eventName, listener)`
گوش دادن به یک رویداد.
```javascript
peik.on('ready', (data) => {
    console.log('سیستم آماده شد');
});
```

### `off(eventName, listener)`
حذف یک شنونده خاص.
```javascript
const myListener = () => console.log('پیام آمد');
chat.on('message', myListener);
// ... بعداً
chat.off('message', myListener);
```

### `emit(eventName, data)`
انتشار یک رویداد (معمولاً توسط خود کلاس انجام می‌شود، اما افزونه‌ها نیز می‌توانند استفاده کنند).

---

## لیست رویدادهای کلاس `Peik`

این رویدادها در سطح سیستم رخ می‌دهند.

| نام رویداد | داده همراه (Payload) | توضیحات |
| :--- | :--- | :--- |
| `ready` | `{ settings, chats }` | زمانی که `init()` تمام شده و سیستم آماده است. |
| `error` | `PeikError` | خطاهای عمومی سیستم (مثل خطای لودینگ). |
| `chat:created` | `Chat` (instance) | زمانی که یک گپ جدید ساخته می‌شود. |
| `chat:updated` | `Chat` (summary object) | زمانی که عنوان یا مشخصات گپ تغییر می‌کند. |
| `chat:deleted` | `chatId` (string) | زمانی که یک گپ حذف می‌شود. |
| `settings:updated` | `Settings` (object) | زمانی که تنظیمات سراسری تغییر می‌کند. |

---

## لیست رویدادهای کلاس `Chat`

این رویدادها مربوط به یک گفتگوی خاص هستند.

| نام رویداد | داده همراه (Payload) | توضیحات |
| :--- | :--- | :--- |
| `message` | `Message` (object) | زمانی که پیام جدیدی (از طرف کاربر یا مدل) به لیست اضافه می‌شود. |
| `sending` | `{ chatId }` | زمانی که درخواست به سمت سرور API ارسال می‌شود. |
| `chunk` | `{ messageId, chunk }` | دریافت تکه‌ای از پاسخ متنی (در حالت استریم). |
| `response:complete` | `Message` (object) | زمانی که پاسخ مدل کامل می‌شود. |
| `message:removed` | `messageId` (string) | زمانی که پیامی حذف می‌شود (مثلاً در صورت خطای ارسال). |
| `error` | `Error` | خطای خاص مربوط به این گفتگو (مثلاً قطعی شبکه). |
| `update` | `Chat` (instance) | تغییرات کلی در وضعیت چت (عنوان، مدل). |

---

## مثال کاربردی: به‌روزرسانی UI

الگوی معمول در افزونه‌های رابط کاربری (UI) به این صورت است:

```javascript
// ۱. گوش دادن به رویدادهای کلی سیستم
peik.on('chat:created', (newChat) => {
    sidebar.addAndSelect(newChat);
    
    // ۲. اتصال به رویدادهای گپ جدید
    newChat.on('message', (msg) => {
        messageList.render(msg);
    });
    
    newChat.on('chunk', ({ chunk }) => {
        messageList.streamText(chunk);
    });
});
```