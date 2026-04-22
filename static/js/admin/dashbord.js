/* =====================================================
   DENSPARK STUDIO — Admin Panel JS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initModals();
  initToasts();
  initCharts();
  initAdminChat();
  initPortfolioAdmin();
  initSettings();
  initBookingsAdmin();
  initPaymentsAdmin();
});

/* --- Sidebar (mobile toggle) --- */
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Active link highlight
  const links = sidebar.querySelectorAll('.sidebar-link');
  const current = window.location.pathname;
  links.forEach(link => {
    if (link.href && current.endsWith(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

/* --- Modals --- */
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modalOpen;
      document.getElementById(id)?.classList.add('open');
    });
  });

  document.querySelectorAll('[data-modal-close], .modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('open');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
    }
  });
}

/* --- Toast --- */
function initToasts() {
  window.showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '!' };
    toast.innerHTML = `<span style="font-weight:700;color:var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning'})">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };
}

/* --- Mini Charts (Canvas) --- */
function initCharts() {
  drawLineChart('revenueChart');
  drawBarChart('bookingsChart');
}

function drawLineChart(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  const data = [42, 68, 55, 91, 74, 110, 88, 130, 105, 142, 120, 165];
  const max = Math.max(...data);
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };

  ctx.clearRect(0, 0, W, H);

  const pts = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * (W - pad.left - pad.right),
    y: H - pad.bottom - ((v / max) * (H - pad.top - pad.bottom)),
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, 'rgba(201,147,63,0.25)');
  grad.addColorStop(1, 'rgba(201,147,63,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom);
  ctx.lineTo(pts[0].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#c9933f';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c9933f';
    ctx.fill();
  });
}

function drawBarChart(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  const data = [8, 14, 11, 19, 15, 22, 18, 26, 21, 29, 24, 32];
  const labels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const max = Math.max(...data);
  const pad = { top: 16, right: 16, bottom: 28, left: 32 };
  const barW = ((W - pad.left - pad.right) / data.length) * 0.6;
  const gap = (W - pad.left - pad.right) / data.length;

  ctx.clearRect(0, 0, W, H);

  data.forEach((v, i) => {
    const x = pad.left + i * gap + (gap - barW) / 2;
    const barH = (v / max) * (H - pad.top - pad.bottom);
    const y = H - pad.bottom - barH;

    const grad = ctx.createLinearGradient(0, y, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(201,147,63,0.9)');
    grad.addColorStop(1, 'rgba(201,147,63,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#555';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 14);
  });
}

/* --- Admin Chat --- */
function initAdminChat() {
  const panel = document.querySelector('.chat-panel');
  if (!panel) return;

  const input = panel.querySelector('textarea');
  const sendBtn = panel.querySelector('.send-btn');
  const messages = panel.querySelector('.admin-messages');

  sendBtn?.addEventListener('click', sendAdminMsg);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminMsg();
    }
  });

  function sendAdminMsg() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const div = document.createElement('div');
    div.className = 'admin-msg me';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="admin-msg-bubble">${text}</div>
      <div class="admin-msg-meta">${time}</div>
    `;
    messages?.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    input.value = '';
    input.style.height = 'auto';
    showToast('Message sent', 'success');
  }

  // Convo list click
  document.querySelectorAll('.convo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.convo-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      item.querySelector('.convo-unread')?.remove();
    });
  });
}

/* --- Portfolio Admin --- */
function initPortfolioAdmin() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  if (!uploadZone) return;

  uploadZone.addEventListener('click', () => fileInput?.click());

  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer?.files || []);
    handleFiles(files);
  });

  fileInput?.addEventListener('change', e => {
    handleFiles(Array.from(e.target.files));
  });

  function handleFiles(files) {
    files.filter(f => f.type.startsWith('image/')).forEach(file => {
      showToast(`"${file.name}" uploaded successfully`, 'success');
    });
  }

  // Delete image cards
  document.querySelectorAll('.img-action-btn[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.img-card');
      if (confirm('Delete this image?')) {
        card?.remove();
        showToast('Image deleted', 'warning');
      }
    });
  });
}

/* --- Settings Tabs --- */
function initSettings() {
  const navLinks = document.querySelectorAll('.settings-nav-link');
  const sections = document.querySelectorAll('.settings-section');

  if (!navLinks.length) return;

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      const target = link.dataset.section;
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Settings form submissions
  document.querySelectorAll('.settings-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      showToast('Settings saved successfully', 'success');
    });
  });
}

/* --- Bookings Admin --- */
function initBookingsAdmin() {
  const statusBtns = document.querySelectorAll('[data-booking-action]');
  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bookingAction;
      const row = btn.closest('tr');
      const badge = row?.querySelector('.badge');
      if (action === 'confirm' && badge) {
        badge.className = 'badge badge-success';
        badge.textContent = 'Confirmed';
        showToast('Booking confirmed!', 'success');
      } else if (action === 'cancel' && badge) {
        badge.className = 'badge badge-error';
        badge.textContent = 'Cancelled';
        showToast('Booking cancelled', 'warning');
      }
    });
  });
}

/* --- Payments Admin --- */
function initPaymentsAdmin() {
  const exportBtn = document.getElementById('exportPayments');
  exportBtn?.addEventListener('click', () => {
    showToast('Payments exported as CSV', 'success');
  });
}
