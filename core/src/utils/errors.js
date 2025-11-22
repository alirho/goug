/**
 * کلاس پایه برای خطاهای هسته پیک.
 */
export class PeikError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
    }
}

export class NotImplementedError extends PeikError {
    constructor(methodName) {
        super(`متد ${methodName} پیاده‌سازی نشده است.`, 'NOT_IMPLEMENTED');
    }
}

export class PluginError extends PeikError {
    constructor(message, details) {
        super(message, 'PLUGIN_ERROR', details);
    }
}

export class ValidationError extends PeikError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
    }
}

export class ProviderError extends PeikError {
    constructor(message, statusCode = null) {
        super(message, 'PROVIDER_ERROR', { statusCode });
    }
}

export class StorageError extends PeikError {
    constructor(message) {
        super(message, 'STORAGE_ERROR');
    }
}