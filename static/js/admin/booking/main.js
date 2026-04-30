/* bookings.js — Denspark Admin */
(function () {
  'use strict';

  /* ===== ELEMENTS ===== */
  const modal       = document.getElementById('bookingModal');
  const openBtn     = document.getElementById('newBookingBtn');
  const closeBtn    = document.getElementById('closeModal');
  const cancelBtn   = document.getElementById('cancelModal');
  const saveBtn     = document.getElementById('saveBooking');
  const form        = document.getElementById('bookingForm');
  const searchInput = document.getElementById('bkSearch');
  const dateInput   = document.getElementById('bkDate');
  const filterBtns  = document.querySelectorAll('.bk-filter');
  const rows        = document.querySelectorAll('#bkTable tbody tr');
  const selectAll   = document.getElementById('selectAll');

  /* ===== MODAL ===== */
  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (openBtn)   openBtn.addEventListener('click', openModal);
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal?.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });

  /* ===== SAVE BOOKING ===== */
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      if (form && form.reportValidity()) {
        form.submit();
      }
    });
  }

  /* ===== FILTER TABS ===== */
  let activeFilter = 'all';

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  /* ===== SEARCH ===== */
  searchInput?.addEventListener('input', applyFilters);
  dateInput?.addEventListener('change', applyFilters);

  function applyFilters() {
    const q    = (searchInput?.value || '').toLowerCase().trim();
    const date = dateInput?.value || '';

    rows.forEach(function (row) {
      const status   = row.dataset.status || '';
      const text     = row.textContent.toLowerCase();
      const dateCell = row.querySelector('.bk-date')?.textContent || '';

      const matchFilter = activeFilter === 'all' || status === activeFilter;
      const matchSearch = !q || text.includes(q);
      const matchDate   = !date || dateCell.includes(date);

      row.style.display = matchFilter && matchSearch && matchDate ? '' : 'none';
    });
  }

  /* ===== SELECT ALL ===== */
  selectAll?.addEventListener('change', function () {
    document.querySelectorAll('.row-check').forEach(function (cb) {
      cb.checked = selectAll.checked;
    });
  });

  /* ===== ROW ACTIONS ===== */
  document.querySelectorAll('.bk-action').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const action  = btn.dataset.action;
      const row     = btn.closest('tr');
      const id      = row?.dataset.id;
      const name    = row?.querySelector('.bk-name')?.textContent || 'this booking';

      if (action === 'view') {
        window.location.href = '/admin/bookings/' + id;
      } else if (action === 'edit') {
        window.location.href = '/admin/bookings/' + id + '/edit';
      } else if (action === 'confirm') {
        if (confirm('Confirm booking for ' + name + '?')) {
          postAction('/admin/bookings/' + id + '/confirm');
        }
      } else if (action === 'cancel') {
        if (confirm('Cancel booking for ' + name + '? This cannot be undone.')) {
          postAction('/admin/bookings/' + id + '/cancel');
        }
      } else if (action === 'invoice') {
        window.location.href = '/admin/bookings/' + id + '/invoice';
      }
    });
  });

  function postAction(url) {
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = url;
    const csrf = document.querySelector('input[name=csrf_token]');
    if (csrf) {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = 'csrf_token'; i.value = csrf.value;
      f.appendChild(i);
    }
    document.body.appendChild(f);
    f.submit();
  }

})();