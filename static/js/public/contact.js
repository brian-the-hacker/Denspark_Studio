/* ============================================================
   DENSPARK STUDIO — contact.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Preloader ─────────────────────────────────────── */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 500);
    });
    setTimeout(() => preloader.classList.add('hidden'), 3000);
  }


  /* ── Custom Cursor ─────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });

    const animFollower = () => {
      fx += (mx - fx) * 0.1;
      fy += (my - fy) * 0.1;
      follower.style.left = fx + 'px';
      follower.style.top  = fy + 'px';
      requestAnimationFrame(animFollower);
    };
    animFollower();

    // Hover effect on interactive elements
    const hoverEls = document.querySelectorAll(
      'a, button, input, select, textarea, .faq-question, .strip-item'
    );
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }


  /* ── Navbar ────────────────────────────────────────── */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  // Contact page starts scrolled (dark bg)
  if (navbar) navbar.classList.add('scrolled');

  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  /* ── Scroll Reveal ─────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => ro.observe(el));
  }


  /* ── FAQ Accordion ─────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle this one
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });


  /* ── Form Validation & Submission ──────────────────── */
  const form        = document.getElementById('contactForm');
  const submitBtn   = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');
  const charCount   = document.getElementById('charCount');
  const messageEl   = document.getElementById('message');
  const MAX_CHARS   = 500;

  // Character counter
  if (messageEl && charCount) {
    messageEl.addEventListener('input', () => {
      const len = messageEl.value.length;
      charCount.textContent = `${len} / ${MAX_CHARS}`;
      charCount.classList.remove('near-limit', 'at-limit');
      if (len >= MAX_CHARS)       charCount.classList.add('at-limit');
      else if (len >= MAX_CHARS * 0.85) charCount.classList.add('near-limit');
      if (len > MAX_CHARS) messageEl.value = messageEl.value.slice(0, MAX_CHARS);
    });
  }

  // Validation rules
  const rules = {
    first_name: { required: true, min: 2,  msg: 'Please enter your first name (min 2 characters).' },
    last_name:  { required: true, min: 2,  msg: 'Please enter your last name (min 2 characters).' },
    email:      { required: true, email: true, msg: 'Please enter a valid email address.' },
    service:    { required: true, msg: 'Please select a service.' },
    message:    { required: true, min: 10, msg: 'Please describe your project (min 10 characters).' },
  };

  const showError = (field, msg) => {
    const input = document.getElementById(field);
    const err   = document.getElementById(`err-${field}`);
    if (input) input.classList.add('error');
    if (err)   err.textContent = msg;
  };

  const clearError = (field) => {
    const input = document.getElementById(field);
    const err   = document.getElementById(`err-${field}`);
    if (input) input.classList.remove('error');
    if (err)   err.textContent = '';
  };

  const isValidEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const validateForm = () => {
    let valid = true;

    Object.entries(rules).forEach(([field, rule]) => {
      const el  = document.getElementById(field);
      const val = el ? el.value.trim() : '';

      if (rule.required && !val) {
        showError(field, rule.msg);
        valid = false;
      } else if (rule.min && val.length < rule.min) {
        showError(field, rule.msg);
        valid = false;
      } else if (rule.email && !isValidEmail(val)) {
        showError(field, rule.msg);
        valid = false;
      } else {
        clearError(field);
      }
    });

    return valid;
  };

  // Live clear errors on input
  Object.keys(rules).forEach(field => {
    const el = document.getElementById(field);
    el?.addEventListener('input', () => clearError(field));
    el?.addEventListener('change', () => clearError(field));
  });

  // Submit
  if (form && submitBtn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      // Loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Simulate API call (replace with real fetch to /api/contact)
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Success
      submitBtn.classList.remove('loading');
      submitBtn.style.display = 'none';
      if (formSuccess) {
        formSuccess.style.display = 'flex';
      }
      form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);

      // Reset after 6s
      setTimeout(() => {
        form.reset();
        form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
        if (formSuccess) formSuccess.style.display = 'none';
        submitBtn.style.display = '';
        submitBtn.disabled = false;
        if (charCount) charCount.textContent = `0 / ${MAX_CHARS}`;
      }, 6000);
    });
  }


  /* ── Input focus label lift ─────────────────────────── */
  // Add filled class for styling if needed
  document.querySelectorAll('input, select, textarea').forEach(el => {
    const update = () => el.closest('.form-group')?.classList.toggle('filled', el.value.length > 0);
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    update();
  });


  /* ── Smooth scroll for "Book Now" anchor ────────────── */
  document.querySelectorAll('a[href="#booking-form"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById('booking-form');
      if (target) {
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  /* ── Map Section Reveal ─────────────────────────────── */
  const mapSection = document.querySelector('.map-section');
  if (mapSection) {
    const mo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          mo.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    mo.observe(mapSection);
  }


  /* ── Contact strip hover ripple ─────────────────────── */
  document.querySelectorAll('a.strip-item').forEach(item => {
    item.addEventListener('mouseenter', function () {
      this.style.transition = 'background 0.25s ease';
    });
  });


  /* ── Marquee pause on hover ─────────────────────────── */
  const marqueeWrap = document.querySelector('.marquee-wrap');
  if (marqueeWrap) {
    marqueeWrap.addEventListener('mouseenter', () => {
      marqueeWrap.querySelectorAll('.marquee-content').forEach(el => {
        el.style.animationPlayState = 'paused';
      });
    });
    marqueeWrap.addEventListener('mouseleave', () => {
      marqueeWrap.querySelectorAll('.marquee-content').forEach(el => {
        el.style.animationPlayState = 'running';
      });
    });
  }


  /* ── Footer social hover ────────────────────────────── */
  document.querySelectorAll('.footer-social a, .social-links a').forEach(a => {
    a.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

}); // end DOMContentLoaded