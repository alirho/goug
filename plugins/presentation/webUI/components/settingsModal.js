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

        this.handleSaveBound = this.handleSave.bind(this);
        this.hideBound = () => this.show(false);
        this.showBound = () => this.show(true);
        this.handleAddCustomProviderBound = this.handleAddCustomProvider.bind(this);
        this.handleCustomListClickBound = this.handleCustomListClick.bind(this);
        this.handleCustomListInputBound = this.handleCustomListInput.bind(this);
        this.hideConfirmationModalBound = this.hideConfirmationModal.bind(this);
        this.handleConfirmBound = this._handleConfirm.bind(this);
        
        this.bindEvents();
    }

    cacheDOMElements() {
        this.modal = document.getElementById('settings-modal');
        this.form = document.getElementById('settings-form');
        this.cancelButton = document.getElementById('cancel-settings-button');
        this.editButton = document.getElementById('edit-settings-button');
        
        this.geminiModelInput = document.getElementById('gemini-model-input');
        this.geminiKeyInput = document.getElementById('gemini-key-input');
        this.geminiKeyToggle = document.getElementById('gemini-key-toggle');
        this.chatgptModelInput = document.getElementById('chatgpt-model-input');
        this.chatgptKeyInput = document.getElementById('chatgpt-key-input');
        this.chatgptKeyToggle = document.getElementById('chatgpt-key-toggle');

        this.addCustomProviderButton = document.getElementById('add-custom-provider-button');
        this.customProviderList = document.getElementById('custom-provider-list');
        this.customProviderTemplate = document.getElementById('custom-provider-template');

        this.sessionOnlyCheckbox = document.getElementById('session-only-checkbox');
        
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.confirmationModalTitle = document.getElementById('confirmation-modal-title');
        this.confirmationModalBody = document.getElementById('confirmation-modal-body');
        this.confirmationModalCancel = document.getElementById('confirmation-modal-cancel');
        this.confirmationModalConfirm = document.getElementById('confirmation-modal-confirm');
    }

    bindEvents() {
        if (this.form) this.form.addEventListener('submit', this.handleSaveBound);
        if (this.cancelButton) this.cancelButton.addEventListener('click', this.hideBound);
        if (this.editButton) this.editButton.addEventListener('click', this.showBound);
        
        if (this.geminiKeyToggle) this.geminiKeyToggle.addEventListener('click', () => this.togglePasswordVisibility(this.geminiKeyInput, this.geminiKeyToggle));
        if (this.chatgptKeyToggle) this.chatgptKeyToggle.addEventListener('click', () => this.togglePasswordVisibility(this.chatgptKeyInput, this.chatgptKeyToggle));
        
        if (this.addCustomProviderButton) this.addCustomProviderButton.addEventListener('click', this.handleAddCustomProviderBound);
        if (this.customProviderList) {
            this.customProviderList.addEventListener('click', this.handleCustomListClickBound);
            this.customProviderList.addEventListener('input', this.handleCustomListInputBound);
        }

        if (this.confirmationModalCancel) this.confirmationModalCancel.addEventListener('click', this.hideConfirmationModalBound);
        if (this.confirmationModalConfirm) this.confirmationModalConfirm.addEventListener('click', this.handleConfirmBound);
    }

    show(shouldShow) {
        if (!this.modal) return;
        this.modal.classList.toggle('hidden', !shouldShow);
        if (shouldShow) {
            this.populateForm();
        }
    }

    populateForm() {
        if (!this.form) return;
        this.form.reset();
        if (this.sessionOnlyCheckbox) this.sessionOnlyCheckbox.checked = false;
        
        const settings = this.peik.settings || { providers: {} };
        const providers = settings.providers || {};
        
        if (this.geminiModelInput) this.geminiModelInput.value = providers.gemini?.modelName || '';
        if (this.geminiKeyInput) this.geminiKeyInput.value = providers.gemini?.apiKey || '';

        if (this.chatgptModelInput) this.chatgptModelInput.value = providers.openai?.modelName || '';
        if (this.chatgptKeyInput) this.chatgptKeyInput.value = providers.openai?.apiKey || '';

        if (this.customProviderList) {
            this.customProviderList.innerHTML = '';
            providers.custom?.forEach(p => this.renderCustomProvider(p));
        }

        const activeRadio = this.form.querySelector(`input[name="active_provider"][value="${settings.activeProviderId}"]`);
        if (activeRadio) {
            activeRadio.checked = true;
        }
    }

    renderCustomProvider(providerData = {}, open = false) {
        if (!this.customProviderTemplate || !this.customProviderList) return;

        const id = providerData.id || `custom_${Date.now()}`;
        const name = providerData.name || 'پیکربندی جدید';
        
        const template = this.customProviderTemplate.content.cloneNode(true);
        const detailsElement = template.querySelector('.custom-provider-item');
        
        if (!detailsElement) return;

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

        const nameInput = template.querySelector('.custom-provider-name-input');
        if (nameInput) nameInput.value = providerData.name || '';
        
        const modelInput = template.querySelector('.custom-provider-model-input');
        if (modelInput) modelInput.value = providerData.modelName || '';
        
        const keyInput = template.querySelector('.custom-provider-key-input');
        if (keyInput) keyInput.value = providerData.apiKey || '';
        
        const endpointInput = template.querySelector('.custom-provider-endpoint-input');
        if (endpointInput) endpointInput.value = providerData.endpointUrl || '';

        this.customProviderList.appendChild(template);
    }
    
    handleAddCustomProvider(e) {
        if(e) e.preventDefault();
        this.renderCustomProvider({}, true);
    }

    handleCustomListClick(e) {
        const deleteButton = e.target.closest('.delete-custom-provider-button');
        if (deleteButton) {
            e.preventDefault();
            const itemElement = deleteButton.closest('.custom-provider-item');
            this.handleDeleteCustomProvider(itemElement);
            return;
        }

        const toggleButton = e.target.closest('.custom-provider-key-toggle');
        if (toggleButton) {
            const itemElement = toggleButton.closest('.custom-provider-item');
            const keyInput = itemElement.querySelector('.custom-provider-key-input');
            this.togglePasswordVisibility(keyInput, toggleButton);
            return;
        }
    }

    handleCustomListInput(e) {
        const nameInput = e.target.closest('.custom-provider-name-input');
        if (nameInput) {
            const itemElement = nameInput.closest('.custom-provider-item');
            const title = itemElement.querySelector('.custom-provider-title');
            if (title) title.textContent = nameInput.value || 'پیکربندی جدید';
        }
    }
    
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

    async handleSave(e) {
        e.preventDefault();
        
        const settings = this.getSettingsFromForm();
        if (!settings) return;
        
        if (this.sessionOnlyCheckbox && this.sessionOnlyCheckbox.checked) {
            this.peik.settings = settings;
            this.show(false);
            alert('تنظیمات فقط برای این نشست اعمال شد و پس از بستن تب پاک خواهد شد.');
        } else {
            await this.peik.updateSettings(settings);
        }
    }
    
    getSettingsFromForm() {
        if (!this.form) return null;

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

        const customNames = newSettings.providers.custom.map(p => p.name);
        if (customNames.some(n => !n)) {
            alert('هر پیکربندی سفارشی باید یک نام داشته باشد.');
            return null;
        }
        if (new Set(customNames).size !== customNames.length) {
            alert('نام پیکربندی‌های سفارشی باید منحصر به فرد باشد.');
            return null;
        }

        const activeRadio = this.form.querySelector('input[name="active_provider"]:checked');
        if (!activeRadio) {
            if (this.peik.config && this.peik.config.defaultProvider && !this.peik.settings.activeProviderId) {
                 return newSettings;
            }
            if (this.peik.settings.activeProviderId) {
                newSettings.activeProviderId = this.peik.settings.activeProviderId;
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

    _handleConfirm() {
        if (this.modal && this.modal.classList.contains('hidden')) return;

        if (this.confirmHandler) {
            this.confirmHandler();
        }
        this.hideConfirmationModal();
    }

    showConfirmationModal({ title, bodyHtml, confirmText = 'تایید', confirmClass = 'btn-primary', onConfirm }) {
        if (!this.confirmationModal) return;
        
        this.confirmationModalTitle.textContent = title;
        this.confirmationModalBody.innerHTML = bodyHtml;
        this.confirmationModalConfirm.textContent = confirmText;
        
        this.confirmationModalConfirm.className = 'btn';
        this.confirmationModalConfirm.classList.add(confirmClass);
        
        this.confirmHandler = onConfirm;
        
        this.confirmationModal.classList.remove('hidden');
    }
    
    hideConfirmationModal() {
        if (!this.confirmationModal) return;
        this.confirmationModal.classList.add('hidden');
        this.confirmHandler = null;
        this.confirmationModalBody.innerHTML = '';
    }
}

export default SettingsModal;