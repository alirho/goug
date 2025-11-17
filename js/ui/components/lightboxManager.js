/**
 * Manages the logic for displaying and hiding a full-screen image lightbox.
 */
class LightboxManager {
    constructor() {
        this.dom = {
            lightbox: document.getElementById('image-lightbox'),
            lightboxImage: document.getElementById('lightbox-image'),
        };

        // --- Bound event handlers for easy removal ---
        this.hideBound = this.hide.bind(this);
        this.stopPropagationBound = (e) => e.stopPropagation();
        this.handleKeyDownBound = (e) => {
            if (e.key === 'Escape' && this.dom.lightbox && !this.dom.lightbox.classList.contains('hidden')) {
                this.hide();
            }
        };

        this.bindEvents();
    }

    bindEvents() {
        if (!this.dom.lightbox) return;

        this.dom.lightbox.addEventListener('click', this.hideBound);
        this.dom.lightboxImage.addEventListener('click', this.stopPropagationBound);
        document.addEventListener('keydown', this.handleKeyDownBound);
    }

    /**
     * Removes all event listeners to prevent memory leaks.
     */
    destroy() {
        if (!this.dom.lightbox) return;

        this.dom.lightbox.removeEventListener('click', this.hideBound);
        this.dom.lightboxImage.removeEventListener('click', this.stopPropagationBound);
        document.removeEventListener('keydown', this.handleKeyDownBound);
    }

    /**
     * Shows the lightbox modal with the specified image source.
     * @param {string} src The source URL of the image to display.
     */
    show(src) {
        if (!this.dom.lightbox) return;
        this.dom.lightboxImage.src = src;
        this.dom.lightbox.classList.remove('hidden');
    }

    /**
     * Hides the lightbox modal.
     */
    hide() {
        if (!this.dom.lightbox) return;
        this.dom.lightbox.classList.add('hidden');
        this.dom.lightboxImage.src = ''; // Clear src to stop loading
    }
}

export default LightboxManager;