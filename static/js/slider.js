/* ============================================================
   DENSPARK STUDIO — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Preloader ─────────────────────────────────────── */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('done'), 600);
    });
    // Failsafe
    setTimeout(() => preloader.classList.add('done'), 3000);
  }


  /* ── Custom Cursor (desktop) ───────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0, fx = 0, fy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    const animCursor = () => {
      cursor.style.left   = mx + 'px';
      cursor.style.top    = my + 'px';
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      follower.style.left = fx + 'px';
      follower.style.top  = fy + 'px';
      requestAnimationFrame(animCursor);
    };
    animCursor();
    document.querySelectorAll('a, button, .portfolio-item, .filter-btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform   = 'translate(-50%,-50%) scale(2.5)';
        cursor.style.opacity     = '0.5';
        follower.style.transform = 'translate(-50%,-50%) scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform   = 'translate(-50%,-50%) scale(1)';
        cursor.style.opacity     = '1';
        follower.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });
  }


  /* ── Navbar ────────────────────────────────────────── */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  // Scroll state
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile toggle
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  /* ── Hero Slider ───────────────────────────────────── */
  const slides      = document.querySelectorAll('.slide');
  const dotsWrap    = document.getElementById('sliderDots');
  const prevBtn     = document.getElementById('prevBtn');
  const nextBtn     = document.getElementById('nextBtn');
  const counterCur  = document.querySelector('.slide-counter .current');
  const counterTot  = document.querySelector('.slide-counter .total');

  let currentSlide = 0;
  let sliderTimer  = null;

  const pad = n => String(n + 1).padStart(2, '0');

  // Build dots
  if (dotsWrap && slides.length) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    if (counterTot) counterTot.textContent = pad(slides.length - 1);
  }

  const getDots = () => dotsWrap ? dotsWrap.querySelectorAll('.slider-dot') : [];

  const goTo = (idx) => {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    getDots()[currentSlide]?.classList.remove('active');

    currentSlide = (idx + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    getDots()[currentSlide]?.classList.add('active');
    if (counterCur) counterCur.textContent = pad(currentSlide);
  };

  const nextSlide = () => goTo(currentSlide + 1);
  const prevSlide = () => goTo(currentSlide - 1);

  const startAuto = () => {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(nextSlide, 5500);
  };

  if (slides.length) {
    slides[0].classList.add('active');
    startAuto();
  }

  prevBtn?.addEventListener('click', () => { prevSlide(); startAuto(); });
  nextBtn?.addEventListener('click', () => { nextSlide(); startAuto(); });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { prevSlide(); startAuto(); }
    if (e.key === 'ArrowRight') { nextSlide(); startAuto(); }
  });

  // Touch swipe
  const heroEl = document.getElementById('hero');
  if (heroEl) {
    let touchStartX = 0;
    heroEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    heroEl.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextSlide() : prevSlide();
        startAuto();
      }
    });
  }


  /* ── Scroll Reveal ─────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }


  /* ── Counter Animation ─────────────────────────────── */
  const statNums = document.querySelectorAll('.stat-num[data-target]');
  if (statNums.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const dur    = 1800;
        const step   = 16;
        const total  = Math.ceil(dur / step);
        let cur      = 0;

        const tick = () => {
          cur++;
          const progress = cur / total;
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target);
          if (cur < total) setTimeout(tick, step);
          else el.textContent = target;
        };
        tick();
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    statNums.forEach(el => countObserver.observe(el));
  }


  /* ── Portfolio Filter ──────────────────────────────── */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      portfolioItems.forEach(item => {
        const cat = item.dataset.category;
        const show = filter === 'all' || cat === filter;
        item.style.display = show ? '' : 'none';
        // Re-trigger animation
        if (show) {
          item.style.opacity    = '0';
          item.style.transform  = 'scale(0.96)';
          item.style.transition = 'none';
          requestAnimationFrame(() => {
            item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            item.style.opacity    = '1';
            item.style.transform  = 'scale(1)';
          });
        }
      });
    });
  });


  /* ── Testimonials Slider ───────────────────────────── */
  const tTrack  = document.getElementById('testimonialsTrack');
  const tDots   = document.getElementById('tDots');
  const tPrev   = document.getElementById('tPrev');
  const tNext   = document.getElementById('tNext');
  const tCards  = tTrack ? tTrack.querySelectorAll('.testimonial-card') : [];
  let   tCur    = 0;
  let   tTimer  = null;

  if (tCards.length) {
    // Build dots
    tCards.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 't-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Testimonial ${i + 1}`);
      d.addEventListener('click', () => { goT(i); resetTTimer(); });
      tDots.appendChild(d);
    });

    const getTDots = () => tDots.querySelectorAll('.t-dot');
    const goT = (idx) => {
      getTDots()[tCur].classList.remove('active');
      tCur = (idx + tCards.length) % tCards.length;
      tTrack.style.transform = `translateX(-${tCur * 100}%)`;
      getTDots()[tCur].classList.add('active');
    };
    const resetTTimer = () => {
      clearInterval(tTimer);
      tTimer = setInterval(() => goT(tCur + 1), 6000);
    };

    tPrev?.addEventListener('click', () => { goT(tCur - 1); resetTTimer(); });
    tNext?.addEventListener('click', () => { goT(tCur + 1); resetTTimer(); });
    resetTTimer();

    // Touch on testimonials
    let tTouchX = 0;
    tTrack.addEventListener('touchstart', e => { tTouchX = e.touches[0].clientX; }, { passive: true });
    tTrack.addEventListener('touchend', e => {
      const diff = tTouchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goT(tCur + 1) : goT(tCur - 1);
        resetTTimer();
      }
    });
  }


  /* ── Lightbox ──────────────────────────────────────── */
  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lightboxImg');
  const lbClose     = document.getElementById('lightboxClose');
  const lbPrev      = document.getElementById('lbPrev');
  const lbNext      = document.getElementById('lbNext');
  const pfItems     = document.querySelectorAll('.portfolio-item');
  let   lbIndex     = 0;

  const getImages = () => {
    const visible = Array.from(pfItems).filter(el => el.style.display !== 'none');
    return visible.map(el => ({
      src: el.querySelector('img')?.src || '',
      alt: el.querySelector('img')?.alt || '',
    }));
  };

  const openLightbox = (idx) => {
    if (!lightbox || !lbImg) return;
    const imgs = getImages();
    if (!imgs[idx]) return;
    lbIndex  = idx;
    lbImg.src = imgs[idx].src;
    lbImg.alt = imgs[idx].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox?.classList.remove('open');
    document.body.style.overflow = '';
  };

  pfItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      const visible = Array.from(pfItems).filter(el => el.style.display !== 'none');
      const visIdx  = visible.indexOf(item);
      openLightbox(visIdx);
    });
  });

  lbClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  lbNext?.addEventListener('click', () => {
    const imgs = getImages();
    lbIndex = (lbIndex + 1) % imgs.length;
    lbImg.src = imgs[lbIndex].src;
    lbImg.alt = imgs[lbIndex].alt;
  });

  lbPrev?.addEventListener('click', () => {
    const imgs = getImages();
    lbIndex = (lbIndex - 1 + imgs.length) % imgs.length;
    lbImg.src = imgs[lbIndex].src;
    lbImg.alt = imgs[lbIndex].alt;
  });

  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  lbNext?.click();
    if (e.key === 'ArrowLeft')   lbPrev?.click();
  });


  /* ── Chat Widget ───────────────────────────────────── */
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatClose    = document.getElementById('chatClose');
  const chatInput    = document.getElementById('chatInput');
  const chatSend     = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge    = document.querySelector('.chat-badge');
  let   chatOpen     = false;

  const toggleChat = () => {
    chatOpen = !chatOpen;
    chatWindow?.classList.toggle('open', chatOpen);
    if (chatOpen && chatBadge) chatBadge.style.display = 'none';
  };

  chatToggle?.addEventListener('click', toggleChat);
  chatClose?.addEventListener('click', toggleChat);

  const addMsg = (text, type) => {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const sendChat = () => {
    const val = chatInput?.value.trim();
    if (!val) return;
    addMsg(val, 'sent');
    chatInput.value = '';
    setTimeout(() => {
      addMsg("Thanks for reaching out! We'll get back to you shortly. 📸", 'received');
    }, 900);
  };

  chatSend?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });


  /* ── Contact Form ──────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-submit');
      if (!btn) return;
      const original = btn.innerHTML;
      btn.innerHTML = 'Sending… ✈';
      btn.disabled  = true;
      // Simulate send
      setTimeout(() => {
        btn.innerHTML = 'Message Sent! ✓';
        btn.style.background = '#16A34A';
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled  = false;
          btn.style.background = '';
          contactForm.reset();
        }, 3000);
      }, 1500);
    });
  }


  /* ── Smooth Active Nav ─────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === `/${id}` || (id === 'hero' && l.getAttribute('href') === '/'));
          });
        }
      });
    }, { threshold: 0.35 });
    sections.forEach(s => navObserver.observe(s));
  }

}); // end DOMContentLoaded