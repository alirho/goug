export default class InputArea {
    constructor(peik, uiManager) {
        this.peik = peik;
        this.uiManager = uiManager;
        
        this.form = document.getElementById('chat-form');
        this.input = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-button');
        
        this.attachBtn = document.getElementById('attach-file-button');
        this.fileInput = document.getElementById('file-input');
        this.previewContainer = document.getElementById('image-preview-container');
        
        this.currentImage = null; 

        // Bind handlers
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleAttachClick = this.handleAttachClick.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);

        this.bindEvents();
    }

    bindEvents() {
        if (this.form) this.form.addEventListener('submit', this.handleSubmit);
        if (this.input) this.input.addEventListener('keydown', this.handleKeyDown);
        if (this.attachBtn) this.attachBtn.addEventListener('click', this.handleAttachClick);
        if (this.fileInput) this.fileInput.addEventListener('change', this.handleFileChange);
    }

    handleSubmit(e) {
        e.preventDefault();
        this.sendMessage();
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    handleAttachClick() {
        if (this.fileInput) this.fileInput.click();
    }

    handleFileChange(e) {
        this.handleFileSelect(e);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('لطفاً فقط فایل تصویر انتخاب کنید.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = event.target.result; 
            const mimeType = file.type;
            const data = base64String.split(',')[1];

            this.currentImage = { data, mimeType };
            this.showPreview(base64String);
            
            this.fileInput.value = '';
        };
        reader.readAsDataURL(file);
    }

    showPreview(dataUrl) {
        this.previewContainer.innerHTML = '';
        this.previewContainer.classList.remove('hidden');

        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'preview-image';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove-button';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => this.clearImage();

        this.previewContainer.appendChild(img);
        this.previewContainer.appendChild(removeBtn);
    }

    clearImage() {
        this.currentImage = null;
        this.previewContainer.innerHTML = '';
        this.previewContainer.classList.add('hidden');
        this.fileInput.value = '';
    }

    async sendMessage() {
        const text = this.input.value.trim();
        
        if (!text && !this.currentImage) return;

        // Use activeChatId from UIManager
        const chatId = this.uiManager.activeChatId;
        
        if (!chatId) {
            alert('لطفاً ابتدا یک گپ ایجاد کنید.');
            return;
        }

        // Fetch the chat instance from core
        const chat = await this.peik.getChat(chatId);
        if (!chat) return;

        const msgText = text;
        const msgImage = this.currentImage;

        this.input.value = '';
        this.clearImage();
        
        try {
            await chat.sendMessage(msgText, msgImage);
        } catch (err) {
            console.error(err);
            this.input.value = msgText;
        }
    }

    setLoading(isLoading) {
        if (this.sendBtn) {
            this.sendBtn.disabled = isLoading;
            this.sendBtn.innerHTML = isLoading 
                ? '<div class="spinner"></div>' 
                : '<span class="material-symbols-outlined">send</span>';
        }
        if (this.attachBtn) {
            this.attachBtn.disabled = isLoading;
        }
    }

    destroy() {
        if (this.form) this.form.removeEventListener('submit', this.handleSubmit);
        if (this.input) this.input.removeEventListener('keydown', this.handleKeyDown);
        if (this.attachBtn) this.attachBtn.removeEventListener('click', this.handleAttachClick);
        if (this.fileInput) this.fileInput.removeEventListener('change', this.handleFileChange);

        this.form = null;
        this.input = null;
        this.sendBtn = null;
        this.attachBtn = null;
        this.fileInput = null;
        this.previewContainer = null;
        this.peik = null;
        this.uiManager = null;
    }
}