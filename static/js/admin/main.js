/* =====================================================
   ADMIN DASHBOARD — JavaScript
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initAnimations();
  initInteractions();
  initSearch();
  initNotifications();
  initCharts();
});

/* =====================================================
   SIDEBAR FUNCTIONALITY
   ===================================================== */

function initSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed',
        sidebar.classList.contains('collapsed') ? 'true' : 'false'
      );
    });
  }

  // Close sidebar on link click (mobile)
  const navLinks = sidebar.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }
    });
  });

  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !mobileToggle?.contains(e.target) &&
        sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  });

  // Restore sidebar state
  if (localStorage.getItem('sidebarCollapsed') === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
  }
}

/* =====================================================
   ANIMATIONS
   ===================================================== */

function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach((el, index) => {
    el.style.animationDelay = `${index * 100}ms`;
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });

  // Stagger animation for stat cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    card.style.animation = `slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms forwards`;
    card.style.opacity = '0';
  });
}

/* =====================================================
   INTERACTIONS
   ===================================================== */

function initInteractions() {
  // Stat cards - ripple effect
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.6), transparent);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple animation to stylesheet
  if (!document.querySelector('style[data-ripple]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ripple', 'true');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Table row hover effect
  document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.addEventListener('mouseenter', function() {
      this.style.transform = 'translateX(4px)';
    });
    row.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(0)';
    });
  });

  // Chart filter select
  document.querySelectorAll('.chart-filter').forEach(select => {
    select.addEventListener('change', function() {
      const card = this.closest('.chart-card');
      card.style.opacity = '0.6';
      setTimeout(() => {
        card.style.opacity = '1';
      }, 200);
    });
  });

  // Message items - click to view
  document.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', function() {
      console.log('Message clicked:', this.textContent);
    });
  });

  // Action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      showActionMenu(this);
    });
  });
}

function showActionMenu(button) {
  console.log('Action menu for button:', button);
}

/* =====================================================
   SEARCH FUNCTIONALITY
   ===================================================== */

function initSearch() {
  const searchInput = document.querySelector('.topbar-search input');
  if (!searchInput) return;

  let searchTimeout;

  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.toLowerCase();

    searchTimeout = setTimeout(() => {
      if (query.length > 0) {
        performSearch(query);
      }
    }, 300);
  });
}

function performSearch(query) {
  const rows = document.querySelectorAll('.data-table tbody tr');
  let found = 0;

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(query)) {
      row.style.display = '';
      row.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
      found++;
    } else {
      row.style.display = 'none';
    }
  });

  console.log(`Found ${found} results for "${query}"`);
}

/* =====================================================
   NOTIFICATIONS
   ===================================================== */

function initNotifications() {
  const notificationsBtn = document.getElementById('notificationsBtn');
  if (!notificationsBtn) return;

  notificationsBtn.addEventListener('click', function() {
    showNotificationDropdown();
  });

  // Close notification dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown &&
        !dropdown.contains(e.target) &&
        !notificationsBtn.contains(e.target)) {
      dropdown?.remove();
    }
  });
}

function showNotificationDropdown() {
  const existing = document.querySelector('.notification-dropdown');
  if (existing) {
    existing.remove();
    return;
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'notification-dropdown';
  dropdown.innerHTML = `
    <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; position: absolute; top: 100%; right: 0; min-width: 300px; margin-top: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); z-index: 1001;">
      <div style="font-weight: 600; margin-bottom: 12px; color: var(--text-primary);">Notifications</div>
      <div style="font-size: 13px; color: var(--text-muted); max-height: 300px; overflow-y: auto;">
        <div style="padding: 8px 0; border-bottom: 1px solid var(--border);">
          <div style="color: var(--gold); font-weight: 500; margin-bottom: 4px;">New Booking</div>
          <div>Wedding photography scheduled for Apr 28</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">2 hours ago</div>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid var(--border);">
          <div style="color: var(--gold); font-weight: 500; margin-bottom: 4px;">Payment Received</div>
          <div>KES 8,000 from John Kamau</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">4 hours ago</div>
        </div>
        <div style="padding: 8px 0;">
          <div style="color: var(--gold); font-weight: 500; margin-bottom: 4px;">New Message</div>
          <div>3 new messages from clients</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">6 hours ago</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dropdown);
  dropdown.style.animation = 'slideUp 0.3s ease-out';
}

/* =====================================================
   CHART INITIALIZATION
   ===================================================== */

function initCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    return;
  }

  // Set global options
  Chart.defaults.color = 'rgba(139, 148, 158, 1)';
  Chart.defaults.borderColor = 'rgba(48, 54, 61, 1)';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

  initBookingsChart();
  initServicesChart();
  initRevenueChart();
  initPaymentMethodsChart();
}

function initBookingsChart() {
  const ctx = document.getElementById('bookingsChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Bookings',
        data: [4, 6, 8, 6],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#D4AF37',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#E8C547',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 17, 23, 0.9)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(48, 54, 61, 1)',
          borderWidth: 1,
          titleColor: '#D4AF37',
          bodyColor: '#e6edf3',
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.5)' },
          ticks: { color: 'rgba(139, 148, 158, 1)' }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(139, 148, 158, 1)' }
        }
      }
    }
  });
}

function initServicesChart() {
  const ctx = document.getElementById('servicesChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Portraits', 'Events', 'Commercial', 'Video'],
      datasets: [{
        data: [35, 30, 20, 15],
        backgroundColor: ['#D4AF37', '#3B82F6', '#22C55E', '#8B5CF6'],
        borderWidth: 2,
        borderColor: 'var(--bg-card)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 17, 23, 0.9)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(48, 54, 61, 1)',
          borderWidth: 1,
          titleColor: '#D4AF37',
          bodyColor: '#e6edf3'
        }
      }
    }
  });
}

function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Revenue (KES)',
        data: [45000, 52000, 48000, 65000],
        backgroundColor: '#22C55E',
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#4ADE80'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 17, 23, 0.9)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(48, 54, 61, 1)',
          borderWidth: 1,
          titleColor: '#D4AF37',
          bodyColor: '#e6edf3',
          callbacks: {
            label: function(context) {
              return 'KES ' + context.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(48, 54, 61, 0.5)' },
          ticks: {
            color: 'rgba(139, 148, 158, 1)',
            callback: function(value) {
              return 'KES ' + (value / 1000) + 'K';
            }
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(139, 148, 158, 1)' }
        }
      }
    }
  });
}

function initPaymentMethodsChart() {
  const ctx = document.getElementById('paymentMethodsChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['M-Pesa', 'Bank', 'Card', 'Cash'],
      datasets: [{
        data: [45, 30, 15, 10],
        backgroundColor: ['#D4AF37', '#3B82F6', '#22C55E', '#8B5CF6'],
        borderWidth: 2,
        borderColor: 'var(--bg-card)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 17, 23, 0.9)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(48, 54, 61, 1)',
          borderWidth: 1,
          titleColor: '#D4AF37',
          bodyColor: '#e6edf3'
        }
      }
    }
  });
}

/* =====================================================
   UTILITY FUNCTIONS
   ===================================================== */

function formatCurrency(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

/* =====================================================
   EXPORT FOR GLOBAL USE
   ===================================================== */

window.AdminDashboard = {
  formatCurrency,
  formatDate,
  showNotificationDropdown
};
