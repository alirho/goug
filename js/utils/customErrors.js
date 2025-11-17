/**
 * @file This file contains custom error classes for the application for better error handling.
 */

/**
 * Base class for application-specific errors.
 */
export class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Error thrown when another version of the app is open in another tab, causing an IndexedDB VersionError.
 */
export class VersionError extends AppError {
    constructor(message = "نسخه جدیدی از برنامه در تب دیگری باز است. لطفاً تمام تب‌ها را بسته و دوباره امتحان کنید.") {
        super(message);
    }
}

/**
 * Error thrown when the browser does not support a required feature, like IndexedDB.
 */
export class StorageSupportError extends AppError {
    constructor(message = "مرورگر شما از IndexedDB پشتیبانی نمی‌کند. امکان ذخیره تاریخچه وجود ندارد.") {
        super(message);
    }
}

/**
 * Error thrown when access to browser storage (IndexedDB) is denied or fails for unknown reasons.
 */
export class StorageAccessError extends AppError {
    constructor(message = "امکان دسترسی به فضای ذخیره‌سازی مرورگر وجود ندارد.") {
        super(message);
    }
}

/**
 * Error thrown when a storage transaction fails due to exceeding the browser's quota.
 */
export class QuotaExceededError extends AppError {
    constructor(message = "فضای ذخیره‌سازی مرورگر پر است. لطفاً گپ‌های قدیمی را حذف کنید.") {
        super(message);
    }
}

/**
 * Error thrown for generic, non-specific storage transaction failures.
 */
export class GenericStorageError extends AppError {
    constructor(message = "خطایی در ذخیره‌سازی داده‌ها رخ داد.") {
        super(message);
    }
}

/**
 * Error thrown when a network request fails, likely due to connectivity issues.
 */
export class NetworkError extends AppError {
    constructor(message = "اتصال به اینترنت برقرار نیست.") {
        super(message);
    }
}

/**
 * Error thrown when an HTML template file cannot be loaded.
 */
export class TemplateLoadError extends AppError {
    constructor(path) {
        super(`Could not load template: ${path}`);
        this.path = path;
    }
}
