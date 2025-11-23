# راهنمای تم‌دهی و شخصی‌سازی (Theming Guide)

ظاهر پیک کاملاً قابل شخصی‌سازی است. ما از **CSS Custom Properties (Variables)** استفاده کرده‌ایم تا شما بتوانید بدون تغییر در کدهای پیچیده CSS، رنگ‌بندی و فونت برنامه را تغییر دهید.

تمام متغیرها در فایل `plugins/presentation/webUI/styles/variables.css` تعریف شده‌اند.

---

## متغیرهای اصلی

| نام متغیر | توضیح | مقدار پیش‌فرض (Light) |
| :--- | :--- | :--- |
| `--color-primary` | رنگ اصلی (دکمه‌ها، حباب پیام کاربر) | `#135bec` (آبی) |
| `--font-family` | فونت کل برنامه | `'Vazirmatn', sans-serif` |
| `--bg-light` | رنگ پس‌زمینه کل صفحه | `#f6f6f8` |
| `--surface-light` | رنگ سطح (سایدبار، کارت‌ها) | `#ffffff` |
| `--text-light` | رنگ متن اصلی | `#1e293b` |

---

## حالت تاریک (Dark Mode)

پیک به صورت پیش‌فرض از کلاس `dark` روی تگ `<html>` برای فعال‌سازی حالت تاریک استفاده می‌کند. متغیرهای مربوط به حالت تاریک با پسوند `-dark` مشخص شده‌اند یا در سلکتور `html.dark` بازنویسی می‌شوند.

```css
html.dark body {
    background-color: var(--bg-dark); /* #101622 */
    color: var(--text-dark);          /* #ffffff */
}
```

---

## چطور تم سفارشی بسازیم؟

برای تغییر تم، کافیست یک فایل CSS جدید بسازید و متغیرهای ریشه (`:root`) را بازنویسی کنید.

### مثال: تم سبز (Forest Theme)

```css
/* custom-theme.css */
:root {
    --color-primary: #059669;       /* سبز زمردی */
    --color-primary-hover: #047857;
    --color-primary-light: rgba(5, 150, 105, 0.1);
    
    /* تغییر فونت */
    --font-family: 'Tahoma', sans-serif;
}
```

سپس این فایل را بعد از فایل `main.css` در `index.html` لینک کنید.

---

## تغییر فونت

برای تغییر فونت فارسی:
1.  فونت مورد نظر (مثلاً "B Nazanin" یا "IranSans") را در پروژه بارگذاری کنید (یا از CDN استفاده کنید).
2.  متغیر `--font-family` را تغییر دهید:

```css
:root {
    --font-family: 'IranSans', 'Vazirmatn', sans-serif;
}
```
