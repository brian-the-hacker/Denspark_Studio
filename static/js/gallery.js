/* ============================================
   DENSPARK STUDIO - Gallery Module
   Advanced gallery functionality
   ============================================ */

class Gallery {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || '.portfolio-grid');
    this.items = [];
    this.currentIndex = 0;
    this.isLightboxOpen = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    if (this.container) {
      this.init();
    }
  }
  
  init() {
    this.items = Array.from(this.container.querySelectorAll('.portfolio-item'));
    this.createLightbox();
    this.bindEvents();
    this.initLazyLoading();
    this.initMasonry();
  }
  
  createLightbox() {
    if (document.querySelector('.gallery-lightbox')) return;
    
    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.innerHTML = `
      <div class="gallery-lightbox-backdrop"></div>
      <div class="gallery-lightbox-content">
        <button class="gallery-lightbox-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="gallery-lightbox-prev" aria-label="Previous">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button class="gallery-lightbox-next" aria-label="Next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <div class="gallery-lightbox-image-container">
          <img class="gallery-lightbox-image" src="" alt="">
          <div class="gallery-lightbox-loader">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="gallery-lightbox-info">
          <h4 class="gallery-lightbox-title"></h4>
          <p class="gallery-lightbox-category"></p>
        </div>
        <div class="gallery-lightbox-counter">
          <span class="current">1</span> / <span class="total">1</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(lightbox);
    this.lightbox = lightbox;
    
    // Add lightbox styles
    this.addLightboxStyles();
  }
  
  addLightboxStyles() {
    if (document.querySelector('#gallery-lightbox-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'gallery-lightbox-styles';
    style.textContent = `
      .gallery-lightbox {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .gallery-lightbox.active {
        opacity: 1;
        visibility: visible;
      }
      
      .gallery-lightbox-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
      }
      
      .gallery-lightbox-content {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
      }
      
      .gallery-lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
      }
      
      .gallery-lightbox-close:hover {
        transform: rotate(90deg);
      }
      
      .gallery-lightbox-close svg {
        width: 24px;
        height: 24px;
      }
      
      .gallery-lightbox-prev,
      .gallery-lightbox-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        background: transparent;
        color: white;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .gallery-lightbox-prev { left: 20px; }
      .gallery-lightbox-next { right: 20px; }
      
      .gallery-lightbox-prev:hover,
      .gallery-lightbox-next:hover {
        background: #c9a962;
        border-color: #c9a962;
      }
      
      .gallery-lightbox-prev svg,
      .gallery-lightbox-next svg {
        width: 20px;
        height: 20px;
      }
      
      .gallery-lightbox-image-container {
        position: relative;
        max-width: 90%;
        max-height: 80vh;
      }
      
      .gallery-lightbox-image {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .gallery-lightbox-image.loaded {
        opacity: 1;
      }
      
      .gallery-lightbox-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      
      .gallery-lightbox-loader .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #c9a962;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .gallery-lightbox-info {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        color: white;
      }
      
      .gallery-lightbox-title {
        font-size: 1.25rem;
        margin-bottom: 4px;
      }
      
      .gallery-lightbox-category {
        font-size: 0.85rem;
        color: #c9a962;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      
      .gallery-lightbox-counter {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 0.9rem;
      }
      
      @media (max-width: 768px) {
        .gallery-lightbox-content {
          padding: 40px 10px;
        }
        
        .gallery-lightbox-prev,
        .gallery-lightbox-next {
          width: 40px;
          height: 40px;
        }
        
        .gallery-lightbox-prev { left: 10px; }
        .gallery-lightbox-next { right: 10px; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  bindEvents() {
    // Click on portfolio items
    this.items.forEach((item, index) => {
      item.addEventListener('click', () => this.openLightbox(index));
    });
    
    // Lightbox controls
    this.lightbox.querySelector('.gallery-lightbox-backdrop').addEventListener('click', () => this.closeLightbox());
    this.lightbox.querySelector('.gallery-lightbox-close').addEventListener('click', () => this.closeLightbox());
    this.lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevImage();
    });
    this.lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextImage();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isLightboxOpen) return;
      
      switch(e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          this.prevImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
      }
    });
    
    // Touch events for swipe
    this.lightbox.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    });
    
    this.lightbox.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
  }
  
  handleSwipe() {
    const threshold = 50;
    const diff = this.touchStartX - this.touchEndX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
  }
  
  openLightbox(index) {
    this.currentIndex = index;
    this.isLightboxOpen = true;
    this.updateLightboxContent();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox() {
    this.isLightboxOpen = false;
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  updateLightboxContent() {
    const item = this.items[this.currentIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('.portfolio-title')?.textContent || '';
    const category = item.querySelector('.portfolio-category')?.textContent || '';
    
    const lightboxImg = this.lightbox.querySelector('.gallery-lightbox-image');
    const loader = this.lightbox.querySelector('.gallery-lightbox-loader');
    
    lightboxImg.classList.remove('loaded');
    loader.style.display = 'block';
    
    // Load image
    const newImg = new Image();
    newImg.onload = () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.classList.add('loaded');
      loader.style.display = 'none';
    };
    newImg.src = img.src;
    
    // Update info
    this.lightbox.querySelector('.gallery-lightbox-title').textContent = title;
    this.lightbox.querySelector('.gallery-lightbox-category').textContent = category;
    this.lightbox.querySelector('.gallery-lightbox-counter .current').textContent = this.currentIndex + 1;
    this.lightbox.querySelector('.gallery-lightbox-counter .total').textContent = this.items.length;
  }
  
  prevImage() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updateLightboxContent();
  }
  
  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateLightboxContent();
  }
  
  initLazyLoading() {
    const images = this.container.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }
  
  initMasonry() {
    // Simple CSS Grid-based masonry effect
    // For more complex layouts, consider using a library like Masonry.js
    this.items.forEach((item, index) => {
      // Randomly make some items span more rows
      if (index % 5 === 0) {
        item.style.gridRow = 'span 2';
      }
    });
  }
  
  // Filter functionality
  filter(category) {
    this.items.forEach(item => {
      const itemCategory = item.dataset.category;
      
      if (category === 'all' || itemCategory === category) {
        item.style.display = 'block';
        item.style.animation = 'fadeInUp 0.5s ease forwards';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Update items array after filtering
    this.items = Array.from(this.container.querySelectorAll('.portfolio-item'))
      .filter(item => item.style.display !== 'none');
  }
}

// Image upload with preview
class ImageUploader {
  constructor(options = {}) {
    this.dropzone = document.querySelector(options.dropzone || '.upload-area');
    this.previewContainer = document.querySelector(options.preview || '.upload-preview');
    this.input = this.dropzone?.querySelector('input[type="file"]');
    this.maxFiles = options.maxFiles || 10;
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
    this.files = [];
    
    if (this.dropzone) {
      this.init();
    }
  }
  
  init() {
    // Create hidden file input if not exists
    if (!this.input) {
      this.input = document.createElement('input');
      this.input.type = 'file';
      this.input.multiple = true;
      this.input.accept = this.allowedTypes.join(',');
      this.input.style.display = 'none';
      this.dropzone.appendChild(this.input);
    }
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.dropzone.addEventListener('click', () => this.input.click());
    
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });
    
    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });
    
    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });
    
    this.input.addEventListener('change', () => {
      this.handleFiles(this.input.files);
    });
  }
  
  handleFiles(fileList) {
    const files = Array.from(fileList);
    
    files.forEach(file => {
      // Validate file
      if (!this.allowedTypes.includes(file.type)) {
        this.showError(`${file.name} is not a valid image type.`);
        return;
      }
      
      if (file.size > this.maxSize) {
        this.showError(`${file.name} is too large. Max size is ${this.maxSize / 1024 / 1024}MB.`);
        return;
      }
      
      if (this.files.length >= this.maxFiles) {
        this.showError(`Maximum ${this.maxFiles} files allowed.`);
        return;
      }
      
      this.files.push(file);
      this.showPreview(file);
    });
  }
  
  showPreview(file) {
    if (!this.previewContainer) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement('div');
      preview.className = 'upload-preview-item';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <button type="button" class="remove-preview" data-name="${file.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="preview-name">${file.name}</div>
      `;
      
      preview.querySelector('.remove-preview').addEventListener('click', () => {
        this.removeFile(file.name);
        preview.remove();
      });
      
      this.previewContainer.appendChild(preview);
    };
    
    reader.readAsDataURL(file);
  }
  
  removeFile(name) {
    this.files = this.files.filter(f => f.name !== name);
  }
  
  showError(message) {
    // You can customize this to show a toast or modal
    alert(message);
  }
  
  getFiles() {
    return this.files;
  }
  
  clear() {
    this.files = [];
    if (this.previewContainer) {
      this.previewContainer.innerHTML = '';
    }
    this.input.value = '';
  }
}

// Initialize gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize gallery on portfolio page
  if (document.querySelector('.portfolio-grid')) {
    window.gallery = new Gallery();
  }
  
  // Initialize image uploader on admin page
  if (document.querySelector('.upload-area')) {
    window.imageUploader = new ImageUploader();
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Gallery, ImageUploader };
}
