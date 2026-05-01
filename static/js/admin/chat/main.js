/* messages.js — Denspark Admin */
(function () {
  'use strict';

  let currentId   = null;
  let currentName = null;

  /* ── DOM refs ── */
  const list          = document.getElementById('msList');
  const detailEmpty   = document.getElementById('msDetailEmpty');
  const detailContent = document.getElementById('msDetailContent');
  const searchInput   = document.getElementById('msSearch');
  const confirmOverlay = document.getElementById('msConfirmOverlay');

  /* ── Click a message item ── */
  list.addEventListener('click', function (e) {
    const item = e.target.closest('.ms-item');
    if (!item) return;

    /* Active state */
    document.querySelectorAll('.ms-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const id      = item.dataset.id;
    const name    = item.dataset.name;
    const email   = item.dataset.email;
    const phone   = item.dataset.phone;
    const service = item.dataset.service;
    const content = item.dataset.content;
    const time    = item.dataset.time;
    const isRead  = item.dataset.read === 'true';

    currentId   = id;
    currentName = name;

    /* Show detail */
    detailEmpty.style.display = 'none';
    detailContent.classList.add('visible');

    /* Populate header */
    document.getElementById('dAvatar').textContent = name[0].toUpperCase();
    document.getElementById('dName').textContent   = name;
    document.getElementById('dSub').textContent    = email;

    /* Meta strip */
    document.getElementById('dFrom').textContent  = name;
    const emailLink = document.getElementById('dEmail');
    emailLink.textContent = email;
    emailLink.href        = 'mailto:' + email;

    const phoneWrap = document.getElementById('dPhoneWrap');
    if (phone) {
      phoneWrap.style.display = '';
      document.getElementById('dPhone').textContent = phone;
    } else {
      phoneWrap.style.display = 'none';
    }

    const serviceWrap = document.getElementById('dServiceWrap');
    if (service) {
      serviceWrap.style.display = '';
      document.getElementById('dService').textContent = service;
    } else {
      serviceWrap.style.display = 'none';
    }

    document.getElementById('dTime').textContent = time || '—';

    /* Message text */
    document.getElementById('dMessage').textContent = content;

    /* Badge */
    const badge = document.getElementById('dBadge');
    if (isRead) {
      badge.textContent = 'Read';
      badge.className   = 'ms-status-badge read';
      document.getElementById('dMarkRead').style.display = 'none';
    } else {
      badge.textContent = 'Unread';
      badge.className   = 'ms-status-badge unread';
      document.getElementById('dMarkRead').style.display = '';
    }

    /* WhatsApp link */
    const waBtn = document.getElementById('dWhatsApp');
    if (phone) {
      let wa = phone.replace(/[\s\-()]/g, '');
      if (wa.startsWith('0')) wa = '254' + wa.slice(1);
      if (wa.startsWith('+')) wa = wa.slice(1);
      waBtn.href  = 'https://wa.me/' + wa;
      waBtn.style.display = '';
    } else {
      waBtn.style.display = 'none';
    }

    /* Email reply link */
    document.getElementById('dEmailBtn').href =
      'mailto:' + email + '?subject=Re%3A%20Your%20Denspark%20Studio%20Enquiry';

    /* Create booking button */
    document.getElementById('dCreateBooking').onclick = function () {
      /* Could open new booking modal pre-filled, or navigate */
      alert('Opening new booking for ' + name + '…\n(Wire this to your booking modal or route)');
    };

    /* Auto-mark as read after 1.8s */
    if (!isRead) {
      setTimeout(() => markRead(), 1800);
    }
  });

  /* ── Mark as read ── */
  document.getElementById('dMarkRead').addEventListener('click', markRead);

  function markRead() {
    if (!currentId) return;

    fetch('/admin/messages/' + currentId + '/read', { method: 'POST' })
      .then(r => r.json())
      .catch(() => {}) /* silent fail in demo */
      .finally(() => {
        const item = document.querySelector('.ms-item[data-id="' + currentId + '"]');
        if (item) {
          item.classList.remove('unread');
          item.dataset.read = 'true';
          const dot = item.querySelector('.ms-unread-dot');
          if (dot) dot.remove();
          const av = item.querySelector('.ms-item-avatar');
          if (av) av.classList.add('dim');
          /* Update unread pill count */
          updateUnreadPill();
        }
        const badge = document.getElementById('dBadge');
        badge.textContent = 'Read';
        badge.className   = 'ms-status-badge read';
        document.getElementById('dMarkRead').style.display = 'none';
      });
  }

  /* ── Delete ── */
  document.getElementById('dDelete').addEventListener('click', function () {
    if (!currentId) return;
    document.getElementById('confirmDeleteName').textContent = currentName || 'this sender';
    confirmOverlay.classList.add('open');
  });

  document.getElementById('confirmNo').addEventListener('click', function () {
    confirmOverlay.classList.remove('open');
  });

  confirmOverlay.addEventListener('click', function (e) {
    if (e.target === confirmOverlay) confirmOverlay.classList.remove('open');
  });

  document.getElementById('confirmYes').addEventListener('click', function () {
    confirmOverlay.classList.remove('open');

    fetch('/admin/messages/' + currentId + '/delete', { method: 'DELETE' })
      .then(r => r.json())
      .catch(() => {})
      .finally(() => {
        const item = document.querySelector('.ms-item[data-id="' + currentId + '"]');
        if (item) item.remove();

        /* Show empty state */
        detailContent.classList.remove('visible');
        detailEmpty.style.display = '';
        currentId = null;
        updateUnreadPill();
      });
  });

  /* ── Search ── */
  searchInput.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('.ms-item').forEach(function (item) {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  });

  /* ── Tab filter ── */
  document.querySelectorAll('.ms-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.ms-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      document.querySelectorAll('.ms-item').forEach(function (item) {
        if (filter === 'all') {
          item.style.display = '';
        } else if (filter === 'unread') {
          item.style.display = item.dataset.read === 'false' ? '' : 'none';
        } else {
          item.style.display = item.dataset.read === 'true'  ? '' : 'none';
        }
      });
    });
  });

  /* ── Update unread count pill ── */
  function updateUnreadPill() {
    const count = document.querySelectorAll('.ms-item.unread').length;
    const pill  = document.querySelector('.ms-unread-pill');
    if (pill) {
      if (count > 0) {
        pill.textContent = count + ' new';
        pill.style.display = '';
      } else {
        pill.style.display = 'none';
      }
    }
  }

  /* ── Keyboard: Escape closes confirm ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') confirmOverlay.classList.remove('open');
  });

})();