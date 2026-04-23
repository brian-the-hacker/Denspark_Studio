/* =========================================
   DENSPARK STUDIO — Main JavaScript
   ========================================= */

(function () {
  'use strict';

  /* ---- Preloader ---- */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 1800);
    });
  }

  /* ---- Navbar scroll ---- */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;
  function onScroll() {
    const y = window.scrollY;
    if (navbar) {
      navbar.classList.toggle('scrolled', y > 60);
    }
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile Menu ---- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
      }
    });
  }

  /* ---- Hero Slider ---- */
  const slides     = document.querySelectorAll('.slide');
  const dotsWrap   = document.getElementById('sliderDots');
  const prevBtn    = document.getElementById('prevBtn');
  const nextBtn    = document.getElementById('nextBtn');
  const counterCur = document.querySelector('.slide-counter .current');
  const counterTot = document.querySelector('.slide-counter .total');

  let currentSlide = 0;
  let sliderTimer  = null;
  const SLIDE_DELAY = 5500;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function goToSlide(idx) {
    slides[currentSlide].classList.remove('active');
    if (dotsWrap) dotsWrap.querySelectorAll('.slider-dot')[currentSlide].classList.remove('active');

    currentSlide = (idx + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    if (dotsWrap) dotsWrap.querySelectorAll('.slider-dot')[currentSlide].classList.add('active');
    if (counterCur) counterCur.textContent = pad(currentSlide + 1);
  }

  function startAutoPlay() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => goToSlide(currentSlide + 1), SLIDE_DELAY);
  }

  if (slides.length) {
    // Build dots
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => { goToSlide(i); startAutoPlay(); });
        dotsWrap.appendChild(dot);
      });
    }
    if (counterTot) counterTot.textContent = pad(slides.length);

    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); startAutoPlay(); });

    // Touch / swipe
    let touchX = 0;
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroEl.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      heroEl.addEventListener('touchend', (e) => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
          startAutoPlay();
        }
      }, { passive: true });
    }

    // Pause on hover
    if (heroEl) {
      heroEl.addEventListener('mouseenter', () => clearInterval(sliderTimer));
      heroEl.addEventListener('mouseleave', startAutoPlay);
    }

    startAutoPlay();
  }

  /* ---- Testimonials Slider ---- */
  const tTrack  = document.getElementById('testimonialsTrack');
  const tDotsEl = document.getElementById('tDots');
  const tPrev   = document.getElementById('tPrev');
  const tNext   = document.getElementById('tNext');
  const tCards  = tTrack ? tTrack.querySelectorAll('.testimonial-card') : [];

  let tCurrent = 0;

  function goToTestimonial(idx) {
    tCurrent = (idx + tCards.length) % tCards.length;
    if (tTrack) tTrack.style.transform = `translateX(-${tCurrent * 100}%)`;
    if (tDotsEl) {
      tDotsEl.querySelectorAll('.t-dot').forEach((d, i) => d.classList.toggle('active', i === tCurrent));
    }
  }

  if (tCards.length) {
    if (tDotsEl) {
      tCards.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 't-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        d.addEventListener('click', () => goToTestimonial(i));
        tDotsEl.appendChild(d);
      });
    }
    if (tPrev) tPrev.addEventListener('click', () => goToTestimonial(tCurrent - 1));
    if (tNext) tNext.addEventListener('click', () => goToTestimonial(tCurrent + 1));

    // Auto rotate testimonials
    setInterval(() => goToTestimonial(tCurrent + 1), 6000);

    // Touch swipe
    if (tTrack) {
      let txStart = 0;
      tTrack.addEventListener('touchstart', (e) => { txStart = e.touches[0].clientX; }, { passive: true });
      tTrack.addEventListener('touchend', (e) => {
        const diff = txStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goToTestimonial(diff > 0 ? tCurrent + 1 : tCurrent - 1);
      }, { passive: true });
    }
  }

  /* ---- Scroll Reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Respect --delay CSS var for stagger
        const delay = getComputedStyle(entry.target).getPropertyValue('--delay') || '0s';
        entry.target.style.transitionDelay = delay;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---- Counter Animation ---- */
  const statNums = document.querySelectorAll('.stat-num[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const dur    = 1800;
      const start  = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        const ease     = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.3 });

  statNums.forEach((el) => counterObserver.observe(el));

  /* ---- Portfolio Filter ---- */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      portfolioItems.forEach((item) => {
        const cat = item.dataset.category;
        const show = filter === 'all' || cat === filter;
        if (show) {
          item.style.display = '';
          item.style.animation = 'fadeUp 0.4s ease forwards';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  /* ---- Lightbox ---- */
  const lightbox     = document.getElementById('lightbox');
  const lbImg        = document.getElementById('lightboxImg');
  const lbClose      = document.getElementById('lightboxClose');
  const lbPrev       = document.getElementById('lbPrev');
  const lbNext       = document.getElementById('lbNext');
  let   lbImages     = [];
  let   lbCurrent    = 0;

  function openLightbox(imgs, idx) {
    lbImages  = imgs;
    lbCurrent = idx;
    if (lbImg) lbImg.src = lbImages[lbCurrent];
    if (lightbox) lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function lbGo(dir) {
    lbCurrent = (lbCurrent + dir + lbImages.length) % lbImages.length;
    if (lbImg) {
      lbImg.style.opacity = '0';
      setTimeout(() => {
        lbImg.src = lbImages[lbCurrent];
        lbImg.style.opacity = '1';
      }, 150);
    }
  }

  // Collect all portfolio images
  document.querySelectorAll('.portfolio-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      const allImgs = [...document.querySelectorAll('.portfolio-img-wrap img')].map((i) => i.src);
      const thisImg = item.querySelector('img');
      const idx     = allImgs.indexOf(thisImg.src);
      openLightbox(allImgs, Math.max(0, idx));
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click', () => lbGo(-1));
  if (lbNext)  lbNext.addEventListener('click', () => lbGo(1));
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  lbGo(-1);
    if (e.key === 'ArrowRight') lbGo(1);
  });

  /* ---- Chat Widget ---- */
  const chatToggle  = document.getElementById('chatToggle');
  const chatWindow  = document.getElementById('chatWindow');
  const chatClose   = document.getElementById('chatClose');
  const chatInput   = document.getElementById('chatInput');
  const chatSend    = document.getElementById('chatSend');
  const chatMsgs    = document.getElementById('chatMessages');
  const chatBadge   = chatToggle ? chatToggle.querySelector('.chat-badge') : null;

  const replies = [
    "Thanks for reaching out! We'd love to help. What service are you interested in?",
    "Great question! Please call us at +254 710 468 300 for detailed information.",
    "We cover all events across Machakos and surrounding counties. Book early to secure your date!",
    "Our packages start from very affordable rates. Contact us for a custom quote.",
    "You can book a session via our contact form or WhatsApp. We'd be happy to help! 😊",
  ];
  let replyIdx = 0;

  function toggleChat() {
    const open = chatWindow.classList.toggle('open');
    if (open && chatBadge) chatBadge.style.display = 'none';
  }

  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMsg(text, 'sent');
    chatInput.value = '';

    setTimeout(() => {
      appendMsg(replies[replyIdx % replies.length], 'received');
      replyIdx++;
    }, 900 + Math.random() * 500);
  }

  if (chatToggle) chatToggle.addEventListener('click', toggleChat);
  if (chatClose)  chatClose.addEventListener('click', toggleChat);
  if (chatSend)   chatSend.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  /* ---- Contact Form ---- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-submit');
      const origText = btn.innerHTML;

      btn.classList.add('loading');
      btn.innerHTML = 'Sending…';

      try {
        const data = new FormData(contactForm);
        const res = await fetch('/api/contact', {
          method: 'POST',
          body: data,
        });

        if (res.ok) {
          btn.classList.remove('loading');
          btn.classList.add('success');
          btn.innerHTML = '✓ Message Sent!';
          contactForm.reset();
          setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = origText;
          }, 4000);
        } else {
          throw new Error('Server error');
        }
      } catch {
        btn.classList.remove('loading');
        btn.innerHTML = 'Failed — Try Again';
        setTimeout(() => { btn.innerHTML = origText; }, 3000);
      }
    });
  }

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '/' + entry.target.id || (link.getAttribute('href') === '/' && entry.target.id === 'hero'));
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach((s) => sectionObserver.observe(s));

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();