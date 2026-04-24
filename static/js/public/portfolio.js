/* =========================================
   DENSPARK STUDIO — Portfolio JS
   Performance-first: lazy images, 
   IntersectionObserver reveals, 
   fast filter with RAF, virtual pagination
   ========================================= */

(function () {
  'use strict';

  /* ====================================================
     1. PRELOADER
  ==================================================== */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 1600);
    });
  }

  /* ====================================================
     2. NAVBAR
  ==================================================== */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
      }
    });
  }

  /* ====================================================
     3. LAZY IMAGE LOADING
     ── Uses native loading="lazy" as primary,
        IntersectionObserver as progressive enhancement.
     ── Adds blur-up effect: images start blurred,
        clear on load.
  ==================================================== */
  function setupLazyImages() {
    const imgs = document.querySelectorAll('.pf-img-wrap img');

    imgs.forEach((img) => {
      // Mark as loading → blurred
      if (!img.complete) {
        img.classList.add('lazy-loading');
        img.addEventListener('load', () => {
          img.classList.remove('lazy-loading');
        }, { once: true });
        img.addEventListener('error', () => {
          img.classList.remove('lazy-loading');
          // Graceful fallback: show placeholder color
          img.style.background = 'var(--gray-100)';
        }, { once: true });
      }
    });

    // IntersectionObserver for browsers that support it
    // — defers off-screen image src assignment for even faster load
    if ('IntersectionObserver' in window) {
      const imgObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            // If data-src set (progressive enhancement), swap it in
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imgObserver.unobserve(img);
          }
        });
      }, { rootMargin: '200px 0px' }); // 200px pre-load buffer

      imgs.forEach((img) => imgObserver.observe(img));
    }
  }

  /* ====================================================
     4. SCROLL REVEAL
     ── Staggered entry for grid items
  ==================================================== */
  function setupReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ====================================================
     5. PORTFOLIO ITEMS REVEAL
     ── Stagger-reveals items as they scroll into view
  ==================================================== */
  function setupItemReveal() {
    const items = document.querySelectorAll('.pf-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Small stagger based on position
          const delay = (Array.from(items).indexOf(entry.target) % 4) * 60;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

    items.forEach((item) => observer.observe(item));
  }

  /* ====================================================
     6. FILTER SYSTEM
     ── Uses requestAnimationFrame for smooth DOM updates
     ── Counts items per category
     ── Updates result text
  ==================================================== */
  const pfGrid      = document.getElementById('pfGrid');
  const pfEmpty     = document.getElementById('pfEmpty');
  const pfResultText= document.getElementById('pfResultText');
  const filterBtns  = document.querySelectorAll('.pf-filter');
  let   activeFilter = 'all';

  // Count items per category
  function updateCounts() {
    const allItems = pfGrid ? pfGrid.querySelectorAll('.pf-item') : [];
    const counts   = { all: 0 };

    allItems.forEach((item) => {
      const cat = item.dataset.category;
      counts.all++;
      counts[cat] = (counts[cat] || 0) + 1;
    });

    document.getElementById('count-all')?.textContent && (
      document.getElementById('count-all').textContent = counts.all
    );
    Object.keys(counts).forEach((key) => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key] || 0;
    });
  }

  function filterItems(filter) {
    if (!pfGrid) return;
    const items = pfGrid.querySelectorAll('.pf-item');
    let visible = 0;

    // Step 1: fade out briefly
    requestAnimationFrame(() => {
      items.forEach((item) => item.classList.add('filtering'));

      // Step 2: after fade, toggle visibility
      setTimeout(() => {
        requestAnimationFrame(() => {
          items.forEach((item) => {
            const cat   = item.dataset.category;
            const show  = filter === 'all' || cat === filter;

            item.classList.remove('filtering');
            item.classList.toggle('filter-hidden', !show);

            if (show) {
              visible++;
              // Re-trigger reveal animation
              item.classList.remove('visible');
              setTimeout(() => item.classList.add('visible'), 50 + (visible % 4) * 50);
            }
          });

          // Empty state
          if (pfEmpty) pfEmpty.style.display = visible === 0 ? 'block' : 'none';
          if (pfResultText) {
            pfResultText.textContent = `Showing ${visible} ${visible === 1 ? 'work' : 'works'}${filter !== 'all' ? ' · ' + filter : ''}`;
          }
        });
      }, 180);
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (filter === activeFilter) return;
      activeFilter = filter;

      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      filterItems(filter);
    });
  });

  /* ====================================================
     7. VIEW TOGGLE — Grid / Masonry / List
  ==================================================== */
  const viewGrid    = document.getElementById('viewGrid');
  const viewMasonry = document.getElementById('viewMasonry');
  const viewList    = document.getElementById('viewList');
  const viewBtns    = [viewGrid, viewMasonry, viewList];
  const viewClasses = ['pf-grid--grid', 'pf-grid--masonry', 'pf-grid--list'];

  function setView(idx) {
    if (!pfGrid) return;
    viewBtns.forEach((b, i) => b && b.classList.toggle('active', i === idx));
    viewClasses.forEach((cls, i) => pfGrid.classList.toggle(cls, i === idx));
    // Persist preference
    try { localStorage.setItem('pf-view', idx); } catch {}
  }

  viewGrid    && viewGrid.addEventListener('click',    () => setView(0));
  viewMasonry && viewMasonry.addEventListener('click', () => setView(1));
  viewList    && viewList.addEventListener('click',    () => setView(2));

  // Restore saved preference
  try {
    const saved = localStorage.getItem('pf-view');
    if (saved !== null) setView(Number(saved));
  } catch {}

  /* ====================================================
     8. LIGHTBOX
     ── Keyboard nav, swipe, caption, counter
  ==================================================== */
  const lightbox    = document.getElementById('lightbox');
  const lbBackdrop  = document.getElementById('lightboxBackdrop');
  const lbImg       = document.getElementById('lightboxImg');
  const lbCaption   = document.getElementById('lightboxCaption');
  const lbCounter   = document.getElementById('lightboxCounter');
  const lbClose     = document.getElementById('lightboxClose');
  const lbPrev      = document.getElementById('lbPrev');
  const lbNext      = document.getElementById('lbNext');

  let lbItems   = []; // { src, title, cat }
  let lbCurrent = 0;

  function buildLbItems() {
    const items = pfGrid ? pfGrid.querySelectorAll('.pf-item:not(.filter-hidden)') : [];
    lbItems = Array.from(items).map((item) => ({
      src  : item.dataset.img || item.querySelector('img')?.src || '',
      title: item.dataset.title || '',
      cat  : item.querySelector('.pf-cat')?.textContent || '',
    }));
  }

  function openLightbox(idx) {
    buildLbItems();
    lbCurrent = idx;
    showLbSlide(lbCurrent);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function showLbSlide(idx) {
    lbCurrent = (idx + lbItems.length) % lbItems.length;
    const item = lbItems[lbCurrent];
    if (!item) return;

    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = item.src;
      lbImg.alt = item.title;
      lbImg.style.opacity = '1';
    }, 140);

    if (lbCaption) lbCaption.textContent = item.title ? `${item.cat} · ${item.title}` : '';
    if (lbCounter) lbCounter.textContent = `${lbCurrent + 1} / ${lbItems.length}`;
  }

  // Attach zoom buttons
  document.addEventListener('click', (e) => {
    const btn  = e.target.closest('.pf-zoom');
    const item = e.target.closest('.pf-item');
    if (!btn && !item) return;
    if (btn || item) {
      e.preventDefault();
      buildLbItems();
      const target  = (btn || item).closest('.pf-item');
      const allItems= Array.from(pfGrid?.querySelectorAll('.pf-item:not(.filter-hidden)') || []);
      const idx     = allItems.indexOf(target);
      if (idx >= 0) openLightbox(idx);
    }
  });

  lbClose    && lbClose.addEventListener('click', closeLightbox);
  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev     && lbPrev.addEventListener('click', () => showLbSlide(lbCurrent - 1));
  lbNext     && lbNext.addEventListener('click', () => showLbSlide(lbCurrent + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   showLbSlide(lbCurrent - 1);
    if (e.key === 'ArrowRight')  showLbSlide(lbCurrent + 1);
  });

  // Touch swipe in lightbox
  let lbTouchX = 0;
  lightbox?.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox?.addEventListener('touchend', (e) => {
    const diff = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) showLbSlide(diff > 0 ? lbCurrent + 1 : lbCurrent - 1);
  });

  /* ====================================================
     9. CHAT WIDGET
  ==================================================== */
  const chatToggle = document.getElementById('chatToggle');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose  = document.getElementById('chatClose');
  const chatInput  = document.getElementById('chatInput');
  const chatSend   = document.getElementById('chatSend');
  const chatMsgs   = document.getElementById('chatMessages');
  const chatBadge  = chatToggle?.querySelector('.chat-badge');

  const replies = [
    "We'd love to help! What kind of photography are you looking for?",
    "Great choice! Book via our contact page or call +254 710 468 300.",
    "We serve Machakos and surrounding areas. DM us for availability!",
    "Our packages are affordable and flexible. Contact us for a quote 😊",
    "Yes, we do weddings, events, portraits, and commercial shoots!",
  ];
  let replyIdx = 0;

  function toggleChat() {
    chatWindow?.classList.toggle('open');
    if (chatBadge) chatBadge.style.display = 'none';
  }
  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    chatMsgs?.appendChild(div);
    if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }
  function sendMsg() {
    const text = chatInput?.value.trim();
    if (!text) return;
    appendMsg(text, 'sent');
    chatInput.value = '';
    setTimeout(() => {
      appendMsg(replies[replyIdx++ % replies.length], 'received');
    }, 800 + Math.random() * 400);
  }

  chatToggle?.addEventListener('click', toggleChat);
  chatClose?.addEventListener('click', toggleChat);
  chatSend?.addEventListener('click', sendMsg);
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });

  /* ====================================================
     10. PERFORMANCE: IMAGE DECODE HINT
     ── Tells browser to decode images off main thread
  ==================================================== */
  function decodeImages() {
    document.querySelectorAll('.pf-img-wrap img').forEach((img) => {
      if ('decode' in img) {
        img.decode().catch(() => {}); // non-blocking
      }
    });
  }

  /* ====================================================
     11. PERFORMANCE: CONTENT-VISIBILITY
     ── Applied via JS for wider support signal
  ==================================================== */
  function applyContentVisibility() {
    if (!CSS.supports('content-visibility', 'auto')) return;
    document.querySelectorAll('.pf-item').forEach((item) => {
      item.style.contentVisibility = 'auto';
      item.style.containIntrinsicSize = '0 300px'; // estimated height
    });
  }

  /* ====================================================
     12. INIT
  ==================================================== */
  function init() {
    setupLazyImages();
    setupReveal();
    setupItemReveal();
    updateCounts();
    decodeImages();
    applyContentVisibility();

    // Trigger initial filter count text
    const allItems = pfGrid?.querySelectorAll('.pf-item') || [];
    if (pfResultText) pfResultText.textContent = `Showing ${allItems.length} works`;
  }

  // Run immediately — DOM is already parsed at script tag position (bottom of body)
  init();

})();