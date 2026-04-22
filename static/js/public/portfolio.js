/* ============================================================
   DENSPARK STUDIO — Portfolio JS
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     PRELOADER
  ────────────────────────────────────────── */
  const preloader = document.getElementById('preloader');

  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
      // Kick off item animations after preloader
      animateVisibleItems();
    }, 1600);
  });

  document.body.style.overflow = 'hidden';

  /* ──────────────────────────────────────────
     CUSTOM CURSOR
  ────────────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth follower via rAF
  function animateCursor() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect on interactive elements
  const hoverTargets = 'a, button, .pf-item, input, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Hide cursor when it leaves the window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity   = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity   = '1';
    follower.style.opacity = '1';
  });

  /* ──────────────────────────────────────────
     NAVBAR — SCROLL BEHAVIOUR
  ────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  /* ──────────────────────────────────────────
     MOBILE MENU TOGGLE
  ────────────────────────────────────────── */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  /* ──────────────────────────────────────────
     SCROLL REVEAL
  ────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ──────────────────────────────────────────
     PORTFOLIO ITEMS — INITIAL ANIMATION
  ────────────────────────────────────────── */
  function animateVisibleItems() {
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          itemObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.pf-item').forEach(item => itemObserver.observe(item));
  }

  /* ──────────────────────────────────────────
     PORTFOLIO FILTER
  ────────────────────────────────────────── */
  const filterBtns   = document.querySelectorAll('.pf-filter');
  const pfGrid       = document.getElementById('pfGrid');
  const pfEmpty      = document.getElementById('pfEmpty');
  const pfResultText = document.getElementById('pfResultText');

  let currentFilter = 'all';

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (filter === currentFilter) return;
      currentFilter = filter;

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      applyFilter(filter);
    });
  });

  function applyFilter(filter) {
    const items = pfGrid.querySelectorAll('.pf-item');
    let visibleCount = 0;

    items.forEach((item, i) => {
      const cat = item.dataset.category;
      const show = filter === 'all' || cat === filter;

      if (show) {
        item.classList.remove('hidden-item');
        item.style.transitionDelay = (i * 0.04) + 's';
        visibleCount++;
      } else {
        item.classList.add('hidden-item');
        item.style.transitionDelay = '0s';
      }
    });

    // Update result text
    const label = filter === 'all' ? 'works' : filter;
    pfResultText.textContent = `Showing ${visibleCount} ${label}`;

    // Show/hide empty state
    pfEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  /* ──────────────────────────────────────────
     VIEW TOGGLE (Masonry / Grid / List)
  ────────────────────────────────────────── */
  const viewGrid    = document.getElementById('viewGrid');
  const viewMasonry = document.getElementById('viewMasonry');
  const viewList    = document.getElementById('viewList');

  const viewBtns = [viewGrid, viewMasonry, viewList];
  const viewClasses = ['pf-grid--grid', 'pf-grid--masonry', 'pf-grid--list'];

  viewBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      viewClasses.forEach(cls => pfGrid.classList.remove(cls));
      pfGrid.classList.add(viewClasses[idx]);
    });
  });

  /* ──────────────────────────────────────────
     LIGHTBOX
  ────────────────────────────────────────── */
  const lightbox        = document.getElementById('lightbox');
  const lightboxImg     = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose   = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lbPrev          = document.getElementById('lbPrev');
  const lbNext          = document.getElementById('lbNext');

  let lightboxItems = [];
  let lightboxIndex = 0;

  function openLightbox(items, startIndex) {
    lightboxItems = items;
    lightboxIndex = startIndex;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const item = lightboxItems[lightboxIndex];
    lightboxImg.src        = item.img;
    lightboxImg.alt        = item.title;
    lightboxCaption.textContent = item.title;
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;

    // Fade animation on image change
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.97)';
    lightboxImg.onload = () => {
      lightboxImg.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    };
    if (lightboxImg.complete) {
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    }
  }

  lbPrev.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  });

  lbNext.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    updateLightbox();
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; updateLightbox(); }
  });

  // Attach zoom buttons
  function buildLightboxData() {
    return Array.from(document.querySelectorAll('.pf-item')).map(item => ({
      img:   item.dataset.img,
      title: item.dataset.title,
      el:    item,
    }));
  }

  document.addEventListener('click', (e) => {
    const zoomBtn = e.target.closest('.pf-zoom');
    if (!zoomBtn) return;
    const item = zoomBtn.closest('.pf-item');
    const allItems = buildLightboxData();
    const idx = allItems.findIndex(d => d.el === item);
    openLightbox(allItems, idx);
  });

  /* ──────────────────────────────────────────
     CHAT WIDGET
  ────────────────────────────────────────── */
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatClose    = document.getElementById('chatClose');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge    = chatToggle.querySelector('.chat-badge');

  let chatOpen = false;

  function toggleChat() {
    chatOpen = !chatOpen;
    chatWindow.classList.toggle('open', chatOpen);
    if (chatOpen && chatBadge) {
      chatBadge.style.display = 'none';
    }
    if (chatOpen) chatInput.focus();
  }

  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', (e) => { e.stopPropagation(); toggleChat(); });

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${type}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'sent');
    chatInput.value = '';

    // Auto-reply after short delay
    setTimeout(() => {
      const replies = [
        "Thanks for reaching out! We'll get back to you shortly. 📸",
        "Great question! Our team will respond within the hour.",
        "We'd love to capture your special moments. Check out our packages!",
        "Feel free to book a session at your convenience!"
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      addMessage(reply, 'received');
    }, 900 + Math.random() * 600);
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  /* ──────────────────────────────────────────
     COUNT UP ANIMATION FOR FILTER COUNTS
  ────────────────────────────────────────── */
  // Dynamic category counts
  function updateCounts() {
    const items = document.querySelectorAll('.pf-item');
    const counts = { all: items.length };
    items.forEach(item => {
      const cat = item.dataset.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });

    Object.entries(counts).forEach(([key, val]) => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = val;
    });

    const resultEl = document.getElementById('pfResultText');
    if (resultEl) resultEl.textContent = `Showing ${counts.all} works`;
  }

  updateCounts();

  /* ──────────────────────────────────────────
     MARQUEE — pause on reduced-motion
  ────────────────────────────────────────── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) marqueeContent.style.animation = 'none';
  }

  /* ──────────────────────────────────────────
     TOUCH SWIPE FOR LIGHTBOX
  ────────────────────────────────────────── */
  let touchStartX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) {
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    } else {
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    }
    updateLightbox();
  }, { passive: true });

  /* ──────────────────────────────────────────
     NAV SCROLL HIGHLIGHT (active link)
  ────────────────────────────────────────── */
  // Already handled via .active class on markup, this handles dynamic scrolling if needed
  const sections = document.querySelectorAll('section[id]');
  if (sections.length) {
    const secObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(sec => secObserver.observe(sec));
  }

})();