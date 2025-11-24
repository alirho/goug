// وارد کردن تایپ‌ها برای JSDoc
/** @typedef {import('../../types.js').Settings} Settings */
/** @typedef {import('../../types.js').CustomProviderConfig} CustomProviderConfig */
/** @typedef {import('../../../core/src/peik.js').default} Peik */

/**
 * رابط کاربری و منطق مودال تنظیمات را مدیریت می‌کند.
 */
class SettingsModal {
    /**
     * @param {Peik} peik - نمونه اصلی هسته پیک.
     */
    constructor(peik) {
        this.peik = peik;
        this.cacheDOMElements();
        
        this.confirmHandler = null;

        // --- ثبت event handlerهای bind شده برای حذف آسان ---
        this.handleSaveBound = this.handleSave.bind(this);
        this.hideBound = () => this.show(false);
        this.showBound = () => this.show(true);
        this.handleAddCustomProviderBound = this.handleAddCustomProvider.bind(this);
        this.handleCustomListClickBound = this.handleCustomListClick.bind(this);
        this.handleCustomListInputBound = this.handleCustomListInput.bind(this);
        
        // Validation handlers
        this.handleStaticInputValidationBound = this.handleStaticInputValidation.bind(this);
        this.handleCustomInputValidationBound = this.handleCustomInputValidation.bind(this);

        this.hideConfirmationModalBound = this.hideConfirmationModal.bind(this);
        this.handleConfirmBound = this._handleConfirm.bind(this);
        
        // Bound handlers for static toggles
        this.handleGeminiToggle = () => this.togglePasswordVisibility(this.geminiKeyInput, this.geminiKeyToggle);
        this.handleChatgptToggle = () => this.togglePasswordVisibility(this.chatgptKeyInput, this.chatgptKeyToggle);
        
        this.bindEvents();
    }

    /**
     * ارجاع به المان‌های DOM پرکاربرد در مودال را کش می‌کند.
     */
    cacheDOMElements() {
        this.modal = document.getElementById('settings-modal');
        this.form = document.getElementById('settings-form');
        this.cancelButton = document.getElementById('cancel-settings-button');
        this.editButton = document.getElementById('edit-settings-button');
        
        // فیلدهای استاتیک
        this.geminiModelInput = document.getElementById('gemini-model-input');
        this.geminiKeyInput = document.getElementById('gemini-key-input');
        this.geminiKeyToggle = document.getElementById('gemini-key-toggle');
        this.chatgptModelInput = document.getElementById('chatgpt-model-input');
        this.chatgptKeyInput = document.getElementById('chatgpt-key-input');
        this.chatgptKeyToggle = document.getElementById('chatgpt-key-toggle');

        // بخش سفارشی
        this.addCustomProviderButton = document.getElementById('add-custom-provider-button');
        this.customProviderList = document.getElementById('custom-provider-list');
        this.customProviderTemplate = document.getElementById('custom-provider-template');

        // چک‌باکس امنیتی
        this.sessionOnlyCheckbox = document.getElementById('session-only-checkbox');
        
        // المان‌های مودال تأیید
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.confirmationModalTitle = document.getElementById('confirmation-modal-title');
        this.confirmationModalBody = document.getElementById('confirmation-modal-body');
        this.confirmationModalCancel = document.getElementById('confirmation-modal-cancel');
        this.confirmationModalConfirm = document.getElementById('confirmation-modal-confirm');
    }

    /**
     * شنوندگان رویداد را به المان‌های تعاملی مودال متصل می‌کند.
     */
    bindEvents() {
        if (this.form) this.form.addEventListener('submit', this.handleSaveBound);
        if (this.cancelButton) this.cancelButton.addEventListener('click', this.hideBound);
        if (this.editButton) this.editButton.addEventListener('click', this.showBound);
        
        if (this.geminiKeyToggle) this.geminiKeyToggle.addEventListener('click', this.handleGeminiToggle);
        if (this.chatgptKeyToggle) this.chatgptKeyToggle.addEventListener('click', this.handleChatgptToggle);
        
        // Real-time Validation for Static Fields
        if (this.geminiKeyInput) this.geminiKeyInput.addEventListener('input', this.handleStaticInputValidationBound);
        if (this.geminiModelInput) this.geminiModelInput.addEventListener('input', this.handleStaticInputValidationBound);
        if (this.chatgptKeyInput) this.chatgptKeyInput.addEventListener('input', this.handleStaticInputValidationBound);
        if (this.chatgptModelInput) this.chatgptModelInput.addEventListener('input', this.handleStaticInputValidationBound);

        if (this.addCustomProviderButton) this.addCustomProviderButton.addEventListener('click', this.handleAddCustomProviderBound);
        if (this.customProviderList) {
            this.customProviderList.addEventListener('click', this.handleCustomListClickBound);
            this.customProviderList.addEventListener('input', this.handleCustomListInputBound);
            // Real-time validation for dynamic fields via delegation
            this.customProviderList.addEventListener('input', this.handleCustomInputValidationBound);
        }

        if (this.confirmationModalCancel) this.confirmationModalCancel.addEventListener('click', this.hideConfirmationModalBound);
        if (this.confirmationModalConfirm) this.confirmationModalConfirm.addEventListener('click', this.handleConfirmBound);
    }

    /**
     * تمام شنوندگان رویداد متصل شده توسط این کامپوننت را حذف می‌کند.
     */
    destroy() {
        if (this.form) this.form.removeEventListener('submit', this.handleSaveBound);
        if (this.cancelButton) this.cancelButton.removeEventListener('click', this.hideBound);
        if (this.editButton) this.editButton.removeEventListener('click', this.showBound);
        
        if (this.geminiKeyToggle) this.geminiKeyToggle.removeEventListener('click', this.handleGeminiToggle);
        if (this.chatgptKeyToggle) this.chatgptKeyToggle.removeEventListener('click', this.handleChatgptToggle);
        
        // Remove validation listeners
        if (this.geminiKeyInput) this.geminiKeyInput.removeEventListener('input', this.handleStaticInputValidationBound);
        if (this.geminiModelInput) this.geminiModelInput.removeEventListener('input', this.handleStaticInputValidationBound);
        if (this.chatgptKeyInput) this.chatgptKeyInput.removeEventListener('input', this.handleStaticInputValidationBound);
        if (this.chatgptModelInput) this.chatgptModelInput.removeEventListener('input', this.handleStaticInputValidationBound);

        if (this.addCustomProviderButton) this.addCustomProviderButton.removeEventListener('click', this.handleAddCustomProviderBound);
        if (this.customProviderList) {
            this.customProviderList.removeEventListener('click', this.handleCustomListClickBound);
            this.customProviderList.removeEventListener('input', this.handleCustomListInputBound);
            this.customProviderList.removeEventListener('input', this.handleCustomInputValidationBound);
        }
        
        if (this.confirmationModalCancel) this.confirmationModalCancel.removeEventListener('click', this.hideConfirmationModalBound);
        if (this.confirmationModalConfirm) this.confirmationModalConfirm.removeEventListener('click', this.handleConfirmBound);

        this.peik = null;
        this.modal = null;
        // Clean up references
    }

    /**
     * Validates a generic input field.
     * @param {HTMLElement} inputElement 
     * @param {Function} validatorFn Returns true if valid, false otherwise.
     * @returns {boolean}
     */
    validateField(inputElement, validatorFn) {
        const isValid = validatorFn(inputElement.value);
        if (isValid) {
            inputElement.classList.remove('invalid');
        } else {
            inputElement.classList.add('invalid');
        }
        return isValid;
    }

    /**
     * Validates custom provider name for uniqueness and emptiness.
     * @param {HTMLElement} inputElement 
     * @returns {boolean}
     */
    validateCustomProviderName(inputElement) {
        const value = inputElement.value.trim();
        
        // Empty check
        if (!value) {
            inputElement.classList.add('invalid');
            return false;
        }

        // Uniqueness check
        const allNameInputs = Array.from(this.customProviderList.querySelectorAll('.custom-provider-name-input'));
        const otherNames = allNameInputs
            .filter(el => el !== inputElement)
            .map(el => el.value.trim());

        if (otherNames.includes(value)) {
            inputElement.classList.add('invalid');
            return false;
        }

        inputElement.classList.remove('invalid');
        return true;
    }

    /**
     * Handler for static input validation (Gemini/OpenAI).
     */
    handleStaticInputValidation(e) {
        const input = e.target;
        this.validateField(input, (val) => val.trim().length > 0);
    }

    /**
     * Handler for dynamic input validation (Custom Providers).
     */
    handleCustomInputValidation(e) {
        const input = e.target;

        if (input.classList.contains('custom-provider-name-input')) {
            this.validateCustomProviderName(input);
        } else if (input.classList.contains('custom-provider-endpoint-input')) {
            this.validateField(input, (val) => {
                try {
                    new URL(val);
                    return true;
                } catch {
                    return false;
                }
            });
        } else if (input.classList.contains('custom-provider-model-input')) {
            this.validateField(input, (val) => val.trim().length > 0);
        }
    }

    /**
     * مودال تنظیمات را نمایش یا مخفی می‌کند.
     * @param {boolean} shouldShow - برای نمایش true و برای مخفی کردن false.
     */
    show(shouldShow) {
        if (!this.modal) return;
        this.modal.classList.toggle('hidden', !shouldShow);
        if (shouldShow) {
            this.populateForm();
        }
    }

    /**
     * فیلدهای فرم را با تنظیمات فعلی از موتور پر می‌کند.
     */
    populateForm() {
        if (!this.form) return;
        this.form.reset();
        if (this.sessionOnlyCheckbox) this.sessionOnlyCheckbox.checked = false;
        
        // Reset validation state
        const invalidInputs = this.form.querySelectorAll('.invalid');
        invalidInputs.forEach(el => el.classList.remove('invalid'));

        const settings = this.peik.settings || { providers: {} };
        const providers = settings.providers || {};
        
        if (this.geminiModelInput) this.geminiModelInput.value = providers.gemini?.modelName || '';
        if (this.geminiKeyInput) this.geminiKeyInput.value = providers.gemini?.apiKey || '';

        if (this.chatgptModelInput) this.chatgptModelInput.value = providers.openai?.modelName || '';
        if (this.chatgptKeyInput) this.chatgptKeyInput.value = providers.openai?.apiKey || '';

        // رندر کردن لیست ارائه‌دهندگان سفارشی
        if (this.customProviderList) {
            this.customProviderList.innerHTML = '';
            providers.custom?.forEach(p => this.renderCustomProvider(p));
        }

        // انتخاب رادیوباتن فعال
        const activeRadio = this.form.querySelector(`input[name="active_provider"][value="${settings.activeProviderId}"]`);
        if (activeRadio) {
            activeRadio.checked = true;
        }
    }

    /**
     * یک المان جدید برای ارائه‌دهنده سفارشی در DOM ایجاد و رندر می‌کند.
     * @param {Partial<CustomProviderConfig>} providerData - داده‌های ارائه‌دهنده برای پر کردن فرم.
     * @param {boolean} [open = false] - آیا آکاردئون باید باز باشد یا خیر.
     */
    renderCustomProvider(providerData = {}, open = false) {
        if (!this.customProviderTemplate || !this.customProviderList) {
            console.error("قالب یا لیست ارائه‌دهنده سفارشی یافت نشد.");
            return;
        }

        const id = providerData.id || `custom_${Date.now()}`;
        const name = providerData.name || 'پیکربندی جدید';
        
        try {
            const template = this.customProviderTemplate.content.cloneNode(true);
            const detailsElement = template.querySelector('.custom-provider-item');
            
            if (!detailsElement) {
                console.error("المان .custom-provider-item در قالب یافت نشد.");
                return;
            }

            detailsElement.dataset.id = id;
            if (open) detailsElement.open = true;

            const radio = template.querySelector('input[type="radio"]');
            if (radio) {
                radio.value = id;
                radio.id = `radio-${id}`;
            }

            const label = template.querySelector('label');
            if (label) label.htmlFor = `radio-${id}`;
            
            const title = template.querySelector('.custom-provider-title');
            if (title) title.textContent = name;

            // پر کردن مقادیر ورودی‌ها
            const nameInput = template.querySelector('.custom-provider-name-input');
            if (nameInput) nameInput.value = providerData.name || '';
            
            const modelInput = template.querySelector('.custom-provider-model-input');
            if (modelInput) modelInput.value = providerData.modelName || '';
            
            const keyInput = template.querySelector('.custom-provider-key-input');
            if (keyInput) keyInput.value = providerData.apiKey || '';
            
            const endpointInput = template.querySelector('.custom-provider-endpoint-input');
            if (endpointInput) endpointInput.value = providerData.endpointUrl || '';

            this.customProviderList.appendChild(template);
        } catch (e) {
            console.error("خطا در رندر کردن ارائه‌دهنده سفارشی:", e);
        }
    }
    
    /**
     * یک ارائه‌دهنده سفارشی جدید اضافه می‌کند.
     */
    handleAddCustomProvider(e) {
        if(e) e.preventDefault();
        this.renderCustomProvider({}, true); // با آکاردئون باز
    }

    /**
     * رویدادهای کلیک روی لیست ارائه‌دهندگان سفارشی را با استفاده از تفویض رویداد مدیریت می‌کند.
     * @param {MouseEvent} e - رویداد کلیک.
     */
    handleCustomListClick(e) {
        // مدیریت حذف
        const deleteButton = e.target.closest('.delete-custom-provider-button');
        if (deleteButton) {
            e.preventDefault(); // جلوگیری از باز/بسته شدن آکاردئون
            const itemElement = deleteButton.closest('.custom-provider-item');
            this.handleDeleteCustomProvider(itemElement);
            return;
        }

        // مدیریت تغییر وضعیت نمایش کلید
        const toggleButton = e.target.closest('.custom-provider-key-toggle');
        if (toggleButton) {
            const itemElement = toggleButton.closest('.custom-provider-item');
            const keyInput = itemElement.querySelector('.custom-provider-key-input');
            this.togglePasswordVisibility(keyInput, toggleButton);
            return;
        }
    }

    /**
     * رویدادهای ورودی (input) را برای به‌روزرسانی UI مدیریت می‌کند.
     * @param {InputEvent} e - رویداد ورودی.
     */
    handleCustomListInput(e) {
        const nameInput = e.target.closest('.custom-provider-name-input');
        if (nameInput) {
            const itemElement = nameInput.closest('.custom-provider-item');
            const title = itemElement.querySelector('.custom-provider-title');
            if (title) title.textContent = nameInput.value || 'پیکربندی جدید';
        }
    }
    
    /**
     * فرآیند حذف یک ارائه‌دهنده سفارشی را مدیریت می‌کند.
     * @param {HTMLElement} itemElement - المان DOM آیتم سفارشی.
     */
    handleDeleteCustomProvider(itemElement) {
        if (!itemElement) return;
        const titleEl = itemElement.querySelector('.custom-provider-title');
        const name = titleEl ? titleEl.textContent : 'این پیکربندی';
        
        this.showConfirmationModal({
            title: 'حذف پیکربندی',
            bodyHtml: `<p>آیا از حذف پیکربندی «<strong>${name}</strong>» مطمئن هستید؟</p>`,
            confirmText: 'حذف',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                itemElement.remove();
            }
        });
    }

    /**
     * ارسال فرم برای ذخیره تنظیمات را مدیریت می‌کند.
     * @param {Event} e - رویداد submit.
     */
    async handleSave(e) {
        e.preventDefault();
        
        const settings = this.getSettingsFromForm();
        if (!settings) {
            return; // اعتبارسنجی ناموفق بود
        }
        
        if (this.sessionOnlyCheckbox && this.sessionOnlyCheckbox.checked) {
            this.peik.settings = settings;
            this.show(false);
            alert('تنظیمات فقط برای این نشست اعمال شد و پس از بستن تب پاک خواهد شد.');
        } else {
            // جایگزینی engine.saveSettings با peik.updateSettings طبق معماری جدید
            await this.peik.updateSettings(settings);
        }
    }
    
    /**
     * مقادیر ورودی را از فرم خوانده و یک آبجکت تنظیمات می‌سازد.
     * @returns {Settings|null} - آبجکت تنظیمات یا null در صورت شکست اعتبارسنجی.
     */
    getSettingsFromForm() {
        if (!this.form) return null;

        // ۱. ساختار پایه تنظیمات را ایجاد کن و تمام داده‌ها را جمع‌آوری کن
        const newSettings = {
            activeProviderId: null,
            providers: {
                gemini: {
                    modelName: this.geminiModelInput ? this.geminiModelInput.value.trim() : '',
                    apiKey: this.geminiKeyInput ? this.geminiKeyInput.value.trim() : '',
                },
                openai: {
                    modelName: this.chatgptModelInput ? this.chatgptModelInput.value.trim() : '',
                    apiKey: this.chatgptKeyInput ? this.chatgptKeyInput.value.trim() : '',
                },
                custom: Array.from(this.customProviderList.querySelectorAll('.custom-provider-item')).map(el => ({
                    id: el.dataset.id,
                    name: el.querySelector('.custom-provider-name-input')?.value.trim() || '',
                    modelName: el.querySelector('.custom-provider-model-input')?.value.trim() || '',
                    apiKey: el.querySelector('.custom-provider-key-input')?.value.trim() || '',
                    endpointUrl: el.querySelector('.custom-provider-endpoint-input')?.value.trim() || '',
                })),
            }
        };

        // ۲. اعتبارسنجی نام‌های منحصر به فرد برای ارائه‌دهندگان سفارشی
        const customNames = newSettings.providers.custom.map(p => p.name);
        if (customNames.some(n => !n)) {
            alert('هر پیکربندی سفارشی باید یک نام داشته باشد.');
            return null;
        }
        if (new Set(customNames).size !== customNames.length) {
            alert('نام پیکربندی‌های سفارشی باید منحصر به فرد باشد.');
            return null;
        }

        // ۳. تعیین و اعتبارسنجی ارائه‌دهنده فعال
        const activeRadio = this.form.querySelector('input[name="active_provider"]:checked');
        if (!activeRadio) {
            // اگر پیکربندی پیش‌فرض وجود دارد، اجازه ادامه بده (منطق ساده‌تر)
            if (this.peik.config && this.peik.config.defaultProvider) {
                 // اینجا می‌توانیم activeProviderId را null بگذاریم یا یک مقدار پیش‌فرض برداریم
                 // فعلاً null می‌گذاریم و در هسته مدیریت می‌کنیم
                 return newSettings; 
            }
            alert('لطفاً یک ارائه‌دهنده فعال را انتخاب کنید.');
            return null;
        }
        
        newSettings.activeProviderId = activeRadio.value;
        const id = newSettings.activeProviderId;

        if (id === 'gemini') {
            const config = newSettings.providers.gemini;
            if (!config.modelName || !config.apiKey) {
                alert('برای فعال کردن Gemini، لطفاً نام مدل و کلید API را وارد کنید.');
                return null;
            }
        } else if (id === 'openai') {
            const config = newSettings.providers.openai;
            if (!config.modelName || !config.apiKey) {
                alert('برای فعال کردن ChatGPT، لطفاً نام مدل و کلید API را وارد کنید.');
                return null;
            }
        } else {
            const customConfig = newSettings.providers.custom.find(p => p.id === id);
            if (!customConfig || !customConfig.modelName || !customConfig.endpointUrl) {
                alert(`برای فعال کردن پیکربندی "${customConfig?.name || 'سفارشی'}"، لطفاً نام مدل و آدرس نقطه پایانی را پر کنید.`);
                return null;
            }
            try {
                new URL(customConfig.endpointUrl);
            } catch (_) {
                alert(`لطفاً یک آدرس نقطه پایانی معتبر برای "${customConfig.name}" وارد کنید.`);
                return null;
            }
        }
        
        return newSettings;
    }

    /**
     * قابلیت مشاهده یک فیلد ورودی رمز عبور را تغییر می‌دهد.
     * @param {HTMLInputElement} inputElement - فیلد ورودی رمز عبور.
     * @param {HTMLButtonElement} buttonElement - دکمه تغییر وضعیت.
     */
    togglePasswordVisibility(inputElement, buttonElement) {
        if (!inputElement || !buttonElement) return;
        const icon = buttonElement.querySelector('.material-symbols-outlined');
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            if (icon) icon.textContent = 'visibility_off';
        } else {
            inputElement.type = 'password';
            if (icon) icon.textContent = 'visibility';
        }
    }

    // --- توابع کمکی برای مودال تأیید ---

    _handleConfirm() {
        if (this.modal && this.modal.classList.contains('hidden')) {
            return;
        }

        if (this.confirmHandler) {
            this.confirmHandler();
        }
        this.hideConfirmationModal();
    }

    showConfirmationModal({ title, bodyHtml, confirmText = 'تایید', confirmClass = 'btn-primary', onConfirm }) {
        if (!this.confirmationModal) return;
        
        if (this.confirmationModalTitle) this.confirmationModalTitle.textContent = title;
        if (this.confirmationModalBody) this.confirmationModalBody.innerHTML = bodyHtml;
        if (this.confirmationModalConfirm) {
            this.confirmationModalConfirm.textContent = confirmText;
            this.confirmationModalConfirm.className = 'btn';
            this.confirmationModalConfirm.classList.add(confirmClass);
        }
        
        this.confirmHandler = onConfirm;
        
        this.confirmationModal.classList.remove('hidden');
    }
    
    hideConfirmationModal() {
        if (!this.confirmationModal) return;
        this.confirmationModal.classList.add('hidden');
        this.confirmHandler = null;
        if (this.confirmationModalBody) this.confirmationModalBody.innerHTML = '';
    }
}

export default SettingsModal;