import { ValidationError } from './errors.js';

export const Validator = {
    required(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            throw new ValidationError(`فیلد «${fieldName}» الزامی است.`);
        }
    },

    string(value, fieldName) {
        if (typeof value !== 'string') {
            throw new ValidationError(`فیلد «${fieldName}» باید از نوع رشته باشد.`);
        }
    },

    object(value, fieldName) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new ValidationError(`فیلد «${fieldName}» باید یک آبجکت باشد.`);
        }
    },

    array(value, fieldName) {
        if (!Array.isArray(value)) {
            throw new ValidationError(`فیلد «${fieldName}» باید یک آرایه باشد.`);
        }
    }
};