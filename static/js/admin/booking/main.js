/**
 * bookings.js — Denspark Admin
 * Routes used:
 *   POST /admin/bookings/create           → create booking (JSON response)
 *   POST /admin/bookings/<id>/update      → save inline edit (form data)
 *   POST /admin/bookings/<id>/confirm     → confirm pending booking
 *   POST /admin/bookings/<id>/cancel      → cancel booking
 */

(function () {
  'use strict';

  /* ── state ── */
  let activeFilter = 'all';
  let expandedId   = null;   // id of currently open row
  let expandedMode = null;   // 'detail' | 'edit'
  let confirmCtx   = null;   // { type, rowEl, id, name }

  /* ── elements ── */
  const tbody          = document.querySelector('#bkTable tbody');
  const filterBtns     = document.querySelectorAll('.bk-filter');
  const searchInput    = document.getElementById('bkSearch');
  const dateInput      = document.getElementById('bkDate');
  const selectAllCb    = document.getElementById('selectAll');
  const bookingModal   = document.getElementById('bookingModal');
  const newBookingBtn  = document.getElementById('newBookingBtn');
  const closeModalBtn  = document.getElementById('closeModal');
  const cancelModalBtn = document.getElementById('cancelModal');
  const saveBookingBtn = document.getElementById('saveBooking');
  const bookingForm    = document.getElementById('bookingForm');
  const confirmOverlay = document.getElementById('confirmOverlay');
  const confirmYesBtn  = document.getElementById('confirmYes');
  const confirmNoBtn   = document.getElementById('confirmNo');

  /* ── CSRF token (Flask-WTF) ── */
  function getCsrf() {
    const el = document.querySelector('input[name="csrf_token"]');
    return el ? el.value : '';
  }

  /* ================================================================
     TOAST
  ================================================================ */
  function toast(msg, type = 'success') {
    let box = document.getElementById('bk-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'bk-toasts';
      Object.assign(box.style, {
        position:'fixed', bottom:'24px', right:'24px',
        display:'flex', flexDirection:'column', gap:'10px',
        zIndex:'9999', pointerEvents:'none',
      });
      document.body.appendChild(box);
    }
    const colours = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue-light)', warning: 'var(--amber)' };
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      background: 'var(--surface)',
      border: `1px solid ${colours[type]}`,
      borderLeft: `3px solid ${colours[type]}`,
      borderRadius: 'var(--radius)',
      color: 'var(--text)',
      fontFamily: 'var(--font)',
      fontSize: '13px',
      padding: '10px 16px',
      boxShadow: 'var(--shadow)',
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'opacity 0.22s ease, transform 0.22s ease',
      maxWidth: '320px',
      lineHeight: '1.5',
    });
    box.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, 3400);
  }

  /* ================================================================
     FILTER / SEARCH / DATE
  ================================================================ */
  function applyFilters() {
    const q   = (searchInput?.value || '').toLowerCase().trim();
    const day = dateInput?.value || '';

    document.querySelectorAll('#bkTable tbody tr.bk-row').forEach(row => {
      const status  = row.dataset.status || '';
      const text    = row.textContent.toLowerCase();
      const dateEl  = row.querySelector('.bk-date');
      const rowDate = dateEl ? dateEl.textContent.trim() : '';

      const okFilter = activeFilter === 'all' || status === activeFilter;
      const okSearch = !q   || text.includes(q);
      const okDate   = !day || rowDate.includes(day);
      const show     = okFilter && okSearch && okDate;

      row.style.display = show ? '' : 'none';

      // Keep paired rows in sync
      const id = row.dataset.id;
      ['detail', 'edit'].forEach(type => {
        const pair = tbody.querySelector(`.bk-${type}-row[data-for="${id}"]`);
        if (pair && !show) pair.style.display = 'none';
      });
    });
  }

  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  }));

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 180);
  });

  dateInput?.addEventListener('change', applyFilters);

  /* ================================================================
     ROW EXPAND — DETAIL & EDIT
  ================================================================ */
  function collapseAll(exceptId) {
    if (!expandedId || expandedId === exceptId) return;
    const mainRow = tbody.querySelector(`.bk-row[data-id="${expandedId}"]`);
    if (mainRow) mainRow.classList.remove('expanded');
    ['detail', 'edit'].forEach(t => {
      const r = tbody.querySelector(`.bk-${t}-row[data-for="${expandedId}"]`);
      if (r) { r.classList.remove('open'); r.style.display = 'none'; }
    });
    expandedId   = null;
    expandedMode = null;
  }

  function openDetail(rowEl) {
    const id = rowEl.dataset.id;
    if (expandedId === id && expandedMode === 'detail') { collapseAll(null); return; }
    collapseAll(id);

    const editRow   = tbody.querySelector(`.bk-edit-row[data-for="${id}"]`);
    const detailRow = tbody.querySelector(`.bk-detail-row[data-for="${id}"]`);
    if (editRow)   { editRow.classList.remove('open');   editRow.style.display   = 'none'; }
    if (!detailRow) return;

    rowEl.classList.add('expanded');
    detailRow.classList.add('open');
    detailRow.style.display = '';
    expandedId   = id;
    expandedMode = 'detail';
  }

  function openEdit(rowEl) {
    const id = rowEl.dataset.id;
    if (expandedId === id && expandedMode === 'edit') { collapseAll(null); return; }
    collapseAll(id);

    const detailRow = tbody.querySelector(`.bk-detail-row[data-for="${id}"]`);
    const editRow   = tbody.querySelector(`.bk-edit-row[data-for="${id}"]`);
    if (detailRow) { detailRow.classList.remove('open'); detailRow.style.display = 'none'; }
    if (!editRow)  return;

    rowEl.classList.add('expanded');
    editRow.classList.add('open');
    editRow.style.display = '';
    expandedId   = id;
    expandedMode = 'edit';

    setTimeout(() => editRow.querySelector('input, select')?.focus(), 80);
  }

  /* ================================================================
     TABLE CLICK DELEGATION
  ================================================================ */
  tbody?.addEventListener('click', e => {
    // ── action buttons ──
    const btn = e.target.closest('[data-action]');
    if (btn) {
      e.stopPropagation();
      const rowEl = btn.closest('.bk-row');
      const action = btn.dataset.action;

      if (action === 'edit')    { openEdit(rowEl); return; }
      if (action === 'confirm') { showConfirm('confirm', rowEl); return; }
      if (action === 'cancel')  { showConfirm('cancel',  rowEl); return; }
      if (action === 'invoice') {
        toast('Invoice feature coming soon.', 'info');
        return;
      }
    }

    // ── discard inline edit ──
    if (e.target.closest('.edit-discard')) { collapseAll(null); return; }

    // ── checkbox — don't expand ──
    if (e.target.matches('.bk-check')) return;

    // ── click row → detail ──
    const rowEl = e.target.closest('.bk-row');
    if (rowEl) openDetail(rowEl);
  });

  /* ================================================================
     INLINE EDIT — FORM SUBMIT  →  POST /admin/bookings/<id>/update
  ================================================================ */
  tbody?.addEventListener('submit', e => {
    const form = e.target.closest('.bk-edit-form');
    if (!form) return;
    e.preventDefault();

    const id     = form.dataset.id;
    const data   = new FormData(form);
    const saveBtn = form.querySelector('.bk-edit-save');

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    fetch(`/admin/bookings/${id}/update`, {
      method: 'POST',
      body: data,
      headers: { 'X-CSRFToken': getCsrf() },
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(() => {
        toast('Booking updated.', 'success');
        collapseAll(null);
        // Reflect changes in the main row visually
        const rowEl = tbody.querySelector(`.bk-row[data-id="${id}"]`);
        if (rowEl) updateRowCells(rowEl, data);
      })
      .catch(() => toast('Save failed — please try again.', 'error'))
      .finally(() => {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
      });
  });

  /** Reflect edited values back into the visible table row immediately */
  function updateRowCells(rowEl, formData) {
    const get = k => formData.get(k) || '';
    setText(rowEl, '.bk-name',     get('name'));
    setText(rowEl, '.bk-email',    get('email'));
    setText(rowEl, '.bk-service',  get('service'));
    setText(rowEl, '.bk-date',     fmtDate(get('date')));
    setText(rowEl, '.bk-time',     fmtTime(get('time')));
    setText(rowEl, '.bk-location', get('location') || '—');

    const amtEl = rowEl.querySelector('.bk-amount');
    if (amtEl) amtEl.textContent = get('amount') ? 'KES ' + Number(get('amount')).toLocaleString() : '—';

    const avatarEl = rowEl.querySelector('.bk-avatar');
    if (avatarEl && get('name')) avatarEl.textContent = get('name')[0].toUpperCase();

    const status = get('status');
    if (status) {
      const badge = rowEl.querySelector('.bk-badge');
      if (badge) { badge.className = `bk-badge ${status}`; badge.textContent = cap(status); }
      rowEl.dataset.status = status;
    }
  }

  function setText(ctx, sel, val) {
    const el = ctx.querySelector(sel);
    if (el) el.textContent = val;
  }

  /* ================================================================
     CONFIRM / CANCEL POPOVER  →  POST /admin/bookings/<id>/confirm|cancel
  ================================================================ */
  function showConfirm(type, rowEl) {
    const id   = rowEl.dataset.id;
    const name = rowEl.querySelector('.bk-name')?.textContent || 'this client';
    confirmCtx = { type, rowEl, id, name };

    const isConfirm = type === 'confirm';

    // Icon
    const icon = document.getElementById('confirmIcon');
    icon.className = `bk-confirm-icon ${isConfirm ? 'green' : 'red'}`;
    document.getElementById('confirmIconSvg').innerHTML = isConfirm
      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
      : '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>';

    document.getElementById('confirmTitle').textContent = isConfirm ? 'Confirm Booking' : 'Cancel Booking';
    document.getElementById('confirmMsg').innerHTML = isConfirm
      ? `Confirm the booking for <strong>${esc(name)}</strong>? They will be notified.`
      : `Cancel the booking for <strong>${esc(name)}</strong>? This cannot be undone.`;

    const yes = document.getElementById('confirmYes');
    yes.className   = `bk-confirm-yes ${isConfirm ? 'green' : 'red'}`;
    yes.textContent = isConfirm ? 'Yes, confirm' : 'Yes, cancel';

    confirmOverlay.classList.add('open');
  }

  function hideConfirm() {
    confirmOverlay.classList.remove('open');
    confirmCtx = null;
  }

  confirmNoBtn?.addEventListener('click', hideConfirm);
  confirmOverlay?.addEventListener('click', e => { if (e.target === confirmOverlay) hideConfirm(); });

  confirmYesBtn?.addEventListener('click', () => {
    if (!confirmCtx) return;
    const { type, rowEl, id, name } = confirmCtx;
    hideConfirm();

    const endpoint = `/admin/bookings/${id}/${type}`;
    const newStatus = type === 'confirm' ? 'confirmed' : 'cancelled';

    // Optimistic update
    applyStatusToRow(rowEl, newStatus);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCsrf(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(() => {
        const verb = type === 'confirm' ? 'confirmed' : 'cancelled';
        toast(`Booking ${verb} for ${name}.`, type === 'confirm' ? 'success' : 'warning');
      })
      .catch(() => {
        toast('Action failed — please refresh and try again.', 'error');
        // Revert optimistic update
        applyStatusToRow(rowEl, type === 'confirm' ? 'pending' : 'confirmed');
      });
  });

  /** Update badge + action buttons when status changes */
  function applyStatusToRow(rowEl, newStatus) {
    const badge = rowEl.querySelector('.bk-badge');
    if (badge) { badge.className = `bk-badge ${newStatus}`; badge.textContent = cap(newStatus); }
    rowEl.dataset.status = newStatus;

    const actions = rowEl.querySelector('.bk-actions');
    if (!actions) return;

    // Remove confirm and cancel buttons, re-add the right one
    actions.querySelector('.confirm-btn')?.remove();
    actions.querySelector('.cancel-btn')?.remove();
    actions.querySelector('.invoice')?.remove();

    if (newStatus === 'confirmed') {
      actions.appendChild(makeBtn('cancel', rowEl.querySelector('.bk-name')?.textContent));
    } else if (newStatus === 'completed') {
      actions.appendChild(makeInvoiceBtn());
    }
    // cancelled — no extra button needed

    applyFilters();
  }

  function makeBtn(type, name) {
    const btn = document.createElement('button');
    btn.className   = `bk-action cancel cancel-btn`;
    btn.title       = 'Cancel';
    btn.dataset.action = 'cancel';
    btn.dataset.name   = name || '';
    btn.innerHTML   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
    return btn;
  }

  function makeInvoiceBtn() {
    const btn = document.createElement('button');
    btn.className      = 'bk-action invoice';
    btn.title          = 'Invoice';
    btn.dataset.action = 'invoice';
    btn.innerHTML      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    return btn;
  }

  /* ================================================================
     NEW BOOKING MODAL  →  POST /admin/bookings/create
  ================================================================ */
  function openModal()  { bookingModal.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeModal() { bookingModal.classList.remove('open'); document.body.style.overflow = ''; }

  newBookingBtn?.addEventListener('click',  openModal);
  closeModalBtn?.addEventListener('click',  closeModal);
  cancelModalBtn?.addEventListener('click', closeModal);
  bookingModal?.addEventListener('click', e => { if (e.target === bookingModal) closeModal(); });

  saveBookingBtn?.addEventListener('click', () => {
    if (!bookingForm.reportValidity()) return;

    saveBookingBtn.disabled    = true;
    saveBookingBtn.textContent = 'Saving…';

    fetch('/admin/bookings/create', {
      method: 'POST',
      body:   new FormData(bookingForm),
      headers: { 'X-CSRFToken': getCsrf() },
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        toast('Booking created!', 'success');
        closeModal();
        bookingForm.reset();
        if (json.booking) injectRow(json.booking);
      })
      .catch(() => toast('Failed to create booking — please try again.', 'error'))
      .finally(() => {
        saveBookingBtn.disabled = false;
        saveBookingBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg> Create Booking`;
      });
  });

  /* ================================================================
     INJECT NEW ROW after create (no page reload)
  ================================================================ */
  function injectRow(b) {
    if (!tbody) return;
    const id     = b.id;
    const status = b.status || 'pending';
    const amount = b.amount ? 'KES ' + Number(b.amount).toLocaleString() : '—';
    const init   = (b.name || '?')[0].toUpperCase();

    const mainTr = document.createElement('tr');
    mainTr.className        = 'bk-row';
    mainTr.dataset.status   = status;
    mainTr.dataset.id       = id;
    mainTr.style.animation  = 'bk-fadein 0.3s ease';
    mainTr.innerHTML = `
      <td><input type="checkbox" class="bk-check row-check"></td>
      <td><span class="bk-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>
      <td>
        <div class="bk-client">
          <div class="bk-avatar">${init}</div>
          <div class="bk-client-info">
            <span class="bk-name">${esc(b.name)}</span>
            <span class="bk-email">${esc(b.email)}</span>
          </div>
        </div>
      </td>
      <td class="bk-service">${esc(b.service)}</td>
      <td><div class="bk-datetime"><span class="bk-date">${esc(fmtDate(b.date))}</span><span class="bk-time">${esc(fmtTime(b.time))}</span></div></td>
      <td class="bk-location">${esc(b.location || '—')}</td>
      <td><span class="bk-amount">${esc(amount)}</span></td>
      <td><span class="bk-badge ${status}">${cap(status)}</span></td>
      <td>
        <div class="bk-actions">
          <button class="bk-action edit-btn" data-action="edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="bk-action confirm confirm-btn" data-action="confirm" data-name="${esc(b.name)}" title="Confirm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </button>
        </div>
      </td>`;

    const detailTr = document.createElement('tr');
    detailTr.className   = 'bk-detail-row';
    detailTr.dataset.for = id;
    detailTr.style.display = 'none';
    detailTr.innerHTML = `<td colspan="9">
      <div class="bk-detail-inner">
        <div class="bk-detail-section">
          <span class="bk-detail-title">Client</span>
          <div class="bk-detail-field"><span class="bk-detail-label">Full name</span><span class="bk-detail-value">${esc(b.name)}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Email</span><span class="bk-detail-value">${esc(b.email)}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Phone</span><span class="bk-detail-value">${esc(b.phone || '—')}</span></div>
        </div>
        <div class="bk-detail-section">
          <span class="bk-detail-title">Session</span>
          <div class="bk-detail-field"><span class="bk-detail-label">Service</span><span class="bk-detail-value">${esc(b.service)}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Date</span><span class="bk-detail-value">${esc(fmtDate(b.date))}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Time</span><span class="bk-detail-value">${esc(fmtTime(b.time))}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Location</span><span class="bk-detail-value">${esc(b.location || '—')}</span></div>
        </div>
        <div class="bk-detail-section">
          <span class="bk-detail-title">Payment</span>
          <div class="bk-detail-field"><span class="bk-detail-label">Amount</span><span class="bk-detail-value">${esc(amount)}</span></div>
          <div class="bk-detail-field"><span class="bk-detail-label">Status</span><span class="bk-badge ${status}">${cap(status)}</span></div>
        </div>
        ${b.notes ? `<div class="bk-detail-section bk-detail-notes"><span class="bk-detail-title">Notes</span><div class="bk-detail-notes-text">${esc(b.notes)}</div></div>` : ''}
      </div></td>`;

    const editTr = document.createElement('tr');
    editTr.className   = 'bk-edit-row';
    editTr.dataset.for = id;
    editTr.style.display = 'none';
    editTr.innerHTML = `<td colspan="9"><div class="bk-edit-inner">
      <form class="bk-edit-form" data-id="${id}" action="/admin/bookings/${id}/update" method="POST">
        <div class="bk-edit-grid">
          <div class="bk-edit-field"><label>Name</label><input type="text" name="name" value="${esc(b.name)}" required></div>
          <div class="bk-edit-field"><label>Email</label><input type="email" name="email" value="${esc(b.email)}" required></div>
          <div class="bk-edit-field"><label>Phone</label><input type="tel" name="phone" value="${esc(b.phone || '')}"></div>
          <div class="bk-edit-field"><label>Service</label>
            <select name="service">
              ${['Portrait Session','Wedding Coverage','Event Photography','Product Shoot','Video Production','Family Portrait','Graduation','Corporate']
                .map(s => `<option value="${s}"${b.service===s?' selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="bk-edit-field"><label>Date</label><input type="date" name="date" value="${esc(b.date||'')}"></div>
          <div class="bk-edit-field"><label>Time</label><input type="time" name="time" value="${esc(b.time||'')}"></div>
          <div class="bk-edit-field"><label>Location</label><input type="text" name="location" value="${esc(b.location||'')}"></div>
          <div class="bk-edit-field"><label>Amount (KES)</label><input type="number" name="amount" value="${b.amount||''}" min="0"></div>
          <div class="bk-edit-field"><label>Status</label>
            <select name="status">
              ${['pending','confirmed','completed','cancelled']
                .map(s => `<option value="${s}"${b.status===s?' selected':''}>${cap(s)}</option>`).join('')}
            </select>
          </div>
          <div class="bk-edit-field span-3"><label>Notes</label><textarea name="notes">${esc(b.notes||'')}</textarea></div>
        </div>
        <div class="bk-edit-actions">
          <button type="submit" class="bk-edit-save">Save Changes</button>
          <button type="button" class="bk-edit-discard edit-discard">Discard</button>
        </div>
      </form>
    </div></td>`;

    // Remove empty state row if present
    tbody.querySelector('.bk-empty-row')?.remove();

    // Prepend all three rows
    const first = tbody.firstChild;
    [mainTr, detailTr, editTr].forEach(tr => tbody.insertBefore(tr, first));

    applyFilters();
  }

  /* ================================================================
     SELECT ALL
  ================================================================ */
  selectAllCb?.addEventListener('change', () => {
    tbody.querySelectorAll('.row-check').forEach(cb => { cb.checked = selectAllCb.checked; });
  });
  tbody?.addEventListener('change', e => {
    if (!e.target.matches('.row-check')) return;
    const all = tbody.querySelectorAll('.row-check');
    const chk = tbody.querySelectorAll('.row-check:checked');
    selectAllCb.indeterminate = chk.length > 0 && chk.length < all.length;
    selectAllCb.checked       = chk.length === all.length;
  });

  /* ================================================================
     KEYBOARD — Escape closes anything open
  ================================================================ */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (confirmOverlay?.classList.contains('open')) { hideConfirm(); return; }
    if (bookingModal?.classList.contains('open'))   { closeModal();  return; }
    if (expandedId) collapseAll(null);
  });

  /* ================================================================
     HELPERS
  ================================================================ */
  function cap(s)  { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function esc(s)  { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d + 'T00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
    catch { return d; }
  }
  function fmtTime(t) {
    if (!t) return '—';
    try {
      const [h, m] = t.split(':').map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    } catch { return t; }
  }

  /* ── Fade-in keyframe ── */
  if (!document.getElementById('bk-kf')) {
    const s = document.createElement('style');
    s.id = 'bk-kf';
    s.textContent = '@keyframes bk-fadein { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }';
    document.head.appendChild(s);
  }

  /* ── Init ── */
  applyFilters();

})();