/* ========================================
   PAYMENTS MANAGEMENT - JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initializePayments();
});

// ========================================
// STATE MANAGEMENT
// ========================================

const paymentsState = {
    currentFilter: 'all',
    searchQuery: '',
    currentMonth: new Date().toISOString().slice(0, 7),
    sortBy: 'date',
    currentPage: 1,
    itemsPerPage: 10,
};

// ========================================
// INITIALIZATION
// ========================================

function initializePayments() {
    setupEventListeners();
    animateOnScroll();
    loadPayments();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Create invoice button
    document.getElementById('createInvoiceBtn')?.addEventListener('click', handleCreateInvoice);

    // Export button
    document.querySelector('[data-action="export"]')?.addEventListener('click', handleExport);

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.addEventListener('click', function () {
            handleFilterChange(this.dataset.filter);
        });
    });

    // Search
    document.getElementById('paymentSearch')?.addEventListener('input', debounce(handleSearch, 300));

    // Month filter
    document.getElementById('monthFilter')?.addEventListener('change', handleMonthChange);

    // Period select
    document.querySelectorAll('.period-select').forEach((select) => {
        select.addEventListener('change', handlePeriodChange);
    });

    // Action buttons
    document.addEventListener('click', function (e) {
        const viewBtn = e.target.closest('[data-action="view"]');
        const downloadBtn = e.target.closest('[data-action="download"]');
        const reminderBtn = e.target.closest('[title="Send Reminder"]');

        if (viewBtn) {
            const row = viewBtn.closest('tr');
            handleViewInvoice(row);
        }

        if (downloadBtn) {
            const row = downloadBtn.closest('tr');
            handleDownloadInvoice(row);
        }

        if (reminderBtn) {
            const row = reminderBtn.closest('tr');
            handleSendReminder(row);
        }
    });

    // Pagination
    document.querySelectorAll('.pagination-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            if (!this.disabled && !this.classList.contains('active')) {
                const svg = this.querySelector('svg');
                if (svg) {
                    // Navigation buttons
                    if (this.innerHTML.includes('<svg')) {
                        const isNext = this.innerHTML.includes('9 18');
                        paymentsState.currentPage += isNext ? 1 : -1;
                    }
                } else {
                    paymentsState.currentPage = parseInt(this.textContent);
                }
                updateTableDisplay();
            }
        });
    });
}

// ========================================
// FILTER & SEARCH
// ========================================

function handleFilterChange(filter) {
    paymentsState.currentFilter = filter;
    paymentsState.currentPage = 1;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

    // Filter and display
    filterAndDisplayPayments();
}

function handleSearch(e) {
    paymentsState.searchQuery = e.target.value.toLowerCase();
    paymentsState.currentPage = 1;
    filterAndDisplayPayments();
}

function handleMonthChange(e) {
    paymentsState.currentMonth = e.target.value;
    paymentsState.currentPage = 1;
    filterAndDisplayPayments();
}

function handlePeriodChange(e) {
    const period = e.target.value;
    updateRevenueStats(period);
}

function filterAndDisplayPayments() {
    const rows = document.querySelectorAll('.payments-table tbody tr');
    let visibleRows = [];

    rows.forEach((row) => {
        const status = row.dataset.status;
        const clientName = row.querySelector('.client-name')?.textContent.toLowerCase() || '';
        const invoiceId = row.querySelector('.invoice-id')?.textContent.toLowerCase() || '';
        const amount = row.querySelector('.amount')?.textContent || '';

        const matchesFilter =
            paymentsState.currentFilter === 'all' || status === paymentsState.currentFilter;
        const matchesSearch =
            clientName.includes(paymentsState.searchQuery) ||
            invoiceId.includes(paymentsState.searchQuery);

        if (matchesFilter && matchesSearch) {
            visibleRows.push(row);
        }
    });

    // Update pagination and display
    updateTableDisplay(visibleRows);
}

function updateTableDisplay(visibleRows = null) {
    if (!visibleRows) {
        const rows = document.querySelectorAll('.payments-table tbody tr');
        const status = paymentsState.currentFilter;
        visibleRows = Array.from(rows).filter(
            (row) => status === 'all' || row.dataset.status === status
        );
    }

    const startIdx = (paymentsState.currentPage - 1) * paymentsState.itemsPerPage;
    const endIdx = startIdx + paymentsState.itemsPerPage;

    // Show/hide rows
    document.querySelectorAll('.payments-table tbody tr').forEach((row, idx) => {
        const shouldShow = visibleRows.includes(row) && idx >= startIdx && idx < endIdx;
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) {
            row.style.animation = 'fadeIn 0.3s ease';
        }
    });

    // Update pagination UI
    updatePaginationUI(visibleRows.length);
}

function updatePaginationUI(totalItems) {
    const totalPages = Math.ceil(totalItems / paymentsState.itemsPerPage);
    const info = document.querySelector('.pagination-info');
    const startIdx = (paymentsState.currentPage - 1) * paymentsState.itemsPerPage + 1;
    const endIdx = Math.min(paymentsState.currentPage * paymentsState.itemsPerPage, totalItems);

    if (info) {
        info.textContent = `Showing ${totalItems === 0 ? 0 : startIdx}-${endIdx} of ${totalItems} payments`;
    }

    // Update page buttons
    document.querySelectorAll('.pagination-btn').forEach((btn) => {
        if (btn.textContent === String(paymentsState.currentPage)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ========================================
// REVENUE STATS
// ========================================

function updateRevenueStats(period) {
    const stats = getStatsForPeriod(period);

    // Animate changes
    const mainCard = document.querySelector('.revenue-card.main');
    if (mainCard) {
        mainCard.style.animation = 'none';
        setTimeout(() => {
            mainCard.style.animation = 'scaleUp 0.4s ease';
        }, 10);
    }

    console.log(`Revenue stats for ${period}:`, stats);
}

function getStatsForPeriod(period) {
    const stats = {
        month: {
            total: 'KES 285,000',
            trend: '+18%',
        },
        quarter: {
            total: 'KES 856,000',
            trend: '+25%',
        },
        year: {
            total: 'KES 3,420,000',
            trend: '+42%',
        },
    };

    return stats[period] || stats.month;
}

// ========================================
// INVOICE ACTIONS
// ========================================

function handleCreateInvoice() {
    showNotification('Opening invoice creator...', 'info');
    // In a real app, this would open a modal or navigate to invoice creation page
    console.log('Create invoice clicked');
}

function handleViewInvoice(row) {
    const invoiceId = row.querySelector('.invoice-id')?.textContent;
    const clientName = row.querySelector('.client-name')?.textContent;
    const amount = row.querySelector('.amount')?.textContent;
    const status = row.querySelector('.status-badge')?.textContent;

    showInvoicePreview({
        invoiceId,
        clientName,
        amount,
        status,
    });
}

function handleDownloadInvoice(row) {
    const invoiceId = row.querySelector('.invoice-id')?.textContent || 'invoice';
    console.log('Downloading invoice:', invoiceId);

    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${invoiceId}.pdf`;
    link.click();

    showNotification('Invoice downloaded successfully!', 'success');
}

function handleSendReminder(row) {
    const clientName = row.querySelector('.client-name')?.textContent;
    const invoiceId = row.querySelector('.invoice-id')?.textContent;

    console.log(`Sending reminder to ${clientName} for ${invoiceId}`);

    // Animate the button
    const reminderBtn = event.target.closest('[title="Send Reminder"]');
    if (reminderBtn) {
        reminderBtn.style.animation = 'spin 0.6s ease';
        setTimeout(() => {
            reminderBtn.style.animation = '';
        }, 600);
    }

    showNotification(`Reminder sent to ${clientName}!`, 'success');
}

function handleExport() {
    console.log('Exporting payments data...');
    showNotification('Payments data exported successfully!', 'success');
}

// ========================================
// INVOICE PREVIEW MODAL
// ========================================

function showInvoicePreview(invoiceData) {
    const modal = document.createElement('div');
    modal.className = 'invoice-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content invoice-content">
            <div class="modal-header">
                <h2>Invoice ${invoiceData.invoiceId}</h2>
                <button class="modal-close" onclick="this.closest('.invoice-modal').remove()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="invoice-details">
                    <div class="invoice-row">
                        <span class="label">Client:</span>
                        <span class="value">${invoiceData.clientName}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">Amount:</span>
                        <span class="value amount">${invoiceData.amount}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">Status:</span>
                        <span class="value status ${invoiceData.status?.toLowerCase()}">${invoiceData.status}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.invoice-modal').remove()">Close</button>
                <button class="btn btn-primary">Download PDF</button>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-backdrop').addEventListener('click', () => modal.remove());

    // Close on Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// ========================================
// UTILITIES
// ======================================== */

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
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${
            type === 'success'
                ? '#10b981'
                : type === 'error'
                  ? '#ef4444'
                  : type === 'warning'
                    ? '#f59e0b'
                    : '#3b82f6'
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
        z-index: 2000;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function loadPayments() {
    // Load and filter payments
    filterAndDisplayPayments();
}

function animateOnScroll() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = entry.target.dataset.animate
                        ? 'fadeIn 0.5s ease'
                        : 'none';
                    observer.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('[data-animate]').forEach((el) => {
            observer.observe(el);
        });
    }
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
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
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(2px);
    }
    
    .modal-content {
        position: relative;
        background: var(--dark-surface);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        box-shadow: var(--shadow-xl);
        animation: scaleUp 0.3s ease;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-light);
    }
    
    .modal-header h2 {
        font-size: 18px;
        font-weight: 700;
    }
    
    .modal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--dark-bg-secondary);
        color: var(--text-muted);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .modal-close:hover {
        background: var(--dark-surface-hover);
        color: var(--text-primary);
        transform: rotate(90deg);
    }
    
    .modal-body {
        padding: 24px;
    }
    
    .invoice-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .invoice-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--dark-bg-secondary);
        border-radius: 8px;
    }
    
    .invoice-row .label {
        color: var(--text-muted);
        font-weight: 600;
    }
    
    .invoice-row .value {
        color: var(--text-primary);
        font-weight: 500;
    }
    
    .invoice-row .value.amount {
        color: var(--success-color);
        font-weight: 700;
    }
    
    .invoice-row .value.status {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
    }
    
    .invoice-row .value.status.paid {
        background: rgba(16, 185, 129, 0.2);
        color: var(--success-color);
    }
    
    .invoice-row .value.status.pending {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning-color);
    }
    
    .invoice-row .value.status.overdue {
        background: rgba(239, 68, 68, 0.2);
        color: var(--danger-color);
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px;
        border-top: 1px solid var(--border-light);
        background: rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

// ========================================
// KEYBOARD SHORTCUTS
// ======================================== */

document.addEventListener('keydown', function (e) {
    // Escape to close any modal
    if (e.key === 'Escape') {
        document.querySelectorAll('.invoice-modal').forEach((modal) => modal.remove());
    }

    // Cmd/Ctrl + K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('paymentSearch')?.focus();
    }

    // Cmd/Ctrl + E to export
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
    }
});