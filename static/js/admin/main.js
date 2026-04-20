/* ===========================
   UTILITY FUNCTIONS
   =========================== */

/**
 * Debounce function to limit function calls
 */
const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

/* ===========================
   TOAST NOTIFICATIONS
   =========================== */

class Toast {
    static container = null;
    
    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }
    
    static show(message, type = 'info', duration = 3000) {
        this.init();
        
        const icons = {
            success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            info: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
        
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
    
    static success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration = 3000) {
        this.show(message, 'error', duration);
    }
    
    static warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }
    
    static info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// Backwards compatibility - old showToast function
const showToast = (message, type = 'info') => {
    Toast.show(message, type);
};

/* ===========================
   SIDEBAR TOGGLE
   =========================== */

class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('adminSidebar');
        this.toggle = document.getElementById('sidebarToggle');
        this.mobileToggle = document.querySelector('.mobile-sidebar-toggle');
        
        this.init();
    }
    
    init() {
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }
        
        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!e.target.closest('.admin-sidebar') && !e.target.closest('.mobile-sidebar-toggle')) {
                    this.sidebar.classList.remove('active');
                }
            }
        });
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
    }
    
    toggleMobileSidebar() {
        this.sidebar.classList.toggle('active');
    }
    
    restore() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            this.sidebar.classList.add('collapsed');
        }
    }
}

// Backwards compatibility - old toggleSidebar function
const toggleSidebar = () => {
    const sidebarManager = window.sidebarManager || new SidebarManager();
    sidebarManager.toggleSidebar();
};

/* ===========================
   MODAL SYSTEM
   =========================== */

class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return;
        }
        this.closeBtn = this.modal.querySelector('.modal-close');
        
        this.init();
    }
    
    init() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }
    
    open() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    toggle() {
        this.modal.classList.contains('active') ? this.close() : this.open();
    }
}

// Backwards compatibility - old modal functions
const openModal = (modalId) => {
    const modal = new Modal(modalId);
    modal.open();
};

const closeModal = (modalId) => {
    const modal = new Modal(modalId);
    modal.close();
};

/* ===========================
   TABLE ACTIONS
   =========================== */

class TableManager {
    constructor(tableId) {
        this.table = document.getElementById(tableId);
        if (!this.table) return;
        
        this.checkboxes = this.table.querySelectorAll('input[type="checkbox"]');
        this.selectAllCheckbox = this.table.querySelector('thead input[type="checkbox"]');
        
        this.init();
    }
    
    init() {
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', () => this.selectAll());
        }
        
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectAll());
        });
    }
    
    selectAll() {
        const isChecked = this.selectAllCheckbox.checked;
        this.checkboxes.forEach(checkbox => {
            if (checkbox !== this.selectAllCheckbox) {
                checkbox.checked = isChecked;
            }
        });
    }
    
    updateSelectAll() {
        const bodyCheckboxes = Array.from(this.checkboxes).filter(cb => cb !== this.selectAllCheckbox);
        const allChecked = bodyCheckboxes.every(cb => cb.checked);
        const someChecked = bodyCheckboxes.some(cb => cb.checked);
        
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.checked = allChecked;
            this.selectAllCheckbox.indeterminate = someChecked && !allChecked;
        }
    }
    
    getSelectedRows() {
        const bodyCheckboxes = Array.from(this.checkboxes).filter(cb => cb !== this.selectAllCheckbox);
        return bodyCheckboxes.filter(cb => cb.checked).map(cb => cb.closest('tr'));
    }
    
    deleteSelected(confirmMessage = 'Are you sure?') {
        const selected = this.getSelectedRows();
        if (selected.length === 0) {
            Toast.warning('No rows selected');
            return;
        }
        
        if (confirm(confirmMessage)) {
            selected.forEach(row => {
                row.style.opacity = '0.5';
                row.style.pointerEvents = 'none';
            });
            Toast.success(`${selected.length} item(s) deleted`);
        }
    }
}

// Backwards compatibility - old delete function
const deleteRow = (row) => {
    row.style.animation = 'slideInUp 0.3s ease-out reverse';
    setTimeout(() => row.remove(), 300);
    Toast.success('Row deleted');
};

/* ===========================
   FILTER FUNCTIONALITY
   =========================== */

class FilterManager {
    constructor(filterId, targetSelector = 'tr', filterKey = 'data-filter') {
        this.filter = document.getElementById(filterId);
        this.targetSelector = targetSelector;
        this.filterKey = filterKey;
        
        this.init();
    }
    
    init() {
        if (this.filter) {
            this.filter.addEventListener('change', (e) => this.applyFilter(e.target.value));
        }
    }
    
    applyFilter(value) {
        const items = document.querySelectorAll(this.targetSelector);
        
        items.forEach(item => {
            const filterValue = item.getAttribute(this.filterKey);
            if (value === 'all' || filterValue === value) {
                item.style.display = '';
                item.style.animation = 'slideInUp 0.3s ease-out';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// Backwards compatibility - old filterTable function
const filterTable = (inputId, tableId) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const filter = input.value.toLowerCase();
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tr = table.getElementsByTagName('tr');
    
    for (let i = 1; i < tr.length; i++) {
        const td = tr[i].getElementsByTagName('td');
        let rowVisible = false;
        
        for (let j = 0; j < td.length; j++) {
            if (td[j] && td[j].innerText.toLowerCase().indexOf(filter) > -1) {
                rowVisible = true;
                break;
            }
        }
        tr[i].style.display = rowVisible ? '' : 'none';
    }
};

/* ===========================
   PORTFOLIO MANAGEMENT
   =========================== */

class PortfolioManager {
    constructor(dropzoneId, uploadInputId, galleryId) {
        this.dropzone = document.getElementById(dropzoneId);
        this.uploadInput = document.getElementById(uploadInputId);
        this.gallery = document.getElementById(galleryId);
        
        this.init();
    }
    
    init() {
        if (this.dropzone && this.uploadInput) {
            this.setupDragDrop();
            this.setupFileInput();
        }
    }
    
    setupDragDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, (e) => e.preventDefault());
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.add('active');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.remove('active');
            });
        });
        
        this.dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
        
        this.dropzone.addEventListener('click', () => {
            this.uploadInput.click();
        });
    }
    
    setupFileInput() {
        this.uploadInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }
    
    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                this.previewFile(file);
            } else {
                Toast.warning(`${file.name} is not a valid image`);
            }
        });
    }
    
    previewFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}" class="gallery-image">
                <div class="gallery-overlay">
                    <button class="gallery-btn delete-btn" title="Delete">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            `;
            
            this.gallery.prepend(item);
            
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.style.animation = 'slideInUp 0.3s ease-out reverse';
                setTimeout(() => item.remove(), 300);
                Toast.info('Image removed');
            });
            
            Toast.success(`${file.name} uploaded`);
        };
        
        reader.readAsDataURL(file);
    }
}

// Backwards compatibility - old handleDrop function
const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    // Would need portfolio manager instance to handle
};

/* ===========================
   BOOKING MANAGEMENT
   =========================== */

class BookingManager {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.confirm-booking-btn')) {
                this.confirmBooking(e.target.closest('.confirm-booking-btn'));
            }
            if (e.target.closest('.cancel-booking-btn')) {
                this.cancelBooking(e.target.closest('.cancel-booking-btn'));
            }
        });
    }
    
    confirmBooking(btn) {
        const bookingRow = btn.closest('tr');
        const status = bookingRow.querySelector('.status-badge');
        
        if (confirm('Confirm this booking?')) {
            status.textContent = 'Confirmed';
            status.className = 'status-badge confirmed';
            btn.disabled = true;
            Toast.success('Booking confirmed');
        }
    }
    
    cancelBooking(btn) {
        const bookingRow = btn.closest('tr');
        const status = bookingRow.querySelector('.status-badge');
        
        if (confirm('Cancel this booking?')) {
            status.textContent = 'Cancelled';
            status.className = 'status-badge cancelled';
            btn.disabled = true;
            Toast.warning('Booking cancelled');
        }
    }
}

// Backwards compatibility - old manageBooking function
const manageBooking = (bookingId) => {
    Toast.info('Booking management for ID: ' + bookingId);
};

/* ===========================
   EDIT/DELETE MODALS
   =========================== */

class EditDeleteManager {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                this.handleEdit(e.target.closest('.edit-btn'));
            }
            if (e.target.closest('.delete-btn:not(.gallery-btn)')) {
                this.handleDelete(e.target.closest('.delete-btn'));
            }
        });
    }
    
    handleEdit(btn) {
        const row = btn.closest('tr');
        if (row) {
            const data = {
                id: row.dataset.id,
                name: row.querySelector('td:nth-child(2)')?.textContent,
                email: row.querySelector('td:nth-child(3)')?.textContent,
                status: row.querySelector('td:nth-child(4)')?.textContent
            };
            
            Toast.info('Edit mode for: ' + (data.name || 'Item'));
        }
    }
    
    handleDelete(btn) {
        const row = btn.closest('tr');
        if (row) {
            if (confirm('Are you sure you want to delete this item?')) {
                row.style.animation = 'slideInUp 0.3s ease-out reverse';
                setTimeout(() => {
                    row.remove();
                    Toast.success('Item deleted');
                }, 300);
            }
        }
    }
}

// Backwards compatibility - old edit/delete functions
const showEditModal = (id) => {
    openModal('editModal');
    Toast.info('Loading data for ID: ' + id);
};

const confirmDelete = (id) => {
    openModal('deleteModal');
};

const editRow = (row) => {
    showEditModal(row.dataset.id || '');
};

/* ===========================
   SEARCH FUNCTIONALITY
   =========================== */

class SearchManager {
    constructor(searchInputId, tableId) {
        this.searchInput = document.getElementById(searchInputId);
        this.table = document.getElementById(tableId);
        
        this.init();
    }
    
    init() {
        if (this.searchInput && this.table) {
            this.searchInput.addEventListener('input', debounce((e) => {
                this.search(e.target.value);
            }, 300));
        }
    }
    
    search(query) {
        const filter = query.toLowerCase();
        const tr = this.table.getElementsByTagName('tr');
        let count = 0;
        
        for (let i = 1; i < tr.length; i++) {
            const td = tr[i].getElementsByTagName('td');
            let rowVisible = false;
            
            for (let j = 0; j < td.length; j++) {
                if (td[j] && td[j].innerText.toLowerCase().indexOf(filter) > -1) {
                    rowVisible = true;
                    break;
                }
            }
            
            tr[i].style.display = rowVisible ? '' : 'none';
            if (rowVisible) count++;
        }
        
        if (count === 0 && query) {
            Toast.info('No results found');
        }
    }
}

/* ===========================
   PAGINATION
   =========================== */

class Pagination {
    constructor(tableId, itemsPerPage = 10) {
        this.table = document.getElementById(tableId);
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.rows = [];
        
        this.init();
    }
    
    init() {
        if (this.table) {
            this.rows = Array.from(this.table.querySelectorAll('tbody tr'));
            this.render();
        }
    }
    
    render() {
        const totalPages = Math.ceil(this.rows.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        
        // Hide all rows
        this.rows.forEach(row => row.style.display = 'none');
        
        // Show current page rows
        this.rows.slice(start, end).forEach(row => row.style.display = '');
        
        this.renderPagination(totalPages);
    }
    
    renderPagination(totalPages) {
        const existing = this.table.parentElement.querySelector('.pagination');
        if (existing) {
            existing.remove();
        }
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '←';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pagination.appendChild(prevBtn);
        
        // Page info
        const info = document.createElement('span');
        info.className = 'pagination-info';
        info.textContent = `Page ${this.currentPage} of ${totalPages}`;
        pagination.appendChild(info);
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = '→';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pagination.appendChild(nextBtn);
        
        this.table.parentElement.appendChild(pagination);
    }
}

/* ===========================
   INITIALIZATION
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Toast
    Toast.init();
    
    // Initialize Sidebar
    const sidebarManager = new SidebarManager();
    sidebarManager.restore();
    window.sidebarManager = sidebarManager; // Store globally for backwards compatibility
    
    // Initialize Modals
    const modals = document.querySelectorAll('.modal');
    const modalInstances = {};
    modals.forEach(modal => {
        const id = modal.id;
        if (id) {
            modalInstances[id] = new Modal(id);
        }
    });
    window.modals = modalInstances;
    
    // Initialize Table Managers
    const tables = document.querySelectorAll('.data-table');
    tables.forEach((table) => {
        if (table.id) {
            new TableManager(table.id);
        }
    });
    
    // Initialize Portfolio Manager
    const dropzone = document.getElementById('uploadDropzone');
    if (dropzone) {
        new PortfolioManager('uploadDropzone', 'uploadInput', 'portfolioGallery');
    }
    
    // Initialize Booking Manager
    new BookingManager();
    
    // Initialize Edit/Delete Manager
    new EditDeleteManager();
    
    // Initialize Search (for topbar search)
    const searchInput = document.querySelector('.topbar-search input');
    if (searchInput) {
        const dataTable = document.querySelector('.data-table');
        if (dataTable && dataTable.id) {
            new SearchManager('topbarSearch', dataTable.id);
        }
    }
    
    // Initialize Pagination (for tables with tbody)
    const dataTable = document.querySelector('.data-table');
    if (dataTable && dataTable.id && dataTable.querySelector('tbody')) {
        new Pagination(dataTable.id, 10);
    }
});

/* ===========================
   EXPORTS FOR MODULE SYSTEMS
   =========================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Toast,
        SidebarManager,
        Modal,
        TableManager,
        FilterManager,
        PortfolioManager,
        BookingManager,
        EditDeleteManager,
        SearchManager,
        Pagination,
        debounce,
        // Backwards compatibility
        toggleSidebar,
        openModal,
        closeModal,
        filterTable,
        deleteRow,
        editRow,
        handleDrop,
        manageBooking,
        showEditModal,
        confirmDelete,
        showToast
    };
}