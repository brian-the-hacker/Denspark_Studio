/* =========================================
   DENSPARK STUDIO — Public Portfolio JS
   Works with dynamic API-loaded items.
   The HTML inline script handles fetch/render;
   this file handles all UI interactions.
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
  /* ── Desktop Services: click to open ──────────────────── */
  (function initNavbar() {
    var navbar               = document.getElementById('navbar');
    var menuToggle           = document.getElementById('menuToggle');
    var mobileMenu           = document.getElementById('mobileMenu');
    var desktopServicesMenu  = document.getElementById('desktopServicesMenu');  // the <li>
    var desktopServicesToggle= document.getElementById('desktopServicesToggle');// the <a> inside it
    var mobileServicesItem   = document.getElementById('mobileServicesItem');
    var mobileServicesToggle = document.getElementById('mobileServicesToggle');

    /* ── Scroll: add .scrolled class ─────────────────────────── */
    function onScroll() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once immediately

    /* ── Hamburger / mobile menu ─────────────────────────────── */
    function openMobileMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.classList.add('open');
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
    }

    function closeMobileMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }

    if (menuToggle) {
      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileMenu && mobileMenu.classList.contains('open');
        isOpen ? closeMobileMenu() : openMobileMenu();
      });
    }

    // Close mobile menu when any nav link inside it is tapped
    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── Desktop mega-menu ───────────────────────────────────── */
    // Toggle on click (not hover — hover is handled by pure CSS in services.css).
    // The JS-driven .open class is for accessibility / click-to-open mode.
    function closeMegaMenu() {
      if (desktopServicesMenu) desktopServicesMenu.classList.remove('open');
    }

    if (desktopServicesToggle) {
      desktopServicesToggle.addEventListener('click', function (e) {
        if (window.innerWidth > 900) {
          e.preventDefault();
          e.stopPropagation(); // prevent the document click handler below
          var isOpen = desktopServicesMenu && desktopServicesMenu.classList.contains('open');
          isOpen ? closeMegaMenu() : desktopServicesMenu.classList.add('open');
        }
      });
    }

    /* ── Mobile services accordion ───────────────────────────── */
    if (mobileServicesToggle && mobileServicesItem) {
      mobileServicesToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileServicesItem.classList.toggle('open');
        mobileServicesToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    /* ── Outside click: close mega + mobile menu ─────────────── */
    document.addEventListener('click', function (e) {
      // Close desktop mega if click is outside the services <li>
      if (desktopServicesMenu && !desktopServicesMenu.contains(e.target)) {
        closeMegaMenu();
      }
      // Close mobile menu if click is outside the entire navbar
      if (navbar && !navbar.contains(e.target)) {
        closeMobileMenu();
      }
    });

    /* ── Close on scroll (desktop mega only) ─────────────────── */
    window.addEventListener('scroll', closeMegaMenu, { passive: true });

    /* ── Escape key ──────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeMegaMenu();
      }
    });
  }());
  /* ====================================================
     3. SCROLL REVEAL
     Exported as window.__revealObs so the inline
     API script can observe dynamically added items.
  ==================================================== */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));
  window.__revealObs = revealObs; // used by inline script for dynamic .pf-item elements

  
  /* ====================================================
     4. ITEM REVEAL
     Called by inline script after it injects items.
     Staggered by position mod 4.
  ==================================================== */
  window.__setupItemReveal = function () {
    const items = document.querySelectorAll('.pf-item');
    const itemObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx   = Array.from(items).indexOf(entry.target);
        const delay = (idx % 4) * 60;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        itemObs.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

    items.forEach((item) => itemObs.observe(item));
  };

  /* ====================================================
     5. LAZY IMAGE LOADING
     Called by inline script after items are rendered.
     Blur-up effect + IntersectionObserver pre-loading.
  ==================================================== */
  window.__setupLazyImages = function () {
    const imgs = document.querySelectorAll('.pf-img-wrap img');

    imgs.forEach((img) => {
      if (!img.complete) {
        img.classList.add('lazy-loading');
        img.addEventListener('load',  () => img.classList.remove('lazy-loading'), { once: true });
        img.addEventListener('error', () => {
          img.classList.remove('lazy-loading');
          img.style.background = 'var(--gray-100)';
        }, { once: true });
      }
      // Off-main-thread decode hint
      if ('decode' in img) img.decode().catch(() => {});
    });

    if ('IntersectionObserver' in window) {
      const imgObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObs.unobserve(img);
        });
      }, { rootMargin: '200px 0px' });
      imgs.forEach((img) => imgObs.observe(img));
    }

    // content-visibility for off-screen items
    if (CSS.supports('content-visibility', 'auto')) {
      document.querySelectorAll('.pf-item').forEach((item) => {
        item.style.contentVisibility    = 'auto';
        item.style.containIntrinsicSize = '0 300px';
      });
    }
  };

  /* ====================================================
     6. FILTER SYSTEM
     The inline script builds and populates the grid.
     It calls window.__bindFilters() once items are ready.
  ==================================================== */
  window.__bindFilters = function () {
    const pfGrid       = document.getElementById('pfGrid');
    const pfEmpty      = document.getElementById('pfEmpty');
    const pfResultText = document.getElementById('pfResultText');
    const filterBtns   = document.querySelectorAll('.pf-filter');
    let   activeFilter = 'all';

    function filterItems(filter) {
      if (!pfGrid) return;
      const items = pfGrid.querySelectorAll('.pf-item');
      let visible = 0;

      requestAnimationFrame(() => {
        items.forEach((item) => item.classList.add('filtering'));

        setTimeout(() => {
          requestAnimationFrame(() => {
            items.forEach((item) => {
              const cat  = item.dataset.category;
              const show = filter === 'all' || cat === filter;
              item.classList.remove('filtering');
              item.classList.toggle('filter-hidden', !show);
              if (show) {
                visible++;
                item.classList.remove('visible');
                setTimeout(() => item.classList.add('visible'), 50 + (visible % 4) * 50);
              }
            });

            if (pfEmpty)      pfEmpty.style.display = visible === 0 ? 'block' : 'none';
            if (pfResultText) {
              const suffix = filter !== 'all' ? ` · ${filter}` : '';
              pfResultText.textContent = `Showing ${visible} ${visible === 1 ? 'work' : 'works'}${suffix}`;
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
  };

  /* ====================================================
     7. VIEW TOGGLE — Grid / Masonry / List
  ==================================================== */
  const pfGrid      = document.getElementById('pfGrid');
  const viewGrid    = document.getElementById('viewGrid');
  const viewMasonry = document.getElementById('viewMasonry');
  const viewList    = document.getElementById('viewList');
  const viewBtns    = [viewGrid, viewMasonry, viewList];
  const viewClasses = ['pf-grid--grid', 'pf-grid--masonry', 'pf-grid--list'];

  function setView(idx) {
    if (!pfGrid) return;
    viewBtns.forEach((b, i) => b && b.classList.toggle('active', i === idx));
    viewClasses.forEach((cls, i) => pfGrid.classList.toggle(cls, i === idx));
    try { localStorage.setItem('pf-view', idx); } catch {}
  }

  viewGrid    && viewGrid.addEventListener('click',    () => setView(0));
  viewMasonry && viewMasonry.addEventListener('click', () => setView(1));
  viewList    && viewList.addEventListener('click',    () => setView(2));

  // Restore saved preference on load
  try {
    const saved = localStorage.getItem('pf-view');
    if (saved !== null) setView(Number(saved));
  } catch {}

  /* ====================================================
     8. LIGHTBOX
     buildLbItems() reads from the inline script's
     visibleItems array via window.__visibleItems,
     which the inline script must set.
  ==================================================== */
  const lightbox   = document.getElementById('lightbox');
  const lbBackdrop = document.getElementById('lightboxBackdrop');
  const lbImg      = document.getElementById('lightboxImg');
  const lbCaption  = document.getElementById('lightboxCaption');
  const lbCounter  = document.getElementById('lightboxCounter');
  const lbClose    = document.getElementById('lightboxClose');
  const lbPrev     = document.getElementById('lbPrev');
  const lbNext     = document.getElementById('lbNext');

  let lbItems   = [];
  let lbCurrent = 0;

  function buildLbItems() {
    // Prefer inline script's data array (has Cloudinary URLs)
    if (window.__visibleItems && window.__visibleItems.length) {
      lbItems = window.__visibleItems.map((item) => ({
        src  : item.image_url || '',
        title: item.title     || '',
        cat  : item.category_label || item.category || '',
      }));
      return;
    }
    // Fallback: read from DOM
    const items = pfGrid ? pfGrid.querySelectorAll('.pf-item:not(.filter-hidden)') : [];
    lbItems = Array.from(items).map((item) => ({
      src  : item.dataset.img || item.querySelector('img')?.src || '',
      title: item.dataset.title || '',
      cat  : item.querySelector('.pf-cat')?.textContent || '',
    }));
  }

  const servicesMenu = document.getElementById("servicesMenu");
  const servicesToggle = document.getElementById("servicesToggle");

  // open/close on click
  servicesToggle.addEventListener("click", function (e) {
    e.preventDefault(); // prevents page jump
    servicesMenu.classList.toggle("open");
  });

  // close when clicking outside
  document.addEventListener("click", function (e) {
    if (!servicesMenu.contains(e.target)) {
      servicesMenu.classList.remove("open");
    }
  });

  // optional: close on scroll
  window.addEventListener("scroll", () => {
    servicesMenu.classList.remove("open");
  });

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

  // Delegate click — works for dynamically added items
  document.addEventListener('click', (e) => {
    const zoomBtn  = e.target.closest('.pf-zoom');
    const imgWrap  = e.target.closest('.pf-img-wrap');
    const pfItem   = e.target.closest('.pf-item');

    if (!zoomBtn && !imgWrap) return;
    if (!pfItem) return;

    e.preventDefault();
    buildLbItems();

    const allItems = Array.from(pfGrid?.querySelectorAll('.pf-item:not(.filter-hidden)') || []);
    const idx      = allItems.indexOf(pfItem);
    if (idx >= 0) openLightbox(idx);
  });

  lbClose    && lbClose.addEventListener('click', closeLightbox);
  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev     && lbPrev.addEventListener('click', () => showLbSlide(lbCurrent - 1));
  lbNext     && lbNext.addEventListener('click', () => showLbSlide(lbCurrent + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showLbSlide(lbCurrent - 1);
    if (e.key === 'ArrowRight') showLbSlide(lbCurrent + 1);
  });

  let lbTouchX = 0;
  lightbox?.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox?.addEventListener('touchend',   (e) => {
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
    setTimeout(() => appendMsg(replies[replyIdx++ % replies.length], 'received'),
      800 + Math.random() * 400);
  }

  chatToggle?.addEventListener('click', toggleChat);
  chatClose?.addEventListener('click',  toggleChat);
  chatSend?.addEventListener('click',   sendMsg);
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });

})();