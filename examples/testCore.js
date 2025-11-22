import { Peik } from '../core/src/index.js';
import MemoryStorage from '../plugins/platform/memoryStorage/index.js';
import FetchHttp from '../plugins/platform/fetchHttp/index.js';
import GeminiProvider from '../plugins/core/geminiProvider/index.js';

// دریافت کلید API از ورودی‌های محیطی
const API_KEY = process.env.API_KEY || 'YOUR_GEMINI_API_KEY';

async function main() {
    console.log('🚀 در حال راه‌اندازی هسته پیک...');

    // ۱. نمونه‌سازی از هسته
    const peik = new Peik();

    // ۲. ثبت افزونه‌ها (ترتیب مهم است: ذخیره‌سازی -> شبکه -> ارائه‌دهندگان)
    // توجه: use() زنجیره‌ای نیست چون در پیاده‌سازی فعلی peik.js مقدار this برمی‌گرداند اما registerсинک است.
    // اگر register async است، باید await شود.
    await peik.use(new MemoryStorage());
    await peik.use(new FetchHttp());
    await peik.use(new GeminiProvider());

    // ۳. گوش دادن به رویدادهای سیستمی
    peik.on('ready', () => console.log('✅ سیستم آماده است (رویداد: ready)'));
    peik.on('chat:created', (chat) => console.log(`✅ گپ جدید ایجاد شد: "${chat.title}" (ID: ${chat.id})`));
    peik.on('error', (err) => console.error('❌ خطای سیستم:', err.message));

    // ۴. مقداردهی اولیه
    await peik.init();

    // ۵. تنظیم پیکربندی (شبیه‌سازی تنظیمات کاربر)
    // نکته: چون از MemoryStorage استفاده می‌کنیم، باید هر بار تنظیمات را ست کنیم.
    await peik.updateSettings({
        activeProviderId: 'gemini',
        providers: {
            gemini: {
                apiKey: API_KEY,
                modelName: 'gemini-2.0-flash-exp' // یا هر مدل معتبر دیگر
            },
            openai: { apiKey: '', modelName: '' },
            custom: []
        }
    });
    console.log('⚙️ تنظیمات اعمال شد.');

    // ۶. ایجاد یک گپ جدید
    const chat = await peik.createChat('آزمون هسته پیک');

    // ۷. گوش دادن به رویدادهای گپ
    chat.on('sending', () => process.stdout.write('\n🤖 در حال دریافت پاسخ: '));
    
    // دریافت استریم و چاپ در ترمینال بدون خط جدید
    chat.on('chunk', ({ chunk }) => {
        process.stdout.write(chunk);
    });

    chat.on('response:complete', (msg) => {
        console.log('\n\n✨ پاسخ کامل شد!');
        printSummary(chat, msg);
    });

    chat.on('error', (err) => {
        console.error('\n❌ خطای گپ:', err.message);
        if (err.statusCode === 401 || err.message.includes('API key')) {
            console.error('⚠️ نکته: لطفاً مطمئن شوید که متغیر محیطی API_KEY را به درستی تنظیم کرده‌اید.');
        }
    });

    // ۸. ارسال پیام
    const userMessage = 'سلام! لطفاً یک شعر کوتاه فارسی بگو.';
    console.log(`\n👤 کاربر: ${userMessage}`);
    
    // بررسی وجود کلید قبل از ارسال برای جلوگیری از خطای واضح
    if (API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.warn('\n⚠️ هشدار: کلید API تنظیم نشده است. لطفاً فایل را ویرایش کنید یا API_KEY را در محیط تنظیم کنید.');
    }

    await chat.sendMessage(userMessage);
}

function printSummary(chat, lastMessage) {
    console.log('--------------------------------------------------');
    console.log('📊 خلاصه آزمون:');
    console.log(`   🏷️  عنوان گپ: ${chat.title}`);
    console.log(`   💬 تعداد پیام‌ها: ${chat.messages.length}`);
    console.log(`   📝 طول پاسخ نهایی: ${lastMessage.content.length} کاراکتر`);
    console.log(`   🧠 مدل استفاده شده: ${chat.modelInfo.displayName} (${chat.modelInfo.modelName})`);
    console.log('--------------------------------------------------');
}

main().catch(err => console.error('خطای غیرمنتظره در اجرای اسکریپت:', err));