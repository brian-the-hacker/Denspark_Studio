/**
 * Denspark Studio - Admin Dashboard JavaScript
 * Handles admin panel functionality including sidebar, modals, and data management
 */

// ==========================================
// Sidebar Toggle
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.getElementById('adminMain');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    
    // Desktop sidebar toggle
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
    
    // Mobile sidebar toggle
    mobileSidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });
    
    // Close mobile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar?.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !mobileSidebarToggle?.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
    
    // Restore sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar?.classList.add('collapsed');
        mainContent?.classList.add('expanded');
    }
    
    // Initialize animations
    initScrollAnimations();
    
    // Initialize modals
    initModals();
    
    // Initialize filters
    initFilters();
    
    // Initialize tables
    initTables();
    
    // Initialize portfolio
    initPortfolio();
    
    // Initialize bookings
    initBookings();
});

// ==========================================
// Scroll Animations
// ==========================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => observer.observe(el));
}

// ==========================================
// Modal System
// ==========================================
function initModals() {
    // Generic modal close functionality
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', () => {
            const modal = el.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.open');
            if (openModal) closeModal(openModal);
        }
    });
    
    // Upload modal
    const uploadBtn = document.getElementById('uploadBtn');
    const emptyUploadBtn = document.getElementById('emptyUploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const cancelUpload = document.getElementById('cancelUpload');
    
    [uploadBtn, emptyUploadBtn].forEach(btn => {
        btn?.addEventListener('click', () => openModal(uploadModal));
    });
    
    [closeUploadModal, cancelUpload].forEach(btn => {
        btn?.addEventListener('click', () => closeModal(uploadModal));
    });
    
    // Booking modal
    const newBookingBtn = document.getElementById('newBookingBtn');
    const bookingModal = document.getElementById('bookingModal');
    const closeBookingModal = document.getElementById('closeBookingModal');
    const cancelBooking = document.getElementById('cancelBooking');
    
    newBookingBtn?.addEventListener('click', () => openModal(bookingModal));
    
    [closeBookingModal, cancelBooking].forEach(btn => {
        btn?.addEventListener('click', () => closeModal(bookingModal));
    });
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// ==========================================
// Filter System
// ==========================================
function initFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const parent = tab.closest('.filter-tabs');
            parent.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filter = tab.dataset.filter;
            filterItems(filter);
        });
    });
    
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-box input, #bookingSearch, #paymentSearch, #photoSearch');
    searchInputs.forEach(input => {
        input?.addEventListener('input', debounce((e) => {
            searchItems(e.target.value);
        }, 300));
    });
}

function filterItems(filter) {
    const items = document.querySelectorAll('[data-status], [data-category]');
    
    items.forEach(item => {
        const status = item.dataset.status || item.dataset.category;
        if (filter === 'all' || status === filter) {
            item.style.display = '';
            item.style.animation = 'fadeIn 0.3s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

function searchItems(query) {
    const items = document.querySelectorAll('tbody tr, .portfolio-item, .conversation-item');
    const normalizedQuery = query.toLowerCase().trim();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(normalizedQuery)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==========================================
// Table Functionality
// ==========================================
function initTables() {
    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    selectAll?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateBulkActions();
    });
    
    // Row checkboxes
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.addEventListener('change', updateBulkActions);
    });
    
    // Action buttons
    document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            const row = btn.closest('tr') || btn.closest('.portfolio-item');
            const id = row?.dataset.id;
            
            handleAction(action, id, row);
        });
    });
}

function updateBulkActions() {
    const checkedCount = document.querySelectorAll('.row-checkbox:checked, .photo-select:checked').length;
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (bulkActions) {
        if (checkedCount > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = checkedCount;
        } else {
            bulkActions.style.display = 'none';
        }
    }
}

function handleAction(action, id, element) {
    switch (action) {
        case 'view':
            console.log('Viewing item:', id);
            // Implement view logic
            break;
        case 'edit':
            openEditModal(id, element);
            break;
        case 'delete':
            openDeleteModal(id, element);
            break;
        case 'confirm':
            confirmBooking(id, element);
            break;
        case 'cancel':
            cancelBooking(id, element);
            break;
        default:
            console.log('Action:', action, 'ID:', id);
    }
}

// ==========================================
// Portfolio Management
// ==========================================
function initPortfolio() {
    const dropzone = document.getElementById('uploadDropzone');
    const photoInput = document.getElementById('photoInput');
    const uploadPreview = document.getElementById('uploadPreview');
    
    if (!dropzone) return;
    
    // Click to browse
    dropzone.querySelector('.browse-link')?.addEventListener('click', () => {
        photoInput.click();
    });
    
    dropzone.addEventListener('click', (e) => {
        if (e.target === dropzone || e.target.closest('svg') || e.target.closest('p')) {
            photoInput.click();
        }
    });
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'));
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'));
    });
    
    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files, uploadPreview);
    });
    
    photoInput?.addEventListener('change', (e) => {
        handleFiles(e.target.files, uploadPreview);
    });
    
    // Portfolio item selection
    document.querySelectorAll('.photo-select').forEach(cb => {
        cb.addEventListener('change', updateBulkActions);
    });
    
    // View toggle
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            const grid = document.getElementById('portfolioGrid');
            if (grid) {
                grid.className = view === 'list' ? 'portfolio-list' : 'portfolio-grid';
            }
        });
    });
    
    // Submit upload
    document.getElementById('submitUpload')?.addEventListener('click', () => {
        const form = document.getElementById('uploadForm');
        if (form.checkValidity()) {
            // Submit form via AJAX or regular submit
            showToast('Photos uploaded successfully!', 'success');
            closeModal(document.getElementById('uploadModal'));
            resetUploadForm();
        } else {
            form.reportValidity();
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFiles(files, previewContainer) {
    if (!previewContainer) return;
    
    [...files].forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'preview-item';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button type="button" class="remove-preview">&times;</button>
                <span class="preview-name">${file.name}</span>
            `;
            
            preview.querySelector('.remove-preview').addEventListener('click', () => {
                preview.remove();
            });
            
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

function resetUploadForm() {
    const form = document.getElementById('uploadForm');
    const preview = document.getElementById('uploadPreview');
    form?.reset();
    if (preview) preview.innerHTML = '';
}

// ==========================================
// Bookings Management
// ==========================================
function initBookings() {
    // Save booking
    document.getElementById('saveBooking')?.addEventListener('click', () => {
        const form = document.getElementById('bookingForm');
        if (form.checkValidity()) {
            showToast('Booking created successfully!', 'success');
            closeModal(document.getElementById('bookingModal'));
            form.reset();
        } else {
            form.reportValidity();
        }
    });
}

function confirmBooking(id, element) {
    const statusBadge = element.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = 'Confirmed';
        statusBadge.className = 'status-badge confirmed';
    }
    element.dataset.status = 'confirmed';
    showToast('Booking confirmed!', 'success');
}

function cancelBooking(id, element) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const statusBadge = element.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'Cancelled';
            statusBadge.className = 'status-badge cancelled';
        }
        element.dataset.status = 'cancelled';
        showToast('Booking cancelled', 'info');
    }
}

// ==========================================
// Edit Modal
// ==========================================
function openEditModal(id, element) {
    const editModal = document.getElementById('editModal');
    if (!editModal) return;
    
    // Populate form with data
    const img = element.querySelector('img');
    const title = element.querySelector('h3')?.textContent || '';
    const category = element.dataset.category || '';
    
    document.getElementById('editPhotoId').value = id;
    document.getElementById('editPreviewImg').src = img?.src || '';
    document.getElementById('editTitle').value = title;
    document.getElementById('editCategory').value = category;
    
    openModal(editModal);
}

// Close edit modal
document.getElementById('closeEditModal')?.addEventListener('click', () => {
    closeModal(document.getElementById('editModal'));
});

document.getElementById('cancelEdit')?.addEventListener('click', () => {
    closeModal(document.getElementById('editModal'));
});

document.getElementById('saveEdit')?.addEventListener('click', () => {
    showToast('Changes saved successfully!', 'success');
    closeModal(document.getElementById('editModal'));
});

// ==========================================
// Delete Modal
// ==========================================
let deleteTarget = null;

function openDeleteModal(id, element) {
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) return;
    
    deleteTarget = { id, element };
    openModal(deleteModal);
}

document.getElementById('closeDeleteModal')?.addEventListener('click', () => {
    closeModal(document.getElementById('deleteModal'));
    deleteTarget = null;
});

document.getElementById('cancelDelete')?.addEventListener('click', () => {
    closeModal(document.getElementById('deleteModal'));
    deleteTarget = null;
});

document.getElementById('confirmDelete')?.addEventListener('click', () => {
    if (deleteTarget) {
        deleteTarget.element.remove();
        showToast('Item deleted successfully!', 'success');
        closeModal(document.getElementById('deleteModal'));
        deleteTarget = null;
    }
});

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' :
              type === 'error' ? '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>' :
              '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span>${message}</span>
    `;
    
    // Create container if doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// Utility Functions
// ==========================================
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

// Add CSS for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: #1a1a1a;
        border: 1px solid #262626;
        border-radius: 12px;
        color: #fff;
        font-size: 14px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        transform: translateX(120%);
        transition: transform 0.3s ease;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
    
    .toast-success svg { color: #22c55e; }
    .toast-error svg { color: #ef4444; }
    .toast-info svg { color: #3b82f6; }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(toastStyles);
