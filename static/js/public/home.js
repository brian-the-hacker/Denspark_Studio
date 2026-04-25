/* ============================================================
   DENSPARK STUDIO — home.js
   Skeleton loading + lazy images + all page interactions
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Inject skeleton CSS immediately (before DOM paint) ── */
  var skeletonCSS = `
    /* ── Skeleton system ──────────────────────────────── */
    @keyframes skeletonShimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }

    .sk {
      background: linear-gradient(90deg,
        #e8e8e8 25%,
        #f2f2f2 50%,
        #e8e8e8 75%
      );
      background-size: 600px 100%;
      animation: skeletonShimmer 1.4s ease-in-out infinite;
      border-radius: 4px;
    }

    /* Skeleton for portfolio images */
    .portfolio-img-wrap {
      position: relative;
    }

    .portfolio-img-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg,
        #e0e0e0 25%,
        #ebebeb 50%,
        #e0e0e0 75%
      );
      background-size: 600px 100%;
      animation: skeletonShimmer 1.4s ease-in-out infinite;
      z-index: 1;
      transition: opacity 0.4s ease;
      border-radius: inherit;
    }

    .portfolio-img-wrap.img-loaded::before {
      opacity: 0;
      pointer-events: none;
    }

    .portfolio-img-wrap img {
      position: relative;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    .portfolio-img-wrap.img-loaded img {
      opacity: 1;
    }

    /* Skeleton for slider backgrounds */
    .slide-bg {
      position: relative;
    }

    .slide-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg,
        #1a1a2e 25%,
        #16213e 50%,
        #1a1a2e 75%
      );
      background-size: 600px 100%;
      animation: skeletonShimmer 1.8s ease-in-out infinite;
      z-index: 1;
      transition: opacity 0.6s ease;
    }

    .slide-bg.bg-loaded::before {
      opacity: 0;
    }

    /* Skeleton for about / hours images */
    .about-img-main,
    .about-img-grid,
    .hours-image {
      position: relative;
    }

    .about-img-main::before,
    .hours-image::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg,
        #e8e8e8 25%,
        #f0f0f0 50%,
        #e8e8e8 75%
      );
      background-size: 600px 100%;
      animation: skeletonShimmer 1.4s ease-in-out infinite;
      z-index: 1;
      border-radius: inherit;
      transition: opacity 0.4s ease;
    }

    .about-img-main.img-loaded::before,
    .hours-image.img-loaded::before {
      opacity: 0;
    }

    .about-img-main img,
    .hours-image img {
      position: relative;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    .about-img-main.img-loaded img,
    .hours-image.img-loaded img {
      opacity: 1;
    }

    /* Skeleton for about grid small images */
    .about-img-grid {
      position: relative;
    }

    .about-img-grid img {
      opacity: 0;
      transition: opacity 0.5s ease;
      position: relative;
      z-index: 2;
    }

    .about-img-grid img.img-loaded {
      opacity: 1;
    }

    /* Skeleton for testimonial author avatars */
    .testimonial-author img {
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .testimonial-author img.img-loaded {
      opacity: 1;
    }

    /* Service card skeleton placeholder (before reveal) */
    .service-card:not(.visible) {
      background: linear-gradient(90deg,
        #f5f5f5 25%,
        #fafafa 50%,
        #f5f5f5 75%
      );
      background-size: 600px 100%;
    }

    /* Stat number placeholder */
    .stat-num {
      min-width: 60px;
      display: inline-block;
    }

    /* Smooth image reveal helper */
    img[loading="lazy"] {
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    img[loading="lazy"].img-loaded {
      opacity: 1;
    }

    /* Override for hero badge and preloader */
    .preloader img,
    .logo-img {
      opacity: 1 !important;
    }

    /* Logo image — always visible */
    .logo-img {
      transition: none !important;
      opacity: 1 !important;
    }
  `;

  var styleTag = document.createElement('style');
  styleTag.textContent = skeletonCSS;
  document.head.appendChild(styleTag);

  /* ── 2. Preloader ───────────────────────────────────────── */
  window.addEventListener('load', function () {
    var preloader = document.getElementById('preloader');
    setTimeout(function () {
      if (preloader) preloader.classList.add('hidden');
    }, 1200);
  });

  /* ── 3. Lazy-load ALL images with skeleton shimmer ─────── */
  function applyLazyImage(img) {
    // Skip logo (always visible above fold)
    if (img.classList.contains('logo-img') || img.closest('.preloader')) return;

    // Add lazy if missing
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    img.setAttribute('decoding', 'async');

    var wrap = img.closest('.portfolio-img-wrap, .about-img-main, .hours-image');

    function onLoad() {
      img.classList.add('img-loaded');
      if (wrap) wrap.classList.add('img-loaded');
    }

    function onError() {
      img.classList.add('img-loaded'); // hide broken skeleton
      if (wrap) wrap.classList.add('img-loaded');
      img.style.opacity = '1';
    }

    if (img.complete && img.naturalWidth > 0) {
      onLoad();
    } else {
      img.addEventListener('load',  onLoad,  { once: true });
      img.addEventListener('error', onError, { once: true });
    }
  }

  // Apply to about grid images directly
  document.querySelectorAll('.about-img-grid img').forEach(function (img) {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    function onLoad()  { img.classList.add('img-loaded'); }
    function onError() { img.classList.add('img-loaded'); img.style.opacity = '1'; }
    if (img.complete && img.naturalWidth > 0) onLoad();
    else { img.addEventListener('load', onLoad, { once: true }); img.addEventListener('error', onError, { once: true }); }
  });

  // Apply to testimonial avatars
  document.querySelectorAll('.testimonial-author img').forEach(function (img) {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    function onLoad()  { img.classList.add('img-loaded'); }
    function onError() { img.classList.add('img-loaded'); img.style.opacity = '1'; }
    if (img.complete && img.naturalWidth > 0) onLoad();
    else { img.addEventListener('load', onLoad, { once: true }); img.addEventListener('error', onError, { once: true }); }
  });

  // Apply to all other images
  document.querySelectorAll('img:not(.logo-img)').forEach(applyLazyImage);

  /* ── 4. Hero slide backgrounds — skeleton until loaded ──── */
  function preloadSlideBg(slideEl) {
    var bg = slideEl.querySelector('.slide-bg');
    if (!bg) return;

    var style = bg.style.backgroundImage || window.getComputedStyle(bg).backgroundImage;
    var match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (!match) return;

    var url = match[1];
    var img = new Image();
    img.onload = function () {
      bg.classList.add('bg-loaded');
    };
    img.onerror = function () {
      bg.classList.add('bg-loaded');
    };
    img.src = url;
  }

  // Preload first slide immediately, rest lazily
  var slides = document.querySelectorAll('.slide');
  if (slides.length > 0) {
    preloadSlideBg(slides[0]); // first slide — eager
  }

  // Preload remaining slides in idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function () {
      slides.forEach(function (slide, i) {
        if (i > 0) preloadSlideBg(slide);
      });
    });
  } else {
    setTimeout(function () {
      slides.forEach(function (slide, i) {
        if (i > 0) preloadSlideBg(slide);
      });
    }, 2000);
  }

  /* ── 5. Navbar ──────────────────────────────────────────── */
  var navbar     = document.getElementById('navbar');
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (navbar && !navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── 6. Hero Slider ─────────────────────────────────────── */
  var dotsWrap   = document.getElementById('sliderDots');
  var prevBtn    = document.getElementById('prevBtn');
  var nextBtn    = document.getElementById('nextBtn');
  var counterCur = document.querySelector('.slide-counter .current');
  var counterTot = document.querySelector('.slide-counter .total');
  var currentSlide = 0;
  var sliderTimer  = null;
  var SLIDE_DELAY  = 5500;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function goToSlide(idx) {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    if (dotsWrap) {
      var dots = dotsWrap.querySelectorAll('.slider-dot');
      if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    }
    currentSlide = (idx + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');

    // Lazy-load next slide background when switching
    var nextIdx = (currentSlide + 1) % slides.length;
    preloadSlideBg(slides[nextIdx]);

    if (dotsWrap) {
      var dots2 = dotsWrap.querySelectorAll('.slider-dot');
      if (dots2[currentSlide]) dots2[currentSlide].classList.add('active');
    }
    if (counterCur) counterCur.textContent = pad(currentSlide + 1);
  }

  function startAutoPlay() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(function () { goToSlide(currentSlide + 1); }, SLIDE_DELAY);
  }

  if (slides.length) {
    // Build dots
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function () { goToSlide(i); startAutoPlay(); });
        dotsWrap.appendChild(dot);
      });
    }

    if (counterTot) counterTot.textContent = pad(slides.length);
    if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(currentSlide - 1); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(currentSlide + 1); startAutoPlay(); });

    // Touch swipe
    var heroEl = document.getElementById('hero');
    if (heroEl) {
      var touchStartX = 0;
      heroEl.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
      heroEl.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1); startAutoPlay(); }
      }, { passive: true });
      heroEl.addEventListener('mouseenter', function () { clearInterval(sliderTimer); });
      heroEl.addEventListener('mouseleave', startAutoPlay);
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && !lightboxIsOpen)  { goToSlide(currentSlide - 1); startAutoPlay(); }
      if (e.key === 'ArrowRight' && !lightboxIsOpen) { goToSlide(currentSlide + 1); startAutoPlay(); }
    });

    startAutoPlay();
  }

  /* ── 7. Testimonials Slider ─────────────────────────────── */
  var tTrack  = document.getElementById('testimonialsTrack');
  var tDotsEl = document.getElementById('tDots');
  var tPrev   = document.getElementById('tPrev');
  var tNext   = document.getElementById('tNext');
  var tCards  = tTrack ? tTrack.querySelectorAll('.testimonial-card') : [];
  var tCurrent = 0;
  var tTimer   = null;

  function goToTestimonial(idx) {
    tCurrent = (idx + tCards.length) % tCards.length;
    if (tTrack) tTrack.style.transform = 'translateX(-' + (tCurrent * 100) + '%)';
    if (tDotsEl) {
      tDotsEl.querySelectorAll('.t-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === tCurrent);
      });
    }
  }

  function startTAutoPlay() {
    clearInterval(tTimer);
    tTimer = setInterval(function () { goToTestimonial(tCurrent + 1); }, 6000);
  }

  if (tCards.length) {
    if (tDotsEl) {
      tCards.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 't-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Testimonial ' + (i + 1));
        d.addEventListener('click', function () { goToTestimonial(i); startTAutoPlay(); });
        tDotsEl.appendChild(d);
      });
    }
    if (tPrev) tPrev.addEventListener('click', function () { goToTestimonial(tCurrent - 1); startTAutoPlay(); });
    if (tNext) tNext.addEventListener('click', function () { goToTestimonial(tCurrent + 1); startTAutoPlay(); });

    if (tTrack) {
      var txStart = 0;
      tTrack.addEventListener('touchstart', function (e) { txStart = e.touches[0].clientX; }, { passive: true });
      tTrack.addEventListener('touchend', function (e) {
        var diff = txStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { goToTestimonial(diff > 0 ? tCurrent + 1 : tCurrent - 1); startTAutoPlay(); }
      }, { passive: true });
    }
    startTAutoPlay();
  }

  /* ── 8. Scroll Reveal ───────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = getComputedStyle(el).getPropertyValue('--delay').trim() || '0s';
        el.style.transitionDelay = delay;
        el.classList.add('visible');
        revealObs.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── 9. Counter Animation ───────────────────────────────── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  if ('IntersectionObserver' in window) {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-target'), 10);
        var start  = null;
        var dur    = 1800;

        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          el.textContent = Math.round(easeOut(p) * target).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString();
        }

        requestAnimationFrame(tick);
        cntObs.unobserve(el);
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stat-num[data-target]').forEach(function (el) { cntObs.observe(el); });
  } else {
    document.querySelectorAll('.stat-num[data-target]').forEach(function (el) {
      el.textContent = parseInt(el.getAttribute('data-target'), 10).toLocaleString();
    });
  }

  /* ── 10. Portfolio Filter ───────────────────────────────── */
  var filterBtns    = document.querySelectorAll('.filter-btn');
  var portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');

      portfolioItems.forEach(function (item) {
        var show = filter === 'all' || item.getAttribute('data-category') === filter;
        if (show) {
          item.style.display = '';
          item.style.animation = 'fadeUp 0.4s ease forwards';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  /* ── 11. Lightbox ───────────────────────────────────────── */
  var lightbox      = document.getElementById('lightbox');
  var lbImg         = document.getElementById('lightboxImg');
  var lbClose       = document.getElementById('lightboxClose');
  var lbPrev        = document.getElementById('lbPrev');
  var lbNext        = document.getElementById('lbNext');
  var lbImages      = [];
  var lbCurrent     = 0;
  var lightboxIsOpen = false;

  function openLightbox(imgs, idx) {
    lbImages  = imgs;
    lbCurrent = idx;
    if (lbImg) lbImg.src = lbImages[lbCurrent];
    if (lightbox) lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightboxIsOpen = true;
  }

  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxIsOpen = false;
  }

  function lbGo(dir) {
    lbCurrent = (lbCurrent + dir + lbImages.length) % lbImages.length;
    if (lbImg) {
      lbImg.style.opacity = '0';
      setTimeout(function () {
        lbImg.src = lbImages[lbCurrent];
        lbImg.style.opacity = '1';
      }, 150);
    }
  }

  portfolioItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') return;
      var allImgs = Array.from(document.querySelectorAll('.portfolio-img-wrap img')).map(function (i) { return i.src; });
      var myImg   = item.querySelector('img');
      var idx     = myImg ? allImgs.indexOf(myImg.src) : 0;
      openLightbox(allImgs, Math.max(0, idx));
    });
  });

  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)   lbPrev.addEventListener('click', function () { lbGo(-1); });
  if (lbNext)   lbNext.addEventListener('click', function () { lbGo(1); });
  if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (!lightboxIsOpen) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lbGo(-1);
    if (e.key === 'ArrowRight')  lbGo(1);
  });

  /* ── 12. Chat Widget ────────────────────────────────────── */
  var chatToggle = document.getElementById('chatToggle');
  var chatWindow = document.getElementById('chatWindow');
  var chatCloseBtn = document.getElementById('chatClose');
  var chatInput  = document.getElementById('chatInput');
  var chatSend   = document.getElementById('chatSend');
  var chatMsgs   = document.getElementById('chatMessages');
  var chatBadge  = chatToggle ? chatToggle.querySelector('.chat-badge') : null;
  var chatIsOpen = false;

  var chatReplies = [
    "Thanks for reaching out! We'd love to help. What service are you interested in?",
    "Great question! Call us at +254 710 468 300 for detailed information.",
    "We cover Machakos and surrounding counties. Book early to secure your date!",
    "Our packages start from very affordable rates. Contact us for a custom quote.",
    "You can book via our contact form or WhatsApp. We're happy to help! 😊"
  ];
  var replyIdx = 0;

  function toggleChat() {
    chatIsOpen = !chatIsOpen;
    if (chatIsOpen) {
      if (chatWindow) { chatWindow.classList.add('open'); chatWindow.style.display = 'flex'; }
      if (chatBadge) chatBadge.style.display = 'none';
      setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
    } else {
      if (chatWindow) { chatWindow.classList.remove('open'); chatWindow.style.display = 'none'; }
    }
  }

  function appendMsg(text, type) {
    if (!chatMsgs) return;
    var div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    div.textContent = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendChatMessage() {
    if (!chatInput) return;
    var text = chatInput.value.trim();
    if (!text) return;
    appendMsg(text, 'sent');
    chatInput.value = '';
    setTimeout(function () {
      appendMsg(chatReplies[replyIdx++ % chatReplies.length], 'received');
    }, 900 + Math.random() * 400);
  }

  if (chatToggle)   chatToggle.addEventListener('click', toggleChat);
  if (chatCloseBtn) chatCloseBtn.addEventListener('click', toggleChat);
  if (chatSend)     chatSend.addEventListener('click', sendChatMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
    });
  }

  // Show badge after 4s if not opened
  setTimeout(function () {
    if (!chatIsOpen && chatBadge) chatBadge.style.display = 'flex';
  }, 4000);

  /* ── 13. Contact Form ───────────────────────────────────── */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('.btn-submit');
      var origHTML = btn.innerHTML;
      btn.classList.add('loading');
      btn.innerHTML = 'Sending…';

      fetch('/api/contact', { method: 'POST', body: new FormData(contactForm) })
        .then(function (res) {
          if (res.ok) {
            btn.classList.remove('loading');
            btn.classList.add('success');
            btn.innerHTML = '✓ Message Sent!';
            contactForm.reset();
            setTimeout(function () {
              btn.classList.remove('success');
              btn.innerHTML = origHTML;
            }, 4000);
          } else throw new Error('fail');
        })
        .catch(function () {
          btn.classList.remove('loading');
          btn.innerHTML = 'Failed — Try Again';
          setTimeout(function () { btn.innerHTML = origHTML; }, 3000);
        });
    });
  }

  /* ── 14. Active nav link on scroll ─────────────────────── */
  if ('IntersectionObserver' in window) {
    var navLinks = document.querySelectorAll('.nav-link');
    var secObs   = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var href = link.getAttribute('href');
          link.classList.toggle('active',
            href === '/' + entry.target.id ||
            (href === '/' && entry.target.id === 'hero')
          );
        });
      });
    }, { threshold: 0.35 });

    document.querySelectorAll('section[id], div[id="hero"]').forEach(function (s) { secObs.observe(s); });
  }

  /* ── 15. Smooth scroll for anchor links ─────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── 16. Open hours badge — show "Open" or "Closed" ───── */
  function updateOpenBadge() {
    var badge = document.querySelector('.open-badge');
    if (!badge) return;

    // Nairobi/Machakos is EAT (UTC+3)
    var now   = new Date();
    var utc   = now.getTime() + (now.getTimezoneOffset() * 60000);
    var eat   = new Date(utc + (3 * 3600000));
    var day   = eat.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    var hour  = eat.getHours() + eat.getMinutes() / 60;

    var open = false;
    if (day === 0) { open = hour >= 8 && hour < 20; }       // Sunday 8am-8pm
    else if (day === 5) { open = hour >= 9 && hour < 20; }  // Friday 9am-8pm
    else { open = hour >= 8.5 && hour < 20; }               // Mon-Thu, Sat 8:30am-8pm

    var dot  = badge.querySelector('.open-dot');
    var text = badge.childNodes[badge.childNodes.length - 1];

    if (open) {
      badge.style.background   = 'rgba(16,185,129,0.08)';
      badge.style.borderColor  = 'rgba(16,185,129,0.25)';
      badge.style.color        = '#059669';
      if (dot) dot.style.background = '#10b981';
      if (text) text.textContent = 'Open Now';
    } else {
      badge.style.background   = 'rgba(239,68,68,0.08)';
      badge.style.borderColor  = 'rgba(239,68,68,0.25)';
      badge.style.color        = '#dc2626';
      if (dot) dot.style.background = '#ef4444';
      if (dot) dot.style.animation  = 'none';
      if (text) text.textContent = 'Currently Closed';
    }
  }

  updateOpenBadge();

})();