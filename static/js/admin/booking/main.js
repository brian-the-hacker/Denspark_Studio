/**
 * bookings.js — Denspark Admin Bookings Page
 * Handles: row expand/collapse, inline edit, status filter,
 *          search, date filter, confirm/cancel popover,
 *          new booking modal, select-all checkbox, pagination.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     UTILS
  ───────────────────────────────────────── */

  /** Debounce helper */
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /** Toast notification (non-blocking feedback) */
  function toast(message, type = 'success') {
    // Reuse existing toast container or create one
    let container = document.getElementById('bk-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bk-toast-container';
      Object.assign(container.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: '9999', pointerEvents: 'none',
      });
      document.body.appendChild(container);
    }

    const colors = {
      success: 'var(--green)',
      error:   'var(--red)',
      info:    'var(--blue-light)',
      warning: 'var(--amber)',
    };

    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      background: 'var(--surface)',
      border: `1px solid ${colors[type] || colors.info}`,
      borderLeft: `3px solid ${colors[type] || colors.info}`,
      borderRadius: 'var(--radius)',
      color: 'var(--text)',
      fontFamily: 'var(--font)',
      fontSize: '13px',
      padding: '10px 16px',
      boxShadow: 'var(--shadow)',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'opacity 0.22s ease, transform 0.22s ease',
      pointerEvents: 'all',
      maxWidth: '320px',
      lineHeight: '1.4',
    });

    container.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, 3200);
  }


  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */

  let activeFilter   = 'all';
  let searchQuery    = '';
  let dateFilter     = '';
  let expandedRow    = null;   // currently expanded detail/edit row id
  let expandedMode   = null;   // 'detail' | 'edit'

  // Confirm popover state
  let confirmAction  = null;   // { type: 'confirm'|'cancel', rowEl, name }


  /* ─────────────────────────────────────────
     ELEMENT REFERENCES
  ───────────────────────────────────────── */

  const table          = document.getElementById('bkTable');
  const tbody          = table ? table.querySelector('tbody') : null;
  const filterBtns     = document.querySelectorAll('.bk-filter');
  const searchInput    = document.getElementById('bkSearch');
  const dateInput      = document.getElementById('bkDate');
  const selectAllCb    = document.getElementById('selectAll');

  // Modal
  const bookingModal   = document.getElementById('bookingModal');
  const newBookingBtn  = document.getElementById('newBookingBtn');
  const closeModalBtn  = document.getElementById('closeModal');
  const cancelModalBtn = document.getElementById('cancelModal');
  const saveBookingBtn = document.getElementById('saveBooking');
  const bookingForm    = document.getElementById('bookingForm');

  // Confirm overlay
  const confirmOverlay = document.getElementById('confirmOverlay');
  const confirmIcon    = document.getElementById('confirmIcon');
  const confirmTitle   = document.getElementById('confirmTitle');
  const confirmMsg     = document.getElementById('confirmMsg');
  const confirmYes     = document.getElementById('confirmYes');
  const confirmNo      = document.getElementById('confirmNo');


  /* ─────────────────────────────────────────
     ROW VISIBILITY — FILTER + SEARCH + DATE
  ───────────────────────────────────────── */

  function getMainRows() {
    return tbody ? Array.from(tbody.querySelectorAll('tr.bk-row')) : [];
  }

  function normalise(str) {
    return (str || '').toLowerCase().trim();
  }

  function applyFilters() {
    getMainRows().forEach(row => {
      const status   = row.dataset.status || '';
      const id       = row.dataset.id;

      // Text content used for search (name, email, service, location, date)
      const cellText = Array.from(row.querySelectorAll('td'))
        .map(td => td.textContent).join(' ');

      const matchesFilter = activeFilter === 'all' || status === activeFilter;
      const matchesSearch = !searchQuery || normalise(cellText).includes(normalise(searchQuery));

      // Date filter: compare against the text date cell (index 4, first span)
      let matchesDate = true;
      if (dateFilter) {
        const dateCell = row.querySelector('.bk-date');
        // The date stored in the dataset might be formatted; try to match
        // the raw date attribute stored on the date input value (YYYY-MM-DD)
        const rowDate = dateCell ? dateCell.textContent.trim() : '';
        // Convert dateFilter (YYYY-MM-DD) to a comparable form
        const filterObj = new Date(dateFilter);
        const filterStr = filterObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        // Also try matching the raw value
        matchesDate = rowDate.includes(dateFilter) || rowDate === filterStr;
      }

      const visible = matchesFilter && matchesSearch && matchesDate;
      row.style.display = visible ? '' : 'none';

      // Also hide associated detail/edit rows when the main row is hidden
      const detailRow = tbody.querySelector(`.bk-detail-row[data-for="${id}"]`);
      const editRow   = tbody.querySelector(`.bk-edit-row[data-for="${id}"]`);
      if (detailRow) detailRow.style.display = (!visible) ? 'none' : (detailRow.classList.contains('open') ? '' : 'none');
      if (editRow)   editRow.style.display   = (!visible) ? 'none' : (editRow.classList.contains('open')   ? '' : 'none');
    });

    updateEmptyState();
  }

  /** Show a "no results" message when nothing matches */
  function updateEmptyState() {
    const existingEmpty = tbody ? tbody.querySelector('.bk-empty-row') : null;
    const visibleRows   = getMainRows().filter(r => r.style.display !== 'none');

    if (visibleRows.length === 0) {
      if (!existingEmpty) {
        const tr = document.createElement('tr');
        tr.className = 'bk-empty-row';
        tr.innerHTML = `<td colspan="9" style="text-align:center;padding:40px 20px;color:var(--text-dim);font-size:13.5px;">
          No bookings match your current filters.
        </td>`;
        tbody.appendChild(tr);
      }
    } else {
      if (existingEmpty) existingEmpty.remove();
    }
  }


  /* ─────────────────────────────────────────
     FILTER BUTTONS
  ───────────────────────────────────────── */

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });


  /* ─────────────────────────────────────────
     SEARCH
  ───────────────────────────────────────── */

  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      searchQuery = e.target.value;
      applyFilters();
    }, 200));
  }


  /* ─────────────────────────────────────────
     DATE FILTER
  ───────────────────────────────────────── */

  if (dateInput) {
    dateInput.addEventListener('change', e => {
      dateFilter = e.target.value;
      applyFilters();
    });
  }


  /* ─────────────────────────────────────────
     ROW EXPAND — DETAIL & EDIT ROWS
  ───────────────────────────────────────── */

  /**
   * Close whichever row is currently open (detail or edit).
   * @param {string|null} exceptId — skip closing this id (used when switching same row)
   */
  function closeOpenRow(exceptId) {
    if (!expandedRow || expandedRow === exceptId) return;

    const prevMain   = tbody.querySelector(`.bk-row[data-id="${expandedRow}"]`);
    const prevDetail = tbody.querySelector(`.bk-detail-row[data-for="${expandedRow}"]`);
    const prevEdit   = tbody.querySelector(`.bk-edit-row[data-for="${expandedRow}"]`);

    if (prevMain)   prevMain.classList.remove('expanded');
    if (prevDetail) prevDetail.classList.remove('open');
    if (prevEdit)   prevEdit.classList.remove('open');

    expandedRow  = null;
    expandedMode = null;
  }

  function openDetailRow(rowEl) {
    const id        = rowEl.dataset.id;
    const detailRow = tbody.querySelector(`.bk-detail-row[data-for="${id}"]`);
    const editRow   = tbody.querySelector(`.bk-edit-row[data-for="${id}"]`);

    if (!detailRow) return;

    // If this row is already showing the detail panel — collapse it
    if (expandedRow === id && expandedMode === 'detail') {
      closeOpenRow(null);
      return;
    }

    closeOpenRow(id);

    // Close edit if open for same row
    if (editRow) editRow.classList.remove('open');

    rowEl.classList.add('expanded');
    detailRow.classList.add('open');
    detailRow.style.display = '';

    expandedRow  = id;
    expandedMode = 'detail';
  }

  function openEditRow(rowEl) {
    const id        = rowEl.dataset.id;
    const editRow   = tbody.querySelector(`.bk-edit-row[data-for="${id}"]`);
    const detailRow = tbody.querySelector(`.bk-detail-row[data-for="${id}"]`);

    if (!editRow) return;

    // If already in edit mode for this row — collapse
    if (expandedRow === id && expandedMode === 'edit') {
      closeOpenRow(null);
      return;
    }

    closeOpenRow(id);

    // Close detail if open for same row
    if (detailRow) detailRow.classList.remove('open');

    rowEl.classList.add('expanded');
    editRow.classList.add('open');
    editRow.style.display = '';

    expandedRow  = id;
    expandedMode = 'edit';

    // Focus first input in the edit form
    const firstInput = editRow.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }


  /* ─────────────────────────────────────────
     TABLE CLICK DELEGATION
  ───────────────────────────────────────── */

  if (tbody) {
    tbody.addEventListener('click', e => {
      // ── Action buttons (edit / confirm / cancel / invoice) ──
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const rowEl  = actionBtn.closest('.bk-row');

        if (action === 'edit') {
          openEditRow(rowEl);
          return;
        }

        if (action === 'confirm') {
          showConfirm('confirm', rowEl, actionBtn.dataset.name);
          return;
        }

        if (action === 'cancel') {
          showConfirm('cancel', rowEl, actionBtn.dataset.name);
          return;
        }

        if (action === 'invoice') {
          // Navigate to invoice or open invoice modal
          const id = rowEl.dataset.id;
          toast(`Opening invoice for booking #${id}…`, 'info');
          // Uncomment when route is ready:
          // window.location.href = `/admin/bookings/${id}/invoice`;
          return;
        }
      }

      // ── Checkbox clicks — don't expand ──
      if (e.target.matches('.bk-check')) return;

      // ── Click on a main row → toggle detail panel ──
      const rowEl = e.target.closest('.bk-row');
      if (rowEl) {
        openDetailRow(rowEl);
      }
    });
  }


  /* ─────────────────────────────────────────
     INLINE EDIT — DISCARD & SAVE
  ───────────────────────────────────────── */

  if (tbody) {
    // Discard button
    tbody.addEventListener('click', e => {
      if (e.target.closest('.edit-discard')) {
        closeOpenRow(null);
      }
    });

    // Submit handler — AJAX or native form fallback
    tbody.addEventListener('submit', e => {
      const form = e.target.closest('.bk-edit-form');
      if (!form) return;

      e.preventDefault();

      const id      = form.dataset.id;
      const action  = form.getAttribute('action');
      const data    = new FormData(form);

      // Optimistic UI — update the visible row immediately
      const rowEl   = tbody.querySelector(`.bk-row[data-id="${id}"]`);
      if (rowEl) applyOptimisticUpdate(rowEl, data);

      fetch(action, { method: 'POST', body: data })
        .then(res => {
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          return res.json().catch(() => ({}));
        })
        .then(() => {
          toast('Booking updated successfully.', 'success');
          closeOpenRow(null);
        })
        .catch(err => {
          console.error('Save failed:', err);
          toast('Failed to save changes. Please try again.', 'error');
        });
    });
  }

  /**
   * Immediately update the main table row cells to reflect edited values,
   * so the user sees the change without a full page reload.
   */
  function applyOptimisticUpdate(rowEl, formData) {
    const name    = formData.get('name');
    const email   = formData.get('email');
    const service = formData.get('service');
    const date    = formData.get('date');
    const time    = formData.get('time');
    const location = formData.get('location');
    const amount  = formData.get('amount');
    const status  = formData.get('status');

    const nameEl    = rowEl.querySelector('.bk-name');
    const emailEl   = rowEl.querySelector('.bk-email');
    const avatarEl  = rowEl.querySelector('.bk-avatar');
    const serviceEl = rowEl.querySelector('.bk-service');
    const dateEl    = rowEl.querySelector('.bk-date');
    const timeEl    = rowEl.querySelector('.bk-time');
    const locEl     = rowEl.querySelector('.bk-location');
    const amountEl  = rowEl.querySelector('.bk-amount');
    const badgeEl   = rowEl.querySelector('.bk-badge');
    const confirmBtn = rowEl.querySelector('.confirm-btn');
    const cancelBtn  = rowEl.querySelector('.cancel-btn');

    if (nameEl && name)    nameEl.textContent = name;
    if (emailEl && email)  emailEl.textContent = email;
    if (avatarEl && name)  avatarEl.textContent = name[0].toUpperCase();
    if (serviceEl && service) serviceEl.textContent = service;
    if (dateEl && date)    dateEl.textContent = formatDateDisplay(date);
    if (timeEl && time)    timeEl.textContent = formatTimeDisplay(time);
    if (locEl)             locEl.textContent = location || '—';

    if (amountEl) {
      amountEl.textContent = amount
        ? 'KES ' + Number(amount).toLocaleString()
        : '—';
    }

    if (badgeEl && status) {
      badgeEl.className = `bk-badge ${status}`;
      badgeEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      rowEl.dataset.status = status;

      // Update action button visibility based on new status
      if (confirmBtn) confirmBtn.dataset.name = name || '';
      if (cancelBtn)  cancelBtn.dataset.name  = name || '';
    }
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  }

  function formatTimeDisplay(timeStr) {
    if (!timeStr) return '—';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch { return timeStr; }
  }


  /* ─────────────────────────────────────────
     CONFIRM / CANCEL POPOVER
  ───────────────────────────────────────── */

  function showConfirm(type, rowEl, clientName) {
    confirmAction = { type, rowEl, name: clientName };

    const isConfirm = type === 'confirm';

    confirmIcon.className = `bk-confirm-icon ${isConfirm ? 'green' : 'red'}`;
    document.getElementById('confirmIconSvg').innerHTML = isConfirm
      ? `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`
      : `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>`;

    confirmTitle.textContent = isConfirm ? 'Confirm Booking' : 'Cancel Booking';
    confirmMsg.innerHTML = isConfirm
      ? `Confirm the booking for <strong>${clientName}</strong>? They will be notified.`
      : `Cancel the booking for <strong>${clientName}</strong>? This cannot be undone.`;

    confirmYes.className = `bk-confirm-yes ${isConfirm ? 'green' : 'red'}`;
    confirmYes.textContent = isConfirm ? 'Yes, confirm' : 'Yes, cancel it';

    confirmOverlay.classList.add('open');
  }

  function hideConfirm() {
    confirmOverlay.classList.remove('open');
    confirmAction = null;
  }

  if (confirmNo)  confirmNo.addEventListener('click', hideConfirm);
  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', e => {
      if (e.target === confirmOverlay) hideConfirm();
    });
  }

  if (confirmYes) {
    confirmYes.addEventListener('click', () => {
      if (!confirmAction) return;

      const { type, rowEl } = confirmAction;
      const id              = rowEl.dataset.id;
      const newStatus       = type === 'confirm' ? 'confirmed' : 'cancelled';
      const endpoint        = `/admin/bookings/${id}/${type}`; // e.g. /admin/bookings/1/confirm

      hideConfirm();

      // Optimistic update
      updateRowStatus(rowEl, newStatus);

      // CSRF token if available
      const csrfInput = document.querySelector('input[name="csrf_token"]');
      const headers   = { 'Content-Type': 'application/json' };
      if (csrfInput) headers['X-CSRFToken'] = csrfInput.value;

      fetch(endpoint, { method: 'POST', headers })
        .then(res => {
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          toast(
            type === 'confirm'
              ? `Booking confirmed for ${confirmAction?.name || 'client'}.`
              : `Booking cancelled.`,
            type === 'confirm' ? 'success' : 'warning'
          );
        })
        .catch(err => {
          console.error('Status update failed:', err);
          toast('Action failed. Please refresh and try again.', 'error');
          // Revert optimistic update
          const original = type === 'confirm' ? 'pending' : 'confirmed';
          updateRowStatus(rowEl, original);
        });
    });
  }

  function updateRowStatus(rowEl, newStatus) {
    const badge = rowEl.querySelector('.bk-badge');
    if (badge) {
      badge.className = `bk-badge ${newStatus}`;
      badge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    }
    rowEl.dataset.status = newStatus;

    // Swap action buttons based on new status
    const actionsCell = rowEl.querySelector('.bk-actions');
    if (!actionsCell) return;

    const confirmBtn = actionsCell.querySelector('.confirm-btn');
    const cancelBtn  = actionsCell.querySelector('.cancel-btn');
    const invoiceBtn = actionsCell.querySelector('.invoice');

    if (newStatus === 'confirmed') {
      if (confirmBtn) confirmBtn.remove();
      if (!cancelBtn) {
        const btn = makeActionBtn('cancel', rowEl.querySelector('.bk-name')?.textContent);
        actionsCell.appendChild(btn);
      }
    } else if (newStatus === 'cancelled') {
      if (cancelBtn)  cancelBtn.remove();
      if (confirmBtn) confirmBtn.remove();
    } else if (newStatus === 'completed') {
      if (cancelBtn)  cancelBtn.remove();
      if (confirmBtn) confirmBtn.remove();
      if (!invoiceBtn) {
        const btn = document.createElement('button');
        btn.className = 'bk-action invoice';
        btn.title = 'Invoice';
        btn.dataset.action = 'invoice';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
        actionsCell.appendChild(btn);
      }
    }

    // Re-apply filters (status change might affect visibility)
    applyFilters();
  }

  function makeActionBtn(type, name) {
    const btn = document.createElement('button');
    if (type === 'cancel') {
      btn.className = 'bk-action cancel cancel-btn';
      btn.title = 'Cancel';
      btn.dataset.action = 'cancel';
      btn.dataset.name = name || '';
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
    }
    return btn;
  }


  /* ─────────────────────────────────────────
     SELECT ALL CHECKBOX
  ───────────────────────────────────────── */

  if (selectAllCb && tbody) {
    selectAllCb.addEventListener('change', () => {
      const rowChecks = tbody.querySelectorAll('.row-check');
      rowChecks.forEach(cb => { cb.checked = selectAllCb.checked; });
    });

    // Sync select-all state when individual checkboxes change
    tbody.addEventListener('change', e => {
      if (!e.target.matches('.row-check')) return;
      const all     = tbody.querySelectorAll('.row-check');
      const checked = tbody.querySelectorAll('.row-check:checked');
      selectAllCb.indeterminate = checked.length > 0 && checked.length < all.length;
      selectAllCb.checked       = checked.length === all.length;
    });
  }


  /* ─────────────────────────────────────────
     NEW BOOKING MODAL
  ───────────────────────────────────────── */

  function openModal() {
    bookingModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus first field
    const first = bookingModal.querySelector('input, select');
    if (first) setTimeout(() => first.focus(), 120);
  }

  function closeModal() {
    bookingModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (newBookingBtn)  newBookingBtn.addEventListener('click', openModal);
  if (closeModalBtn)  closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  if (bookingModal) {
    bookingModal.addEventListener('click', e => {
      if (e.target === bookingModal) closeModal();
    });
  }

  // Escape key closes modal or confirm overlay
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (confirmOverlay?.classList.contains('open')) { hideConfirm(); return; }
    if (bookingModal?.classList.contains('open'))   { closeModal(); return; }
    if (expandedRow) closeOpenRow(null);
  });

  // Save booking (submit new booking form via AJAX)
  if (saveBookingBtn && bookingForm) {
    saveBookingBtn.addEventListener('click', () => {
      // Trigger native validation
      if (!bookingForm.reportValidity()) return;

      const data     = new FormData(bookingForm);
      const action   = bookingForm.getAttribute('action');

      saveBookingBtn.disabled     = true;
      saveBookingBtn.textContent  = 'Saving…';

      fetch(action, { method: 'POST', body: data })
        .then(res => {
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          return res.json().catch(() => ({}));
        })
        .then(json => {
          toast('Booking created successfully!', 'success');
          closeModal();
          bookingForm.reset();

          // If the server returns the new booking, inject it into the table
          if (json.booking) {
            injectNewRow(json.booking);
          } else {
            // Fallback: reload page
            window.location.reload();
          }
        })
        .catch(err => {
          console.error('Create booking failed:', err);
          toast('Failed to create booking. Please try again.', 'error');
        })
        .finally(() => {
          saveBookingBtn.disabled    = false;
          saveBookingBtn.innerHTML   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg> Create Booking`;
        });
    });
  }

  /**
   * Inject a newly created booking row at the top of the table.
   * Expects a booking object from the server response.
   */
  function injectNewRow(b) {
    if (!tbody) return;

    const initials = (b.name || '?')[0].toUpperCase();
    const amount   = b.amount ? `KES ${Number(b.amount).toLocaleString()}` : '—';
    const status   = b.status || 'pending';
    const id       = b.id || Date.now();

    const mainHtml = `
      <tr class="bk-row" data-status="${status}" data-id="${id}" style="animation:bk-fadein 0.3s ease">
        <td><input type="checkbox" class="bk-check row-check"></td>
        <td>
          <span class="bk-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </td>
        <td>
          <div class="bk-client">
            <div class="bk-avatar">${initials}</div>
            <div class="bk-client-info">
              <span class="bk-name">${escHtml(b.name || '')}</span>
              <span class="bk-email">${escHtml(b.email || '')}</span>
            </div>
          </div>
        </td>
        <td class="bk-service">${escHtml(b.service || '—')}</td>
        <td>
          <div class="bk-datetime">
            <span class="bk-date">${escHtml(formatDateDisplay(b.date))}</span>
            <span class="bk-time">${escHtml(formatTimeDisplay(b.time))}</span>
          </div>
        </td>
        <td class="bk-location">${escHtml(b.location || '—')}</td>
        <td><span class="bk-amount">${escHtml(amount)}</span></td>
        <td><span class="bk-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td>
          <div class="bk-actions">
            <button class="bk-action edit-btn" title="Edit" data-action="edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="bk-action confirm confirm-btn" title="Confirm" data-action="confirm" data-name="${escHtml(b.name || '')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </button>
          </div>
        </td>
      </tr>`;

    const detailHtml = `
      <tr class="bk-detail-row" data-for="${id}" style="display:none">
        <td colspan="9">
          <div class="bk-detail-inner">
            <div class="bk-detail-section">
              <span class="bk-detail-title">Client</span>
              <div class="bk-detail-field"><span class="bk-detail-label">Full name</span><span class="bk-detail-value">${escHtml(b.name || '')}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Email</span><span class="bk-detail-value">${escHtml(b.email || '')}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Phone</span><span class="bk-detail-value">${escHtml(b.phone || '—')}</span></div>
            </div>
            <div class="bk-detail-section">
              <span class="bk-detail-title">Session</span>
              <div class="bk-detail-field"><span class="bk-detail-label">Service</span><span class="bk-detail-value">${escHtml(b.service || '—')}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Date</span><span class="bk-detail-value">${escHtml(formatDateDisplay(b.date))}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Time</span><span class="bk-detail-value">${escHtml(formatTimeDisplay(b.time))}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Location</span><span class="bk-detail-value">${escHtml(b.location || '—')}</span></div>
            </div>
            <div class="bk-detail-section">
              <span class="bk-detail-title">Payment</span>
              <div class="bk-detail-field"><span class="bk-detail-label">Amount</span><span class="bk-detail-value">${escHtml(amount)}</span></div>
              <div class="bk-detail-field"><span class="bk-detail-label">Status</span><span class="bk-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></div>
            </div>
            ${b.notes ? `<div class="bk-detail-section bk-detail-notes"><span class="bk-detail-title">Notes from client</span><div class="bk-detail-notes-text">${escHtml(b.notes)}</div></div>` : ''}
          </div>
        </td>
      </tr>`;

    const editHtml = `<tr class="bk-edit-row" data-for="${id}" style="display:none"><td colspan="9"></td></tr>`;

    const wrapper = document.createElement('tbody');
    wrapper.innerHTML = mainHtml + detailHtml + editHtml;

    // Prepend all three rows
    const firstRow = tbody.firstChild;
    Array.from(wrapper.children).forEach(tr => tbody.insertBefore(tr, firstRow));

    applyFilters();
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  /* ─────────────────────────────────────────
     PAGINATION
  ───────────────────────────────────────── */

  const pagBtns = document.querySelectorAll('.bk-pag-btn:not([disabled])');

  pagBtns.forEach(btn => {
    if (btn.querySelector('svg')) return; // skip prev/next arrow buttons for now

    btn.addEventListener('click', () => {
      pagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // TODO: Fetch the correct page from the server:
      // const page = btn.textContent.trim();
      // fetchPage(page);
      toast(`Page ${btn.textContent.trim()} — connect to backend to paginate.`, 'info');
    });
  });


  /* ─────────────────────────────────────────
     ROW FADE-IN KEYFRAME (injected once)
  ───────────────────────────────────────── */

  if (!document.getElementById('bk-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bk-keyframes';
    style.textContent = `
      @keyframes bk-fadein {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }


  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */

  applyFilters();

})();