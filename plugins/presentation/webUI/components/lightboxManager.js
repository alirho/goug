import Component from '../component.js';

export default class LightboxManager extends Component {
    constructor(peik, uiManager) {
        super(peik, uiManager);
        
        this.dom = {};

        // تعریف متدها به صورت Arrow Function
        this.hide = () => {
            if (!this.dom.lightbox) return;
            this.dom.lightbox.classList.add('hidden');
            if (this.dom.image) {
                this.dom.image.src = ''; 
            }
        };

        this.show = (src) => {
            if (!this.dom.lightbox || !this.dom.image) return;
            this.dom.image.src = src;
            this.dom.lightbox.classList.remove('hidden');
        };

        this.handleLightboxClick = (e) => {
            if (e.target === this.dom.lightbox) {
                this.hide();
            }
        };

        this.handleKeyDown = (e) => {
            if (e.key === 'Escape' && this.dom.lightbox && !this.dom.lightbox.classList.contains('hidden')) {
                this.hide();
            }
        };
    }

    async init() {
        this.dom = {
            lightbox: document.getElementById('image-lightbox'),
            image: document.getElementById('lightbox-image'),
            closeBtn: document.getElementById('lightbox-close-button')
        };
        this.bindEvents();
    }

    bindEvents() {
        if (!this.dom.lightbox) return;

        this.dom.lightbox.addEventListener('click', this.handleLightboxClick);

        if (this.dom.closeBtn) {
            this.dom.closeBtn.addEventListener('click', this.hide);
        }

        document.addEventListener('keydown', this.handleKeyDown);
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.dom.lightbox) {
            this.dom.lightbox.removeEventListener('click', this.handleLightboxClick);
        }
        if (this.dom.closeBtn) {
            this.dom.closeBtn.removeEventListener('click', this.hide);
        }
        this.dom = {};
    }
}