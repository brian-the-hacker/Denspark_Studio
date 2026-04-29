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
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── Desktop Services mega menu (click to open/close) ─── */
  const desktopServicesMenu   = document.getElementById('desktopServicesMenu');
  const desktopServicesToggle = document.getElementById('desktopServicesToggle');
  if (desktopServicesMenu && desktopServicesToggle) {
    desktopServicesToggle.addEventListener('click', (e) => {
      // Only intercept on desktop; on mobile the element is hidden anyway
      if (window.innerWidth > 768) {
        e.preventDefault();
        desktopServicesMenu.classList.toggle('open');
      }
    });
    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!desktopServicesMenu.contains(e.target)) {
        desktopServicesMenu.classList.remove('open');
      }
    });
    // Close on scroll
    window.addEventListener('scroll', () => desktopServicesMenu.classList.remove('open'), { passive: true });
  }

  /* ── Mobile Services accordion ────────────────────────── */
  const mobileServicesItem   = document.getElementById('mobileServicesItem');
  const mobileServicesToggle = document.getElementById('mobileServicesToggle');
  if (mobileServicesItem && mobileServicesToggle) {
    mobileServicesToggle.addEventListener('click', () => {
      const open = mobileServicesItem.classList.toggle('open');
      mobileServicesToggle.setAttribute('aria-expanded', String(open));
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
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn      = contactForm.querySelector('.btn-submit');
      const origHTML = btn.innerHTML;

      // Remove any previous error
      const prevErr = contactForm.querySelector('.form-submit-error');
      if (prevErr) prevErr.remove();

      // Loading state
      btn.classList.add('loading');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:    contactForm.querySelector('#name').value.trim(),
            phone:   contactForm.querySelector('#phone').value.trim(),
            email:   contactForm.querySelector('#email').value.trim(),
            service: contactForm.querySelector('#service').value,
            message: contactForm.querySelector('#message').value.trim(),
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Success
          btn.classList.remove('loading');
          btn.classList.add('success');
          btn.disabled = false;
          btn.innerHTML = '✓ Message Sent!';
          contactForm.reset();
          setTimeout(() => {
            btn.classList.remove('success');
            btn.innerHTML = origHTML;
          }, 4000);

        } else {
          // Server validation error — show message from backend
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

      } catch (err) {
        btn.classList.remove('loading');
        btn.classList.add('error');
        btn.disabled = false;
        btn.textContent = 'Failed — Try Again';

        // Show error below button
        const errEl = document.createElement('p');
        errEl.className = 'form-submit-error';
        errEl.style.cssText = 'color:#dc2626;font-size:0.83rem;margin-top:0.75rem;text-align:center;';
        errEl.textContent = err.message || 'Network error. Please check your connection.';
        btn.insertAdjacentElement('afterend', errEl);

        setTimeout(() => {
          btn.classList.remove('error');
          btn.innerHTML = origHTML;
          btn.disabled  = false;
        }, 3000);
      }
    });
  }

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