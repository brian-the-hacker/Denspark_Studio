/* =========================================
   DENSPARK ADMIN — Portfolio Manager JS
   ========================================= */
(function () {
  'use strict';

  /* ── CSRF token (required by Flask-WTF on all POST/DELETE requests) ── */
  const CSRF = document.querySelector('meta[name="csrf-token"]')?.content || '';

  /* ── Safe fetch — always sends CSRF, always returns parsed JSON ── */
  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'X-CSRFToken': CSRF,
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
      console.error('Non-JSON response from server:', text.slice(0, 400));
      throw new Error('Server returned an error page — check console for details');
    }
  }

  /* ---- Helpers ---- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function showToast(msg, type = 'success') {
    const toast = $('#apToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'ap-toast' + (type === 'error' ? ' error' : '');
    void toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /* ============================================================
     FILTER + SEARCH
  ============================================================ */
  const filterBtns = $$('.ap-filter');
  const apGrid     = $('#apGrid');
  const apSearch   = $('#apSearch');
  const noResults  = $('#apNoResults');
  const apCount    = $('#apCount');

  let activeFilter = 'all';
  let searchQuery  = '';

  function applyFilterSearch() {
    const cards = $$('.ap-card', apGrid);
    let visible = 0;

    cards.forEach((card) => {
      const cat      = card.dataset.cat   || '';
      const title    = card.dataset.title || '';
      const catOk    = activeFilter === 'all' || cat === activeFilter;
      const searchOk = !searchQuery || title.includes(searchQuery);
      const show     = catOk && searchOk;

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) noResults.style.display = visible === 0 && cards.length > 0 ? 'block' : 'none';
    if (apCount)   apCount.textContent = `${visible} item${visible !== 1 ? 's' : ''}`;
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      applyFilterSearch();
    });
  });

  apSearch?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    applyFilterSearch();
  });

  /* ============================================================
     MODAL HELPERS
  ============================================================ */
  function openModal(id) {
    const el = document.getElementById(id);
    el && el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    el && el.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('.ap-modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['uploadModal', 'editModal', 'deleteModal'].forEach(closeModal);
    }
  });

  /* ============================================================
     UPLOAD MODAL
  ============================================================ */
  const uploadModal  = 'uploadModal';
  const uploadForm   = $('#uploadForm');
  const dropzone     = $('#apDropzone');
  const fileInput    = $('#fileInput');
  const previewStrip = $('#previewStrip');
  const progressWrap = $('#uploadProgressWrap');
  const progressFill = $('#uploadProgressFill');
  const progressText = $('#uploadProgressText');

  let filesToUpload = [];

  $('#openUploadModal')?.addEventListener('click', () => openModal(uploadModal));
  $('#emptyUploadBtn')?.addEventListener('click',  () => openModal(uploadModal));
  $('#closeUploadModal')?.addEventListener('click', () => closeModal(uploadModal));
  $('#cancelUpload')?.addEventListener('click',     () => closeModal(uploadModal));

  dropzone?.addEventListener('dragover',  (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone?.addEventListener('dragleave', ()  => dropzone.classList.remove('drag-over'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFiles([...e.dataTransfer.files]);
  });

  fileInput?.addEventListener('change', () => handleFiles([...fileInput.files]));

  function handleFiles(files) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    imageFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`${file.name} exceeds 10MB limit`, 'error');
        return;
      }
      if (filesToUpload.find((f) => f.name === file.name)) return;
      filesToUpload.push(file);
      addPreviewThumb(file);
    });
  }

  function addPreviewThumb(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumb = document.createElement('div');
      thumb.className    = 'ap-preview-thumb';
      thumb.dataset.name = file.name;
      thumb.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <button class="ap-thumb-remove" type="button" title="Remove">×</button>
      `;
      thumb.querySelector('.ap-thumb-remove').addEventListener('click', () => {
        filesToUpload = filesToUpload.filter((f) => f.name !== file.name);
        thumb.remove();
      });
      previewStrip?.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  }

  /* ── Upload submit ── */
  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title    = $('#uploadTitle').value.trim();
    const category = $('#uploadCategory').value;
    const desc     = $('#uploadDesc').value.trim();
    const featured = $('#uploadFeatured').checked;

    if (!title || !category) { showToast('Title and category are required', 'error'); return; }
    if (filesToUpload.length === 0) { showToast('Please select at least one photo', 'error'); return; }

    const submitBtn = $('#uploadSubmit');
    submitBtn.disabled = true;
    if (progressWrap) progressWrap.style.display = 'block';

    let successCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      if (progressFill) progressFill.style.width = Math.round((i / filesToUpload.length) * 100) + '%';
      if (progressText) progressText.textContent = `Uploading ${i + 1} of ${filesToUpload.length}…`;

      const fd = new FormData();
      fd.append('file',        file);
      fd.append('title',       title + (filesToUpload.length > 1 ? ` (${i + 1})` : ''));
      fd.append('category',    category);
      fd.append('description', desc);
      fd.append('featured',    featured ? '1' : '0');

      try {
        /* ── IMPORTANT: Do NOT set Content-Type on FormData — browser sets it ── */
        const { ok, data } = await apiFetch('/admin/portfolio/upload', {
          method: 'POST',
          body: fd,
          /* headers intentionally omitted for Content-Type — apiFetch adds only CSRF+Accept */
        });

        if (ok && data.success) {
          successCount++;
        } else {
          showToast(`Failed: ${data?.error || 'Unknown error'}`, 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }

    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent  = 'Done!';

    setTimeout(() => {
      submitBtn.disabled = false;
      if (progressWrap) progressWrap.style.display = 'none';
      if (progressFill) progressFill.style.width   = '0';

      if (successCount > 0) {
        showToast(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded!`);
        closeModal(uploadModal);
        uploadForm.reset();
        filesToUpload = [];
        if (previewStrip) previewStrip.innerHTML = '';
        setTimeout(() => window.location.reload(), 600);
      }
    }, 800);
  });

  /* ============================================================
     EDIT MODAL
  ============================================================ */
  let editingId = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ap-edit-btn');
    if (!btn) return;

    editingId = btn.dataset.id;
    $('#editId').value         = editingId;
    $('#editTitle').value      = btn.dataset.title    || '';
    $('#editDesc').value       = btn.dataset.desc     || '';
    $('#editCategory').value   = btn.dataset.cat      || '';
    $('#editFeatured').checked = btn.dataset.featured === 'true';
    $('#editPreviewImg').src   = btn.dataset.img      || '';
    openModal('editModal');
  });

  $('#closeEditModal')?.addEventListener('click', () => closeModal('editModal'));
  $('#cancelEdit')?.addEventListener('click',     () => closeModal('editModal'));

  $('#editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    const payload = {
      id:          editingId,
      title:       $('#editTitle').value.trim(),
      category:    $('#editCategory').value,
      description: $('#editDesc').value.trim(),
      featured:    $('#editFeatured').checked,
    };

    try {
      const { ok, data } = await apiFetch(`/admin/portfolio/edit/${editingId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (ok && data.success) {
        showToast('Changes saved!');
        closeModal('editModal');

        const card = $(`.ap-card[data-id="${editingId}"]`);
        if (card) {
          card.dataset.cat   = payload.category;
          card.dataset.title = payload.title.toLowerCase();

          const titleEl = card.querySelector('.ap-card-title');
          const catEl   = card.querySelector('.ap-cat-tag');
          const descEl  = card.querySelector('.ap-card-desc');
          const editBtn = card.querySelector('.ap-edit-btn');

          if (titleEl) titleEl.textContent = payload.title;
          if (catEl) {
            catEl.textContent = payload.category.charAt(0).toUpperCase() + payload.category.slice(1);
            catEl.className   = `ap-cat-tag ap-cat-${payload.category}`;
          }
          if (descEl) descEl.textContent = payload.description.slice(0, 60) + (payload.description.length > 60 ? '…' : '');
          if (editBtn) {
            editBtn.dataset.title    = payload.title;
            editBtn.dataset.desc     = payload.description;
            editBtn.dataset.cat      = payload.category;
            editBtn.dataset.featured = String(payload.featured);
          }

          const badge = card.querySelector('.ap-featured-badge');
          if (payload.featured && !badge) {
            const imgWrap = card.querySelector('.ap-card-img');
            const b = document.createElement('span');
            b.className   = 'ap-featured-badge';
            b.textContent = 'Featured';
            imgWrap?.prepend(b);
          } else if (!payload.featured && badge) {
            badge.remove();
          }
        }
      } else {
        showToast(data?.error || 'Save failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save Changes';
    }
  });

  /* ============================================================
     DELETE MODAL
  ============================================================ */
  let deletingId = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ap-delete-btn');
    if (!btn) return;
    deletingId = btn.dataset.id;
    $('#deleteItemTitle').textContent = `"${btn.dataset.title}"`;
    openModal('deleteModal');
  });

  $('#closeDeleteModal')?.addEventListener('click', () => closeModal('deleteModal'));
  $('#cancelDelete')?.addEventListener('click',     () => closeModal('deleteModal'));

  $('#confirmDelete')?.addEventListener('click', async () => {
    if (!deletingId) return;
    const btn     = $('#confirmDelete');
    btn.disabled  = true;
    btn.textContent = 'Deleting…';

    try {
      const { ok, data } = await apiFetch(`/admin/portfolio/delete/${deletingId}`, {
        method: 'DELETE',
      });

      if (ok && data.success) {
        closeModal('deleteModal');
        showToast('Item deleted.');

        const card = $(`.ap-card[data-id="${deletingId}"]`);
        if (card) {
          card.classList.add('hiding');
          setTimeout(() => { card.remove(); applyFilterSearch(); }, 220);
        }
      } else {
        showToast(data?.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Delete';
      deletingId      = null;
    }
  });

  /* ---- Initial render ---- */
  applyFilterSearch();

})();