/* =============================================
   DENSPARK ADMIN — Video Manager JS
   Save to: /static/js/admin/videos/main.js
   ============================================= */
(function () {
  'use strict';

  /* ── Helpers ── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function toast(msg, type = 'default') {
    const el = qs('#avToast');
    if (!el) return;
    el.textContent = msg;
    el.className   = `av-toast show${type !== 'default' ? ' ' + type : ''}`;
    setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* ── Extract YouTube ID ── */
  function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function thumbUrl(ytId) {
    return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  }

  /* ── Filter + search state ── */
  let activeFilter = 'all';
  let searchTerm   = '';

  function filterCards() {
    let visible = 0;
    qsa('.av-card').forEach((card) => {
      const cat   = card.dataset.cat   || '';
      const title = card.dataset.title || '';
      const matchCat    = activeFilter === 'all' || cat === activeFilter;
      const matchSearch = !searchTerm || title.includes(searchTerm);
      const show = matchCat && matchSearch;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    const noRes = qs('#avNoResults');
    if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
  }

  /* Filter buttons */
  qsa('.av-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('.av-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      filterCards();
    });
  });

  /* Search */
  const searchEl = qs('#avSearch');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      searchTerm = searchEl.value.trim().toLowerCase();
      filterCards();
    });
  }

  /* ── Modal helpers ── */
  function openModal(id) {
    const el = qs('#' + id);
    if (el) el.classList.add('open');
  }
  function closeModal(id) {
    const el = qs('#' + id);
    if (el) el.classList.remove('open');
    // Stop any playing iframe
    if (id === 'previewModal') {
      const iframe = qs('#previewIframe');
      if (iframe) iframe.src = '';
    }
  }

  /* Close on overlay click */
  qsa('.av-modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  /* Close buttons */
  [
    ['closeAddModal',     'addModal'],
    ['cancelAdd',         'addModal'],
    ['closeEditModal',    'editModal'],
    ['cancelEdit',        'editModal'],
    ['closeDeleteModal',  'deleteModal'],
    ['cancelDelete',      'deleteModal'],
    ['closePreviewModal', 'previewModal'],
  ].forEach(([btnId, modalId]) => {
    const btn = qs('#' + btnId);
    if (btn) btn.addEventListener('click', () => closeModal(modalId));
  });

  /* ── Add Modal ── */
  qs('#openAddModal')?.addEventListener('click', () => {
    resetAddForm();
    openModal('addModal');
  });
  qs('#emptyAddBtn')?.addEventListener('click', () => {
    resetAddForm();
    openModal('addModal');
  });

  function resetAddForm() {
    const form = qs('#addForm');
    if (form) form.reset();
    qs('#addThumbPreview').style.display = 'none';
    qs('#addUrlError').style.display     = 'none';
    if (qs('#addDescCount')) qs('#addDescCount').textContent = '0';
  }

  /* Live YouTube URL preview on Add form */
  const addUrlInput = qs('#addUrl');
  if (addUrlInput) {
    addUrlInput.addEventListener('input', () => {
      const ytId = extractYouTubeId(addUrlInput.value.trim());
      const preview  = qs('#addThumbPreview');
      const errEl    = qs('#addUrlError');
      const thumbImg = qs('#addThumbImg');
      const thumbIdEl= qs('#addThumbId');

      if (ytId) {
        thumbImg.src           = thumbUrl(ytId);
        if (thumbIdEl) thumbIdEl.textContent = `ID: ${ytId}`;
        preview.style.display  = 'flex';
        errEl.style.display    = 'none';
      } else if (addUrlInput.value.length > 10) {
        preview.style.display  = 'none';
        errEl.style.display    = 'block';
      } else {
        preview.style.display  = 'none';
        errEl.style.display    = 'none';
      }
    });
  }

  /* Char counter */
  const addDescEl = qs('#addDesc');
  if (addDescEl) {
    addDescEl.addEventListener('input', () => {
      const count = qs('#addDescCount');
      if (count) count.textContent = addDescEl.value.length;
    });
  }

  /* ── ADD Form Submit ── */
  const addForm = qs('#addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = qs('#addSubmit');

      const url   = qs('#addUrl').value.trim();
      const ytId  = extractYouTubeId(url);
      if (!ytId) {
        toast('Invalid YouTube URL — please check and try again.', 'error');
        return;
      }

      const payload = {
        url,
        youtube_id:  ytId,
        title:       qs('#addTitle').value.trim(),
        category:    qs('#addCategory').value,
        description: qs('#addDesc').value.trim(),
        duration:    qs('#addDuration').value.trim(),
        featured:    qs('#addFeatured').checked,
      };

      submitBtn.disabled    = true;
      submitBtn.textContent = 'Saving…';

      try {
        const res = await fetch('/admin/api/videos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save');

        closeModal('addModal');
        toast('Video added successfully!', 'success');
        injectCard(data);
        updateCount(1);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        submitBtn.disabled    = false;
        submitBtn.innerHTML   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Video';
      }
    });
  }

  /* ── Inject new card into grid (no page reload) ── */
  function injectCard(video) {
    const grid  = qs('#avGrid');
    const empty = qs('#avEmpty');
    if (empty) empty.style.display = 'none';

    const card = buildCardEl(video);
    grid.insertAdjacentElement('afterbegin', card);
    bindCardEvents(card);
    filterCards();
  }

  function buildCardEl(video) {
    const div = document.createElement('div');
    div.className        = 'av-card';
    div.dataset.id       = video.id;
    div.dataset.cat      = video.category;
    div.dataset.title    = (video.title || '').toLowerCase();

    const desc    = video.description ? video.description.substring(0, 80) + (video.description.length > 80 ? '…' : '') : '';
    const featBadge = video.featured ? '<span class="av-featured-badge">Featured</span>' : '';
    const durBadge  = video.duration  ? `<span class="av-duration">${video.duration}</span>` : '';
    const catClass  = `av-cat-${video.category}`;
    const ytId      = video.youtube_id || extractYouTubeId(video.url) || '';
    const thumb     = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    const today     = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    div.innerHTML = `
      <div class="av-card-thumb">
        <img src="${thumb}" alt="${esc(video.title)}" loading="lazy"
             onerror="this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'">
        <div class="av-play-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        ${featBadge}
        <div class="av-card-actions">
          <button class="av-action-btn av-edit-btn"
                  data-id="${video.id}" data-title="${esc(video.title)}"
                  data-desc="${esc(video.description || '')}"
                  data-cat="${video.category}" data-url="${esc(video.url)}"
                  data-featured="${video.featured ? 'true' : 'false'}"
                  title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="av-action-btn av-delete-btn"
                  data-id="${video.id}" data-title="${esc(video.title)}"
                  title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
        ${durBadge}
      </div>
      <div class="av-card-body">
        <span class="av-cat-tag ${catClass}">${capitalize(video.category)}</span>
        <h3 class="av-card-title">${esc(video.title)}</h3>
        ${desc ? `<p class="av-card-desc">${esc(desc)}</p>` : ''}
        <div class="av-card-meta">
          <a href="${esc(video.url)}" target="_blank" class="av-yt-link" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </a>
          <span class="av-card-date">${today}</span>
        </div>
      </div>`;
    return div;
  }

  /* ── Edit Modal ── */
  let currentEditId = null;

  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.av-edit-btn');
    if (!editBtn) return;

    currentEditId = editBtn.dataset.id;
    const ytId    = extractYouTubeId(editBtn.dataset.url) || '';

    qs('#editId').value       = currentEditId;
    qs('#editUrl').value      = editBtn.dataset.url || '';
    qs('#editTitle').value    = editBtn.dataset.title || '';
    qs('#editDesc').value     = editBtn.dataset.desc || '';
    qs('#editDuration').value = editBtn.dataset.duration || '';
    qs('#editFeatured').checked = editBtn.dataset.featured === 'true';

    const sel = qs('#editCategory');
    if (sel) sel.value = editBtn.dataset.cat || '';

    const thumb = qs('#editThumbImg');
    if (thumb && ytId) {
      thumb.src = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      thumb.onerror = () => { thumb.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`; };
    }

    openModal('editModal');
  });

  /* Edit form submit */
  const editForm = qs('#editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url  = qs('#editUrl').value.trim();
      const ytId = extractYouTubeId(url);
      if (!ytId) { toast('Invalid YouTube URL', 'error'); return; }

      const payload = {
        url,
        youtube_id:  ytId,
        title:       qs('#editTitle').value.trim(),
        category:    qs('#editCategory').value,
        description: qs('#editDesc').value.trim(),
        duration:    qs('#editDuration').value.trim(),
        featured:    qs('#editFeatured').checked,
      };

      try {
        const res = await fetch(`/admin/api/videos/${currentEditId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update');

        closeModal('editModal');
        toast('Video updated!', 'success');
        // Refresh the card in the grid
        const card = qs(`.av-card[data-id="${currentEditId}"]`);
        if (card) {
          const newCard = buildCardEl({ ...payload, id: currentEditId });
          card.replaceWith(newCard);
          bindCardEvents(newCard);
        }
        filterCards();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  /* ── Delete Modal ── */
  let currentDeleteId = null;

  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.av-delete-btn');
    if (!delBtn) return;
    currentDeleteId = delBtn.dataset.id;
    const titleEl = qs('#deleteVideoTitle');
    if (titleEl) titleEl.textContent = delBtn.dataset.title || 'this video';
    openModal('deleteModal');
  });

  qs('#confirmDelete')?.addEventListener('click', async () => {
    if (!currentDeleteId) return;

    try {
      const res = await fetch(`/admin/api/videos/${currentDeleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      closeModal('deleteModal');
      toast('Video deleted.', 'success');

      const card = qs(`.av-card[data-id="${currentDeleteId}"]`);
      if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.95)';
        setTimeout(() => {
          card.remove();
          updateCount(-1);
          // Show empty state if no cards left
          if (!qs('.av-card')) {
            const empty = qs('#avEmpty');
            if (empty) empty.style.display = 'block';
          }
        }, 300);
      }
    } catch (err) {
      toast('Could not delete. Try again.', 'error');
    }
    currentDeleteId = null;
  });

  /* ── Preview Modal (watch video inside admin) ── */
  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('.av-card-thumb');
    if (!thumb) return;
    // Don't open preview if clicking action buttons
    if (e.target.closest('.av-card-actions')) return;

    const card  = thumb.closest('.av-card');
    if (!card)  return;

    // Get YouTube URL from edit button data
    const editBtn = card.querySelector('.av-edit-btn');
    if (!editBtn) return;
    const ytId = extractYouTubeId(editBtn.dataset.url || '');
    if (!ytId)  return;

    const title = editBtn.dataset.title || 'Video Preview';
    qs('#previewTitle').textContent = title;
    qs('#previewIframe').src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    openModal('previewModal');
  });

  /* ── Bind events to dynamically injected cards ── */
  function bindCardEvents(card) {
    // Events are all delegated via document.addEventListener — nothing extra needed
  }

  /* Bind initial cards */
  qsa('.av-card').forEach(bindCardEvents);

  /* ── Count update ── */
  function updateCount(delta) {
    const el = qs('#avCount');
    if (!el) return;
    const n = (parseInt(el.textContent) || 0) + delta;
    el.textContent = `${n} video${n !== 1 ? 's' : ''}`;
  }

  /* ── Utilities ── */
  function capitalize(str) { return String(str).charAt(0).toUpperCase() + String(str).slice(1); }
  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Keyboard: close modals on Escape ── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      qsa('.av-modal-overlay.open').forEach((m) => {
        m.classList.remove('open');
        const iframe = m.querySelector('iframe');
        if (iframe) iframe.src = '';
      });
    }
  });

})();