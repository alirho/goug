# راهنمای آداپتور ارائه‌دهنده (Provider Adapter Guide)

معماری `ChatEngine` به گونه‌ای طراحی شده که کاملاً ماژولار و قابل توسعه باشد. هسته برنامه هیچ وابستگی مستقیمی به یک API هوش مصنوعی خاص (مانند Gemini یا OpenAI) ندارد. در عوض، از طریق **الگوی آداپتور (Adapter Pattern)**، با یک رابط (Interface) استاندارد کار می‌کند.

"آداپتور ارائه‌دهنده" یک ماژول جاوااسکریپت است که به عنوان یک پل بین `ChatEngine` و API خارجی عمل می‌کند. این آداپتور مسئولیت ترجمه درخواست‌ها و پاسخ‌ها را بر عهده دارد. این رویکرد به شما اجازه می‌دهد تا به راحتی پشتیبانی از هر مدل هوش مصنوعی را به برنامه اضافه کنید، بدون اینکه نیاز به تغییر در کد هسته `ChatEngine` داشته باشید.

## 1. رابط API مورد نیاز (Required API Interface)

هر آداپتور ارائه‌دهنده باید یک تابع `async` با امضای زیر را `export` کند:

```javascript
/**
 * @param {object} settings - تنظیمات کاربر شامل apiKey, modelName, و هر فیلد سفارشی دیگر.
 * @param {Array<object>} history - تاریخچه گفتگو برای ارسال به API.
 * @param {Function} onChunk - یک تابع callback که برای هر قطعه متن دریافت شده از استریم باید فراخوانی شود.
 * @param {AbortSignal} [signal] - یک سیگنال اختیاری برای لغو درخواست.
 * @throws {ApiError|Error} - در صورت بروز خطا، باید یک Error پرتاب شود.
 */
export async function streamMyApiResponse(settings, history, onChunk, signal) {
    // پیاده‌سازی شما در اینجا قرار می‌گیرد
}
```

### پارامترها

-   **`settings: object`**:
    آبجکتی که از تنظیمات ذخیره شده کاربر می‌آید. این آبجکت حداقل شامل `provider`, `modelName`, `apiKey` است، اما می‌تواند فیلدهای سفارشی دیگری مانند `endpointUrl` (برای مدل‌های سفارشی) نیز داشته باشد.

-   **`history: Array<object>`**:
    آرایه‌ای از آبجکت‌های پیام که تاریخچه فعلی گفتگو را نشان می‌دهد. هر آبجکت پیام ساختار زیر را دارد:
    ```javascript
    {
        id: 'msg_1712345678_abcde', // شناسه یکتا
        role: 'user' | 'model',    // نقش پیام‌دهنده
        content: 'متن پیام...',      // محتوای متنی
        image: {                   // اختیاری: برای پیام‌های چندرسانه‌ای
            data: 'base64_string', // داده تصویر به صورت Base64
            mimeType: 'image/jpeg' // نوع MIME تصویر
        },
        timestamp: 1712345678901   // مهر زمانی ایجاد پیام
    }
    ```
    **نکته**: `ChatEngine` از نقش‌های `user` و `model` استفاده می‌کند. ممکن است API شما از نام‌های دیگری مانند `assistant` استفاده کند که باید در آداپتور خود آن‌ها را تبدیل کنید.

-   **`onChunk: (chunk: string) => void`**:
    یک تابع `callback` که **باید** برای هر قطعه از متن (`string`) که از API به صورت استریم دریافت می‌شود، فراخوانی شود. این کار برای نمایش پاسخ به صورت کلمه به کلمه در UI ضروری است.

-   **`signal: AbortSignal`**:
    (اختیاری) یک سیگنال از `AbortController` که برای لغو درخواست `fetch` استفاده می‌شود. شما **باید** این سیگنال را به درخواست شبکه خود متصل کنید تا قابلیت لغو به درستی کار کند.

## 2. مراحل پیاده‌سازی یک آداپتور جدید

فرض کنید می‌خواهیم یک آداپتور برای سرویس فرضی "ExampleAI" ایجاد کنیم.

### مرحله ۱: ایجاد فایل Provider
یک فایل جدید در مسیر `js/core/providers/` ایجاد کنید. برای مثال: `exampleAiProvider.js`.

### مرحله ۲: ساخت تابع اصلی
ساختار اصلی تابع را در فایل جدید خود بنویسید:
```javascript
// js/core/providers/exampleAiProvider.js
import { fetchStreamWithRetries } from '../../services/apiService.js';
import { getErrorMessageForStatus, ApiError } from '../../utils/apiErrors.js';

export async function streamExampleAiResponse(settings, history, onChunk, signal) {
    // منطق اصلی در مراحل بعدی اضافه می‌شود
}
```

### مرحله ۳: ساخت بدنه درخواست
تاریخچه پیام‌ها (`history`) را به فرمتی که API `ExampleAI` انتظار دارد، تبدیل کنید.

```javascript
function buildRequestBody(settings, history) {
    // فرض کنید ExampleAI نقش 'assistant' را به جای 'model' می‌پذیرد
    const messages = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content || '' // اطمینان از وجود محتوای متنی
        // فرض کنید این API تصویر را پشتیبانی نمی‌کند
    }));

    return {
        model: settings.modelName,
        messages: messages,
        stream: true
    };
}
```

### مرحله ۴: استفاده از `apiService` برای ارسال درخواست
ماژول `apiService` یک تابع کمکی به نام `fetchStreamWithRetries` فراهم می‌کند که منطق تلاش مجدد (retry)، وقفه زمانی (timeout) و خواندن استریم را مدیریت می‌کند.

```javascript
// داخل تابع streamExampleAiResponse

const API_URL = 'https://api.example.ai/v1/chat/completions';
const requestBody = buildRequestBody(settings, history);

const fetchOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal, // <--- سیگنال لغو را به گزینه‌ها اضافه کنید
};

await fetchStreamWithRetries(
    API_URL,
    fetchOptions,
    (line) => processStreamLine(line, onChunk), // تابع پردازش هر خط
    getApiErrorMessage // تابع استخراج پیام خطا
);
```

### مرحله ۵: پردازش پاسخ استریم و خطاها
شما باید دو تابع `callback` برای `fetchStreamWithRetries` پیاده‌سازی کنید:

1.  **`processStreamLine`**: این تابع برای هر خط (`string`) که از پاسخ استریم دریافت می‌شود، اجرا می‌شود. شما باید این خط را تجزیه (parse) کرده، محتوای متنی را استخراج کنید و `onChunk(text)` را فراخوانی کنید.
2.  **`getApiErrorMessage`**: اگر پاسخ سرور یک خطا باشد (مثلاً status 401)، این تابع برای استخراج یک پیام خطای قابل فهم از بدنه پاسخ فراخوانی می‌شود.

```javascript
// فرض کنید پاسخ استریم ExampleAI به این شکل است: data: {"chunk": "some text"}\n\n
function processStreamLine(line, onChunk) {
    if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6).trim();
        if (jsonStr === '[DONE]') return; // سیگنال پایان استریم
        try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.chunk;
            if (text) {
                onChunk(text);
            }
        } catch (e) {
            console.warn("Error parsing stream chunk:", line, e);
        }
    }
}

// فرض کنید پاسخ خطای ExampleAI یک آبجکت JSON با فیلد `detail` است
async function getApiErrorMessage(response) {
    try {
        const errorData = await response.json();
        return errorData?.detail?.message || getErrorMessageForStatus(response.status);
    } catch {
        return getErrorMessageForStatus(response.status);
    }
}
```

### مرحله ۶: ثبت Provider جدید
در نهایت، آداپتور جدید خود را در فایل ورودی اصلی برنامه (`js/main.js`) ثبت کنید.

```javascript
// js/main.js
import ChatEngine from './core/chatEngine.js';
// ... import‌های دیگر
import { streamGeminiResponse } from './core/providers/geminiProvider.js';
import { streamOpenAIResponse } from './core/providers/openaiProvider.js';
import { streamCustomResponse } from './core/providers/customProvider.js';
import { streamExampleAiResponse } from './core/providers/exampleAiProvider.js'; // <- ایمپورت جدید

document.addEventListener('DOMContentLoaded', async () => {
    // ...
    const chatEngine = new ChatEngine({
        storage: IndexedDBStorage,
        providers: {
            gemini: streamGeminiResponse,
            openai: streamOpenAIResponse,
            custom: streamCustomResponse,
            example_ai: streamExampleAiResponse, // <- ثبت آداپتور جدید
        }
    });
    // ...
});
```
اکنون کاربران می‌توانند با انتخاب `example_ai` به عنوان `provider` در تنظیمات، از این سرویس جدید استفاده کنند.

### مرحله ۷ (اختیاری): به‌روزرسانی UI تنظیمات
اگر ارائه‌دهنده جدید شما نیاز به فیلدهای خاصی در تنظیمات دارد (مثلاً یک URL سفارشی)، باید:
1.  فایل `templates/settingsModal.html` را ویرایش کرده و فیلدهای ورودی HTML لازم را اضافه کنید.
2.  فایل `js/ui/components/settingsModal.js` را ویرایش کرده تا منطق خواندن و نوشتن مقادیر این فیلدهای جدید را مدیریت کند.