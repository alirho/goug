export default class Sidebar {
    constructor(peik, uiManager) {
        this.peik = peik;
        this.uiManager = uiManager;
        this.container = document.getElementById('chat-list-container');
        this.activeMenu = null;

        // Bind methods for event listeners
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleContainerClick = this.handleContainerClick.bind(this);

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', this.handleDocumentClick);
        if (this.container) {
            this.container.addEventListener('click', this.handleContainerClick);
        }
    }

    handleDocumentClick(e) {
        if (!e.target.closest('.chat-actions-container')) {
            this.closeAllMenus();
        }
    }

    handleContainerClick(e) {
        // Delegate click events
        const target = e.target;

        // 1. Click on chat item (to switch)
        const chatItem = target.closest('.chat-list-item');
        if (chatItem && !target.closest('.chat-actions-container')) {
            const chatId = chatItem.dataset.id;
            this.uiManager.switchChat(chatId);
            return;
        }

        // 2. Menu button (three dots)
        const moreBtn = target.closest('.more-btn');
        if (moreBtn) {
            e.stopPropagation();
            const menu = moreBtn.nextElementSibling; // Assuming HTML structure
            if (menu) {
                const isHidden = menu.classList.contains('hidden');
                this.closeAllMenus();
                if (isHidden) {
                    menu.classList.remove('hidden');
                }
            }
            return;
        }

        // 3. Edit button
        const editBtn = target.closest('.edit-btn');
        if (editBtn) {
            e.stopPropagation();
            this.closeAllMenus();
            const chatItem = editBtn.closest('.chat-list-item');
            const chatId = chatItem.dataset.id;
            const currentTitle = chatItem.querySelector('.chat-title').textContent;
            
            const newTitle = prompt('نام جدید گپ را وارد کنید:', currentTitle);
            if (newTitle && newTitle.trim() !== '') {
                this.peik.renameChat(chatId, newTitle.trim());
            }
            return;
        }

        // 4. Delete button
        const deleteBtn = target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            this.closeAllMenus();
            const chatItem = deleteBtn.closest('.chat-list-item');
            const chatId = chatItem.dataset.id;
            const currentTitle = chatItem.querySelector('.chat-title').textContent;

            if (confirm(`آیا از حذف گپ «${currentTitle}» مطمئن هستید؟`)) {
                this.peik.deleteChat(chatId);
            }
            return;
        }
    }

    render(chats, activeId) {
        if (!this.container) return;
        this.container.innerHTML = '';
        const chatArray = Array.isArray(chats) ? chats : [];
        const sortedChats = [...chatArray].sort((a, b) => b.updatedAt - a.updatedAt);
        sortedChats.forEach(chat => this.addChat(chat, chat.id === activeId));
    }

    addChat(chat, isActive = false) {
        this.removeChat(chat.id);

        const el = document.createElement('div');
        el.className = `chat-list-item ${isActive ? 'active' : ''}`;
        el.dataset.id = chat.id;
        
        const provider = chat.modelInfo?.provider || 'custom';
        let iconName = 'hub';
        if (provider === 'gemini') iconName = 'auto_awesome';
        if (provider === 'openai') iconName = 'psychology';

        el.innerHTML = `
            <span class="material-symbols-outlined provider-icon" data-provider="${provider}">${iconName}</span>
            <span class="chat-title">${chat.title}</span>
            <div class="chat-actions-container">
                <button class="actions-button more-btn" title="گزینه‌ها">
                    <span class="material-symbols-outlined">more_horiz</span>
                </button>
                <div class="actions-menu hidden">
                    <button class="actions-menu-item edit-btn">
                        <span class="material-symbols-outlined">edit</span>
                        <span>ویرایش نام</span>
                    </button>
                    <button class="actions-menu-item delete-btn">
                        <span class="material-symbols-outlined">delete</span>
                        <span>حذف</span>
                    </button>
                </div>
            </div>
        `;

        this.container.prepend(el);
    }

    updateChat(chat) {
        const isActive = document.querySelector(`.chat-list-item[data-id="${chat.id}"]`)?.classList.contains('active');
        this.addChat(chat, isActive);
    }

    removeChat(chatId) {
        if (!this.container) return;
        const el = this.container.querySelector(`[data-id="${chatId}"]`);
        if (el) el.remove();
    }

    setActive(chatId) {
        if (!this.container) return;
        this.container.querySelectorAll('.chat-list-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === chatId);
        });
    }

    closeAllMenus() {
        if (!this.container) return;
        this.container.querySelectorAll('.actions-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        if (this.container) {
            this.container.removeEventListener('click', this.handleContainerClick);
            this.container.innerHTML = '';
        }
        this.container = null;
        this.peik = null;
        this.uiManager = null;
    }
}