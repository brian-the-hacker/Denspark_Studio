/* ========================================
   PORTFOLIO MANAGEMENT - JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initializePortfolio();
});

// ========================================
// STATE MANAGEMENT
// ========================================

const portfolioState = {
    currentFilter: 'all',
    currentView: 'grid',
    selectedItems: new Set(),
    searchQuery: '',
    sortBy: 'newest',
};

// ========================================
// INITIALIZATION
// ========================================

function initializePortfolio() {
    setupEventListeners();
    loadPortfolioItems();
    setupDragAndDrop();
    animateOnScroll();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Upload buttons
    document.getElementById('uploadBtn')?.addEventListener('click', openUploadModal);
    document.getElementById('emptyUploadBtn')?.addEventListener('click', openUploadModal);

    // Modal controls
    document.getElementById('closeUploadModal')?.addEventListener('click', closeUploadModal);
    document.getElementById('cancelUpload')?.addEventListener('click', closeUploadModal);
    document.getElementById('submitUpload')?.addEventListener('click', handleUpload);

    document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit')?.addEventListener('click', closeEditModal);
    document.getElementById('saveEdit')?.addEventListener('click', handleSaveEdit);

    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete')?.addEventListener('click', handleDelete);

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.addEventListener('click', function () {
            handleFilterChange(this.dataset.filter);
        });
    });

    // Search
    document.getElementById('photoSearch')?.addEventListener('input', debounce(handleSearch, 300));

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', handleSort);

    // View toggle
    document.querySelectorAll('.view-toggle').forEach((btn) => {
        btn.addEventListener('click', function () {
            handleViewChange(this.dataset.view);
        });
    });

    // Bulk actions
    document.getElementById('bulkDelete')?.addEventListener('click', handleBulkDelete);
    document.getElementById('bulkCategory')?.addEventListener('click', handleBulkCategory);
    document.getElementById('bulkDownload')?.addEventListener('click', handleBulkDownload);
    document.getElementById('bulkCancel')?.addEventListener('click', cancelBulkActions);

    // Upload form
    const browseLink = document.querySelector('.browse-link');
    if (browseLink) {
        browseLink.addEventListener('click', () => {
            document.getElementById('photoInput')?.click();
        });
    }

    document.getElementById('photoInput')?.addEventListener('change', handleFileSelect);

    // Upload category
    const uploadCategory = document.getElementById('uploadCategory');
    if (uploadCategory) {
        uploadCategory.addEventListener('change', function () {
            localStorage.setItem('lastCategory', this.value);
        });
    }
}

// ========================================
// FILTER & SEARCH
// ========================================

function handleFilterChange(filter) {
    portfolioState.currentFilter = filter;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

    // Filter items
    filterAndDisplayItems();
}

function handleSearch(e) {
    portfolioState.searchQuery = e.target.value.toLowerCase();
    filterAndDisplayItems();
}

function handleSort(e) {
    portfolioState.sortBy = e.target.value;
    filterAndDisplayItems();
}

function handleViewChange(view) {
    portfolioState.currentView = view;

    // Update active button
    document.querySelectorAll('.view-toggle').forEach((btn) => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

    // Change grid layout
    const grid = document.getElementById('portfolioGrid');
    if (grid) {
        if (view === 'list') {
            grid.style.gridTemplateColumns = '1fr';
        } else {
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        }
    }
}

function filterAndDisplayItems() {
    const items = document.querySelectorAll('.portfolio-item');
    let visibleCount = 0;

    items.forEach((item) => {
        const category = item.dataset.category;
        const title = item.querySelector('.portfolio-info h3')?.textContent.toLowerCase() || '';
        const matchesFilter =
            portfolioState.currentFilter === 'all' || category === portfolioState.currentFilter;
        const matchesSearch = title.includes(portfolioState.searchQuery);

        if (matchesFilter && matchesSearch) {
            item.style.display = '';
            visibleCount++;
            animateItem(item);
        } else {
            item.style.display = 'none';
        }
    });

    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }
}

// ========================================
// SELECTION & BULK ACTIONS
// ========================================

document.addEventListener('change', function (e) {
    if (e.target.classList.contains('photo-select')) {
        const item = e.target.closest('.portfolio-item');
        if (e.target.checked) {
            portfolioState.selectedItems.add(item.dataset.id);
            item.classList.add('selected');
        } else {
            portfolioState.selectedItems.delete(item.dataset.id);
            item.classList.remove('selected');
        }
        updateBulkActionsUI();
    }
});

function updateBulkActionsUI() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');

    if (portfolioState.selectedItems.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = portfolioState.selectedItems.size;
    } else {
        bulkActions.style.display = 'none';
    }
}

function cancelBulkActions() {
    document.querySelectorAll('.photo-select').forEach((checkbox) => {
        checkbox.checked = false;
    });
    document.querySelectorAll('.portfolio-item').forEach((item) => {
        item.classList.remove('selected');
    });
    portfolioState.selectedItems.clear();
    updateBulkActionsUI();
}

function handleBulkDelete() {
    if (portfolioState.selectedItems.size === 0) return;

    showDeleteModal(Array.from(portfolioState.selectedItems));
}

function handleBulkCategory() {
    if (portfolioState.selectedItems.size === 0) return;

    const category = prompt(
        'Enter new category (portraits, events, commercial, video):',
        'portraits'
    );
    if (category) {
        console.log('Changing category for:', Array.from(portfolioState.selectedItems), category);
        cancelBulkActions();
    }
}

function handleBulkDownload() {
    if (portfolioState.selectedItems.size === 0) return;

    Array.from(portfolioState.selectedItems).forEach((id) => {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            const img = item.querySelector('img');
            const link = document.createElement('a');
            link.href = img.src;
            link.download = `portfolio-${id}.jpg`;
            link.click();
        }
    });
}

// ========================================
// UPLOAD MODAL
// ========================================

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Restore last selected category
        const lastCategory = localStorage.getItem('lastCategory');
        if (lastCategory) {
            document.getElementById('uploadCategory').value = lastCategory;
        }
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetUploadForm();
    }
}

function resetUploadForm() {
    document.getElementById('uploadForm')?.reset();
    document.getElementById('uploadPreview').innerHTML = '';
}

function setupDragAndDrop() {
    const dropzone = document.getElementById('uploadDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', handleDrop);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    document.getElementById('photoInput').files = files;
    handleFileSelect({ target: { files } });
}

function handleFileSelect(e) {
    const files = e.target.files;
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${event.target.result}" alt="Preview">
                    <button class="preview-remove" data-index="${index}" type="button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                `;
                preview.appendChild(div);

                div.querySelector('.preview-remove')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    div.remove();
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

function handleUpload() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    const category = document.getElementById('uploadCategory').value;
    if (!category) {
        alert('Please select a category');
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitUpload');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> Uploading...';
    submitBtn.disabled = true;

    // In a real app, submit form via AJAX
    setTimeout(() => {
        console.log('Upload successful');
        showNotification('Photos uploaded successfully!', 'success');
        closeUploadModal();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// ========================================
// EDIT MODAL
// ========================================

let currentEditId = null;

document.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="edit"]')) {
        const item = e.target.closest('.portfolio-item');
        if (item) {
            openEditModal(item);
        }
    }

    if (e.target.closest('[data-action="view"]')) {
        const item = e.target.closest('.portfolio-item');
        if (item) {
            openViewModal(item);
        }
    }

    if (e.target.closest('[data-action="delete"]')) {
        const item = e.target.closest('.portfolio-item');
        if (item) {
            showDeleteModal([item.dataset.id]);
        }
    }
});

function openEditModal(item) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    currentEditId = item.dataset.id;
    const img = item.querySelector('img');
    const title = item.querySelector('.portfolio-info h3')?.textContent || '';
    const category = item.dataset.category;

    document.getElementById('editPhotoId').value = currentEditId;
    document.getElementById('editPreviewImg').src = img.src;
    document.getElementById('editTitle').value = title;
    document.getElementById('editCategory').value = category;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleSaveEdit() {
    const form = document.getElementById('editForm');
    if (!form) return;

    const formData = new FormData(form);
    console.log('Saving edits:', Object.fromEntries(formData));

    showNotification('Photo updated successfully!', 'success');
    closeEditModal();
}

function openViewModal(item) {
    const img = item.querySelector('img');
    window.open(img.src, '_blank');
}

// ========================================
// DELETE MODAL
// ========================================

let itemsToDelete = [];

function showDeleteModal(ids) {
    itemsToDelete = ids;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    itemsToDelete = [];
}

function handleDelete() {
    if (itemsToDelete.length === 0) return;

    console.log('Deleting items:', itemsToDelete);

    // Animate deletion
    itemsToDelete.forEach((id) => {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'scaleOut 0.3s ease forwards';
            setTimeout(() => {
                item.remove();
                filterAndDisplayItems();
            }, 300);
        }
    });

    portfolioState.selectedItems.clear();
    updateBulkActionsUI();
    closeDeleteModal();
    showNotification('Photo deleted successfully!', 'success');
}

// ========================================
// UTILITIES
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
        z-index: 2000;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function animateItem(item) {
    item.style.animation = 'none';
    setTimeout(() => {
        item.style.animation = 'scaleUp 0.3s ease';
    }, 10);
}

function animateOnScroll() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'scaleUp 0.5s ease forwards';
                    observer.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('[data-animate]').forEach((el) => {
            observer.observe(el);
        });
    }
}

function loadPortfolioItems() {
    // This would typically load from the backend
    filterAndDisplayItems();
}

// Add animation keyframes to document
const style = document.createElement('style');
style.textContent = `
    @keyframes scaleOut {
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function (e) {
    // Close modal on Escape
    if (e.key === 'Escape') {
        closeUploadModal();
        closeEditModal();
        closeDeleteModal();
    }

    // Cmd/Ctrl + K for search focus
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('photoSearch')?.focus();
    }
});

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', function () {
        this.closest('.modal').classList.remove('active');
        document.body.style.overflow = '';
    });
});